import * as fs from "fs";
import * as path from "path";
import { type Venue, type VenueCategory, categoryToFileMap } from "../types";

// Path to the webapp/public directory containing CSV files
const CSV_BASE_PATH = path.resolve(__dirname, "../../../webapp/public");

// Cache for loaded venues
const venueCache: Map<VenueCategory, Venue[]> = new Map();

/**
 * Parse a semicolon-separated CSV line, handling quoted values
 */
function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ";" && !inQuotes) {
      values.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  // Push the last value
  values.push(current.trim());

  return values;
}

/**
 * Parse CSV content into array of objects
 * Handles multi-line quoted fields correctly
 */
function parseCsv(content: string): Record<string, string>[] {
  const records: Record<string, string>[] = [];

  // First, we need to properly parse considering multi-line quoted fields
  // Split content into logical lines (handling quoted newlines)
  const logicalLines: string[] = [];
  let currentLine = "";
  let inQuotes = false;

  for (let i = 0; i < content.length; i++) {
    const char = content[i];

    if (char === '"') {
      inQuotes = !inQuotes;
      currentLine += char;
    } else if (char === '\n' && !inQuotes) {
      if (currentLine.trim()) {
        logicalLines.push(currentLine);
      }
      currentLine = "";
    } else if (char === '\r') {
      // Skip carriage returns
      continue;
    } else {
      currentLine += char;
    }
  }

  // Don't forget the last line
  if (currentLine.trim()) {
    logicalLines.push(currentLine);
  }

  if (logicalLines.length === 0) {
    return [];
  }

  const headerLine = logicalLines[0];
  if (!headerLine) {
    return [];
  }
  const headers = parseCsvLine(headerLine);

  for (let i = 1; i < logicalLines.length; i++) {
    const line = logicalLines[i];
    if (!line) continue;
    const values = parseCsvLine(line);
    const record: Record<string, string> = {};

    headers.forEach((header, index) => {
      record[header] = values[index] || "";
    });

    records.push(record);
  }

  return records;
}

/**
 * Map restaurant category from CSV to internal category
 */
function mapRestaurantCategory(csvCategory: string): string {
  const lowerCategory = csvCategory.toLowerCase().trim();
  if (lowerCategory.includes("brasserie") || lowerCategory.includes("institution")) {
    return "brasserie";
  }
  if (lowerCategory.includes("cuisine du monde")) {
    return "cuisine_monde";
  }
  if (lowerCategory.includes("trendy") || lowerCategory.includes("festif")) {
    return "trendy";
  }
  if (lowerCategory.includes("étoilé") || lowerCategory.includes("etoile")) {
    return "etoile";
  }
  if (lowerCategory.includes("confidentiel")) {
    return "confidentiel";
  }
  return "brasserie"; // default
}

/**
 * Map museum category from CSV to internal category
 */
function mapMuseumCategory(csvCategory: string): string {
  const lowerCategory = csvCategory.toLowerCase().trim();
  if (lowerCategory.includes("incontournable")) {
    return "incontournable";
  }
  if (lowerCategory.includes("art moderne") || lowerCategory === "art moderne") {
    return "art_moderne";
  }
  if (lowerCategory.includes("patrimoine") || lowerCategory.includes("monument")) {
    return "patrimoine_monument";
  }
  if (lowerCategory.includes("contemporain") || lowerCategory.includes("classique")) {
    return "art_contemporain_classique";
  }
  return "patrimoine_monument"; // default
}

/**
 * Map activity category from CSV to internal category
 */
function mapActivityCategory(csvCategory: string): string {
  const lowerCategory = csvCategory.toLowerCase().trim();
  if (lowerCategory.includes("enfant") || lowerCategory.includes("famille")) {
    return "enfant_famille";
  }
  if (lowerCategory.includes("culture") || lowerCategory.includes("visite") || lowerCategory.includes("excursion")) {
    return "culture_visite";
  }
  if (lowerCategory.includes("créative") || lowerCategory.includes("creative")) {
    return "activite_creative";
  }
  if (lowerCategory.includes("voiture") || lowerCategory.includes("prestige")) {
    return "tour_voiture";
  }
  if (lowerCategory.includes("croisière") || lowerCategory.includes("croisiere") || lowerCategory.includes("seine")) {
    return "croisiere";
  }
  if (lowerCategory.includes("hélicoptère") || lowerCategory.includes("helicoptere")) {
    return "helicoptere";
  }
  return "culture_visite"; // default
}

