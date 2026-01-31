import { nanoid } from "nanoid";
import {
  type GenerateProgramRequest,
  type Program,
  type ProgramDay,
  type ActivitySlot,
  type ActivityOption,
  type VenueCategory,
  type TimeSlot,
  type ActivityType,
  type Venue,
  type IntensityLevel,
} from "../types";
import {
  getRestaurantsByCategories,
  getRestaurantsWithEiffelView,
  getMuseumsByCategories,
  getActivitiesByCategories,
  getNightlifeByCategories,
  getSpas,
  getShoppingVenues,
  getTransports,
  loadVenuesByCategory,
  filterVenuesByAvailability,
  getDayOfWeekFrench,
  isVenueOpenAt,
  getLuxuryGiantShops,
  isLuxuryGiant,
  isHermes,
} from "./csv-loader";

// Special activities that should only be proposed ONCE per trip
const ONE_SHOT_ACTIVITIES = ["tour_voiture", "croisiere", "helicoptere"];

// Activity count per day based on intensity (excluding nightlife bonus)
const INTENSITY_ACTIVITIES: Record<IntensityLevel, number> = {
  relaxed: 1,
  moderate: 2,
  intense: 3,
};

// ========== V3: TIME CONVERSION HELPER ==========

/**
 * Convert time string (HH:MM) to minutes for comparison
 */
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return (hours || 0) * 60 + (minutes || 0);
}

// ========== V2: VARIABLE TIME SLOTS ==========

/**
 * Generate a random time variation within a range
 */
function getVariedTime(baseHour: number, baseMinute: number, variationMinutes: number = 30): string {
  const variations = [0, 15, 30];
  const randomVariation = variations[Math.floor(Math.random() * variations.length)] || 0;
  const totalMinutes = baseHour * 60 + baseMinute + randomVariation;
  const maxMinutes = baseHour * 60 + baseMinute + variationMinutes;
  const finalMinutes = Math.min(totalMinutes, maxMinutes);
  const hour = Math.floor(finalMinutes / 60);
  const minute = finalMinutes % 60;
  return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
}

/**
 * Get variable time for a time slot based on context
 *
 * NOTE: Each activity slot represents a MINIMUM 2 HOURS of engagement.
 * The time slots are designed with sufficient spacing to ensure
 * meaningful experiences at each venue:
 * - Morning: ~10:00-12:00 (2h museum/culture visit)
 * - Lunch: ~12:30-14:30 (2h dining experience)
 * - Afternoon: ~14:30-18:00 (2-4h depending on intensity)
 * - Dinner: ~19:30-21:30 (2h dining experience)
 * - Evening: ~22:00+ (nightlife/cabaret)
 */
function getTimeForSlot(
  timeSlot: TimeSlot,
  options: {
    isCabaretDay?: boolean;
    activityCount?: number;
    isFirstActivity?: boolean;
  } = {}
): string {
  const { isCabaretDay = false, activityCount = 2, isFirstActivity = true } = options;

  switch (timeSlot) {
    case "morning":
      // Morning: 10:00, 10:30, or 11:00
      return getVariedTime(10, 0, 60);
    case "lunch":
      // Lunch: 12:30 or 13:00
      return getVariedTime(12, 30, 30);
    case "afternoon":
      // Afternoon: varies based on activity count and if first or second activity
      if (activityCount >= 3 && !isFirstActivity) {
        // Second afternoon slot: 16:30 or 17:00
        return getVariedTime(16, 30, 30);
      }
      // First afternoon activity: 14:30, 15:00, or 15:30
      return getVariedTime(14, 30, 60);
    case "dinner":
      // Dinner: earlier if cabaret day
      if (isCabaretDay) {
        // 18:00 or 18:30 for cabaret nights
        return getVariedTime(18, 0, 30);
      }
      // Normal dinner: 19:30 or 20:00
      return getVariedTime(19, 30, 30);
    case "evening":
      // Nightlife: 22:00, 22:30, or 23:00
      return getVariedTime(22, 0, 60);
    default:
      return "12:00";
  }
}

// ========== V2: DYNAMIC TITLE GENERATION ==========

/**
 * Generate a dynamic program title based on guests, duration, and selected categories
 */
function generateProgramTitle(
  profile: string,
  duration: number,
  guests: number,
  selectedCategories: {
    restaurantCategories?: string[];
    museumCategories?: string[];
    activityCategories?: string[];
    nightlifeCategories?: string[];
    wantsSpa?: boolean;
    wantsShopping?: boolean;
  }
): string {
  const {
    museumCategories = [],
    activityCategories = [],
    nightlifeCategories = [],
    wantsSpa = false,
    wantsShopping = false,
  } = selectedCategories;

  // Determine if this is a couple, solo, or group trip
  const isSolo = guests === 1;
  const isCouple = guests === 2 && profile === "couple";
  const isGroup = guests >= 4;
  const isFamily = profile === "famille" || activityCategories.includes("enfant_famille");

  // Check category emphasis
  const hasNightlife = nightlifeCategories.length > 0 && !nightlifeCategories.includes("aucun");
  const hasCabarets = nightlifeCategories.includes("cabarets");
  const hasMuseums = museumCategories.length > 0 && !museumCategories.includes("aucun");
  const hasArtModerne = museumCategories.includes("art_moderne");
  const hasIncontournables = museumCategories.includes("incontournable");

  // Generate title based on context
  if (isCouple && duration <= 3) {
    return "Escapade Romantique a Paris";
  }

  if (isCouple && duration > 3) {
    if (wantsSpa) {
      return "Romance & Bien-etre Parisien";
    }
    return "Sejour Romantique a Paris";
  }

  if (isGroup && hasNightlife) {
    return "Sejour Festif entre Amis";
  }

  if (isFamily) {
    return "Paris en Famille";
  }

  if (hasMuseums && (hasArtModerne || hasIncontournables) && duration >= 5) {
    return "Immersion Art & Culture";
  }

  if (hasMuseums && duration >= 3) {
    return "Decouverte Culturelle de Paris";
  }

  if (wantsShopping && duration >= 3) {
    return "Shopping & Lifestyle Parisien";
  }

  if (wantsSpa && duration >= 3) {
    return "Serenite & Bien-etre a Paris";
  }

  if (hasCabarets) {
    return "Paris, Ville Lumiere";
  }

  if (hasNightlife) {
    return "Nuits Parisiennes";
  }

  if (isSolo) {
    return "Decouverte Solo de Paris";
  }

  // Profile-based fallbacks
  const profileTitles: Record<string, string> = {
    famille: "Sejour Familial a Paris",
    couple: "Escapade Romantique a Paris",
    vip: "Programme VIP Paris",
    uhnw: "Experience Ultra-Luxe a Paris",
    business: "Programme Affaires Paris",
    solo: "Decouverte Solo de Paris",
  };

  const durationLabel =
    duration <= 3 ? "Week-end" : duration <= 7 ? "Sejour" : "Immersion";

  return profileTitles[profile] || `${durationLabel} a Paris - ${duration} jours`;
}

/**
 * Track used day titles to ensure uniqueness
 */
const usedDayTitles: Set<string> = new Set();

/**
 * Generate a unique and creative day theme based on activities
 */
