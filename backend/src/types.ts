import { z } from "zod";

// ========== VENUE TYPES ==========

export const VenueCategorySchema = z.enum([
  "restaurants",
  "musees",
  "activites",
  "spas",
  "shopping",
  "nightlife",
  "transports",
]);

export type VenueCategory = z.infer<typeof VenueCategorySchema>;

// Map CSV files to categories
export const categoryToFileMap: Record<VenueCategory, string> = {
  restaurants: "restaurants.csv",
  musees: "mus--es.csv",
  activites: "activit--s.csv",
  spas: "spas.csv",
  shopping: "shopping.csv",
  nightlife: "nightlife.csv",
  transports: "transports.csv",
};

// Restaurant sub-categories (from CSV "Catégorie" column)
export type RestaurantCategory =
  | "brasserie"
  | "cuisine_monde"
  | "trendy"
  | "etoile"
  | "confidentiel";

// Museum sub-categories (from CSV "Catégories" column)
export type MuseumCategory =
  | "art_contemporain_classique"
  | "patrimoine_monument"
  | "art_moderne"
  | "incontournable"
  | "aucun";

// Activity sub-categories (from CSV "Catégories" column)
export type ActivityCategory =
  | "enfant_famille"
  | "culture_visite"
  | "activite_creative"
  | "tour_voiture"
  | "croisiere"
  | "helicoptere";

// Nightlife sub-categories (from CSV "Catégorie" column)
export type NightlifeCategory =
  | "palace_lounge_rooftops"
  | "speakeasy_bar_vins"
  | "clubs_festifs"
  | "cabarets"
  | "aucun";

// Intensity level for trip pacing
export type IntensityLevel = "relaxed" | "moderate" | "intense";

// Generic normalized venue structure
export const VenueSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: VenueCategorySchema,
  subCategory: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  hours: z.string().optional(),
  type: z.string().optional(),
  style: z.string().optional(),
  description: z.string().optional(),
  experience: z.string().optional(), // For restaurants: Terrasse, Vue Tour Eiffel, etc.
  priceRange: z.string().optional(),
  reservationRequired: z.boolean().optional(), // For shops that need appointment
  isEiffelView: z.boolean().optional(), // For restaurants with Tour Eiffel view
});

export type Venue = z.infer<typeof VenueSchema>;

// ========== PROGRAM GENERATION TYPES ==========

export const ProfileSchema = z.enum([
  "famille",
  "couple",
  "vip",
  "uhnw",
  "business",
  "solo",
]);

export type Profile = z.infer<typeof ProfileSchema>;

export const PaceSchema = z.enum(["relaxed", "balanced", "intense"]);

export type Pace = z.infer<typeof PaceSchema>;

// Interest IDs (kept for backwards compatibility)
export const InterestSchema = z.enum([
  "restaurants",
  "top25",
  "bars",
  "clubs",
  "transports",
  "spas",
  "musees",
  "enfants",
  "tours",
  "nautique",
  "elite",
  "cabarets",
  "shoppers",
  "securite",
]);

export type Interest = z.infer<typeof InterestSchema>;

// Map old interests to new categories
export const interestToCategoryMap: Record<string, VenueCategory> = {
  restaurants: "restaurants",
  top25: "restaurants",
  bars: "nightlife",
  clubs: "nightlife",
  transports: "transports",
  spas: "spas",
  musees: "musees",
  enfants: "activites",
  tours: "activites",
  nautique: "activites",
  elite: "activites",
  cabarets: "nightlife",
  shoppers: "shopping",
  securite: "transports",
};

export const TimeSlotSchema = z.enum([
  "morning",
  "lunch",
  "afternoon",
  "dinner",
  "evening",
]);

export type TimeSlot = z.infer<typeof TimeSlotSchema>;

export const ActivityTypeSchema = z.enum([
  "dining",
  "culture",
  "wellness",
  "shopping",
  "experience",
  "leisure",
  "transport",
  "nightlife",
]);

export type ActivityType = z.infer<typeof ActivityTypeSchema>;

// ========== API REQUEST/RESPONSE SCHEMAS ==========

// Generate program request with new fields
export const GenerateProgramRequestSchema = z.object({
  city: z.string().default("paris"),
  profile: ProfileSchema,
  interests: z.array(InterestSchema).default([]),
  pace: PaceSchema,
  duration: z.number().int().min(1).max(21),
  guests: z.number().int().min(1).default(1),
  excludedVenues: z.array(z.string()).optional().default([]),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  // New enhanced fields
  arrivalTimeKnown: z.boolean().optional().default(false),
  arrivalTime: z.string().optional().default("14:00"),
  departureTimeKnown: z.boolean().optional().default(false),
  departureTime: z.string().optional().default("12:00"),
  restaurantCategories: z.array(z.string()).optional().default([]),
  // V2 fields - intensity and category arrays
  intensity: z.enum(["relaxed", "moderate", "intense"]).default("moderate"),
  museumCategories: z.array(z.string()).optional().default([]),
  activityCategories: z.array(z.string()).optional().default([]),
  wantsSpa: z.boolean().optional().default(false),
  wantsShopping: z.boolean().optional().default(false),
  selectedShops: z.array(z.string()).optional().default([]),
  nightlifeCategories: z.array(z.string()).optional().default([]),
});