/**
 * Map nightlife category from CSV to internal category
 */
function mapNightlifeCategory(csvCategory: string): string {
  const lowerCategory = csvCategory.toLowerCase().trim();
  if (lowerCategory.includes("cabaret")) {
    return "cabarets";
  }
  if (lowerCategory.includes("club") || lowerCategory.includes("festif")) {
    return "clubs_festifs";
  }
  if (lowerCategory.includes("speakeasy") || lowerCategory.includes("bar à vins") || lowerCategory.includes("bar a vins")) {
    return "speakeasy_bar_vins";
  }
  if (lowerCategory.includes("palace") || lowerCategory.includes("lounge") || lowerCategory.includes("rooftop")) {
    return "palace_lounge_rooftops";
  }
  // Default to palace/lounge/rooftops for bars
  return "palace_lounge_rooftops";
}

/**
 * Normalize French headers to standard field names based on category
 */
function normalizeRecord(
  record: Record<string, string>,
  category: VenueCategory
): Partial<Venue> {
  const normalized: Partial<Venue> = {
    category,
  };

  // Get name
  for (const key of Object.keys(record)) {
    const lowerKey = key.toLowerCase();
    if (lowerKey.includes("nom") && !normalized.name) {
      normalized.name = record[key];
    }
    if (lowerKey === "adresse" || lowerKey === "lieu") {
      normalized.address = record[key];
    }
    if (lowerKey.includes("téléphone") || lowerKey.includes("telephone") || lowerKey === "contact") {
      normalized.phone = record[key];
    }
    if (lowerKey.includes("horaire")) {
      normalized.hours = record[key];
    }
    if (lowerKey === "type" || lowerKey.includes("type de cuisine")) {
      normalized.type = record[key];
    }
    if (lowerKey.includes("style") || lowerKey.includes("ambiance") || lowerKey.includes("remarques")) {
      normalized.style = record[key];
    }
    if (lowerKey.includes("pourquoi") || lowerKey.includes("description")) {
      normalized.description = record[key];
    }
    if (lowerKey === "expérience" || lowerKey === "experience") {
      normalized.experience = record[key];
    }
  }

  // Get sub-category based on main category
  if (category === "restaurants") {
    const catField = record["Catégorie"] || record["Categorie"] || "";
    normalized.subCategory = mapRestaurantCategory(catField);
    // Check for Vue Tour Eiffel in experience field
    const experience = normalized.experience?.toLowerCase() || "";
    if (experience.includes("vue tour eiffel") || experience.includes("tour eiffel")) {
      normalized.isEiffelView = true;
    }
  } else if (category === "musees") {
    const catField = record["Catégories"] || record["Categories"] || "";
    normalized.subCategory = mapMuseumCategory(catField);
  } else if (category === "activites") {
    const catField = record["Catégories"] || record["Categories"] || "";
    normalized.subCategory = mapActivityCategory(catField);
  } else if (category === "nightlife") {
    const catField = record["Catégorie"] || record["Categorie"] || record["Catégorie "] || "";
    normalized.subCategory = mapNightlifeCategory(catField);
  } else if (category === "shopping") {
    // Check for reservation required field
    const rdvField = record["Rendez-vous nécessaire"] || record["Rendez-vous necessaire"] || "";
    const rdvLower = rdvField.toLowerCase().trim();
    if (rdvLower === "oui" || rdvLower === "recommandé" || rdvLower === "recommande" ||
        rdvLower.includes("oui") || rdvLower.includes("recommand")) {
      normalized.reservationRequired = true;
    } else {
      normalized.reservationRequired = false;
    }
  }

  return normalized;
}