function generateDayTheme(
  dayNumber: number,
  totalDays: number,
  activities: ActivitySlot[],
  isCabaretDay: boolean = false
): { themeInternal: string; themeClient: string } {
  const types = new Set(activities.map(a => a.type));
  const categories = new Set(activities.map(a => a.category));
  const subCategories = activities.flatMap(a => a.options.map(o => o.category));

  // Check for specific activity combinations
  const hasMuseum = categories.has("musees");
  const hasWellness = types.has("wellness");
  const hasShopping = types.has("shopping");
  const hasNightlife = types.has("nightlife");
  const hasCulture = types.has("culture");
  const hasDining = types.has("dining");

  // First day - arrival theme
  if (dayNumber === 1) {
    const themes = [
      { themeInternal: `Jour 1: Arrivee & Premiere Decouverte`, themeClient: `Premiers Pas Parisiens` },
      { themeInternal: `Jour 1: Bienvenue a Paris`, themeClient: `Premiers Pas dans la Ville Lumiere` },
    ];
    const theme = themes.find(t => !usedDayTitles.has(t.themeClient)) || themes[0]!;
    usedDayTitles.add(theme.themeClient);
    return theme;
  }

  // Last day - departure theme
  if (dayNumber === totalDays) {
    usedDayTitles.clear(); // Clear for next program
    return {
      themeInternal: `Jour ${dayNumber}: Derniers Instants Parisiens`,
      themeClient: `Au Revoir Paris`,
    };
  }

  // Cabaret day - special theme
  if (isCabaretDay) {
    const themes = [
      { themeInternal: `Jour ${dayNumber}: Soiree Spectacle`, themeClient: `Une Nuit au Cabaret` },
      { themeInternal: `Jour ${dayNumber}: Elegance & Spectacle`, themeClient: `Magie des Cabarets Parisiens` },
    ];
    const theme = themes.find(t => !usedDayTitles.has(t.themeClient)) || themes[0]!;
    usedDayTitles.add(theme.themeClient);
    return theme;
  }

  // Combination themes
  if (hasMuseum && hasNightlife) {
    const themes = [
      { themeInternal: `Jour ${dayNumber}: Culture & Nuit Parisienne`, themeClient: `De Monet aux Nuits Parisiennes` },
      { themeInternal: `Jour ${dayNumber}: Art & Festivites`, themeClient: `Culture le Jour, Fete la Nuit` },
    ];
    const theme = themes.find(t => !usedDayTitles.has(t.themeClient)) || themes[0]!;
    usedDayTitles.add(theme.themeClient);
    return theme;
  }

  if (hasWellness && hasDining) {
    const themes = [
      { themeInternal: `Jour ${dayNumber}: Bien-etre & Gastronomie`, themeClient: `Serenite & Gastronomie` },
      { themeInternal: `Jour ${dayNumber}: Detente & Saveurs`, themeClient: `Relaxation & Plaisirs Gourmands` },
    ];
    const theme = themes.find(t => !usedDayTitles.has(t.themeClient)) || themes[0]!;
    usedDayTitles.add(theme.themeClient);
    return theme;
  }

  if (hasShopping && hasNightlife) {
    const themes = [
      { themeInternal: `Jour ${dayNumber}: Shopping & Sortie`, themeClient: `Elegance & Festivites` },
      { themeInternal: `Jour ${dayNumber}: Mode & Nuit`, themeClient: `Du Shopping aux Nuits Parisiennes` },
    ];
    const theme = themes.find(t => !usedDayTitles.has(t.themeClient)) || themes[0]!;
    usedDayTitles.add(theme.themeClient);
    return theme;
  }

  if (hasShopping) {
    const themes = [
      { themeInternal: `Jour ${dayNumber}: Shopping & Elegance`, themeClient: `Mode & Shopping` },
      { themeInternal: `Jour ${dayNumber}: Boutiques de Prestige`, themeClient: `Paris, Capitale de la Mode` },
    ];
    const theme = themes.find(t => !usedDayTitles.has(t.themeClient)) || themes[0]!;
    usedDayTitles.add(theme.themeClient);
    return theme;
  }

  if (hasWellness) {
    const themes = [
      { themeInternal: `Jour ${dayNumber}: Bien-etre & Relaxation`, themeClient: `Detente & Bien-etre` },
      { themeInternal: `Jour ${dayNumber}: Pause Serenite`, themeClient: `Instant de Quietude` },
    ];
    const theme = themes.find(t => !usedDayTitles.has(t.themeClient)) || themes[0]!;
    usedDayTitles.add(theme.themeClient);
    return theme;
  }

  if (hasMuseum || hasCulture) {
    const themes = [
      { themeInternal: `Jour ${dayNumber}: Culture & Decouverte`, themeClient: `Decouverte Culturelle` },
      { themeInternal: `Jour ${dayNumber}: Patrimoine Parisien`, themeClient: `Tresors de Paris` },
      { themeInternal: `Jour ${dayNumber}: Art & Histoire`, themeClient: `Voyage Artistique` },
    ];
    const theme = themes.find(t => !usedDayTitles.has(t.themeClient)) || themes[0]!;
    usedDayTitles.add(theme.themeClient);
    return theme;
  }

  if (hasNightlife) {
    const themes = [
      { themeInternal: `Jour ${dayNumber}: Nuit Parisienne`, themeClient: `Paris by Night` },
      { themeInternal: `Jour ${dayNumber}: Soiree Parisienne`, themeClient: `Lumieres de la Nuit` },
    ];
    const theme = themes.find(t => !usedDayTitles.has(t.themeClient)) || themes[0]!;
    usedDayTitles.add(theme.themeClient);
    return theme;
  }

  // Day-specific default themes with variety
  const defaultThemes: Array<{ themeInternal: string; themeClient: string }> = [
    { themeInternal: `Jour ${dayNumber}: Exploration Parisienne`, themeClient: `Au Coeur de Paris` },
    { themeInternal: `Jour ${dayNumber}: Journee Prestige`, themeClient: `Prestige Parisien` },
    { themeInternal: `Jour ${dayNumber}: Escapade Unique`, themeClient: `Experiences Uniques` },
    { themeInternal: `Jour ${dayNumber}: Moments d'Exception`, themeClient: `Instants Privilegies` },
    { themeInternal: `Jour ${dayNumber}: Immersion Parisienne`, themeClient: `L'Art de Vivre Parisien` },
    { themeInternal: `Jour ${dayNumber}: Decouverte`, themeClient: `Journee Parisienne` },
  ];

  const theme = defaultThemes.find(t => !usedDayTitles.has(t.themeClient)) || defaultThemes[dayNumber % defaultThemes.length]!;
  usedDayTitles.add(theme.themeClient);
  return theme;
}

// ========== V7: VENUE REUSE TRACKING ==========

/**
 * Check if a venue can be used on the current day
 * For trips of 5+ days, venues can be reused after a minimum gap
 * @param venueName - Name of the venue to check
 * @param usedVenuesByDay - Map tracking which day each venue was last used
 * @param currentDay - Current day number in the trip
 * @param minDayGap - Minimum days before venue can be reused (default: 4)
 * @param isLongTrip - Whether this is a long trip (5+ days)
 */
function canUseVenue(
  venueName: string,
  usedVenuesByDay: Map<string, number>,
  currentDay: number,
  minDayGap: number = 4,
  isLongTrip: boolean = false
): boolean {
  const lastUsedDay = usedVenuesByDay.get(venueName.toLowerCase());
  if (lastUsedDay === undefined) return true;
  // For short trips (1-4 days), never reuse venues
  if (!isLongTrip) return false;
  // For long trips, allow reuse after minDayGap
  return (currentDay - lastUsedDay) >= minDayGap;
}

/**
 * Mark a venue as used on a specific day
 */
function markVenueUsed(
  venueName: string,
  usedVenuesByDay: Map<string, number>,
  dayNumber: number
): void {
  usedVenuesByDay.set(venueName.toLowerCase(), dayNumber);
}

/**
 * Filter venues by availability and reuse rules
 * Returns venues that can be used on the current day
 */
function filterAvailableVenues(
  venues: Venue[],
  usedVenuesByDay: Map<string, number>,
  currentDay: number,
  actualDate: Date,
  time: string,
  minDayGap: number = 4,
  isLongTrip: boolean = false
): Venue[] {
  // First filter by venue reuse rules
  const reusableVenues = venues.filter(v =>
    canUseVenue(v.name, usedVenuesByDay, currentDay, minDayGap, isLongTrip)
  );
  // Then filter by opening hours availability
  return filterVenuesByAvailability(reusableVenues, actualDate, time);
}

/**
 * Get venues that can be reused (used more than minDayGap days ago)
 * This is used as a fallback when no unused venues are available
 */
function getReusableVenues(
  venues: Venue[],
  usedVenuesByDay: Map<string, number>,
  currentDay: number,
  actualDate: Date,
  time: string,
  minDayGap: number = 4
): Venue[] {
  const reusable = venues.filter(v => {
    const lastUsedDay = usedVenuesByDay.get(v.name.toLowerCase());
    // Only include venues that were used but can now be reused
    if (lastUsedDay === undefined) return false;
    return (currentDay - lastUsedDay) >= minDayGap;
  });
  return filterVenuesByAvailability(reusable, actualDate, time);
}

/**
 * Create a "Free time" rest slot when no venues are available
 */
