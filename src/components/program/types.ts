// Program types - mirrored from backend/src/types.ts
// These are the frontend types used in the Program page

export type ViewMode = "concierge" | "client";

export type VenueCategory =
  | "restaurants"
  | "top25"
  | "bars"
  | "clubs"
  | "transports"
  | "spas"
  | "musees"
  | "enfants"
  | "tours"
  | "nautique"
  | "elite"
  | "cabarets"
  | "shoppers"
  | "securite";

export type Profile =
  | "family"
  | "couple"
  | "vip"
  | "uhnw"
  | "business"
  | "solo";

export type Pace = "relaxed" | "balanced" | "intense";

export type Interest =
  | "gastronomie"
  | "top25"
  | "mixologie"
  | "nightlife"
  | "logistique"
  | "bienetre"
  | "culture"
  | "famille"
  | "decouverte"
  | "nautique"
  | "ultraluxe"
  | "spectacles"
  | "mode"
  | "protection";

export type TimeSlot = "morning" | "lunch" | "afternoon" | "dinner" | "evening";

export type ActivityType =
  | "dining"
  | "culture"
  | "wellness"
  | "shopping"
  | "experience"
  | "leisure"
  | "transport"
  | "nightlife";

export interface ActivityOption {
  id: string;
  venueName: string;
  venueAddress?: string;
  venuePhone?: string;
  venueHours?: string;
  venueStyle?: string;
  venueType?: string;
  venueDescription?: string; // Personalized recommendation comment
  venueReservationRequired?: boolean; // For "Sur RDV" shops
  venueReservationNote?: string; // Special notes (e.g., Hermes lottery warning)
  isEiffelView?: boolean; // Flag for Vue Tour Eiffel
  category: VenueCategory;
  isSelected: boolean;
}

export interface ActivitySlot {
  id: string;
  timeSlot: TimeSlot;
  time?: string;
  type: ActivityType;
  category: VenueCategory;
  options: ActivityOption[];
  conciergeNotes?: string;
  verificationStatus: "pending" | "verified" | "to_confirm";
  isRest?: boolean; // Flag to indicate this slot is marked as "rest time"
}

export interface ProgramDay {
  id: string;
  dayNumber: number;
  actualDate?: string; // The actual date (YYYY-MM-DD)
  themeInternal?: string;
  themeClient?: string;
  activities: ActivitySlot[];
}

export interface Program {
  id: string;
  userId: string;
  city: string;
  duration: number;
  profile: Profile;
  pace: Pace;
  interests: Interest[];
  guests: number;
  title?: string;
  introInternal?: string;
  introClient?: string;
  closingInternal?: string;
  closingClient?: string;
  status: "draft" | "validated" | "exported";
  validatedAt?: string;
  startDate?: string; // ISO date string (YYYY-MM-DD)
  endDate?: string; // ISO date string (YYYY-MM-DD)
  createdAt: string;
  updatedAt: string;
  days: ProgramDay[];
}

// Time slot labels in French
export const TIME_SLOT_LABELS: Record<TimeSlot, string> = {
  morning: "Matinee",
  lunch: "Dejeuner",
  afternoon: "Apres-midi",
  dinner: "Diner",
  evening: "Soiree",
};

// Activity type labels in French
export const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  dining: "Gastronomie",
  culture: "Culture",
  wellness: "Bien-etre",
  shopping: "Shopping",
  experience: "Experience",
  leisure: "Loisirs",
  transport: "Transport",
  nightlife: "Nightlife",
};

// Profile labels in French
export const PROFILE_LABELS: Record<string, string> = {
  family: "Famille",
  couple: "Couple",
  vip: "VIP",
  uhnw: "UHNW",
  business: "Business",
  solo: "Solo",
};

// Pace labels in French
export const PACE_LABELS: Record<string, string> = {
  relaxed: "Detendu",
  balanced: "Equilibre",
  intense: "Intense",
};
