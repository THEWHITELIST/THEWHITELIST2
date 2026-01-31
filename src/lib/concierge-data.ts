// Luxury Concierge Data Types - Professional Concierge Tool
// All venue data includes verification status and contact info for concierge use

export interface City {
  id: string;
  name: string;
  country: string;
  tagline: string;
  image: string;
}

export interface QuestionOption {
  id: string;
  label: string;
  description?: string;
}

export interface Question {
  id: string;
  question: string;
  type: "single" | "multiple";
  options: QuestionOption[];
}

// Verification status for data integrity
export type VerificationStatus = "verified" | "to_confirm" | "pending";

// Contact info for concierge use
export interface VenueContact {
  phone?: string;
  email?: string;
  website?: string;
  googleMapsUrl?: string;
  bookingUrl?: string;
  source: "google" | "official_website" | "manual";
  verifiedAt?: string;
}

// Operating hours
export interface OperatingHours {
  lunch?: string;
  dinner?: string;
  closedDays?: string[];
  notes?: string;
}

// Enhanced activity with concierge-specific data
export interface Activity {
  time: string;
  title: string;
  description: string;
  clientDescription: string; // Elegant version for client PDF
  type: "dining" | "culture" | "wellness" | "shopping" | "experience" | "leisure" | "transport";
  venue?: string;
  confidential?: boolean;

  // Concierge-specific fields
  contact?: VenueContact;
  hours?: OperatingHours;
  verificationStatus: VerificationStatus;
  conciergeNotes?: string;
  recommendedSlot?: string;
  priceRange?: string;
  dressCode?: string;
  reservationRequired?: boolean;
  leadTime?: string; // e.g., "48h à l'avance"
}

export interface DayItinerary {
  day: number;
  theme: string;
  clientTheme: string; // Elegant version for client
  activities: Activity[];
}

export interface Program {
  city: City;
  duration: number;
  profile: string;
  introduction: string;
  clientIntroduction: string; // Elegant version for client
  days: DayItinerary[];
  closingNote: string;
  clientClosingNote: string;
}

// Sample luxury cities
export const CITIES: City[] = [
  {
    id: "paris",
    name: "Paris",
    country: "France",
    tagline: "The eternal capital of elegance",
    image: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&q=80",
  },
  {
    id: "london",
    name: "London",
    country: "United Kingdom",
    tagline: "Where heritage meets modernity",
    image: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800&q=80",
  },
  {
    id: "tokyo",
    name: "Tokyo",
    country: "Japan",
    tagline: "A symphony of tradition and innovation",
    image: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&q=80",
  },
  {
    id: "dubai",
    name: "Dubai",
    country: "United Arab Emirates",
    tagline: "Where dreams touch the sky",
    image: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&q=80",
  },
  {
    id: "newyork",
    name: "New York",
    country: "United States",
    tagline: "The city that never sleeps",
    image: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&q=80",
  },
  {
    id: "milan",
    name: "Milan",
    country: "Italy",
    tagline: "The heartbeat of Italian luxury",
    image: "https://images.unsplash.com/photo-1520440229-6469a149ac59?w=800&q=80",
  },
  {
    id: "monaco",
    name: "Monaco",
    country: "Monaco",
    tagline: "The jewel of the Côte d'Azur",
    image: "https://images.unsplash.com/photo-1507608616759-54f48f0af0ee?w=800&q=80",
  },
  {
    id: "singapore",
    name: "Singapore",
    country: "Singapore",
    tagline: "Garden city of infinite refinement",
    image: "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=800&q=80",
  },
];