function createFreeTimeSlot(
  timeSlot: TimeSlot,
  time: string
): ActivitySlot {
  return {
    id: nanoid(10),
    timeSlot,
    time,
    type: "experience",
    category: "activites",
    options: [{
      id: nanoid(10),
      venueName: "Temps libre",
      venueAddress: "A votre convenance",
      venueDescription: "Profitez de ce moment pour explorer Paris a votre rythme ou vous reposer.",
      category: "activites",
      isSelected: true,
    }],
    verificationStatus: "verified",
    isRest: true,
  };
}

/**
 * Ensure minimum options for a slot, adding reusable venues or rest option if needed
 * Returns at least minOptions venues (or adds a rest/free time option)
 */
function ensureMinimumOptions(
  selectedVenues: Venue[],
  allVenues: Venue[],
  usedVenuesByDay: Map<string, number>,
  currentDay: number,
  actualDate: Date,
  time: string,
  minOptions: number = 2,
  minDayGap: number = 4
): Venue[] {
  if (selectedVenues.length >= minOptions) {
    return selectedVenues;
  }

  // Try to find reusable venues to fill the gap
  const reusable = getReusableVenues(
    allVenues.filter(v => !selectedVenues.some(s => s.name.toLowerCase() === v.name.toLowerCase())),
    usedVenuesByDay,
    currentDay,
    actualDate,
    time,
    minDayGap
  );

  const needed = minOptions - selectedVenues.length;
  const additionalVenues = getRandomFrom(reusable, needed);

  return [...selectedVenues, ...additionalVenues];
}

// ========== VENUE HELPERS ==========

/**
 * Generate a personalized recommendation comment based on venue characteristics
 */
function generateVenueDescription(venue: Venue): string {
  const parts: string[] = [];

  if (venue.style) {
    parts.push(venue.style);
  }

  if (venue.type && venue.category === "restaurants") {
    parts.push(`Cuisine: ${venue.type}`);
  }

  if (venue.experience) {
    parts.push(venue.experience);
  }

  if (venue.description) {
    return venue.description;
  }

  if (parts.length > 0) {
    return parts.join(". ");
  }

  // Default descriptions by category
  const defaults: Record<string, string> = {
    restaurants: "Une adresse raffinee pour une experience culinaire memorable",
    musees: "Un lieu culturel incontournable a decouvrir",
    activites: "Une experience unique a vivre",
    spas: "Un moment de detente et de bien-etre",
    shopping: "Une boutique de prestige pour vos achats",
    nightlife: "Une soiree parisienne inoubliable",
  };

  return defaults[venue.category] || "Une experience exceptionnelle";
}

/**
 * Create an activity option from a venue with V2 fields
 */
function createActivityOption(
  venue: Venue,
  isSelected: boolean = false
): ActivityOption {
  const option: ActivityOption = {
    id: nanoid(10),
    venueName: venue.name,
    venueAddress: venue.address,
    venuePhone: venue.phone,
    venueHours: venue.hours,
    venueStyle: venue.style,
    venueType: venue.type,
    venueDescription: generateVenueDescription(venue),
    category: venue.category,
    isSelected,
  };

  // Add Eiffel view flag for restaurants
  if (venue.isEiffelView || venue.experience?.toLowerCase().includes("vue tour eiffel")) {
    option.isEiffelView = true;
    if (!option.venueDescription?.includes("Tour Eiffel")) {
      option.venueDescription = `Vue Tour Eiffel. ${option.venueDescription || ""}`.trim();
    }
  }

  // Add reservation flags for shopping
  if (venue.category === "shopping") {
    if (venue.reservationRequired) {
      option.venueReservationRequired = true;
    }

    // Special Hermes warning
    if (isHermes(venue)) {
      option.venueReservationNote = "Attention, l'obtention des RDV chez Hermes fonctionne sur un systeme de loterie et n'est pas garantie.";
    }
  }

  return option;
}

/**
 * Create an activity slot with 1-2 venue options (or 4 for shopping)
 */
function createActivitySlotFromVenues(
  venues: Venue[],
  timeSlot: TimeSlot,
  type: ActivityType,
  time?: string,
  maxOptions: number = 2
): ActivitySlot | null {
  const firstVenue = venues[0];
  if (!firstVenue) return null;

  const options = venues.slice(0, maxOptions).map((v, i) => createActivityOption(v, i === 0));

  return {
    id: nanoid(10),
    timeSlot,
    time: time || getTimeForSlot(timeSlot),
    type,
    category: firstVenue.category,
    options,
    verificationStatus: "pending",
    isRest: false,
  };
}

/**
 * Get a random element from an array
 */
function getRandomFrom<T>(arr: T[], count: number = 1): T[] {
  if (arr.length === 0) return [];
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

/**
 * Calculate date from start date and day number
 */
function calculateActualDate(startDate: string | undefined, dayNumber: number): Date {
  if (startDate) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + dayNumber - 1);
    return date;
  }
  // Default to today
  const date = new Date();
  date.setDate(date.getDate() + dayNumber - 1);
  return date;
}

/**
 * Format date as YYYY-MM-DD
 */
function formatDate(date: Date): string {
  return date.toISOString().split("T")[0]!;
}

/**
 * Calculate the start time for the first day based on arrival time
 * V3: The FIRST activity must start EXACTLY 4 hours after arrival time
 */
function calculateFirstDayStartSlot(
  arrivalTimeKnown: boolean,
  arrivalTime: string
): { skipMorning: boolean; skipLunch: boolean; skipAfternoon: boolean; skipDinner: boolean; firstActivityTime: string } {
  if (!arrivalTimeKnown) {
    // Default: assume midday arrival, first activity at 16:00 (afternoon)
    return { skipMorning: true, skipLunch: true, skipAfternoon: false, skipDinner: false, firstActivityTime: "16:00" };
  }

  const [hours, minutes] = arrivalTime.split(":").map(Number);
  const arrivalHour = hours || 14;
  const arrivalMinute = minutes || 0;

  // V3: Add exactly 4-hour buffer
  const availableFromMinutes = (arrivalHour * 60) + arrivalMinute + (4 * 60);
  const availableFromHour = Math.floor(availableFromMinutes / 60);
  const availableFromMin = availableFromMinutes % 60;

  // Format the first activity time
  const firstActivityTime = `${availableFromHour.toString().padStart(2, "0")}:${availableFromMin.toString().padStart(2, "0")}`;

  // Determine which slots to skip based on when guest is available
  // Morning: ~10:00-12:00, Lunch: ~12:30-14:00, Afternoon: ~14:30-18:00, Dinner: ~19:30+
  return {
    skipMorning: availableFromHour >= 12,
    skipLunch: availableFromHour >= 14,
    skipAfternoon: availableFromHour >= 18,
    skipDinner: availableFromHour >= 21,
    firstActivityTime,
  };
}

/**
 * Calculate last day slots based on departure time
 */
function calculateLastDayAvailableSlots(
  departureTimeKnown: boolean,
  departureTime: string
): { hasLunch: boolean; hasAfternoon: boolean; hasDinner: boolean } {
  if (!departureTimeKnown) {
    return { hasLunch: true, hasAfternoon: false, hasDinner: false };
  }

  const [hours] = departureTime.split(":").map(Number);
  const departureHour = hours || 12;

  return {
    hasLunch: departureHour > 14,
    hasAfternoon: departureHour > 17,
    hasDinner: departureHour > 21,
  };
}

// ========== V2: CABARET HELPERS ==========

/**
 * Check if cabarets category is selected
 */
function hasCabaretsSelected(nightlifeCategories: string[]): boolean {
  return nightlifeCategories.includes("cabarets");
}

/**
 * Get cabaret venues
 */
function getCabaretVenues(excludedNames: string[] = []): Venue[] {
  const nightlife = loadVenuesByCategory("nightlife");
  const excludedSet = new Set(excludedNames.map(n => n.toLowerCase()));

  return nightlife.filter(v =>
    v.subCategory === "cabarets" &&
    !excludedSet.has(v.name.toLowerCase())
  );
}

/**
 * Get non-cabaret nightlife venues
 */
function getNonCabaretNightlife(nightlifeCategories: string[], excludedNames: string[] = []): Venue[] {
  const validCategories = nightlifeCategories.filter(c => c !== "aucun" && c !== "cabarets");
  if (validCategories.length === 0) {
    return [];
  }

  const nightlife = loadVenuesByCategory("nightlife");
  const excludedSet = new Set(excludedNames.map(n => n.toLowerCase()));

  return nightlife.filter(v =>
    validCategories.includes(v.subCategory || "") &&
    !excludedSet.has(v.name.toLowerCase())
  );
}