/**
 * Generate a unique ID for a venue
 */
function generateVenueId(name: string, category: VenueCategory): string {
  const slug = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 50);

  return `${category}-${slug}`;
}

/**
 * Load and parse a CSV file for a specific category
 */
export function loadVenuesByCategory(category: VenueCategory): Venue[] {
  // Check cache first
  if (venueCache.has(category)) {
    return venueCache.get(category)!;
  }

  const filename = categoryToFileMap[category];
  const filepath = path.join(CSV_BASE_PATH, filename);

  try {
    if (!fs.existsSync(filepath)) {
      console.warn(`CSV file not found: ${filepath}`);
      return [];
    }

    const content = fs.readFileSync(filepath, "utf-8");
    const records = parseCsv(content);

    const venues: Venue[] = records
      .map((record) => {
        const normalized = normalizeRecord(record, category);

        if (!normalized.name) {
          return null;
        }

        return {
          id: generateVenueId(normalized.name, category),
          name: normalized.name,
          category,
          subCategory: normalized.subCategory,
          address: normalized.address,
          phone: normalized.phone,
          hours: normalized.hours,
          type: normalized.type,
          style: normalized.style,
          description: normalized.description,
          experience: normalized.experience,
          priceRange: normalized.priceRange,
        } as Venue;
      })
      .filter((v): v is Venue => v !== null);

    // Cache the results
    venueCache.set(category, venues);

    return venues;
  } catch (error) {
    console.error(`Error loading CSV for category ${category}:`, error);
    return [];
  }
}

/**
 * Load all venues from all categories
 */
export function loadAllVenues(): Map<VenueCategory, Venue[]> {
  const allVenues = new Map<VenueCategory, Venue[]>();

  for (const category of Object.keys(categoryToFileMap) as VenueCategory[]) {
    const venues = loadVenuesByCategory(category);
    allVenues.set(category, venues);
  }

  return allVenues;
}

/**
 * Get restaurants filtered by sub-categories
 * V3: STRICT category matching - NO fallbacks
 */
export function getRestaurantsByCategories(categories: string[], excludedNames: string[] = []): Venue[] {
  // V3: Filter out "aucun" from categories
  const validCategories = categories.filter(c => c !== "aucun");

  // V3: If no valid categories, return empty array (strict matching)
  if (validCategories.length === 0) {
    return [];
  }

  const restaurants = loadVenuesByCategory("restaurants");
  const excludedSet = new Set(excludedNames.map((n) => n.toLowerCase()));

  // V3: STRICT matching - only return restaurants with exact subCategory match
  return restaurants.filter(
    (v) =>
      validCategories.includes(v.subCategory || "") &&
      !excludedSet.has(v.name.toLowerCase())
  );
}

/**
 * Get restaurants with Tour Eiffel view
 */
export function getRestaurantsWithEiffelView(): Venue[] {
  const restaurants = loadVenuesByCategory("restaurants");
  return restaurants.filter(
    (v) => v.experience?.toLowerCase().includes("vue tour eiffel")
  );
}

/**
 * Get museums filtered by category (legacy single category)
 */
export function getMuseumsByCategory(category: string, excludedNames: string[] = []): Venue[] {
  if (category === "aucun") {
    return [];
  }

  const museums = loadVenuesByCategory("musees");
  const excludedSet = new Set(excludedNames.map((n) => n.toLowerCase()));

  return museums.filter(
    (v) =>
      v.subCategory === category &&
      !excludedSet.has(v.name.toLowerCase())
  );
}

/**
 * Get museums filtered by multiple categories (V2)
 */
export function getMuseumsByCategories(categories: string[], excludedNames: string[] = []): Venue[] {
  // Filter out "aucun" from categories
  const validCategories = categories.filter(c => c !== "aucun");
  if (validCategories.length === 0) {
    return [];
  }

  const museums = loadVenuesByCategory("musees");
  const excludedSet = new Set(excludedNames.map((n) => n.toLowerCase()));

  return museums.filter(
    (v) =>
      validCategories.includes(v.subCategory || "") &&
      !excludedSet.has(v.name.toLowerCase())
  );
}