export type GenerateProgramRequest = z.infer<
  typeof GenerateProgramRequestSchema
>;

// Activity option for dual choices
export const ActivityOptionSchema = z.object({
  id: z.string(),
  venueName: z.string(),
  venueAddress: z.string().optional(),
  venuePhone: z.string().optional(),
  venueHours: z.string().optional(),
  venueStyle: z.string().optional(),
  venueType: z.string().optional(),
  venueDescription: z.string().optional(), // For personalized recommendation comment
  venueReservationRequired: z.boolean().optional(), // For "Sur RDV" shops
  venueReservationNote: z.string().optional(), // Special notes like Hermes lottery warning
  isEiffelView: z.boolean().optional(), // Flag for Vue Tour Eiffel restaurants
  category: VenueCategorySchema,
  isSelected: z.boolean().default(false),
});

export type ActivityOption = z.infer<typeof ActivityOptionSchema>;

// Activity slot with dual options (or up to 4 for shopping)
export const ActivitySlotSchema = z.object({
  id: z.string(),
  timeSlot: TimeSlotSchema,
  time: z.string().optional(),
  type: ActivityTypeSchema,
  category: VenueCategorySchema,
  options: z.array(ActivityOptionSchema).min(1).max(4),
  conciergeNotes: z.string().optional(),
  verificationStatus: z
    .enum(["pending", "verified", "to_confirm"])
    .default("pending"),
  isRest: z.boolean().optional().default(false),
});

export type ActivitySlot = z.infer<typeof ActivitySlotSchema>;

// Program day
export const ProgramDaySchema = z.object({
  id: z.string(),
  dayNumber: z.number().int().min(1),
  actualDate: z.string().optional(), // Full date string e.g., "2025-02-03"
  themeInternal: z.string().optional(),
  themeClient: z.string().optional(),
  activities: z.array(ActivitySlotSchema),
});

export type ProgramDay = z.infer<typeof ProgramDaySchema>;

// Full program response
export const ProgramSchema = z.object({
  id: z.string(),
  userId: z.string(),
  city: z.string().default("paris"),
  duration: z.number().int(),
  profile: ProfileSchema,
  pace: PaceSchema,
  interests: z.array(InterestSchema),
  guests: z.number().int(),
  title: z.string().optional(),
  introInternal: z.string().optional(),
  introClient: z.string().optional(),
  closingInternal: z.string().optional(),
  closingClient: z.string().optional(),
  status: z.enum(["draft", "validated", "exported"]).default("draft"),
  validatedAt: z.string().datetime().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  days: z.array(ProgramDaySchema),
});

export type Program = z.infer<typeof ProgramSchema>;

// Program list item (summary)
export const ProgramSummarySchema = z.object({
  id: z.string(),
  title: z.string().optional(),
  city: z.string(),
  duration: z.number().int(),
  profile: ProfileSchema,
  pace: PaceSchema,
  status: z.enum(["draft", "validated", "exported"]),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type ProgramSummary = z.infer<typeof ProgramSummarySchema>;

// Select activity option request
export const SelectActivityOptionRequestSchema = z.object({
  optionId: z.string(),
});

export type SelectActivityOptionRequest = z.infer<
  typeof SelectActivityOptionRequestSchema
>;

// Select multiple activity options request (for shopping)
export const SelectMultipleOptionsRequestSchema = z.object({
  optionIds: z.array(z.string()).min(1).max(4),
});

export type SelectMultipleOptionsRequest = z.infer<
  typeof SelectMultipleOptionsRequestSchema
>;

// Update concierge notes request
export const UpdateConciergeNotesRequestSchema = z.object({
  notes: z.string(),
});

export type UpdateConciergeNotesRequest = z.infer<
  typeof UpdateConciergeNotesRequestSchema
>;

// Exclude venue request
export const ExcludeVenueRequestSchema = z.object({
  venueName: z.string(),
  category: VenueCategorySchema,
  reason: z.string().optional(),
});

export type ExcludeVenueRequest = z.infer<typeof ExcludeVenueRequestSchema>;

// Update activity time request
export const UpdateActivityTimeRequestSchema = z.object({
  time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: "Invalid time format. Expected HH:MM (24-hour format)",
  }),
});

export type UpdateActivityTimeRequest = z.infer<typeof UpdateActivityTimeRequestSchema>;

// Update program title request
export const UpdateProgramTitleRequestSchema = z.object({
  title: z.string().min(1, { message: "Title cannot be empty" }),
});

export type UpdateProgramTitleRequest = z.infer<typeof UpdateProgramTitleRequestSchema>;

// Update day title request
export const UpdateDayTitleRequestSchema = z.object({
  title: z.string().min(1, { message: "Title cannot be empty" }),
});

export type UpdateDayTitleRequest = z.infer<typeof UpdateDayTitleRequestSchema>;

// Switch activity type request
export const SwitchActivityTypeRequestSchema = z.object({
  newCategory: VenueCategorySchema,
});

export type SwitchActivityTypeRequest = z.infer<typeof SwitchActivityTypeRequestSchema>;

// API Error response
export const ApiErrorSchema = z.object({
  error: z.object({
    message: z.string(),
    code: z.string().optional(),
  }),
});

export type ApiError = z.infer<typeof ApiErrorSchema>;