/**
 * Determine the best day for cabaret (around mid-trip)
 */
function getCabaretDay(duration: number): number {
  if (duration <= 2) return 1;
  if (duration === 3) return 2;
  // For longer trips, place around the middle
  return Math.ceil(duration / 2);
}

/**
 * Generate a complete program based on user preferences (V2)
 */
export function generateProgram(
  userId: string,
  request: GenerateProgramRequest
): Program {
  const {
    duration,
    profile,
    pace,
    guests,
    startDate,
    endDate,
    arrivalTimeKnown = false,
    arrivalTime = "14:00",
    departureTimeKnown = false,
    departureTime = "12:00",
    restaurantCategories = [],
    museumCategories = [],
    activityCategories = [],
    wantsSpa = false,
    wantsShopping = false,
    selectedShops = [],
    nightlifeCategories = [],
    intensity = "moderate",
    excludedVenues = [],
    interests = [],
  } = request;

  // Clear used day titles for new program
  usedDayTitles.clear();

  const days: ProgramDay[] = [];
  // V7: Track venues by the day they were last used (for reuse after N days)
  const usedVenuesByDay: Map<string, number> = new Map();
  // Mark excluded venues as used on day 0 so they're never used
  excludedVenues.forEach(v => usedVenuesByDay.set(v.toLowerCase(), 0));
  const usedOneShotActivities: Set<string> = new Set();

  // V7: Determine if this is a long trip (5+ days) where venue reuse is allowed
  const isLongTrip = duration >= 5;
  // V7: Minimum day gap before reuse (4 for museums/activities, 3 for restaurants)
  const MIN_DAY_GAP_ACTIVITIES = 4;
  const MIN_DAY_GAP_RESTAURANTS = 3;

  // Pre-load all venues based on selections
  const restaurants = getRestaurantsByCategories(restaurantCategories, excludedVenues);
  const eiffelRestaurants = getRestaurantsWithEiffelView().filter(
    r => !excludedVenues.map(e => e.toLowerCase()).includes(r.name.toLowerCase())
  );
  const museums = getMuseumsByCategories(museumCategories, excludedVenues);
  const activities = getActivitiesByCategories(activityCategories, excludedVenues);
  const spas = wantsSpa ? getSpas(excludedVenues) : [];
  const shops = wantsShopping ? getShoppingVenues(selectedShops, excludedVenues) : [];
  const luxuryGiants = wantsShopping ? getLuxuryGiantShops(excludedVenues) : [];
  const transports = getTransports();

  // V2: Cabaret handling
  const wantsCabaret = hasCabaretsSelected(nightlifeCategories);
  const cabaretDay = wantsCabaret ? getCabaretDay(duration) : -1;
  const cabarets = wantsCabaret ? getCabaretVenues(excludedVenues) : [];
  const regularNightlife = getNonCabaretNightlife(nightlifeCategories, excludedVenues);
  let cabaretUsed = false;

  // Track Eiffel view restaurant cadence (max 1 every 4 days)
  let hasEiffelRestaurant = false;
  let daysSinceLastEiffel = 4; // Allow on first day
  const maxEiffelRestaurants = Math.ceil(duration / 4);
  let eiffelRestaurantsUsed = 0;

  // Calculate spa frequency (max 1 every 3 days)
  const maxSpas = Math.floor(duration / 3) || (wantsSpa ? 1 : 0);
  let spasUsed = 0;
  let daysSinceLastSpa = 3;

  // V3.1: Calculate the ideal spa day (middle of the trip, NEVER first day)
  // For 2 days: day 2, for 3 days: day 2, for 4 days: day 2 or 3, for 7 days: day 3 or 4
  const spaDay = wantsSpa ? Math.max(2, Math.ceil(duration / 2)) : -1;

  // V21: Calculate shopping frequency (max 1 every 3 days, same rule as spas)
  const maxShopping = Math.floor(duration / 3) || (wantsShopping ? 1 : 0);
  let shoppingUsed = 0;
  let daysSinceLastShopping = 3; // Allow on first day

  // Track luxury giant shopping (ensure at least one)
  let hasLuxuryGiant = false;

  // Determine activity count per day based on intensity
  const activitiesPerDay = INTENSITY_ACTIVITIES[intensity as IntensityLevel] || 2;

  // Generate each day
  for (let dayNum = 1; dayNum <= duration; dayNum++) {
    const dayActivities: ActivitySlot[] = [];
    const isFirstDay = dayNum === 1;
    const isLastDay = dayNum === duration;
    const isCabaretDay = dayNum === cabaretDay && !cabaretUsed && cabarets.length > 0;

    // Calculate actual date for this day
    const actualDate = calculateActualDate(startDate, dayNum);
    const dayOfWeek = getDayOfWeekFrench(actualDate);

    // Determine available slots
    const firstDaySlots = isFirstDay
      ? calculateFirstDayStartSlot(arrivalTimeKnown, arrivalTime)
      : { skipMorning: false, skipLunch: false, skipAfternoon: false, skipDinner: false, firstActivityTime: "10:00" };

    const lastDaySlots = isLastDay
      ? calculateLastDayAvailableSlots(departureTimeKnown, departureTime)
      : { hasLunch: true, hasAfternoon: true, hasDinner: true };

    // Track activities added this day (not counting meals or nightlife)
    let activitiesAdded = 0;

    // V3: Track if this is the first activity of the first day (for exact time control)
    let isFirstActivityOfDay = isFirstDay;
    const firstDayActivityTime = firstDaySlots.firstActivityTime;

    // Calculate required activities for this day based on intensity
    // First day might have reduced activities due to arrival
    // Last day has reduced activities due to departure
    let targetActivities = activitiesPerDay;
    if (isFirstDay && firstDaySlots.skipMorning) {
      targetActivities = Math.max(1, activitiesPerDay - 1);
    }
    if (isFirstDay && firstDaySlots.skipAfternoon) {
      targetActivities = Math.max(1, 1); // At least dinner if available
    }
    if (isLastDay) {
      targetActivities = lastDaySlots.hasAfternoon ? 1 : 0;
    }

    // ========== MORNING ACTIVITY (MUSEUM/CULTURE) ==========
    // V6 FIX: Proper intensity-based distribution:
    // - RELAXED (1 activity): Skip morning entirely, only afternoon
    // - MODERATE (2 activities): 1 morning + 1 afternoon
    // - INTENSE (3 activities): 1 morning + 2 afternoon
    // Each activity slot represents a minimum of 2 hours of engagement
    const shouldHaveMorningActivity = activitiesPerDay >= 2; // Only MODERATE and INTENSE get morning activities
    const maxMorningActivities = shouldHaveMorningActivity ? 1 : 0;
    let morningActivitiesAdded = 0;

    if (!firstDaySlots.skipMorning && !isLastDay && shouldHaveMorningActivity && morningActivitiesAdded < maxMorningActivities) {
      const morningTime = getTimeForSlot("morning");

      // V7: Try unused museums first
      if (museums.length > 0) {
        const availableMuseums = filterAvailableVenues(
          museums,
          usedVenuesByDay,
          dayNum,
          actualDate,
          morningTime,
          MIN_DAY_GAP_ACTIVITIES,
          isLongTrip
        );

        if (availableMuseums.length > 0) {
          let selected = getRandomFrom(availableMuseums, 2);
          // V7: Ensure minimum 2 options - try museums first, then activities as supplement
          if (selected.length < 2) {
            // Try to supplement with activities for morning
            const availableActivities = filterAvailableVenues(
              activities.filter(a => !ONE_SHOT_ACTIVITIES.includes(a.subCategory || "")),
              usedVenuesByDay,
              dayNum,
              actualDate,
              morningTime,
              MIN_DAY_GAP_ACTIVITIES,
              isLongTrip
            );
            const needed = 2 - selected.length;
            const supplements = getRandomFrom(availableActivities, needed);
            selected = [...selected, ...supplements];
          }
          if (selected.length < 2) {
            // Final attempt: get from reusable museums or activities
            selected = ensureMinimumOptions(
              selected,
              [...museums, ...activities.filter(a => !ONE_SHOT_ACTIVITIES.includes(a.subCategory || ""))],
              usedVenuesByDay,
              dayNum,
              actualDate,
              morningTime,
              2,
              MIN_DAY_GAP_ACTIVITIES
            );
          }
          const slot = createActivitySlotFromVenues(selected, "morning", "culture", morningTime);
          if (slot) {
            dayActivities.push(slot);
            selected.forEach(v => markVenueUsed(v.name, usedVenuesByDay, dayNum));
            activitiesAdded++;
            morningActivitiesAdded++;
          }
        }
      }

      // V7: Fallback 1 - Try museums from 4+ days ago (for long trips)
      if (morningActivitiesAdded === 0 && museums.length > 0 && isLongTrip) {
        const reusableMuseums = getReusableVenues(
          museums,
          usedVenuesByDay,
          dayNum,
          actualDate,
          morningTime,
          MIN_DAY_GAP_ACTIVITIES
        );

        if (reusableMuseums.length > 0) {
          let selected = getRandomFrom(reusableMuseums, 2);
          // V7: Ensure minimum 2 options from reusable museums
          selected = ensureMinimumOptions(
            selected,
            museums,
            usedVenuesByDay,
            dayNum,
            actualDate,
            morningTime,
            2,
            MIN_DAY_GAP_ACTIVITIES
          );
          const slot = createActivitySlotFromVenues(selected, "morning", "culture", morningTime);
          if (slot) {
            dayActivities.push(slot);
            selected.forEach(v => markVenueUsed(v.name, usedVenuesByDay, dayNum));
            activitiesAdded++;
            morningActivitiesAdded++;
          }
        }
      }

      // V7: Fallback 2 - Try unused regular activities for morning
      if (morningActivitiesAdded === 0 && activities.length > 0) {
        const regularActivities = filterAvailableVenues(
          activities.filter(a => !ONE_SHOT_ACTIVITIES.includes(a.subCategory || "")),
          usedVenuesByDay,
          dayNum,
          actualDate,
          morningTime,
          MIN_DAY_GAP_ACTIVITIES,
          isLongTrip
        );

        if (regularActivities.length > 0) {
          let selected = getRandomFrom(regularActivities, 2);
          // V7: Ensure minimum 2 options
          selected = ensureMinimumOptions(
            selected,
            activities.filter(a => !ONE_SHOT_ACTIVITIES.includes(a.subCategory || "")),
            usedVenuesByDay,
            dayNum,
            actualDate,
            morningTime,
            2,
            MIN_DAY_GAP_ACTIVITIES
          );
          const slot = createActivitySlotFromVenues(selected, "morning", "experience", morningTime);
          if (slot) {
            dayActivities.push(slot);
            selected.forEach(v => markVenueUsed(v.name, usedVenuesByDay, dayNum));
            activitiesAdded++;
            morningActivitiesAdded++;
          }
        }
      }

      // V7: Fallback 3 - Try activities from 4+ days ago (for long trips)
      if (morningActivitiesAdded === 0 && activities.length > 0 && isLongTrip) {
        const reusableActivities = getReusableVenues(
          activities.filter(a => !ONE_SHOT_ACTIVITIES.includes(a.subCategory || "")),
          usedVenuesByDay,
          dayNum,
          actualDate,
          morningTime,
          MIN_DAY_GAP_ACTIVITIES
        );

        if (reusableActivities.length > 0) {
          let selected = getRandomFrom(reusableActivities, 2);
          // V7: Ensure minimum 2 options from reusable activities
          selected = ensureMinimumOptions(
            selected,
            activities.filter(a => !ONE_SHOT_ACTIVITIES.includes(a.subCategory || "")),
            usedVenuesByDay,
            dayNum,
            actualDate,
            morningTime,
            2,
            MIN_DAY_GAP_ACTIVITIES
          );
          const slot = createActivitySlotFromVenues(selected, "morning", "experience", morningTime);
          if (slot) {
            dayActivities.push(slot);
            selected.forEach(v => markVenueUsed(v.name, usedVenuesByDay, dayNum));
            activitiesAdded++;
            morningActivitiesAdded++;
          }
        }
      }

      // V11: NEVER create free time slots during generation - always find a real venue
      // Even if we have to reuse a venue from day 1, that's better than "Temps libre"
      if (morningActivitiesAdded === 0 && shouldHaveMorningActivity) {
        // Force reuse: ignore day gap and find ANY open museum or activity
        const allMorningVenues = [...museums, ...activities.filter(a => !ONE_SHOT_ACTIVITIES.includes(a.subCategory || ""))];
        const openVenues = filterVenuesByAvailability(allMorningVenues, actualDate, morningTime);

        if (openVenues.length > 0) {
          const selected = getRandomFrom(openVenues, 2);
          const type: ActivityType = selected[0]?.category === "musees" ? "culture" : "experience";
          const slot = createActivitySlotFromVenues(selected, "morning", type, morningTime);
          if (slot) {
            dayActivities.push(slot);
            selected.forEach(v => markVenueUsed(v.name, usedVenuesByDay, dayNum));
            activitiesAdded++;
            morningActivitiesAdded++;
          }
        }
        // If still nothing (extremely rare - all venues closed), skip this slot entirely
        // DO NOT create "Temps libre" - the concierge can add it manually if needed
      }
    }

    // ========== LUNCH - RESTAURANT ==========
    if (!firstDaySlots.skipLunch && (lastDaySlots.hasLunch || !isLastDay)) {
      // V3: Use exact first activity time if this is the first day and morning was skipped (lunch is first activity)
      const lunchTime = (isFirstDay && isFirstActivityOfDay && firstDaySlots.skipMorning)
        ? firstDayActivityTime
        : getTimeForSlot("lunch");
      // V7: Use new venue tracking system with restaurant-specific day gap
      const availableLunchRestaurants = filterAvailableVenues(
        restaurants,
        usedVenuesByDay,
        dayNum,
        actualDate,
        lunchTime,
        MIN_DAY_GAP_RESTAURANTS,
        isLongTrip
      );

      // Try to include an Eiffel view restaurant if cadence allows
      if (
        !hasEiffelRestaurant &&
        eiffelRestaurantsUsed < maxEiffelRestaurants &&
        daysSinceLastEiffel >= 4
      ) {
        const availableEiffel = filterAvailableVenues(
          eiffelRestaurants,
          usedVenuesByDay,
          dayNum,
          actualDate,
          lunchTime,
          MIN_DAY_GAP_RESTAURANTS,
          isLongTrip
        );

        if (availableEiffel.length > 0) {
          const selected = getRandomFrom(availableEiffel, 1);
          const alternates = getRandomFrom(
            availableLunchRestaurants.filter(r => r.name !== selected[0]?.name),
            1
          );
          let allSelected = [...selected, ...alternates];
          // V7: Ensure minimum 2 options for lunch
          allSelected = ensureMinimumOptions(
            allSelected,
            restaurants,
            usedVenuesByDay,
            dayNum,
            actualDate,
            lunchTime,
            2,
            MIN_DAY_GAP_RESTAURANTS
          );
          const slot = createActivitySlotFromVenues(allSelected, "lunch", "dining", lunchTime);
          if (slot) {
            dayActivities.push(slot);
            allSelected.forEach(v => markVenueUsed(v.name, usedVenuesByDay, dayNum));
            hasEiffelRestaurant = true;
            eiffelRestaurantsUsed++;
            daysSinceLastEiffel = 0;
            isFirstActivityOfDay = false; // V3: First activity has been added
          }
        }
      }

      // Regular lunch if no Eiffel restaurant was added
      if (!dayActivities.some(a => a.timeSlot === "lunch") && availableLunchRestaurants.length > 0) {
        let selected = getRandomFrom(availableLunchRestaurants, 2);
        // V7: Ensure minimum 2 options for lunch
        selected = ensureMinimumOptions(
          selected,
          restaurants,
          usedVenuesByDay,
          dayNum,
          actualDate,
          lunchTime,
          2,
          MIN_DAY_GAP_RESTAURANTS
        );
        const slot = createActivitySlotFromVenues(selected, "lunch", "dining", lunchTime);
        if (slot) {
          dayActivities.push(slot);
          selected.forEach(v => markVenueUsed(v.name, usedVenuesByDay, dayNum));
          isFirstActivityOfDay = false; // V3: First activity has been added
        }
      }
    }

    // ========== AFTERNOON ACTIVITIES ==========
    // V6 FIX: Calculate afternoon slots based on intensity level:
    // - RELAXED (1 activity total): 1 afternoon (since no morning)
    // - MODERATE (2 activities total): 1 afternoon (since 1 morning already added)
    // - INTENSE (3 activities total): 2 afternoon (since 1 morning already added)
    // Each activity slot represents a minimum of 2 hours of engagement
    const maxAfternoonActivities = activitiesPerDay === 1 ? 1 : (activitiesPerDay === 2 ? 1 : 2);
    const afternoonSlotsNeeded = Math.min(maxAfternoonActivities, Math.max(0, targetActivities - activitiesAdded));
    let afternoonActivitiesAdded = 0;

    // V3: Skip afternoon on first day if arrival is too late
    if (!firstDaySlots.skipAfternoon && (lastDaySlots.hasAfternoon || !isLastDay) && afternoonSlotsNeeded > 0) {
      // V3: Use the calculated first activity time if this is the first day's first activity
      const firstAfternoonTime = (isFirstDay && isFirstActivityOfDay)
        ? firstDayActivityTime
        : getTimeForSlot("afternoon", { activityCount: targetActivities, isFirstActivity: true });

      // Priority 1: Spa (if wanted and this is the designated spa day - middle of trip, NEVER first day)
      // V3.1: Spa is placed at the middle of the trip, not the first day
      const isSpaDay = dayNum === spaDay;
      if (wantsSpa && spasUsed < maxSpas && isSpaDay && spas.length > 0 && afternoonActivitiesAdded < afternoonSlotsNeeded) {
        const availableSpas = filterAvailableVenues(
          spas,
          usedVenuesByDay,
          dayNum,
          actualDate,
          firstAfternoonTime,
          MIN_DAY_GAP_ACTIVITIES,
          isLongTrip
        );

        if (availableSpas.length > 0) {
          let selected = getRandomFrom(availableSpas, 2);
          // V7: Ensure minimum 2 options
          selected = ensureMinimumOptions(
            selected,
            spas,
            usedVenuesByDay,
            dayNum,
            actualDate,
            firstAfternoonTime,
            2,
            MIN_DAY_GAP_ACTIVITIES
          );
          const slot = createActivitySlotFromVenues(selected, "afternoon", "wellness", firstAfternoonTime);
          if (slot) {
            dayActivities.push(slot);
            selected.forEach(v => markVenueUsed(v.name, usedVenuesByDay, dayNum));
            spasUsed++;
            daysSinceLastSpa = 0;
            activitiesAdded++;
            afternoonActivitiesAdded++;
            isFirstActivityOfDay = false; // V3: First activity has been added
          }
        }
      }

      // Priority 2: Shopping with 4 boutique options (at least one luxury giant)
      // V21: Apply same frequency rule as spas (max 1 every 3 days)
      const canAddShopping = shoppingUsed < maxShopping && daysSinceLastShopping >= 3;
      if (wantsShopping && canAddShopping && shops.length > 0 && afternoonActivitiesAdded < afternoonSlotsNeeded) {
        // V3: Use first day activity time if this is the first activity
        const shoppingTime = (isFirstDay && isFirstActivityOfDay)
          ? firstDayActivityTime
          : (afternoonActivitiesAdded === 0 ? firstAfternoonTime : getTimeForSlot("afternoon", { activityCount: targetActivities, isFirstActivity: false }));
        const availableShops = filterAvailableVenues(
          shops,
          usedVenuesByDay,
          dayNum,
          actualDate,
          shoppingTime,
          MIN_DAY_GAP_ACTIVITIES,
          isLongTrip
        );
        const availableLuxury = filterAvailableVenues(
          luxuryGiants,
          usedVenuesByDay,
          dayNum,
          actualDate,
          shoppingTime,
          MIN_DAY_GAP_ACTIVITIES,
          isLongTrip
        );

        // Create shopping slot with 4 options, ensuring at least one luxury giant
        if (availableShops.length > 0 || availableLuxury.length > 0) {
          const allSelected: Venue[] = [];

          // Ensure at least one luxury giant if available and not yet included
          if (!hasLuxuryGiant && availableLuxury.length > 0) {
            const luxuryPick = getRandomFrom(availableLuxury, 1);
            allSelected.push(...luxuryPick);
            hasLuxuryGiant = true;
          }

          // Fill remaining slots with other shops (up to 4 total)
          const remainingShops = availableShops.filter(
            s => !allSelected.some(sel => sel.name === s.name)
          );
          const additionalShops = getRandomFrom(remainingShops, 4 - allSelected.length);
          allSelected.push(...additionalShops);

          // If we still don't have 4, try to add more luxury shops
          if (allSelected.length < 4 && availableLuxury.length > allSelected.filter(s => isLuxuryGiant(s)).length) {
            const moreLuxury = availableLuxury.filter(
              l => !allSelected.some(sel => sel.name === l.name)
            );
            const extraLuxury = getRandomFrom(moreLuxury, 4 - allSelected.length);
            allSelected.push(...extraLuxury);
          }

          if (allSelected.length > 0) {
            const slot = createActivitySlotFromVenues(allSelected, "afternoon", "shopping", shoppingTime, 4);
            if (slot) {
              dayActivities.push(slot);
              allSelected.forEach(v => markVenueUsed(v.name, usedVenuesByDay, dayNum));
              shoppingUsed++; // V21: Track shopping usage
              daysSinceLastShopping = 0; // V21: Reset counter
              activitiesAdded++;
              afternoonActivitiesAdded++;
              isFirstActivityOfDay = false; // V3: First activity has been added
            }
          }
        }
      }

      // Priority 3: One-shot special activity (only once per trip)
      // V6 FIX: Enhanced enforcement - these activities (tour_voiture, croisiere, helicoptere)
      // should NEVER appear more than once per trip. We check:
      // 1. The activity category is requested by the user
      // 2. It hasn't been used yet in this trip (usedOneShotActivities Set)
      // 3. We're on the ideal day (middle of trip) for the experience
      // The usedOneShotActivities Set persists across all days of the trip generation
      const requestedOneShotCategories = activityCategories.filter(c => ONE_SHOT_ACTIVITIES.includes(c));
      const unusedOneShotCategories = requestedOneShotCategories.filter(c => !usedOneShotActivities.has(c));
      const isIdealOneShotDay = dayNum === Math.ceil(duration / 2);

      if (unusedOneShotCategories.length > 0 && isIdealOneShotDay && afternoonActivitiesAdded < afternoonSlotsNeeded) {
        // V3: Use first day activity time if this is the first activity
        const oneShotTime = (isFirstDay && isFirstActivityOfDay)
          ? firstDayActivityTime
          : (afternoonActivitiesAdded === 0 ? firstAfternoonTime : getTimeForSlot("afternoon", { activityCount: targetActivities, isFirstActivity: false }));

        // Process only the first unused one-shot category for this trip
        const category = unusedOneShotCategories[0]!;
        // V7: Use new venue tracking for one-shot activities
        const available = filterAvailableVenues(
          activities.filter(a => a.subCategory === category),
          usedVenuesByDay,
          dayNum,
          actualDate,
          oneShotTime,
          MIN_DAY_GAP_ACTIVITIES,
          isLongTrip
        );

        if (available.length > 0) {
          const selected = getRandomFrom(available, 2);
          const slot = createActivitySlotFromVenues(selected, "afternoon", "experience", oneShotTime);
          if (slot) {
            dayActivities.push(slot);
            selected.forEach(v => markVenueUsed(v.name, usedVenuesByDay, dayNum));
            // V6 FIX: Mark this category as used IMMEDIATELY to prevent any re-use
            usedOneShotActivities.add(category);
            activitiesAdded++;
            afternoonActivitiesAdded++;
            isFirstActivityOfDay = false; // V3: First activity has been added
          }
        }
      }

      // Priority 4: Regular activities to fill remaining slots
      while (afternoonActivitiesAdded < afternoonSlotsNeeded) {
        // V3: Use first day activity time if this is the first activity
        const activityTime = (isFirstDay && isFirstActivityOfDay)
          ? firstDayActivityTime
          : (afternoonActivitiesAdded === 0 ? firstAfternoonTime : getTimeForSlot("afternoon", { activityCount: targetActivities, isFirstActivity: false }));

        // V7: Try unused regular activities first
        const regularActivities = filterAvailableVenues(
          activities.filter(a => !ONE_SHOT_ACTIVITIES.includes(a.subCategory || "")),
          usedVenuesByDay,
          dayNum,
          actualDate,
          activityTime,
          MIN_DAY_GAP_ACTIVITIES,
          isLongTrip
        );

        if (regularActivities.length > 0) {
          let selected = getRandomFrom(regularActivities, 2);
          // V7: Ensure minimum 2 options
          selected = ensureMinimumOptions(
            selected,
            activities.filter(a => !ONE_SHOT_ACTIVITIES.includes(a.subCategory || "")),
            usedVenuesByDay,
            dayNum,
            actualDate,
            activityTime,
            2,
            MIN_DAY_GAP_ACTIVITIES
          );
          const slot = createActivitySlotFromVenues(selected, "afternoon", "experience", activityTime);
          if (slot) {
            dayActivities.push(slot);
            selected.forEach(v => markVenueUsed(v.name, usedVenuesByDay, dayNum));
            activitiesAdded++;
            afternoonActivitiesAdded++;
            isFirstActivityOfDay = false; // V3: First activity has been added
          } else {
            break;
          }
        } else {
          // V7: Try to fill with any available venue type using new tracking
          const allVenueTypes = [
            ...museums,
            ...activities.filter(a => !ONE_SHOT_ACTIVITIES.includes(a.subCategory || "")),
            ...spas,
            ...shops
          ];
          const allAvailable = filterAvailableVenues(
            allVenueTypes,
            usedVenuesByDay,
            dayNum,
            actualDate,
            activityTime,
            MIN_DAY_GAP_ACTIVITIES,
            isLongTrip
          );

          if (allAvailable.length > 0) {
            let selected = getRandomFrom(allAvailable, 2);
            // V7: Ensure minimum 2 options
            selected = ensureMinimumOptions(
              selected,
              allVenueTypes,
              usedVenuesByDay,
              dayNum,
              actualDate,
              activityTime,
              2,
              MIN_DAY_GAP_ACTIVITIES
            );
            const type: ActivityType = selected[0]?.category === "musees" ? "culture"
              : selected[0]?.category === "spas" ? "wellness"
              : selected[0]?.category === "shopping" ? "shopping"
              : "experience";
            const slot = createActivitySlotFromVenues(selected, "afternoon", type, activityTime);
            if (slot) {
              dayActivities.push(slot);
              selected.forEach(v => markVenueUsed(v.name, usedVenuesByDay, dayNum));
              activitiesAdded++;
              afternoonActivitiesAdded++;
              isFirstActivityOfDay = false; // V3: First activity has been added
            } else {
              break;
            }
          } else {
            // V11: NEVER create free time slots - force reuse any venue that's open
            const openVenues = filterVenuesByAvailability(allVenueTypes, actualDate, activityTime);

            if (openVenues.length > 0) {
              const selected = getRandomFrom(openVenues, 2);
              const type: ActivityType = selected[0]?.category === "musees" ? "culture"
                : selected[0]?.category === "spas" ? "wellness"
                : selected[0]?.category === "shopping" ? "shopping"
                : "experience";
              const slot = createActivitySlotFromVenues(selected, "afternoon", type, activityTime);
              if (slot) {
                dayActivities.push(slot);
                selected.forEach(v => markVenueUsed(v.name, usedVenuesByDay, dayNum));
                activitiesAdded++;
                afternoonActivitiesAdded++;
                isFirstActivityOfDay = false;
              } else {
                break;
              }
            } else {
              // All venues closed for this time - skip the slot entirely
              // DO NOT create "Temps libre" - the concierge can add it manually if needed
              break;
            }
          }
        }
      }
    }

    daysSinceLastSpa++;
    daysSinceLastEiffel++;
    daysSinceLastShopping++; // V21: Increment shopping counter each day

    // ========== DINNER - RESTAURANT ==========
    // V3: Check if dinner should be skipped on first day (late arrival)
    if (!firstDaySlots.skipDinner && (lastDaySlots.hasDinner || !isLastDay)) {
      // V3: If this is the first day and first activity hasn't been set yet, dinner might be first
      const dinnerTime = (isFirstDay && isFirstActivityOfDay)
        ? firstDayActivityTime
        : getTimeForSlot("dinner", { isCabaretDay });
      // V7: Use new venue tracking system for dinner restaurants
      const availableDinnerRestaurants = filterAvailableVenues(
        restaurants,
        usedVenuesByDay,
        dayNum,
        actualDate,
        dinnerTime,
        MIN_DAY_GAP_RESTAURANTS,
        isLongTrip
      );

      // Try Eiffel view at dinner if not yet achieved
      if (
        !hasEiffelRestaurant &&
        eiffelRestaurantsUsed < maxEiffelRestaurants &&
        daysSinceLastEiffel >= 4
      ) {
        const availableEiffel = filterAvailableVenues(
          eiffelRestaurants,
          usedVenuesByDay,
          dayNum,
          actualDate,
          dinnerTime,
          MIN_DAY_GAP_RESTAURANTS,
          isLongTrip
        );

        if (availableEiffel.length > 0) {
          const selected = getRandomFrom(availableEiffel, 1);
          const alternates = getRandomFrom(
            availableDinnerRestaurants.filter(r => r.name !== selected[0]?.name),
            1
          );
          let allSelected = [...selected, ...alternates];
          // V7: Ensure minimum 2 options for dinner
          allSelected = ensureMinimumOptions(
            allSelected,
            restaurants,
            usedVenuesByDay,
            dayNum,
            actualDate,
            dinnerTime,
            2,
            MIN_DAY_GAP_RESTAURANTS
          );
          const slot = createActivitySlotFromVenues(allSelected, "dinner", "dining", dinnerTime);
          if (slot) {
            dayActivities.push(slot);
            allSelected.forEach(v => markVenueUsed(v.name, usedVenuesByDay, dayNum));
            hasEiffelRestaurant = true;
            eiffelRestaurantsUsed++;
            daysSinceLastEiffel = 0;
          }
        }
      }

      // Regular dinner if no Eiffel restaurant was added
      if (!dayActivities.some(a => a.timeSlot === "dinner") && availableDinnerRestaurants.length > 0) {
        // Group by subCategory for variety
        const byCategory = new Map<string, Venue[]>();
        availableDinnerRestaurants.forEach(r => {
          const cat = r.subCategory || "other";
          if (!byCategory.has(cat)) byCategory.set(cat, []);
          byCategory.get(cat)!.push(r);
        });

        // Pick from different categories if possible
        const categories = Array.from(byCategory.keys());
        const shuffledCats = categories.sort(() => Math.random() - 0.5);
        let selected: Venue[] = [];

        for (const cat of shuffledCats) {
          if (selected.length >= 2) break;
          const catVenues = byCategory.get(cat) || [];
          const pick = getRandomFrom(catVenues, 1);
          selected.push(...pick);
        }

        // V7: Ensure minimum 2 options for dinner
        selected = ensureMinimumOptions(
          selected,
          restaurants,
          usedVenuesByDay,
          dayNum,
          actualDate,
          dinnerTime,
          2,
          MIN_DAY_GAP_RESTAURANTS
        );

        const slot = createActivitySlotFromVenues(selected, "dinner", "dining", dinnerTime);
        if (slot) {
          dayActivities.push(slot);
          selected.forEach(v => markVenueUsed(v.name, usedVenuesByDay, dayNum));
        }
      }
    }

    // ========== EVENING - NIGHTLIFE (BONUS, doesn't count toward activity quota) ==========
    if (nightlifeCategories.length > 0 && !nightlifeCategories.includes("aucun") && !isLastDay) {
      const eveningTime = getTimeForSlot("evening");

      // V2: Cabaret only on the designated cabaret day
      if (isCabaretDay && cabarets.length > 0) {
        // V7: Use new venue tracking for cabarets
        const availableCabarets = filterAvailableVenues(
          cabarets,
          usedVenuesByDay,
          dayNum,
          actualDate,
          eveningTime,
          MIN_DAY_GAP_ACTIVITIES,
          isLongTrip
        );

        if (availableCabarets.length > 0) {
          let selected = getRandomFrom(availableCabarets, 2);
          // V7: Ensure minimum 2 options for cabarets
          selected = ensureMinimumOptions(
            selected,
            cabarets,
            usedVenuesByDay,
            dayNum,
            actualDate,
            eveningTime,
            2,
            MIN_DAY_GAP_ACTIVITIES
          );
          const slot = createActivitySlotFromVenues(selected, "evening", "nightlife", eveningTime);
          if (slot) {
            dayActivities.push(slot);
            selected.forEach(v => markVenueUsed(v.name, usedVenuesByDay, dayNum));
            cabaretUsed = true;
          }
        }
      } else if (regularNightlife.length > 0 || (!wantsCabaret && nightlifeCategories.length > 0)) {
        // Regular nightlife for non-cabaret nights
        const nightlifeVenues = wantsCabaret ? regularNightlife : getNightlifeByCategories(nightlifeCategories, excludedVenues);
        // V7: Use new venue tracking for nightlife
        const availableNightlife = filterAvailableVenues(
          nightlifeVenues,
          usedVenuesByDay,
          dayNum,
          actualDate,
          eveningTime,
          MIN_DAY_GAP_ACTIVITIES,
          isLongTrip
        );

        if (availableNightlife.length > 0) {
          let selected = getRandomFrom(availableNightlife, 2);
          // V7: Ensure minimum 2 options for nightlife
          selected = ensureMinimumOptions(
            selected,
            nightlifeVenues,
            usedVenuesByDay,
            dayNum,
            actualDate,
            eveningTime,
            2,
            MIN_DAY_GAP_ACTIVITIES
          );
          const slot = createActivitySlotFromVenues(selected, "evening", "nightlife", eveningTime);
          if (slot) {
            dayActivities.push(slot);
            selected.forEach(v => markVenueUsed(v.name, usedVenuesByDay, dayNum));
          }
        }
      }
    }

    // V3: Sort activities by time slot first, then by actual time value for strict chronological order
    const slotOrder: TimeSlot[] = ["morning", "lunch", "afternoon", "dinner", "evening"];
    dayActivities.sort((a, b) => {
      // First sort by time slot category
      const slotDiff = slotOrder.indexOf(a.timeSlot) - slotOrder.indexOf(b.timeSlot);
      if (slotDiff !== 0) return slotDiff;
      // If same time slot, sort by actual time value
      const aTime = a.time || "12:00";
      const bTime = b.time || "12:00";
      return timeToMinutes(aTime) - timeToMinutes(bTime);
    });

    // V3: Validate chronological consistency - ensure times flow forward
    for (let i = 1; i < dayActivities.length; i++) {
      const prevActivity = dayActivities[i - 1]!;
      const currActivity = dayActivities[i]!;
      const prevTime = timeToMinutes(prevActivity.time || "12:00");
      const currTime = timeToMinutes(currActivity.time || "12:00");
      // If current activity time is before or equal to previous, adjust it
      if (currTime <= prevTime) {
        // Add 30 minutes buffer after previous activity
        const newMinutes = prevTime + 30;
        const newHour = Math.floor(newMinutes / 60);
        const newMin = newMinutes % 60;
        currActivity.time = `${newHour.toString().padStart(2, "0")}:${newMin.toString().padStart(2, "0")}`;
      }
    }

    // V2: Create the day with unique dynamic theme
    const theme = generateDayTheme(dayNum, duration, dayActivities, isCabaretDay);

    const day: ProgramDay = {
      id: nanoid(10),
      dayNumber: dayNum,
      actualDate: formatDate(actualDate),
      themeInternal: theme.themeInternal,
      themeClient: theme.themeClient,
      activities: dayActivities,
    };

    days.push(day);
  }

  // Get transport info (Chabe)
  const chabeTransport = transports.find(t =>
    t.name.toLowerCase().includes("chabe") || t.name.toLowerCase().includes("chabe")
  );

  // V2: Generate dynamic program title
  const title = generateProgramTitle(profile, duration, guests, {
    restaurantCategories,
    museumCategories,
    activityCategories,
    nightlifeCategories,
    wantsSpa,
    wantsShopping,
  });

  const program: Program = {
    id: nanoid(12),
    userId,
    city: "paris",
    duration,
    profile,
    pace,
    interests: interests,
    guests,
    title,
    introInternal: generateIntroInternal(duration, guests, chabeTransport),
    introClient: generateIntroClient(duration, guests),
    closingInternal: `Programme genere avec ${days.reduce((acc, d) => acc + d.activities.length, 0)} activites au total. Veuillez verifier les disponibilites et confirmer les reservations.`,
    closingClient: `Nous esperons que ce programme vous plaira. N'hesitez pas a nous contacter pour toute modification.`,
    status: "draft",
    startDate,
    endDate,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    days,
  };

  return program;
}

