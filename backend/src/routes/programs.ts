import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import {
  GenerateProgramRequestSchema,
  SelectActivityOptionRequestSchema,
  SelectMultipleOptionsRequestSchema,
  UpdateConciergeNotesRequestSchema,
  ExcludeVenueRequestSchema,
  UpdateActivityTimeRequestSchema,
  UpdateProgramTitleRequestSchema,
  UpdateDayTitleRequestSchema,
  SwitchActivityTypeRequestSchema,
  type Program,
  type ProgramSummary,
  type VenueCategory,
} from "../types";
import { generateProgram } from "../services/recommendation-engine";
import { prisma } from "../prisma";
import type { AuthUser, AuthSession } from "../auth";
import { renderToBuffer } from "@react-pdf/renderer";
import { ProgramPdfDocument } from "../pdf/program-pdf";
import { loadVenuesByCategory, filterVenuesByAvailability, getDayOfWeekFrench } from "../services/csv-loader";
import { mergePdfs, fetchPdfFromUrl } from "../pdf/pdf-merger";

export const programsRouter = new Hono<{
  Variables: {
    user: AuthUser | null;
    session: AuthSession | null;
  };
}>();

// Default user ID for unauthenticated access (temporary)
const DEFAULT_USER_ID = "anonymous-user";

// Ensure anonymous user exists in database
async function ensureAnonymousUser(): Promise<string> {
  const existingUser = await prisma.user.findUnique({
    where: { id: DEFAULT_USER_ID },
  });

  if (!existingUser) {
    await prisma.user.create({
      data: {
        id: DEFAULT_USER_ID,
        name: "Utilisateur Anonyme",
        email: "anonymous@concierge.local",
        emailVerified: false,
      },
    });
  }

  return DEFAULT_USER_ID;
}

// Helper to get user ID (uses auth if available, otherwise default)
const getUserId = async (c: { get: (key: "user") => AuthUser | null }): Promise<string> => {
  const user = c.get("user");
  if (user?.id) return user.id;
  return ensureAnonymousUser();
};

/**
 * POST /api/programs/generate - Generate a new program
 */
programsRouter.post(
  "/generate",
  zValidator("json", GenerateProgramRequestSchema),
  async (c) => {
    const userId = await getUserId(c);
    const request = c.req.valid("json");

    try {
      // Generate the program using the recommendation engine
      const generatedProgram = generateProgram(userId, request);

      // Save to database
      const dbProgram = await prisma.program.create({
        data: {
          id: generatedProgram.id,
          userId: userId,
          city: generatedProgram.city,
          duration: generatedProgram.duration,
          profile: generatedProgram.profile,
          pace: generatedProgram.pace,
          interests: JSON.stringify(generatedProgram.interests),
          guests: generatedProgram.guests,
          startDate: request.startDate,
          endDate: request.endDate,
          title: generatedProgram.title,
          introInternal: generatedProgram.introInternal,
          introClient: generatedProgram.introClient,
          closingInternal: generatedProgram.closingInternal,
          closingClient: generatedProgram.closingClient,
          status: "draft",
          days: {
            create: generatedProgram.days.map((day) => ({
              id: day.id,
              dayNumber: day.dayNumber,
              actualDate: day.actualDate,
              themeInternal: day.themeInternal,
              themeClient: day.themeClient,
              activities: {
                create: day.activities.flatMap((activity, activityIndex) =>
                  activity.options.map((option, optionIndex) => ({
                    id: option.id,
                    timeSlot: activity.timeSlot,
                    time: activity.time,
                    type: activity.type,
                    category: activity.category,
                    venueName: option.venueName,
                    venueAddress: option.venueAddress,
                    venuePhone: option.venuePhone,
                    venueHours: option.venueHours,
                    venueStyle: option.venueStyle,
                    venueDescription: option.venueDescription,
                    venueReservationRequired: option.venueReservationRequired || false,
                    venueReservationNote: option.venueReservationNote,
                    isEiffelView: option.isEiffelView || false,
                    isOption: optionIndex > 0,
                    optionGroupId: activity.id,
                    isSelected: option.isSelected,
                    verificationStatus: activity.verificationStatus,
                    sortOrder: activityIndex,
                    conciergeNotes: activity.conciergeNotes,
                  }))
                ),
              },
            })),
          },
        },
        include: {
          days: {
            include: {
              activities: true,
            },
            orderBy: { dayNumber: "asc" },
          },
        },
      });

      // Transform database response to API format
      const program = transformDbProgramToApi(dbProgram);

      return c.json({ data: program });
    } catch (error) {
      console.error("Error generating program:", error);
      return c.json(
        { error: { message: "Failed to generate program", code: "GENERATION_ERROR" } },
        500
      );
    }
  }
);

/**
 * GET /api/programs - List user's programs
 */