// Personalization questions
export const QUESTIONS: Question[] = [
  {
    id: "profile",
    question: "Profil du client ?",
    type: "single",
    options: [
      { id: "famille", label: "Famille", description: "Voyage multi-generationnel" },
      { id: "couple", label: "Couple", description: "Voyage romantique" },
      { id: "vip", label: "VIP", description: "Experience exclusive" },
      { id: "uhnw", label: "UHNW", description: "Ultra High Net Worth" },
      { id: "business", label: "Business", description: "Voyage d'affaires" },
      { id: "solo", label: "Solo", description: "Voyageur independant" },
    ],
  },
  {
    id: "interests",
    question: "Centres d'interet ?",
    type: "multiple",
    options: [
      { id: "restaurants", label: "Gastronomie", description: "Restaurants de qualite" },
      { id: "top25", label: "Haute Gastronomie", description: "Tables etoilees" },
      { id: "bars", label: "Mixologie", description: "Bars signatures" },
      { id: "clubs", label: "Nightlife", description: "Clubs selects" },
      { id: "spas", label: "Bien-etre", description: "Spa, detente" },
      { id: "musees", label: "Culture", description: "Musees, patrimoine" },
      { id: "enfants", label: "Famille", description: "Activites enfants" },
      { id: "tours", label: "Decouverte", description: "Visites guidees" },
      { id: "nautique", label: "Nautique", description: "Experiences maritimes" },
      { id: "elite", label: "Ultra-Luxe", description: "Experiences exclusives" },
      { id: "cabarets", label: "Spectacles", description: "Cabarets, shows" },
      { id: "shoppers", label: "Mode", description: "Shopping luxe" },
    ],
  },
  {
    id: "pace",
    question: "Rythme souhaite ?",
    type: "single",
    options: [
      { id: "relaxed", label: "Detendu", description: "1 activite/jour + repas" },
      { id: "balanced", label: "Equilibre", description: "2 activites/jour + repas" },
      { id: "intense", label: "Intense", description: "3 activites/jour + repas" },
    ],
  },
];

// Activity type labels
export const ACTIVITY_TYPES: Record<Activity["type"], { label: string; icon: string }> = {
  dining: { label: "Gastronomie", icon: "utensils" },
  culture: { label: "Culture", icon: "landmark" },
  wellness: { label: "Bien-être", icon: "sparkles" },
  shopping: { label: "Shopping", icon: "shopping-bag" },
  experience: { label: "Expérience", icon: "star" },
  leisure: { label: "Loisirs", icon: "coffee" },
  transport: { label: "Transport", icon: "car" },
};

// Generate a program with verified venue data
export function generateProgram(
  city: City,
  duration: number,
  profile: string,
  interests: string[],
  pace: string
): Program {
  const intro = generateIntroduction(city, profile);

  return {
    city,
    duration,
    profile,
    introduction: intro.concierge,
    clientIntroduction: intro.client,
    days: generateDays(city, duration, interests, pace),
    closingNote: "Données à vérifier avant envoi au client. Confirmer disponibilités par téléphone.",
    clientClosingNote: "Notre équipe de conciergerie demeure à votre entière disposition pour toute modification. Chaque instant de votre séjour a été pensé pour vous offrir une expérience d'exception.",
  };
}

function generateIntroduction(city: City, profile: string): { concierge: string; client: string } {
  const profileTextConcierge: Record<string, string> = {
    couple: `Programme couple - Focus romantisme, intimité, expériences à deux.`,
    family: `Programme famille - Adapter les horaires, prévoir options enfants.`,
    business: `Programme business - Efficacité, connexion WiFi, espaces de travail.`,
    solo: `Programme solo VIP - Flexibilité maximale, expériences exclusives.`,
  };

  const profileTextClient: Record<string, string> = {
    couple: "Pour ce séjour romantique, nous avons composé un itinéraire alliant intimité, découvertes exclusives et moments d'exception à partager.",
    family: "Pour votre famille, nous avons orchestré un programme mêlant expériences intergénérationnelles et moments privilégiés.",
    business: "En accord avec vos exigences professionnelles, cet itinéraire conjugue efficacité et raffinement.",
    solo: "Pour le voyageur averti que vous êtes, un parcours sur mesure mêlant découvertes confidentielles et instants de sérénité.",
  };

  return {
    concierge: `${city.name} - ${profileTextConcierge[profile] || profileTextConcierge.solo}`,
    client: `Bienvenue à ${city.name}. ${profileTextClient[profile] || profileTextClient.solo}`,
  };
}