/**
 * Generate internal introduction with transport info
 */
function generateIntroInternal(
  duration: number,
  guests: number,
  transport?: Venue
): string {
  let intro = `Programme de ${duration} jours pour ${guests} voyageur${guests > 1 ? "s" : ""}.`;

  if (transport) {
    intro += `\n\nTRANSPORT: ${transport.name}`;
    if (transport.phone) {
      intro += `\nTel: ${transport.phone}`;
    }
    if (transport.description) {
      intro += `\n${transport.description}`;
    }
  }

  return intro;
}

/**
 * Generate client-facing introduction
 */
function generateIntroClient(duration: number, guests: number): string {
  return `Bienvenue a Paris! Voici votre programme personnalise pour ${duration} jour${duration > 1 ? "s" : ""} d'exception.`;
}

/**
 * Calculate program statistics
 */
export function getProgramStats(program: Program): {
  totalActivities: number;
  totalMeals: number;
  categoriesUsed: VenueCategory[];
  completionPercentage: number;
} {
  let totalActivities = 0;
  let totalMeals = 0;
  const categoriesUsed = new Set<VenueCategory>();
  let selectedCount = 0;

  for (const day of program.days) {
    for (const activity of day.activities) {
      totalActivities++;
      categoriesUsed.add(activity.category);

      if (activity.type === "dining") {
        totalMeals++;
      }

      if (activity.options.some(opt => opt.isSelected)) {
        selectedCount++;
      }
    }
  }

  const completionPercentage =
    totalActivities > 0 ? (selectedCount / totalActivities) * 100 : 0;

  return {
    totalActivities,
    totalMeals,
    categoriesUsed: Array.from(categoriesUsed),
    completionPercentage,
  };
}