/**
 * Get activities filtered by categories
 * V3: STRICT category matching - NO fallbacks
 */
export function getActivitiesByCategories(categories: string[], excludedNames: string[] = []): Venue[] {
  // V3: Filter out "aucun" from categories
  const validCategories = categories.filter(c => c !== "aucun");

  // V3: If no valid categories, return empty array (strict matching)
  if (validCategories.length === 0) {
    return [];
  }

  const activities = loadVenuesByCategory("activites");
  const excludedSet = new Set(excludedNames.map((n) => n.toLowerCase()));

  // V3: STRICT matching - only return activities with exact subCategory match
  return activities.filter(
    (v) =>
      validCategories.includes(v.subCategory || "") &&
      !excludedSet.has(v.name.toLowerCase())
  );
}

/**
 * Get nightlife venues filtered by category (legacy single category)
 */
export function getNightlifeByCategory(category: string, excludedNames: string[] = []): Venue[] {
  if (category === "aucun") {
    return [];
  }

  const nightlife = loadVenuesByCategory("nightlife");
  const excludedSet = new Set(excludedNames.map((n) => n.toLowerCase()));

  return nightlife.filter(
    (v) =>
      v.subCategory === category &&
      !excludedSet.has(v.name.toLowerCase())
  );
}

/**
 * Get nightlife venues filtered by multiple categories (V2)
 */
export function getNightlifeByCategories(categories: string[], excludedNames: string[] = []): Venue[] {
  // Filter out "aucun" from categories
  const validCategories = categories.filter(c => c !== "aucun");
  if (validCategories.length === 0) {
    return [];
  }

  const nightlife = loadVenuesByCategory("nightlife");
  const excludedSet = new Set(excludedNames.map((n) => n.toLowerCase()));

  return nightlife.filter(
    (v) =>
      validCategories.includes(v.subCategory || "") &&
      !excludedSet.has(v.name.toLowerCase())
  );
}

/**
 * Get spas
 */
export function getSpas(excludedNames: string[] = []): Venue[] {
  const spas = loadVenuesByCategory("spas");
  const excludedSet = new Set(excludedNames.map((n) => n.toLowerCase()));

  return spas.filter((v) => !excludedSet.has(v.name.toLowerCase()));
}

/**
 * Get shopping venues, optionally filtered by selected shop names
 */
export function getShoppingVenues(selectedShops: string[] = [], excludedNames: string[] = []): Venue[] {
  const shops = loadVenuesByCategory("shopping");
  const excludedSet = new Set(excludedNames.map((n) => n.toLowerCase()));

  if (selectedShops.length === 0) {
    return shops.filter((v) => !excludedSet.has(v.name.toLowerCase()));
  }

  const selectedSet = new Set(selectedShops.map((n) => n.toLowerCase()));
  return shops.filter(
    (v) =>
      selectedSet.has(v.name.toLowerCase()) &&
      !excludedSet.has(v.name.toLowerCase())
  );
}

/**
 * Get transport venues (Chabé)
 */
export function getTransports(): Venue[] {
  return loadVenuesByCategory("transports");
}

/**
 * Get venues by category, excluding specific venues
 */
export function getVenuesWithExclusions(
  category: VenueCategory,
  excludedNames: string[]
): Venue[] {
  const venues = loadVenuesByCategory(category);
  const excludedSet = new Set(excludedNames.map((n) => n.toLowerCase()));

  return venues.filter((v) => !excludedSet.has(v.name.toLowerCase()));
}

/**
 * Get random venues from a category
 */