programsRouter.get("/", async (c) => {
  const userId = await getUserId(c);

  try {
    const programs = await prisma.program.findMany({
      where: { userId: userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        city: true,
        duration: true,
        profile: true,
        pace: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const summaries: ProgramSummary[] = programs.map((p) => ({
      id: p.id,
      title: p.title || undefined,
      city: p.city,
      duration: p.duration,
      profile: p.profile as ProgramSummary["profile"],
      pace: p.pace as ProgramSummary["pace"],
      status: p.status as ProgramSummary["status"],
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    }));

    return c.json({ data: summaries });
  } catch (error) {
    console.error("Error listing programs:", error);
    return c.json(
      { error: { message: "Failed to list programs", code: "LIST_ERROR" } },
      500
    );
  }
});

/**
 * GET /api/programs/:id - Get specific program
 */
programsRouter.get("/:id", async (c) => {
  const userId = await getUserId(c);
  const programId = c.req.param("id");

  try {
    const dbProgram = await prisma.program.findFirst({
      where: {
        id: programId,
        userId: userId,
      },
      include: {
        days: {
          include: {
            activities: {
              orderBy: [{ sortOrder: "asc" }, { isOption: "asc" }],
            },
          },
          orderBy: { dayNumber: "asc" },
        },
      },
    });

    if (!dbProgram) {
      return c.json(
        { error: { message: "Program not found", code: "NOT_FOUND" } },
        404
      );
    }

    const program = transformDbProgramToApi(dbProgram);
    return c.json({ data: program });
  } catch (error) {
    console.error("Error fetching program:", error);
    return c.json(
      { error: { message: "Failed to fetch program", code: "FETCH_ERROR" } },
      500
    );
  }
});

/**
 * PUT /api/programs/:id/activities/:activityId/select - Select an option
 */
programsRouter.put(
  "/:id/activities/:activityId/select",
  zValidator("json", SelectActivityOptionRequestSchema),
  async (c) => {
    const userId = await getUserId(c);
    const programId = c.req.param("id");
    const activityId = c.req.param("activityId");
    const { optionId } = c.req.valid("json");

    try {
      // Verify program ownership
      const program = await prisma.program.findFirst({
        where: { id: programId, userId: userId },
      });

      if (!program) {
        return c.json(
          { error: { message: "Program not found", code: "NOT_FOUND" } },
          404
        );
      }

      // Find the activity and its related options
      const activity = await prisma.activity.findFirst({
        where: {
          id: optionId,
          day: {
            programId: programId,
          },
        },
      });

      if (!activity) {
        return c.json(
          { error: { message: "Activity not found", code: "NOT_FOUND" } },
          404
        );
      }

      // Update: deselect all in group, select the chosen one
      await prisma.$transaction([
        prisma.activity.updateMany({
          where: { optionGroupId: activity.optionGroupId },
          data: { isSelected: false },
        }),
        prisma.activity.update({
          where: { id: optionId },
          data: { isSelected: true },
        }),
      ]);

      // Fetch updated program
      const updatedProgram = await prisma.program.findFirst({
        where: { id: programId },
        include: {
          days: {
            include: { activities: { orderBy: [{ sortOrder: "asc" }, { isOption: "asc" }] } },
            orderBy: { dayNumber: "asc" },
          },
        },
      });

      return c.json({ data: transformDbProgramToApi(updatedProgram!) });
    } catch (error) {
      console.error("Error selecting option:", error);
      return c.json(
        { error: { message: "Failed to select option", code: "SELECT_ERROR" } },
        500
      );
    }
  }
);

/**
 * PUT /api/programs/:id/activities/:activityId/select-multiple - Select multiple options (for shopping)
 */
programsRouter.put(
  "/:id/activities/:activityId/select-multiple",
  zValidator("json", SelectMultipleOptionsRequestSchema),
  async (c) => {
    const userId = await getUserId(c);
    const programId = c.req.param("id");
    const activityId = c.req.param("activityId");
    const { optionIds } = c.req.valid("json");

    try {
      // Verify program ownership
      const program = await prisma.program.findFirst({
        where: { id: programId, userId: userId },
      });

      if (!program) {
        return c.json(
          { error: { message: "Program not found", code: "NOT_FOUND" } },
          404
        );
      }

      // Find the first option to get the option group ID
      const firstOption = await prisma.activity.findFirst({
        where: {
          id: optionIds[0],
          day: { programId: programId },
        },
      });

      if (!firstOption) {
        return c.json(
          { error: { message: "Activity not found", code: "NOT_FOUND" } },
          404
        );
      }

      // Update: deselect all in group, then select the chosen ones
      await prisma.$transaction([
        prisma.activity.updateMany({
          where: { optionGroupId: firstOption.optionGroupId },
          data: { isSelected: false },
        }),
        prisma.activity.updateMany({
          where: { id: { in: optionIds } },
          data: { isSelected: true },
        }),
      ]);

      // Fetch updated program
      const updatedProgram = await prisma.program.findFirst({
        where: { id: programId },
        include: {
          days: {
            include: { activities: { orderBy: [{ sortOrder: "asc" }, { isOption: "asc" }] } },
            orderBy: { dayNumber: "asc" },
          },
        },
      });

      return c.json({ data: transformDbProgramToApi(updatedProgram!) });
    } catch (error) {
      console.error("Error selecting multiple options:", error);
      return c.json(
        { error: { message: "Failed to select options", code: "SELECT_ERROR" } },
        500
      );
    }
  }
);

/**
 * PUT /api/programs/:id/activities/:activityId/notes - Update concierge notes
 */
programsRouter.put(
  "/:id/activities/:activityId/notes",
  zValidator("json", UpdateConciergeNotesRequestSchema),
  async (c) => {
    const userId = await getUserId(c);
    const programId = c.req.param("id");
    const activityId = c.req.param("activityId");
    const { notes } = c.req.valid("json");

    try {
      // Verify program ownership
      const program = await prisma.program.findFirst({
        where: { id: programId, userId: userId },
      });

      if (!program) {
        return c.json(
          { error: { message: "Program not found", code: "NOT_FOUND" } },
          404
        );
      }

      // Find activity by id OR optionGroupId (since frontend sends the group ID)
      const activity = await prisma.activity.findFirst({
        where: {
          OR: [
            { id: activityId, day: { programId } },
            { optionGroupId: activityId, day: { programId } },
          ],
        },
      });

      if (!activity) {
        return c.json(
          { error: { message: "Activity not found", code: "NOT_FOUND" } },
          404
        );
      }

      // Update all activities in the option group with the notes
      await prisma.activity.updateMany({
        where: { optionGroupId: activity.optionGroupId },
        data: { conciergeNotes: notes },
      });

      // Fetch updated program
      const updatedProgram = await prisma.program.findFirst({
        where: { id: programId },
        include: {
          days: {
            include: { activities: { orderBy: [{ sortOrder: "asc" }, { isOption: "asc" }] } },
            orderBy: { dayNumber: "asc" },
          },
        },
      });

      return c.json({ data: transformDbProgramToApi(updatedProgram!) });
    } catch (error) {
      console.error("Error updating notes:", error);
      return c.json(
        { error: { message: "Failed to update notes", code: "NOTES_ERROR" } },
        500
      );
    }
  }
);

/**
 * PUT /api/programs/:id/activities/:activityId/time - Update activity time
 */
programsRouter.put(
  "/:id/activities/:activityId/time",
  zValidator("json", UpdateActivityTimeRequestSchema),
  async (c) => {
    const userId = await getUserId(c);
    const programId = c.req.param("id");
    const activityId = c.req.param("activityId");
    const { time } = c.req.valid("json");

    try {
      // Verify program ownership
      const program = await prisma.program.findFirst({
        where: { id: programId, userId: userId },
      });

      if (!program) {
        return c.json(
          { error: { message: "Program not found", code: "NOT_FOUND" } },
          404
        );
      }

      // Find activity by id OR optionGroupId (since frontend sends the group ID)
      const activity = await prisma.activity.findFirst({
        where: {
          OR: [
            { id: activityId, day: { programId } },
            { optionGroupId: activityId, day: { programId } },
          ],
        },
      });

      if (!activity) {
        return c.json(
          { error: { message: "Activity not found", code: "NOT_FOUND" } },
          404
        );
      }

      // Update time for all activities in the option group
      await prisma.activity.updateMany({
        where: { optionGroupId: activity.optionGroupId },
        data: { time },
      });

      // Fetch updated program
      const updatedProgram = await prisma.program.findFirst({
        where: { id: programId },
        include: {
          days: {
            include: { activities: { orderBy: [{ sortOrder: "asc" }, { isOption: "asc" }] } },
            orderBy: { dayNumber: "asc" },
          },
        },
      });

      return c.json({ data: transformDbProgramToApi(updatedProgram!) });
    } catch (error) {
      console.error("Error updating activity time:", error);
      return c.json(
        { error: { message: "Failed to update activity time", code: "TIME_UPDATE_ERROR" } },
        500
      );
    }
  }
);

/**
 * PUT /api/programs/:id/activities/:activityId/regenerate
 * Regenerate a specific option with a new venue
 */
programsRouter.put(
  "/:id/activities/:activityId/regenerate",
  zValidator("json", z.object({ optionId: z.string() })),
  async (c) => {
    const userId = await getUserId(c);
    const programId = c.req.param("id");
    const activityId = c.req.param("activityId");
    const { optionId } = c.req.valid("json");

    try {
      // Verify program ownership
      const program = await prisma.program.findFirst({
        where: { id: programId, userId: userId },
        include: {
          days: {
            include: {
              activities: true,
            },
          },
        },
      });

      if (!program) {
        return c.json(
          { error: { message: "Program not found", code: "NOT_FOUND" } },
          404
        );
      }

      // Find the activity/option to regenerate
      const targetActivity = await prisma.activity.findFirst({
        where: {
          id: optionId,
          day: { programId },
        },
      });

      if (!targetActivity) {
        return c.json(
          { error: { message: "Activity option not found", code: "NOT_FOUND" } },
          404
        );
      }

      // Get all venues already used in the program
      const allActivities = program.days.flatMap(d => d.activities);
      const usedVenueNames = new Set(
        allActivities.map(a => a.venueName.toLowerCase())
      );

      // Get user's excluded venues
      const excludedVenues = await prisma.excludedActivity.findMany({
        where: { userId },
        select: { venueName: true },
      });
      const excludedNames = excludedVenues.map(e => e.venueName.toLowerCase());

      // Load venues from the same category
      const category = targetActivity.category as VenueCategory;
      const allVenues = loadVenuesByCategory(category);

      // Filter out:
      // - Already used venues in the program
      // - The current venue being replaced
      // - Excluded venues for this user
      const currentVenueName = targetActivity.venueName.toLowerCase();
      const availableVenues = allVenues.filter(venue => {
        const venueNameLower = venue.name.toLowerCase();
        return (
          !usedVenueNames.has(venueNameLower) &&
          venueNameLower !== currentVenueName &&
          !excludedNames.includes(venueNameLower)
        );
      });

      if (availableVenues.length === 0) {
        return c.json(
          { error: { message: "No alternative venues available", code: "NO_ALTERNATIVES" } },
          400
        );
      }

      // Pick a random new venue
      const randomIndex = Math.floor(Math.random() * availableVenues.length);
      const newVenue = availableVenues[randomIndex]!;

      // Update the option with the new venue info
      await prisma.activity.update({
        where: { id: optionId },
        data: {
          venueName: newVenue.name,
          venueAddress: newVenue.address || null,
          venuePhone: newVenue.phone || null,
          venueHours: newVenue.hours || null,
          venueStyle: newVenue.style || null,
          venueDescription: newVenue.description || null,
          isEiffelView: newVenue.isEiffelView || false,
          venueReservationRequired: newVenue.reservationRequired || false,
        },
      });

      // Fetch updated program
      const updatedProgram = await prisma.program.findFirst({
        where: { id: programId },
        include: {
          days: {
            include: { activities: { orderBy: [{ sortOrder: "asc" }, { isOption: "asc" }] } },
            orderBy: { dayNumber: "asc" },
          },
        },
      });

      return c.json({ data: transformDbProgramToApi(updatedProgram!) });
    } catch (error) {
      console.error("Error regenerating option:", error);
      return c.json(
        { error: { message: "Failed to regenerate option", code: "REGENERATE_ERROR" } },
        500
      );
    }
  }
);

/**
 * PUT /api/programs/:id/activities/:activityId/switch-type
 * Switch the category/type of an activity slot to a new category
 */
programsRouter.put(
  "/:id/activities/:activityId/switch-type",
  zValidator("json", SwitchActivityTypeRequestSchema),
  async (c) => {
    const userId = await getUserId(c);
    const programId = c.req.param("id");
    const activityId = c.req.param("activityId");
    const { newCategory } = c.req.valid("json");

    try {
      // Verify program ownership
      const program = await prisma.program.findFirst({
        where: { id: programId, userId: userId },
        include: {
          days: {
            include: {
              activities: true,
            },
          },
        },
      });

      if (!program) {
        return c.json(
          { error: { message: "Program not found", code: "NOT_FOUND" } },
          404
        );
      }

      // Find the activity by id OR optionGroupId
      const activity = await prisma.activity.findFirst({
        where: {
          OR: [
            { id: activityId, day: { programId } },
            { optionGroupId: activityId, day: { programId } },
          ],
        },
        include: {
          day: true,
        },
      });

      if (!activity) {
        return c.json(
          { error: { message: "Activity not found", code: "NOT_FOUND" } },
          404
        );
      }

      // Map category to activity type
      const categoryToTypeMap: Record<VenueCategory, string> = {
        spas: "wellness",
        musees: "culture",
        restaurants: "dining",
        activites: "experience",
        shopping: "shopping",
        nightlife: "nightlife",
        transports: "transport",
      };

      const newType = categoryToTypeMap[newCategory];

      // Get the day's actualDate and activity time for availability filtering
      const actualDate = activity.day.actualDate;
      const activityTime = activity.time || "14:00"; // Default to 14:00 if no time specified

      // Load 2 venues from the new category CSV
      const allVenues = loadVenuesByCategory(newCategory);

      // Get all venues already used in the program
      const allActivities = program.days.flatMap(d => d.activities);
      const usedVenueNames = new Set(
        allActivities.map(a => a.venueName.toLowerCase())
      );

      // Get user's excluded venues
      const excludedVenues = await prisma.excludedActivity.findMany({
        where: { userId },
        select: { venueName: true },
      });
      const excludedNames = excludedVenues.map(e => e.venueName.toLowerCase());

      // Filter out already used and excluded venues
      let availableVenues = allVenues.filter(venue => {
        const venueNameLower = venue.name.toLowerCase();
        return (
          !usedVenueNames.has(venueNameLower) &&
          !excludedNames.includes(venueNameLower)
        );
      });

      // Filter by availability if we have a date
      if (actualDate) {
        const date = new Date(actualDate);
        availableVenues = filterVenuesByAvailability(availableVenues, date, activityTime);
      }

      // If we don't have enough venues, fall back to all available (without date filtering)
      if (availableVenues.length < 2) {
        availableVenues = allVenues.filter(venue => {
          const venueNameLower = venue.name.toLowerCase();
          return (
            !usedVenueNames.has(venueNameLower) &&
            !excludedNames.includes(venueNameLower)
          );
        });
      }

      if (availableVenues.length === 0) {
        return c.json(
          { error: { message: "No venues available for this category", code: "NO_VENUES" } },
          400
        );
      }

      // Shuffle and take appropriate number of venues (4 for shopping, 2 for others)
      const shuffled = [...availableVenues].sort(() => Math.random() - 0.5);
      const numVenues = newCategory === "shopping" ? 4 : 2;
      const selectedVenues = shuffled.slice(0, Math.min(numVenues, shuffled.length));

      // Get all activities in the option group
      const groupActivities = await prisma.activity.findMany({
        where: { optionGroupId: activity.optionGroupId },
      });

      // Delete old options
      await prisma.activity.deleteMany({
        where: { optionGroupId: activity.optionGroupId },
      });

      // Create new options with the new category
      const newActivities = selectedVenues.map((venue, index) => ({
        id: `${activity.optionGroupId}-opt-${index + 1}`,
        dayId: activity.dayId,
        timeSlot: activity.timeSlot,
        time: activity.time,
        type: newType,
        category: newCategory,
        venueName: venue.name,
        venueAddress: venue.address || null,
        venuePhone: venue.phone || null,
        venueHours: venue.hours || null,
        venueStyle: venue.style || null,
        venueDescription: venue.description || null,
        isEiffelView: venue.isEiffelView || false,
        venueReservationRequired: venue.reservationRequired || false,
        isOption: index > 0,
        optionGroupId: activity.optionGroupId,
        isSelected: index === 0, // Select first option by default
        verificationStatus: activity.verificationStatus,
        sortOrder: activity.sortOrder,
        conciergeNotes: activity.conciergeNotes,
        isRest: false,
      }));

      // Insert new activities
      await prisma.activity.createMany({
        data: newActivities,
      });

      // Fetch updated program
      const updatedProgram = await prisma.program.findFirst({
        where: { id: programId },
        include: {
          days: {
            include: { activities: { orderBy: [{ sortOrder: "asc" }, { isOption: "asc" }] } },
            orderBy: { dayNumber: "asc" },
          },
        },
      });

      return c.json({ data: transformDbProgramToApi(updatedProgram!) });
    } catch (error) {
      console.error("Error switching activity type:", error);
      return c.json(
        { error: { message: "Failed to switch activity type", code: "SWITCH_ERROR" } },
        500
      );
    }
  }
);

/**
 * PUT /api/programs/:id/activities/:activityId/rest
 * Toggle the rest state of an activity slot
 */
programsRouter.put("/:id/activities/:activityId/rest", async (c) => {
  const userId = await getUserId(c);
  const programId = c.req.param("id");
  const activityId = c.req.param("activityId");

  try {
    // Verify program ownership
    const program = await prisma.program.findFirst({
      where: { id: programId, userId: userId },
    });

    if (!program) {
      return c.json(
        { error: { message: "Program not found", code: "NOT_FOUND" } },
        404
      );
    }

    // Find activity by id OR optionGroupId (since frontend sends the group ID)
    const activity = await prisma.activity.findFirst({
      where: {
        OR: [
          { id: activityId, day: { programId } },
          { optionGroupId: activityId, day: { programId } },
        ],
      },
    });

    if (!activity) {
      return c.json(
        { error: { message: "Activity not found", code: "NOT_FOUND" } },
        404
      );
    }

    // Toggle isRest for all activities in the option group
    const newIsRest = !activity.isRest;
    await prisma.activity.updateMany({
      where: { optionGroupId: activity.optionGroupId },
      data: { isRest: newIsRest },
    });

    // Fetch updated program
    const updatedProgram = await prisma.program.findFirst({
      where: { id: programId },
      include: {
        days: {
          include: { activities: { orderBy: [{ sortOrder: "asc" }, { isOption: "asc" }] } },
          orderBy: { dayNumber: "asc" },
        },
      },
    });

    return c.json({ data: transformDbProgramToApi(updatedProgram!) });
  } catch (error) {
    console.error("Error toggling rest state:", error);
    return c.json(
      { error: { message: "Failed to toggle rest state", code: "REST_ERROR" } },
      500
    );
  }
});

/**
 * PUT /api/programs/:id/validate - Validate/finalize the program
 */
programsRouter.put("/:id/validate", async (c) => {
  const userId = await getUserId(c);
  const programId = c.req.param("id");

  try {
    // Verify program ownership
    const program = await prisma.program.findFirst({
      where: { id: programId, userId: userId },
    });

    if (!program) {
      return c.json(
        { error: { message: "Program not found", code: "NOT_FOUND" } },
        404
      );
    }

    // Update status to validated
    await prisma.program.update({
      where: { id: programId },
      data: {
        status: "validated",
        validatedAt: new Date(),
      },
    });

    // Fetch updated program
    const updatedProgram = await prisma.program.findFirst({
      where: { id: programId },
      include: {
        days: {
          include: { activities: { orderBy: [{ sortOrder: "asc" }, { isOption: "asc" }] } },
          orderBy: { dayNumber: "asc" },
        },
      },
    });

    return c.json({ data: transformDbProgramToApi(updatedProgram!) });
  } catch (error) {
    console.error("Error validating program:", error);
    return c.json(
      { error: { message: "Failed to validate program", code: "VALIDATE_ERROR" } },
      500
    );
  }
});

/**
 * PUT /api/programs/:id/title - Update program title
 */
programsRouter.put(
  "/:id/title",
  zValidator("json", UpdateProgramTitleRequestSchema),
  async (c) => {
    const userId = await getUserId(c);
    const programId = c.req.param("id");
    const { title } = c.req.valid("json");

    try {
      // Verify program ownership
      const program = await prisma.program.findFirst({
        where: { id: programId, userId: userId },
      });

      if (!program) {
        return c.json(
          { error: { message: "Program not found", code: "NOT_FOUND" } },
          404
        );
      }

      // Update the program title
      await prisma.program.update({
        where: { id: programId },
        data: { title },
      });

      // Fetch updated program
      const updatedProgram = await prisma.program.findFirst({
        where: { id: programId },
        include: {
          days: {
            include: { activities: { orderBy: [{ sortOrder: "asc" }, { isOption: "asc" }] } },
            orderBy: { dayNumber: "asc" },
          },
        },
      });

      return c.json({ data: transformDbProgramToApi(updatedProgram!) });
    } catch (error) {
      console.error("Error updating program title:", error);
      return c.json(
        { error: { message: "Failed to update program title", code: "TITLE_UPDATE_ERROR" } },
        500
      );
    }
  }
);

/**
 * PUT /api/programs/:id/days/:dayId/title - Update day title (themeClient)
 */
programsRouter.put(
  "/:id/days/:dayId/title",
  zValidator("json", UpdateDayTitleRequestSchema),
  async (c) => {
    const userId = await getUserId(c);
    const programId = c.req.param("id");
    const dayId = c.req.param("dayId");
    const { title } = c.req.valid("json");

    try {
      // Verify program ownership
      const program = await prisma.program.findFirst({
        where: { id: programId, userId: userId },
      });

      if (!program) {
        return c.json(
          { error: { message: "Program not found", code: "NOT_FOUND" } },
          404
        );
      }

      // Find the day and verify it belongs to this program
      const day = await prisma.programDay.findFirst({
        where: {
          id: dayId,
          programId: programId,
        },
      });

      if (!day) {
        return c.json(
          { error: { message: "Day not found", code: "NOT_FOUND" } },
          404
        );
      }

      // Update the day's themeClient field
      await prisma.programDay.update({
        where: { id: dayId },
        data: { themeClient: title },
      });

      // Fetch updated program
      const updatedProgram = await prisma.program.findFirst({
        where: { id: programId },
        include: {
          days: {
            include: { activities: { orderBy: [{ sortOrder: "asc" }, { isOption: "asc" }] } },
            orderBy: { dayNumber: "asc" },
          },
        },
      });

      return c.json({ data: transformDbProgramToApi(updatedProgram!) });
    } catch (error) {
      console.error("Error updating day title:", error);
      return c.json(
        { error: { message: "Failed to update day title", code: "DAY_TITLE_UPDATE_ERROR" } },
        500
      );
    }
  }
);

/**
 * POST /api/programs/:id/exclude - Add venue to user's exclusion list
 */
programsRouter.post(
  "/:id/exclude",
  zValidator("json", ExcludeVenueRequestSchema),
  async (c) => {
    const userId = await getUserId(c);
    const programId = c.req.param("id");
    const { venueName, category, reason } = c.req.valid("json");

    try {
      // Verify program ownership
      const program = await prisma.program.findFirst({
        where: { id: programId, userId: userId },
      });

      if (!program) {
        return c.json(
          { error: { message: "Program not found", code: "NOT_FOUND" } },
          404
        );
      }

      // Add to exclusion list (upsert to avoid duplicates)
      await prisma.excludedActivity.upsert({
        where: {
          userId_venueName_category: {
            userId: userId,
            venueName,
            category,
          },
        },
        update: {
          reason,
        },
        create: {
          userId: userId,
          venueName,
          category,
          reason,
        },
      });

      return c.json({
        data: {
          success: true,
          message: `Venue "${venueName}" added to exclusion list`,
        },
      });
    } catch (error) {
      console.error("Error excluding venue:", error);
      return c.json(
        { error: { message: "Failed to exclude venue", code: "EXCLUDE_ERROR" } },
        500
      );
    }
  }
);

/**
 * GET /api/programs/:id/pdf - Generate and return PDF of validated program
 */
programsRouter.get("/:id/pdf", async (c) => {
  const userId = await getUserId(c);
  const programId = c.req.param("id");
  const lang = c.req.query("lang") || "fr"; // Get language from query param, default to French

  try {
    // Fetch the program
    const dbProgram = await prisma.program.findFirst({
      where: {
        id: programId,
        userId: userId,
      },
      include: {
        days: {
          include: {
            activities: {
              orderBy: [{ sortOrder: "asc" }, { isOption: "asc" }],
            },
          },
          orderBy: { dayNumber: "asc" },
        },
      },
    });

    if (!dbProgram) {
      return c.json(
        { error: { message: "Programme non trouve", code: "NOT_FOUND" } },
        404
      );
    }

    // Note: PDF generation is now allowed regardless of validation status
    // This allows users to export draft programs for review

    // Transform to API format
    const program = transformDbProgramToApi(dbProgram);

    // Generate PDF with language support
    console.log("[PDF] Starting PDF generation for program:", programId);
    console.log("[PDF] Program title:", program.title);
    console.log("[PDF] Days count:", program.days.length);

    let pdfBuffer: Buffer;
    try {
      // Create the React element for the PDF
      const pdfElement = ProgramPdfDocument({ program, language: lang });
      pdfBuffer = await renderToBuffer(pdfElement);
      console.log("[PDF] PDF generated successfully, size:", pdfBuffer.length);
    } catch (renderError) {
      console.error("[PDF] Error during renderToBuffer:", renderError);
      throw renderError;
    }

    // Create filename
    const sanitizedTitle = (program.title || "programme")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 50);
    const filename = `${sanitizedTitle}-${program.city}.pdf`;

    // Return PDF response
    return new Response(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": pdfBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("Error generating PDF:", error);
    // Log more details about the error
    if (error instanceof Error) {
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    return c.json(
      { error: { message: "Echec de la generation du PDF", code: "PDF_ERROR" } },
      500
    );
  }
});

/**
 * POST /api/programs/:id/pdf - Generate PDF with optional attachments to merge
 */
const PdfWithAttachmentsRequestSchema = z.object({
  attachmentUrls: z.array(z.string().url()).optional(),
  language: z.string().optional().default("fr"),
});

programsRouter.post(
  "/:id/pdf",
  zValidator("json", PdfWithAttachmentsRequestSchema),
  async (c) => {
    const userId = await getUserId(c);
    const programId = c.req.param("id");
    const { attachmentUrls, language } = c.req.valid("json");

    try {
      // Fetch the program
      const dbProgram = await prisma.program.findFirst({
        where: {
          id: programId,
          userId: userId,
        },
        include: {
          days: {
            include: {
              activities: {
                orderBy: [{ sortOrder: "asc" }, { isOption: "asc" }],
              },
            },
            orderBy: { dayNumber: "asc" },
          },
        },
      });

      if (!dbProgram) {
        return c.json(
          { error: { message: "Programme non trouve", code: "NOT_FOUND" } },
          404
        );
      }

      // Transform to API format
      const program = transformDbProgramToApi(dbProgram);

      // Generate the main program PDF
      console.log("[PDF] Starting PDF generation with attachments for program:", programId);
      const pdfElement = ProgramPdfDocument({ program, language });
      const programPdfBuffer = await renderToBuffer(pdfElement);
      console.log("[PDF] Program PDF generated, size:", programPdfBuffer.length);

      // If no attachments, return just the program PDF
      if (!attachmentUrls || attachmentUrls.length === 0) {
        const sanitizedTitle = (program.title || "programme")
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "-")
          .replace(/-+/g, "-")
          .slice(0, 50);
        const filename = `${sanitizedTitle}-${program.city}.pdf`;

        return new Response(programPdfBuffer, {
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="${filename}"`,
            "Content-Length": programPdfBuffer.length.toString(),
          },
        });
      }

      // Fetch all attachment PDFs
      console.log("[PDF] Fetching", attachmentUrls.length, "attachment PDFs");
      const pdfBuffers: Buffer[] = [programPdfBuffer];

      for (const url of attachmentUrls) {
        const attachmentBuffer = await fetchPdfFromUrl(url);
        if (attachmentBuffer) {
          pdfBuffers.push(attachmentBuffer);
          console.log("[PDF] Added attachment from:", url);
        }
      }

      // Merge all PDFs
      console.log("[PDF] Merging", pdfBuffers.length, "PDFs");
      const mergedPdfBuffer = await mergePdfs(pdfBuffers);
      console.log("[PDF] Merged PDF size:", mergedPdfBuffer.length);

      // Create filename
      const sanitizedTitle = (program.title || "programme")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "-")
        .replace(/-+/g, "-")
        .slice(0, 50);
      const filename = `${sanitizedTitle}-${program.city}-complet.pdf`;

      // Return merged PDF response
      return new Response(mergedPdfBuffer, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${filename}"`,
          "Content-Length": mergedPdfBuffer.length.toString(),
        },
      });
    } catch (error) {
      console.error("Error generating PDF with attachments:", error);
      if (error instanceof Error) {
        console.error("Error details:", error.message, error.stack);
      }
      return c.json(
        { error: { message: "Echec de la generation du PDF", code: "PDF_ERROR" } },
        500
      );
    }
  }
);

/**
 * Transform database program to API format
 */
function transformDbProgramToApi(dbProgram: {
  id: string;
  userId: string;
  city: string;
  duration: number;
  profile: string;
  pace: string;
  interests: string;
  guests: number;
  startDate: string | null;
  endDate: string | null;
  title: string | null;
  introInternal: string | null;
  introClient: string | null;
  closingInternal: string | null;
  closingClient: string | null;
  status: string;
  validatedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  days: Array<{
    id: string;
    dayNumber: number;
    actualDate: string | null;
    themeInternal: string | null;
    themeClient: string | null;
    activities: Array<{
      id: string;
      timeSlot: string;
      time: string | null;
      type: string;
      category: string;
      venueName: string;
      venueAddress: string | null;
      venuePhone: string | null;
      venueHours: string | null;
      venueStyle: string | null;
      venueDescription: string | null;
      venueReservationRequired: boolean;
      venueReservationNote: string | null;
      isEiffelView: boolean;
      isOption: boolean;
      optionGroupId: string | null;
      isSelected: boolean;
      conciergeNotes: string | null;
      verificationStatus: string;
      isRest: boolean;
      sortOrder: number;
    }>;
  }>;
}): Program {
  // Group activities by optionGroupId
  const transformedDays = dbProgram.days.map((day) => {
    const activityGroups = new Map<string, typeof day.activities>();

    for (const activity of day.activities) {
      const groupId = activity.optionGroupId || activity.id;
      if (!activityGroups.has(groupId)) {
        activityGroups.set(groupId, []);
      }
      activityGroups.get(groupId)!.push(activity);
    }

    const activities = Array.from(activityGroups.entries()).map(
      ([groupId, groupActivities]) => {
        const primary = groupActivities[0];
        if (!primary) {
          throw new Error("No activities in group");
        }
        return {
          id: groupId,
          timeSlot: primary.timeSlot as Program["days"][0]["activities"][0]["timeSlot"],
          time: primary.time || undefined,
          type: primary.type as Program["days"][0]["activities"][0]["type"],
          category: primary.category as Program["days"][0]["activities"][0]["category"],
          options: groupActivities.map((a) => ({
            id: a.id,
            venueName: a.venueName,
            venueAddress: a.venueAddress || undefined,
            venuePhone: a.venuePhone || undefined,
            venueHours: a.venueHours || undefined,
            venueStyle: a.venueStyle || undefined,
            venueType: undefined,
            venueDescription: a.venueDescription || undefined,
            venueReservationRequired: a.venueReservationRequired || undefined,
            venueReservationNote: a.venueReservationNote || undefined,
            isEiffelView: a.isEiffelView || undefined,
            category: a.category as Program["days"][0]["activities"][0]["category"],
            isSelected: a.isSelected,
          })),
          conciergeNotes: primary.conciergeNotes || undefined,
          verificationStatus: primary.verificationStatus as
            | "pending"
            | "verified"
            | "to_confirm",
          isRest: primary.isRest || false,
        };
      }
    );

    // Sort by time slot order
    const slotOrder = ["morning", "lunch", "afternoon", "dinner", "evening"];
    activities.sort(
      (a, b) => slotOrder.indexOf(a.timeSlot) - slotOrder.indexOf(b.timeSlot)
    );

    return {
      id: day.id,
      dayNumber: day.dayNumber,
      actualDate: day.actualDate || undefined,
      themeInternal: day.themeInternal || undefined,
      themeClient: day.themeClient || undefined,
      activities,
    };
  });

  return {
    id: dbProgram.id,
    userId: dbProgram.userId,
    city: dbProgram.city,
    duration: dbProgram.duration,
    profile: dbProgram.profile as Program["profile"],
    pace: dbProgram.pace as Program["pace"],
    interests: JSON.parse(dbProgram.interests),
    guests: dbProgram.guests,
    title: dbProgram.title || undefined,
    introInternal: dbProgram.introInternal || undefined,
    introClient: dbProgram.introClient || undefined,
    closingInternal: dbProgram.closingInternal || undefined,
    closingClient: dbProgram.closingClient || undefined,
    status: dbProgram.status as Program["status"],
    validatedAt: dbProgram.validatedAt?.toISOString(),
    startDate: dbProgram.startDate || undefined,
    endDate: dbProgram.endDate || undefined,
    createdAt: dbProgram.createdAt.toISOString(),
    updatedAt: dbProgram.updatedAt.toISOString(),
    days: transformedDays,
  };
}