/**
 * Regenerate a specific activity with alternative venues
 * V6 FIX: One-shot activities (tour_voiture, croisiere, helicoptere) cannot be
 * regenerated into a different one-shot activity type - they remain unique per trip
 */
export function regenerateActivity(
  program: Program,
  dayNumber: number,
  activityId: string
): Program {
  const day = program.days.find(d => d.dayNumber === dayNumber);
  if (!day) return program;

  const activity = day.activities.find(a => a.id === activityId);
  if (!activity) return program;

  const activityIndex = day.activities.indexOf(activity);
  const usedNames = new Set<string>();
  const usedOneShotInProgram = new Set<string>();

  // Collect all used venue names and one-shot activities in the program
  program.days.forEach(d => {
    d.activities.forEach(a => {
      a.options.forEach(o => {
        usedNames.add(o.venueName.toLowerCase());
        // Track which one-shot activity types are already used in this program
        const venueCategory = o.category;
        if (venueCategory && ONE_SHOT_ACTIVITIES.some(os => venueCategory.includes(os))) {
          // Find the matching one-shot category
          ONE_SHOT_ACTIVITIES.forEach(os => {
            if (venueCategory.includes(os)) {
              usedOneShotInProgram.add(os);
            }
          });
        }
      });
    });
  });

  // Get alternative venues, excluding one-shot activities that are already used elsewhere
  const venues = loadVenuesByCategory(activity.category);
  const available = venues.filter(v => {
    if (usedNames.has(v.name.toLowerCase())) return false;
    // V6 FIX: Don't allow regenerating to a different one-shot activity
    if (v.subCategory && ONE_SHOT_ACTIVITIES.includes(v.subCategory)) {
      // Only allow if this specific one-shot category is not used elsewhere
      return !usedOneShotInProgram.has(v.subCategory);
    }
    return true;
  });

  if (available.length === 0) return program;

  const selected = getRandomFrom(available, 2);
  const newSlot = createActivitySlotFromVenues(
    selected,
    activity.timeSlot,
    activity.type,
    activity.time
  );

  if (newSlot) {
    day.activities[activityIndex] = newSlot;
    program.updatedAt = new Date().toISOString();
  }

  return program;
}