export function getRandomVenues(
  category: VenueCategory,
  count: number,
  excludedNames: string[] = []
): Venue[] {
  const venues = getVenuesWithExclusions(category, excludedNames);

  if (venues.length === 0) {
    return [];
  }

  // Shuffle and take count
  const shuffled = [...venues].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

/**
 * Get a specific venue by ID
 */
export function getVenueById(venueId: string): Venue | null {
  // Extract category from ID
  const parts = venueId.split("-");
  if (parts.length < 2) {
    return null;
  }

  const categoryPart = parts[0] as VenueCategory;
  if (!categoryToFileMap[categoryPart]) {
    return null;
  }

  const venues = loadVenuesByCategory(categoryPart);
  return venues.find((v) => v.id === venueId) || null;
}

/**
 * Search venues by name
 */
export function searchVenues(
  query: string,
  categories?: VenueCategory[]
): Venue[] {
  const searchCategories = categories || (Object.keys(categoryToFileMap) as VenueCategory[]);
  const results: Venue[] = [];
  const queryLower = query.toLowerCase();

  for (const category of searchCategories) {
    const venues = loadVenuesByCategory(category);
    for (const venue of venues) {
      if (venue.name.toLowerCase().includes(queryLower)) {
        results.push(venue);
      }
    }
  }

  return results;
}

/**
 * Clear the venue cache (useful for testing or reloading)
 */
export function clearVenueCache(): void {
  venueCache.clear();
}

/**
 * Get statistics about loaded venues
 */
export function getVenueStats(): Record<VenueCategory, number> {
  const stats: Record<string, number> = {};

  for (const category of Object.keys(categoryToFileMap) as VenueCategory[]) {
    const venues = loadVenuesByCategory(category);
    stats[category] = venues.length;
  }

  return stats as Record<VenueCategory, number>;
}

// ========== V2 OPENING HOURS AND AVAILABILITY FUNCTIONS ==========

/**
 * Parsed opening hours structure
 */
export interface DayHours {
  open: string;
  close: string;
}

export interface OpeningHours {
  [day: string]: DayHours[] | "Fermé" | "Sur mesure" | "spectacle";
}

/**
 * Parse the hours string from CSV into structured format
 * Examples:
 * - "lundi : 10:00-18:00"
 * - "lundi : Fermé"
 * - "lundi : 12:00–14:30, 19:00–23:00"
 * - "lundi : spectacle 19h, spectacle 21h"
 */
export function parseOpeningHours(hoursString: string | undefined): OpeningHours {
  const result: OpeningHours = {};

  if (!hoursString) {
    return result;
  }

  // Split by newlines to get individual day entries
  const lines = hoursString.split("\n").map(line => line.trim()).filter(Boolean);

  for (const line of lines) {
    // Match pattern: "day : hours"
    const match = line.match(/^(lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche)\s*:\s*(.+)$/i);
    if (!match) continue;

    const day = match[1]!.toLowerCase();
    const hoursStr = match[2]!.trim();

    // Check for closed
    if (hoursStr.toLowerCase() === "fermé") {
      result[day] = "Fermé";
      continue;
    }

    // Check for "Sur mesure" or similar
    if (hoursStr.toLowerCase().includes("sur mesure") || hoursStr.toLowerCase().includes("selon")) {
      result[day] = "Sur mesure";
      continue;
    }

    // Check for spectacle times (cabarets)
    if (hoursStr.toLowerCase().includes("spectacle")) {
      result[day] = "spectacle";
      continue;
    }

    // Parse time ranges (can have multiple, separated by comma)
    const timeRanges = hoursStr.split(",").map(s => s.trim());
    const parsedRanges: DayHours[] = [];

    for (const range of timeRanges) {
      // Match time range pattern: "10:00-18:00" or "10:00–18:00" (different dashes)
      const timeMatch = range.match(/(\d{1,2}:\d{2})\s*[–-]\s*(\d{1,2}:\d{2})/);
      if (timeMatch) {
        parsedRanges.push({
          open: timeMatch[1]!,
          close: timeMatch[2]!
        });
      }
    }

    if (parsedRanges.length > 0) {
      result[day] = parsedRanges;
    }
  }

  return result;
}

/**
 * Check if a venue is open at a specific day and time
 * @param venue The venue to check
 * @param dayOfWeek Day in French: lundi, mardi, mercredi, jeudi, vendredi, samedi, dimanche
 * @param time Time in HH:MM format
 * @returns Object with isOpen boolean and isSurMesure flag
 */
export function isVenueOpenAt(
  venue: Venue,
  dayOfWeek: string,
  time: string
): { isOpen: boolean; isSurMesure: boolean; isSpectacle: boolean } {
  const hours = parseOpeningHours(venue.hours);
  const dayLower = dayOfWeek.toLowerCase();
  const dayHours = hours[dayLower];

  // If no hours info, assume open
  if (!dayHours) {
    return { isOpen: true, isSurMesure: false, isSpectacle: false };
  }

  // Closed
  if (dayHours === "Fermé") {
    return { isOpen: false, isSurMesure: false, isSpectacle: false };
  }

  // Sur mesure - return true but flag it
  if (dayHours === "Sur mesure") {
    return { isOpen: true, isSurMesure: true, isSpectacle: false };
  }

  // Spectacle - return true but flag it
  if (dayHours === "spectacle") {
    return { isOpen: true, isSurMesure: false, isSpectacle: true };
  }

  // Check time ranges
  const [checkHour, checkMinute] = time.split(":").map(Number);
  const checkMinutes = (checkHour || 0) * 60 + (checkMinute || 0);

  for (const range of dayHours) {
    const [openHour, openMinute] = range.open.split(":").map(Number);
    const [closeHour, closeMinute] = range.close.split(":").map(Number);

    let openMinutes = (openHour || 0) * 60 + (openMinute || 0);
    let closeMinutes = (closeHour || 0) * 60 + (closeMinute || 0);

    // Handle overnight hours (e.g., 22:00-06:00)
    if (closeMinutes < openMinutes) {
      // If check time is after opening OR before closing (next day)
      if (checkMinutes >= openMinutes || checkMinutes <= closeMinutes) {
        return { isOpen: true, isSurMesure: false, isSpectacle: false };
      }
    } else {
      // Normal hours
      if (checkMinutes >= openMinutes && checkMinutes <= closeMinutes) {
        return { isOpen: true, isSurMesure: false, isSpectacle: false };
      }
    }
  }

  return { isOpen: false, isSurMesure: false, isSpectacle: false };
}

/**
 * Get day of week in French from a date
 */
export function getDayOfWeekFrench(date: Date): string {
  const days = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
  return days[date.getDay()]!;
}

/**
 * Filter venues by availability on a specific date and time
 */
export function filterVenuesByAvailability(
  venues: Venue[],
  date: Date,
  time: string
): Venue[] {
  const dayOfWeek = getDayOfWeekFrench(date);
  return venues.filter(venue => {
    const { isOpen } = isVenueOpenAt(venue, dayOfWeek, time);
    return isOpen;
  });
}

// ========== V2 LUXURY GIANTS RULE ==========

const LUXURY_GIANTS = ["Hermès", "Hermes", "Dior", "Chanel", "Louis Vuitton"];

/**
 * Get luxury brand shops (Giants rule)
 * Returns shops that match any of the luxury giant names
 */
export function getLuxuryGiantShops(excludedNames: string[] = []): Venue[] {
  const shops = loadVenuesByCategory("shopping");
  const excludedSet = new Set(excludedNames.map((n) => n.toLowerCase()));

  return shops.filter(shop => {
    if (excludedSet.has(shop.name.toLowerCase())) {
      return false;
    }

    // Check if shop name contains any luxury giant name
    const shopNameLower = shop.name.toLowerCase();
    return LUXURY_GIANTS.some(giant =>
      shopNameLower.includes(giant.toLowerCase())
    );
  });
}

/**
 * Check if a venue is a luxury giant shop
 */
export function isLuxuryGiant(venue: Venue): boolean {
  const nameLower = venue.name.toLowerCase();
  return LUXURY_GIANTS.some(giant => nameLower.includes(giant.toLowerCase()));
}

/**
 * Check if a venue is Hermes (for special lottery warning)
 */
export function isHermes(venue: Venue): boolean {
  const nameLower = venue.name.toLowerCase();
  return nameLower.includes("hermès") || nameLower.includes("hermes");
}