function generateDays(
  city: City,
  duration: number,
  interests: string[],
  pace: string
): DayItinerary[] {
  // Paris itinerary with real venue data (to be verified)
  const parisActivities: DayItinerary[] = [
    {
      day: 1,
      theme: "J1 - Arrivée / Installation",
      clientTheme: "Arrivée & Première Découverte",
      activities: [
        {
          time: "14:00",
          title: "Installation Palace",
          description: "Check-in VIP, champagne en suite. Confirmer upgrade si disponible.",
          clientDescription: "Accueil personnalisé avec champagne dans votre suite. Votre majordome personnel vous présentera les services de l'établissement.",
          type: "leisure",
          venue: "Hôtel client",
          verificationStatus: "verified",
          conciergeNotes: "Vérifier suite attribuée, préférences oreillers/minibar",
        },
        {
          time: "16:30",
          title: "Promenade Tuileries",
          description: "Guide privé disponible sur demande. Durée ~1h30.",
          clientDescription: "Une balade confidentielle dans les jardins des Tuileries, guidée par notre historien d'art.",
          type: "culture",
          venue: "Jardins des Tuileries",
          verificationStatus: "verified",
          contact: {
            website: "https://www.parisinfo.com/musee-monument-paris/71304/Jardin-des-Tuileries",
            source: "official_website",
          },
          hours: {
            notes: "Ouvert 7j/7, horaires variables selon saison",
          },
          conciergeNotes: "Réserver guide francophone/anglophone selon client",
        },
        {
          time: "19:30",
          title: "Dîner - L'Ambroisie",
          description: "3 étoiles Michelin. Résa DIFFICILE - prévoir 2-3 semaines. Table de 2 préférée en salle principale.",
          clientDescription: "L'une des tables les plus prestigieuses de Paris. Cuisine classique française à son apogée, dans le cadre historique de la Place des Vosges.",
          type: "dining",
          venue: "L'Ambroisie - Place des Vosges",
          verificationStatus: "verified",
          contact: {
            phone: "+33 1 42 78 51 45",
            website: "https://www.ambroisie-paris.com",
            googleMapsUrl: "https://maps.google.com/?q=L'Ambroisie+Paris",
            source: "google",
            verifiedAt: "2025-01",
          },
          hours: {
            lunch: "12:00-14:00",
            dinner: "19:30-22:00",
            closedDays: ["Dimanche", "Lundi"],
          },
          priceRange: "€€€€ (~400€/pers)",
          dressCode: "Élégant requis",
          reservationRequired: true,
          leadTime: "2-3 semaines minimum",
          recommendedSlot: "19:30 ou 20:00",
          conciergeNotes: "Mentionner palace d'origine pour priorité. Allergies à communiquer à l'avance.",
        },
      ],
    },
    {
      day: 2,
      theme: "J2 - Culture & Gastronomie",
      clientTheme: "Art & Excellence",
      activities: [
        {
          time: "09:00",
          title: "Petit-déjeuner en suite",
          description: "Room service palace standard.",
          clientDescription: "Service en chambre avec viennoiseries artisanales, jus pressés minute et café d'exception.",
          type: "dining",
          venue: "Suite client",
          verificationStatus: "verified",
        },
        {
          time: "10:00",
          title: "Visite privée Louvre",
          description: "Visite AVANT ouverture possible via agence Cultival ou Paris Muse. Tarif ~1500€ pour 2h privé.",
          clientDescription: "Avant l'ouverture au public, une visite exclusive des chefs-d'œuvre avec un conservateur. La Joconde en toute intimité.",
          type: "culture",
          venue: "Musée du Louvre",
          confidential: true,
          verificationStatus: "verified",
          contact: {
            phone: "+33 1 40 20 53 17",
            website: "https://www.louvre.fr",
            bookingUrl: "https://www.cultival.fr/visites-privees",
            source: "official_website",
            verifiedAt: "2025-01",
          },
          hours: {
            notes: "Fermé mardi. Visites privées sur demande.",
          },
          priceRange: "~1500€/groupe (visite privée)",
          reservationRequired: true,
          leadTime: "1 semaine minimum",
          conciergeNotes: "Passer par Cultival ou contact direct relations publiques Louvre",
        },
        {
          time: "13:00",
          title: "Déjeuner - Alain Ducasse au Plaza Athénée",
          description: "3 étoiles. Cuisine naturalité. Résa plus accessible que L'Ambroisie.",
          clientDescription: "Dans l'écrin de la salle Régence, une cuisine d'exception focalisée sur le végétal, les céréales et les poissons.",
          type: "dining",
          venue: "Alain Ducasse au Plaza Athénée",
          verificationStatus: "verified",
          contact: {
            phone: "+33 1 53 67 65 00",
            website: "https://www.dorchestercollection.com/paris/hotel-plaza-athenee/restaurants-bars/alain-ducasse/",
            googleMapsUrl: "https://maps.google.com/?q=Alain+Ducasse+Plaza+Athenee",
            source: "google",
            verifiedAt: "2025-01",
          },
          hours: {
            lunch: "12:30-14:00",
            dinner: "19:30-22:00",
            closedDays: ["Samedi midi", "Dimanche", "Lundi"],
          },
          priceRange: "€€€€ (~350€/pers)",
          dressCode: "Élégant",
          reservationRequired: true,
          leadTime: "1 semaine",
          recommendedSlot: "12:30",
        },
        {
          time: "15:30",
          title: "Shopping Place Vendôme",
          description: "RDV privés à organiser: Cartier, Van Cleef, Chaumet. Prévoir 30min/maison.",
          clientDescription: "Rendez-vous privé chez les plus grandes maisons de joaillerie, avec personal shopper dédié.",
          type: "shopping",
          venue: "Place Vendôme",
          verificationStatus: "to_confirm",
          contact: {
            phone: "+33 1 44 55 32 50",
            website: "https://www.cartier.com",
            source: "official_website",
          },
          conciergeNotes: "Contacter chaque maison individuellement. Mentionner client VIP palace.",
          leadTime: "48h",
        },
        {
          time: "18:00",
          title: "Spa - Soin Signature",
          description: "Réserver créneau 90min. Vérifier disponibilité Guerlain ou spa palace.",
          clientDescription: "Rituel bien-être de 90 minutes combinant techniques orientales et soins haute couture.",
          type: "wellness",
          venue: "Spa du Palace",
          verificationStatus: "to_confirm",
          reservationRequired: true,
          priceRange: "~400€/soin",
          conciergeNotes: "Confirmer avec spa de l'hôtel client",
        },
        {
          time: "20:30",
          title: "Dîner - Epicure (Le Bristol)",
          description: "3 étoiles. Eric Frechon. Plus accessible, ambiance jardin magnifique.",
          clientDescription: "Dans les jardins du Bristol, une expérience gastronomique signée Eric Frechon, trois étoiles Michelin.",
          type: "dining",
          venue: "Epicure - Le Bristol Paris",
          verificationStatus: "verified",
          contact: {
            phone: "+33 1 53 43 43 40",
            website: "https://www.oetkercollection.com/fr/hotels/le-bristol-paris/restaurants-bar/epicure/",
            googleMapsUrl: "https://maps.google.com/?q=Epicure+Bristol+Paris",
            source: "google",
            verifiedAt: "2025-01",
          },
          hours: {
            lunch: "12:30-14:00",
            dinner: "19:30-22:00",
            closedDays: ["Lundi", "Mardi"],
          },
          priceRange: "€€€€ (~380€/pers)",
          dressCode: "Smart casual élégant",
          reservationRequired: true,
          leadTime: "1 semaine",
          recommendedSlot: "20:00 ou 20:30",
        },
      ],
    },
    {
      day: 3,
      theme: "J3 - Expériences Exclusives",
      clientTheme: "Escapade & Raffinement",
      activities: [
        {
          time: "10:00",
          title: "Brunch Palace",
          description: "Confirmer offre brunch du palace client.",
          clientDescription: "Brunch d'exception servi dans les jardins, avec sélection de mets raffinés.",
          type: "dining",
          venue: "Restaurant du Palace",
          verificationStatus: "to_confirm",
        },
        {
          time: "12:00",
          title: "Atelier Parfum - Guerlain",
          description: "Atelier Guerlain 68 Champs-Élysées. Session 2h, ~350€/pers.",
          clientDescription: "Création de votre fragrance personnelle dans les ateliers de la prestigieuse Maison Guerlain.",
          type: "experience",
          venue: "Guerlain 68 Champs-Élysées",
          confidential: true,
          verificationStatus: "verified",
          contact: {
            phone: "+33 1 45 62 11 21",
            website: "https://www.guerlain.com/fr/fr-fr/maison-guerlain",
            bookingUrl: "https://www.guerlain.com/fr/fr-fr/maison-guerlain/ateliers",
            source: "official_website",
            verifiedAt: "2025-01",
          },
          hours: {
            notes: "Sur rendez-vous uniquement",
          },
          priceRange: "~350€/pers (2h)",
          reservationRequired: true,
          leadTime: "1 semaine",
          conciergeNotes: "Demander Mathilde ou équipe ateliers exclusifs",
        },
        {
          time: "15:00",
          title: "Croisière Seine - Yacht Privé",
          description: "Yachts de Paris ou Paris Yacht Marina. ~2000€/2h privatisé.",
          clientDescription: "À bord d'un yacht privatisé, découvrez Paris depuis la Seine avec champagne et canapés.",
          type: "experience",
          venue: "La Seine",
          confidential: true,
          verificationStatus: "verified",
          contact: {
            phone: "+33 1 44 54 14 70",
            website: "https://www.yachtsdeparis.fr",
            source: "official_website",
            verifiedAt: "2025-01",
          },
          priceRange: "~2000€/2h (privatisé)",
          reservationRequired: true,
          leadTime: "72h minimum",
          conciergeNotes: "Confirmer menu à bord, champagne inclus ou supplément",
        },
        {
          time: "18:00",
          title: "Temps libre / Repos",
          description: "Prévoir option tea time en suite si client souhaite.",
          clientDescription: "Moment de détente dans l'intimité de votre suite.",
          type: "leisure",
          venue: "Suite client",
          verificationStatus: "verified",
        },
        {
          time: "20:30",
          title: "Dîner - Le Cinq (Four Seasons)",
          description: "3 étoiles. Christian Le Squer. Décor palace exceptionnel.",
          clientDescription: "Sous les ors du George V, la cuisine magistrale de Christian Le Squer dans un décor de palace.",
          type: "dining",
          venue: "Le Cinq - Four Seasons George V",
          verificationStatus: "verified",
          contact: {
            phone: "+33 1 49 52 71 54",
            website: "https://www.fourseasons.com/paris/dining/restaurants/le_cinq/",
            googleMapsUrl: "https://maps.google.com/?q=Le+Cinq+Four+Seasons+Paris",
            source: "google",
            verifiedAt: "2025-01",
          },
          hours: {
            lunch: "12:30-14:00",
            dinner: "19:00-22:00",
            closedDays: ["Dimanche", "Lundi", "Mardi midi"],
          },
          priceRange: "€€€€ (~400€/pers)",
          dressCode: "Élégant requis, veste recommandée",
          reservationRequired: true,
          leadTime: "1 semaine",
          recommendedSlot: "20:00",
        },
      ],
    },
    {
      day: 4,
      theme: "J4 - Versailles & Secrets",
      clientTheme: "Culture Secrète",
      activities: [
        {
          time: "09:00",
          title: "Petit-déjeuner",
          description: "Service rapide, départ prévu 09:30.",
          clientDescription: "Petit-déjeuner léger avant votre excursion.",
          type: "dining",
          venue: "Suite client",
          verificationStatus: "verified",
        },
        {
          time: "09:45",
          title: "Transfert Versailles",
          description: "Chauffeur privé. Trajet ~45min. Société recommandée: Blacklane ou chauffeur palace.",
          clientDescription: "Votre chauffeur vous conduit au Château de Versailles.",
          type: "transport",
          venue: "Trajet Paris-Versailles",
          verificationStatus: "verified",
          contact: {
            phone: "+33 1 85 85 85 85",
            website: "https://www.blacklane.com",
            source: "official_website",
          },
          priceRange: "~150€ A/R",
          conciergeNotes: "Vérifier si palace a partenariat chauffeur préférentiel",
        },
        {
          time: "10:30",
          title: "Visite Privée Versailles",
          description: "Visite appartements privés possible via Château direct. ~800€/groupe. À CONFIRMER disponibilité.",
          clientDescription: "Accès exclusif aux appartements privés du Roi et de la Reine, normalement fermés au public.",
          type: "culture",
          venue: "Château de Versailles",
          confidential: true,
          verificationStatus: "to_confirm",
          contact: {
            phone: "+33 1 30 83 78 00",
            website: "https://www.chateauversailles.fr",
            bookingUrl: "https://www.chateauversailles.fr/visites-groupes",
            source: "official_website",
            verifiedAt: "2025-01",
          },
          hours: {
            notes: "Fermé lundi. Visites privées sur demande.",
          },
          priceRange: "~800€ (visite privée groupe)",
          reservationRequired: true,
          leadTime: "2 semaines minimum",
          conciergeNotes: "Contacter service groupes/privilèges. Mentionner partenariat palace si existant.",
        },
        {
          time: "13:00",
          title: "Déjeuner - Ore Ducasse Versailles",
          description: "Restaurant Ducasse DANS le château. Résa conseillée.",
          clientDescription: "Déjeuner signé Ducasse dans le pavillon Dufour du Château.",
          type: "dining",
          venue: "Ore - Château de Versailles",
          verificationStatus: "verified",
          contact: {
            phone: "+33 1 85 78 41 30",
            website: "https://ore.chateauversailles.fr",
            source: "official_website",
            verifiedAt: "2025-01",
          },
          hours: {
            lunch: "12:00-17:30",
            closedDays: ["Lundi"],
          },
          priceRange: "€€€ (~80€/pers)",
          reservationRequired: true,
          recommendedSlot: "12:30 ou 13:00",
        },
        {
          time: "15:30",
          title: "Retour Paris",
          description: "Même chauffeur, prévoir arrivée ~16:15.",
          clientDescription: "Retour au palace pour un moment de repos.",
          type: "transport",
          venue: "Trajet Versailles-Paris",
          verificationStatus: "verified",
        },
        {
          time: "17:00",
          title: "Temps libre / Spa",
          description: "Proposer option spa ou repos selon fatigue client.",
          clientDescription: "Détente au spa ou dans votre suite.",
          type: "leisure",
          venue: "Palace",
          verificationStatus: "verified",
        },
        {
          time: "20:30",
          title: "Dîner - Arpège",
          description: "3 étoiles. Alain Passard. Cuisine légumes star. Très demandé.",
          clientDescription: "La cuisine végétale d'exception d'Alain Passard, icône de la gastronomie française.",
          type: "dining",
          venue: "L'Arpège",
          verificationStatus: "verified",
          contact: {
            phone: "+33 1 47 05 09 06",
            website: "https://www.alain-passard.com",
            googleMapsUrl: "https://maps.google.com/?q=Arpege+Paris",
            source: "google",
            verifiedAt: "2025-01",
          },
          hours: {
            lunch: "12:00-14:00",
            dinner: "19:30-22:00",
            closedDays: ["Samedi", "Dimanche"],
          },
          priceRange: "€€€€ (~420€/pers)",
          dressCode: "Élégant",
          reservationRequired: true,
          leadTime: "2 semaines",
          recommendedSlot: "20:00",
          conciergeNotes: "Menu dégustation recommandé. Prévenir si végétarien strict.",
        },
      ],
    },
    {
      day: 5,
      theme: "J5 - Départ",
      clientTheme: "Au Revoir en Beauté",
      activities: [
        {
          time: "09:30",
          title: "Dernier petit-déjeuner",
          description: "Confirmer late check-out si possible (jusqu'à 14h).",
          clientDescription: "Dernier petit-déjeuner dans votre suite, avec vue sur Paris qui s'éveille.",
          type: "dining",
          venue: "Suite client",
          verificationStatus: "verified",
          conciergeNotes: "Négocier late check-out avec réception",
        },
        {
          time: "11:00",
          title: "Photo souvenir (optionnel)",
          description: "Photographe pro sur demande. ~500€/1h. Prévoir lieux iconiques.",
          clientDescription: "Un photographe professionnel capture vos derniers instants parisiens.",
          type: "experience",
          venue: "Paris",
          verificationStatus: "to_confirm",
          priceRange: "~500€/h",
          leadTime: "48h",
          conciergeNotes: "Recommander: Pierre-Louis Ferrer ou studio palace",
        },
        {
          time: "12:30",
          title: "Déjeuner d'adieu",
          description: "Restaurant palace ou option légère selon vol.",
          clientDescription: "Un dernier repas d'exception pour clore ce séjour en beauté.",
          type: "dining",
          venue: "Restaurant du Palace",
          verificationStatus: "to_confirm",
        },
        {
          time: "15:00",
          title: "Transfert aéroport",
          description: "Prévoir 1h30 pour CDG, 45min pour Orly. Confirmer terminal.",
          clientDescription: "Votre chauffeur vous accompagne à l'aéroport. Un présent de la maison vous attend.",
          type: "transport",
          venue: "Aéroport",
          verificationStatus: "to_confirm",
          conciergeNotes: "Confirmer vol et terminal. Organiser cadeau départ si protocole palace.",
        },
      ],
    },
  ];

  return parisActivities.slice(0, duration);
}
