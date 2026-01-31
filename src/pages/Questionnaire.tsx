import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check, Loader2, Users, CalendarDays, Clock, Coffee, Gauge, Flame, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CITIES } from "@/lib/concierge-data";
import { api } from "@/lib/api";

interface Answers {
  startDate: string;
  endDate: string;
  arrivalTimeKnown: boolean;
  arrivalTime: string;
  departureTimeKnown: boolean;
  departureTime: string;
  guests: number;
  intensity: "relaxed" | "moderate" | "intense";
  restaurantCategories: string[];
  museumCategories: string[];
  activityCategories: string[];
  wantsSpa: boolean;
  wantsShopping: boolean;
  selectedShops: string[];
  nightlifeCategories: string[];
}

// Restaurant categories from CSV
const RESTAURANT_CATEGORIES = [
  { id: "brasserie", label: "Brasserie / Institution", description: "Les grandes brasseries parisiennes" },
  { id: "cuisine_monde", label: "Cuisine du monde", description: "Gastronomies internationales" },
  { id: "trendy", label: "Trendy / Festif", description: "Ambiances branchées et festives" },
  { id: "etoile", label: "Étoilé", description: "Tables étoilées Michelin" },
  { id: "confidentiel", label: "Confidentiel", description: "Adresses secrètes" },
];

// Museum categories - updated to match CSV exactly
const MUSEUM_CATEGORIES = [
  { id: "art_contemporain_classique", label: "Art contemporain / Classique", description: "Orangerie, Jacquemart-André, Petit Palais..." },
  { id: "patrimoine_monument", label: "Patrimoine & Monuments", description: "Galerie Dior, Rodin, Carnavalet..." },
  { id: "art_moderne", label: "Art Moderne", description: "Fondation LV, Picasso, Palais de Tokyo..." },
  { id: "incontournable", label: "Incontournables", description: "Louvre, Orsay, Quai Branly" },
  { id: "aucun", label: "Aucun musée", description: "Pas de visite culturelle" },
];

// Activity categories
const ACTIVITY_CATEGORIES = [
  { id: "enfant_famille", label: "Enfant / Famille", description: "Activités familiales" },
  { id: "culture_visite", label: "Culture / Visite guidée / Excursion", description: "Visites et découvertes" },
  { id: "activite_creative", label: "Activité créative", description: "Ateliers et expériences" },
  { id: "tour_voiture", label: "Tour en voiture de prestige", description: "Balades en véhicules d'exception" },
  { id: "croisiere", label: "Croisière sur la Seine", description: "Navigation sur la Seine" },
  { id: "helicoptere", label: "Hélicoptère", description: "Survol de Paris" },
];

// Nightlife categories - updated to match CSV exactly
const NIGHTLIFE_CATEGORIES = [
  { id: "palace_lounge_rooftops", label: "Palace, Lounge, Rooftops", description: "Bars d'hôtels de luxe et rooftops" },
  { id: "speakeasy_bar_vins", label: "SpeakEasy, Bar à Vins", description: "Bars cachés et caves à vins" },
  { id: "clubs_festifs", label: "Clubs, Restaurants Festifs", description: "Clubs et ambiances festives" },
  { id: "cabarets", label: "Cabarets", description: "Spectacles et revues parisiennes" },
  { id: "aucun", label: "Aucun", description: "Pas de sortie nocturne" },
];

// Intensity options
const INTENSITY_OPTIONS = [
  { id: "relaxed", label: "Détendu", description: "" },
  { id: "moderate", label: "Modéré", description: "" },
  { id: "intense", label: "Intense", description: "" },
];

// Steps order - updated with intensity after guests
const STEPS = [
  "dates",
  "guests",
  "intensity",
  "restaurants",
  "museums",
  "activities",
  "spa",
  "shopping",
  "nightlife",
] as const;

type StepId = typeof STEPS[number];

export default function Questionnaire() {
  const { cityId } = useParams<{ cityId: string }>();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shopsList, setShopsList] = useState<{ name: string; address: string }[]>([]);
  const [randomShops, setRandomShops] = useState<{ name: string; address: string }[]>([]);

  // Default dates: today + 3 days
  const today = new Date();
  const defaultEnd = new Date(today);
  defaultEnd.setDate(defaultEnd.getDate() + 3);

  const [answers, setAnswers] = useState<Answers>({
    startDate: today.toISOString().split("T")[0],
    endDate: defaultEnd.toISOString().split("T")[0],
    arrivalTimeKnown: false,
    arrivalTime: "14:00",
    departureTimeKnown: false,
    departureTime: "12:00",
    guests: 2,
    intensity: "moderate",
    restaurantCategories: [],
    museumCategories: [],
    activityCategories: [],
    wantsSpa: false,
    wantsShopping: false,
    selectedShops: [],
    nightlifeCategories: [],
  });

  const city = CITIES.find((c) => c.id === cityId);
  const totalSteps = STEPS.length;
  const progress = ((currentStep + 1) / totalSteps) * 100;
  const currentStepId = STEPS[currentStep];

  // Calculate duration from dates
  const duration = useMemo(() => {
    const start = new Date(answers.startDate);
    const end = new Date(answers.endDate);
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return Math.max(1, Math.min(21, diffDays));
  }, [answers.startDate, answers.endDate]);

  // Load shops list from CSV
  useEffect(() => {
    fetch("/shopping.csv")
      .then((res) => res.text())
      .then((text) => {
        const lines = text.split("\n").slice(1);
        const shops = lines
          .filter((line) => line.trim())
          .map((line) => {
            const parts = line.split(";");
            return {
              name: parts[0]?.trim() || "",
              address: parts[3]?.trim() || "",
            };
          })
          .filter((shop) => shop.name);
        setShopsList(shops);
      })
      .catch(console.error);
  }, []);

  // Generate 6 random shops when shopsList is loaded or when user selects "yes" for shopping
  useEffect(() => {
    if (shopsList.length > 0 && answers.wantsShopping && randomShops.length === 0) {
      const shuffled = [...shopsList].sort(() => Math.random() - 0.5);
      setRandomShops(shuffled.slice(0, 6));
    }
  }, [shopsList, answers.wantsShopping, randomShops.length]);

  useEffect(() => {
    if (!city) {
      navigate("/");
    }
  }, [city, navigate]);

  if (!city) return null;

  const canProceed = (): boolean => {
    switch (currentStepId) {
      case "dates":
        return !!answers.startDate && !!answers.endDate && duration >= 1 && duration <= 21;
      case "guests":
        return answers.guests >= 1 && answers.guests <= 9;
      case "intensity":
        return !!answers.intensity;
      case "restaurants":
        return answers.restaurantCategories.length > 0;
      case "museums":
        return answers.museumCategories.length > 0;
      case "activities":
        return answers.activityCategories.length > 0;
      case "spa":
        return true; // Always can proceed (yes/no choice)
      case "shopping":
        return true; // Always can proceed
      case "nightlife":
        return answers.nightlifeCategories.length > 0;
      default:
        return false;
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Convert answers to API format
      const interests: string[] = [];

      // Map restaurant categories to interests
      if (answers.restaurantCategories.includes("etoile")) interests.push("top25");
      if (answers.restaurantCategories.length > 0) interests.push("restaurants");

      // Map museum categories
      if (!answers.museumCategories.includes("aucun") && answers.museumCategories.length > 0) {
        interests.push("musees");
      }

      // Map activities
      if (answers.activityCategories.includes("enfant_famille")) interests.push("enfants");
      if (answers.activityCategories.includes("culture_visite")) interests.push("tours");
      if (answers.activityCategories.includes("croisiere")) interests.push("nautique");
      if (answers.activityCategories.some(c => ["tour_voiture", "helicoptere"].includes(c))) interests.push("elite");

      // Spa
      if (answers.wantsSpa) interests.push("spas");

      // Shopping
      if (answers.wantsShopping) interests.push("shoppers");

      // Nightlife
      if (answers.nightlifeCategories.includes("palace_lounge_rooftops") || answers.nightlifeCategories.includes("speakeasy_bar_vins")) {
        interests.push("bars");
      }
      if (answers.nightlifeCategories.includes("clubs_festifs")) interests.push("clubs");
      if (answers.nightlifeCategories.includes("cabarets")) interests.push("cabarets");

      const response = await api.post<{ id: string }>("/api/programs/generate", {
        city: cityId,
        duration: duration,
        profile: "couple",
        interests: interests,
        pace: "balanced",
        guests: answers.guests,
        startDate: answers.startDate,
        endDate: answers.endDate,
        // New fields for enhanced generation
        arrivalTimeKnown: answers.arrivalTimeKnown,
        arrivalTime: answers.arrivalTime,
        departureTimeKnown: answers.departureTimeKnown,
        departureTime: answers.departureTime,
        intensity: answers.intensity,
        restaurantCategories: answers.restaurantCategories,
        museumCategories: answers.museumCategories,
        activityCategories: answers.activityCategories,
        wantsSpa: answers.wantsSpa,
        wantsShopping: answers.wantsShopping,
        selectedShops: answers.selectedShops,
        nightlifeCategories: answers.nightlifeCategories,
      });
      navigate(`/program/${response.id}`);
    } catch (error) {
      console.error("Failed to generate program:", error);
      // Fallback to URL params
      const params = new URLSearchParams({
        duration: duration.toString(),
        guests: answers.guests.toString(),
      });
      navigate(`/program/${cityId}?${params.toString()}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    } else {
      navigate("/");
    }
  };

  const getStepTitle = (): string => {
    switch (currentStepId) {
      case "dates": return "Dates du séjour";
      case "guests": return "Nombre de voyageurs";
      case "intensity": return "Rythme du séjour";
      case "restaurants": return "Restaurants";
      case "museums": return "Musées";
      case "activities": return "Activités";
      case "spa": return "Spa & Bien-être";
      case "shopping": return "Shopping";
      case "nightlife": return "Nightlife";
      default: return "";
    }
  };

  const getStepSubtitle = (): string | null => {
    switch (currentStepId) {
      case "dates": return "Sélectionnez vos dates d'arrivée et de départ";
      case "guests": return "Combien de personnes participent au voyage ?";
      case "intensity": return "Quel rythme souhaitez-vous pour votre séjour ?";
      case "restaurants": return "Sélectionnez une ou plusieurs catégories";
      case "museums": return "Sélectionnez un ou plusieurs types de visite";
      case "activities": return "Sélectionnez une ou plusieurs activités";
      case "spa": return "Souhaitez-vous inclure des séances bien-être ?";
      case "shopping": return "Souhaitez-vous inclure du shopping ?";
      case "nightlife": return "Sélectionnez une ou plusieurs ambiances";
      default: return null;
    }
  };

  // Handle museum multi-select with "aucun" exclusive logic
  const toggleMuseumCategory = (id: string) => {
    setAnswers((prev) => {
      if (id === "aucun") {
        // If selecting "aucun", clear all others and set only "aucun"
        return { ...prev, museumCategories: ["aucun"] };
      } else {
        // If selecting another option, remove "aucun" if present
        const current = prev.museumCategories.filter((c) => c !== "aucun");
        if (current.includes(id)) {
          return { ...prev, museumCategories: current.filter((c) => c !== id) };
        }
        return { ...prev, museumCategories: [...current, id] };
      }
    });
  };

  // Handle nightlife multi-select with "aucun" exclusive logic
  const toggleNightlifeCategory = (id: string) => {
    setAnswers((prev) => {
      if (id === "aucun") {
        // If selecting "aucun", clear all others and set only "aucun"
        return { ...prev, nightlifeCategories: ["aucun"] };
      } else {
        // If selecting another option, remove "aucun" if present
        const current = prev.nightlifeCategories.filter((c) => c !== "aucun");
        if (current.includes(id)) {
          return { ...prev, nightlifeCategories: current.filter((c) => c !== id) };
        }
        return { ...prev, nightlifeCategories: [...current, id] };
      }
    });
  };

  const toggleMultiSelect = (field: keyof Answers, value: string) => {
    setAnswers((prev) => {
      const current = prev[field] as string[];
      if (current.includes(value)) {
        return { ...prev, [field]: current.filter((v) => v !== value) };
      }
      return { ...prev, [field]: [...current, value] };
    });
  };

  const toggleShopSelection = (shopName: string) => {
    setAnswers((prev) => {
      const current = prev.selectedShops;
      if (current.includes(shopName)) {
        return { ...prev, selectedShops: current.filter((s) => s !== shopName) };
      }
      if (current.length >= 4) {
        return prev; // Max 4 shops (updated from 6)
      }
      return { ...prev, selectedShops: [...current, shopName] };
    });
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/5 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 min-h-screen flex flex-col">
        <header className="px-6 py-4 flex items-center justify-between border-b border-border/30">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Retour</span>
          </button>

          <div className="text-center">
            <p className="text-xs tracking-widest uppercase text-primary">
              {city.name}
            </p>
          </div>

          <div className="text-sm text-muted-foreground">
            {currentStep + 1}/{totalSteps}
          </div>
        </header>

        <div className="h-0.5 bg-border/30">
          <div
            className="h-full bg-primary transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        <main className="flex-1 flex flex-col justify-center px-6 py-12 overflow-y-auto">
          <div className="max-w-2xl mx-auto w-full">
            <div className="text-center mb-12 animate-fade-up">
              <h2 className="font-serif text-display-sm md:text-display-md text-foreground mb-3">
                {getStepTitle()}
              </h2>
              {getStepSubtitle() && (
                <p className="text-muted-foreground text-sm">
                  {getStepSubtitle()}
                </p>
              )}
            </div>

            {/* Date Step */}
            {currentStepId === "dates" && (
              <DateSelector
                startDate={answers.startDate}
                endDate={answers.endDate}
                duration={duration}
                arrivalTimeKnown={answers.arrivalTimeKnown}
                arrivalTime={answers.arrivalTime}
                departureTimeKnown={answers.departureTimeKnown}
                departureTime={answers.departureTime}
                onStartDateChange={(date) => setAnswers((prev) => ({ ...prev, startDate: date }))}
                onEndDateChange={(date) => setAnswers((prev) => ({ ...prev, endDate: date }))}
                onArrivalTimeKnownChange={(known) => setAnswers((prev) => ({ ...prev, arrivalTimeKnown: known }))}
                onArrivalTimeChange={(time) => setAnswers((prev) => ({ ...prev, arrivalTime: time }))}
                onDepartureTimeKnownChange={(known) => setAnswers((prev) => ({ ...prev, departureTimeKnown: known }))}
                onDepartureTimeChange={(time) => setAnswers((prev) => ({ ...prev, departureTime: time }))}
              />
            )}

            {/* Guests Step */}
            {currentStepId === "guests" && (
              <GuestsInput
                value={answers.guests}
                onChange={(value) => setAnswers((prev) => ({ ...prev, guests: value }))}
              />
            )}

            {/* Intensity Step */}
            {currentStepId === "intensity" && (
              <IntensitySelector
                selected={answers.intensity}
                onSelect={(id) => setAnswers((prev) => ({ ...prev, intensity: id as "relaxed" | "moderate" | "intense" }))}
              />
            )}

            {/* Restaurants Step */}
            {currentStepId === "restaurants" && (
              <MultiSelectGrid
                options={RESTAURANT_CATEGORIES}
                selected={answers.restaurantCategories}
                onToggle={(id) => toggleMultiSelect("restaurantCategories", id)}
              />
            )}

            {/* Museums Step - Now multi-select with exclusive "aucun" */}
            {currentStepId === "museums" && (
              <MultiSelectGridWithExclusive
                options={MUSEUM_CATEGORIES}
                selected={answers.museumCategories}
                onToggle={toggleMuseumCategory}
                exclusiveId="aucun"
              />
            )}

            {/* Activities Step */}
            {currentStepId === "activities" && (
              <MultiSelectGrid
                options={ACTIVITY_CATEGORIES}
                selected={answers.activityCategories}
                onToggle={(id) => toggleMultiSelect("activityCategories", id)}
              />
            )}

            {/* Spa Step */}
            {currentStepId === "spa" && (
              <YesNoSelector
                value={answers.wantsSpa}
                onChange={(value) => setAnswers((prev) => ({ ...prev, wantsSpa: value }))}
                yesLabel="Oui, inclure des séances bien-être"
                noLabel="Non merci"
                yesDescription=""
                noDescription="Pas de séance bien-être prévue"
              />
            )}

            {/* Shopping Step - Simplified: just Yes/No */}
            {currentStepId === "shopping" && (
              <YesNoSelector
                value={answers.wantsShopping}
                onChange={(value) => setAnswers((prev) => ({ ...prev, wantsShopping: value, selectedShops: [] }))}
                yesLabel="Oui, inclure du shopping"
                noLabel="Non merci"
                yesDescription="Les boutiques seront proposées dans le planning"
                noDescription="Pas de shopping prévu"
              />
            )}

            {/* Nightlife Step - Now multi-select with exclusive "aucun" */}
            {currentStepId === "nightlife" && (
              <MultiSelectGridWithExclusive
                options={NIGHTLIFE_CATEGORIES}
                selected={answers.nightlifeCategories}
                onToggle={toggleNightlifeCategory}
                exclusiveId="aucun"
              />
            )}

            <div className="flex justify-center mt-8">
              <Button
                onClick={handleNext}
                disabled={!canProceed() || isSubmitting}
                className="px-8 py-6 text-base font-medium bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Création du programme...
                  </>
                ) : currentStep === totalSteps - 1 ? (
                  "Découvrir mon programme"
                ) : (
                  <>
                    Continuer
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

// Date Selector Component with arrival/departure time options
function DateSelector({
  startDate,
  endDate,
  duration,
  arrivalTimeKnown,
  arrivalTime,
  departureTimeKnown,
  departureTime,
  onStartDateChange,
  onEndDateChange,
  onArrivalTimeKnownChange,
  onArrivalTimeChange,
  onDepartureTimeKnownChange,
  onDepartureTimeChange,
}: {
  startDate: string;
  endDate: string;
  duration: number;
  arrivalTimeKnown: boolean;
  arrivalTime: string;
  departureTimeKnown: boolean;
  departureTime: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  onArrivalTimeKnownChange: (known: boolean) => void;
  onArrivalTimeChange: (time: string) => void;
  onDepartureTimeKnownChange: (known: boolean) => void;
  onDepartureTimeChange: (time: string) => void;
}) {
  const today = new Date().toISOString().split("T")[0];

  const getDayName = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("fr-FR", { weekday: "long" });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  };

  return (
    <div className="space-y-8 mb-12 animate-fade-up">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Start Date */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-muted-foreground">
            Date d'arrivée
          </label>
          <div className="relative">
            <input
              type="date"
              value={startDate}
              min={today}
              onChange={(e) => {
                onStartDateChange(e.target.value);
                if (e.target.value > endDate) {
                  const newEnd = new Date(e.target.value);
                  newEnd.setDate(newEnd.getDate() + 2);
                  onEndDateChange(newEnd.toISOString().split("T")[0]);
                }
              }}
              className="w-full px-4 py-4 rounded-xl border border-border/50 bg-card/50 text-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
          {startDate && (
            <p className="text-sm text-primary capitalize">
              {getDayName(startDate)} - {formatDate(startDate)}
            </p>
          )}

          {/* Arrival time option */}
          <div className="mt-4 p-4 rounded-xl border border-border/30 bg-card/30">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Heure d'arrivée connue ?
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => onArrivalTimeKnownChange(true)}
                  className={`px-3 py-1 rounded-lg text-sm transition-all ${
                    arrivalTimeKnown
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  Oui
                </button>
                <button
                  onClick={() => onArrivalTimeKnownChange(false)}
                  className={`px-3 py-1 rounded-lg text-sm transition-all ${
                    !arrivalTimeKnown
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  Non
                </button>
              </div>
            </div>
            {arrivalTimeKnown && (
              <input
                type="time"
                value={arrivalTime}
                onChange={(e) => onArrivalTimeChange(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border/50 bg-card/50 text-foreground focus:border-primary/50 focus:outline-none transition-all"
              />
            )}
          </div>
        </div>

        {/* End Date */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-muted-foreground">
            Date de départ
          </label>
          <div className="relative">
            <input
              type="date"
              value={endDate}
              min={startDate}
              onChange={(e) => onEndDateChange(e.target.value)}
              className="w-full px-4 py-4 rounded-xl border border-border/50 bg-card/50 text-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
          {endDate && (
            <p className="text-sm text-primary capitalize">
              {getDayName(endDate)} - {formatDate(endDate)}
            </p>
          )}

          {/* Departure time option */}
          <div className="mt-4 p-4 rounded-xl border border-border/30 bg-card/30">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Heure de départ connue ?
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => onDepartureTimeKnownChange(true)}
                  className={`px-3 py-1 rounded-lg text-sm transition-all ${
                    departureTimeKnown
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  Oui
                </button>
                <button
                  onClick={() => onDepartureTimeKnownChange(false)}
                  className={`px-3 py-1 rounded-lg text-sm transition-all ${
                    !departureTimeKnown
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  Non
                </button>
              </div>
            </div>
            {departureTimeKnown && (
              <input
                type="time"
                value={departureTime}
                onChange={(e) => onDepartureTimeChange(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border/50 bg-card/50 text-foreground focus:border-primary/50 focus:outline-none transition-all"
              />
            )}
          </div>
        </div>
      </div>

      {/* Duration Summary */}
      <div className="text-center p-6 rounded-2xl bg-primary/10 border border-primary/20">
        <div className="flex items-center justify-center gap-3">
          <CalendarDays className="w-6 h-6 text-primary" />
          <span className="text-3xl font-serif text-primary">{duration}</span>
          <span className="text-lg text-primary/80">
            {duration === 1 ? "jour" : "jours"}
          </span>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          {duration <= 3 ? "Week-end" : duration <= 7 ? "Séjour court" : duration <= 14 ? "Séjour prolongé" : "Immersion complète"}
        </p>
      </div>
    </div>
  );
}

// Guests Input Component
function GuestsInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  const MAX_GUESTS = 9;

  const handleIncrement = () => {
    if (value < MAX_GUESTS) onChange(value + 1);
  };

  const handleDecrement = () => {
    if (value > 1) onChange(value - 1);
  };

  const getGuestsLabel = () => {
    if (value === 1) return "Voyageur solo";
    if (value === 2) return "Couple ou duo";
    if (value <= 4) return "Petit groupe";
    return "Groupe";
  };

  return (
    <div className="space-y-8 mb-12 animate-fade-up">
      <div className="flex items-center justify-center gap-6">
        <button
          onClick={handleDecrement}
          disabled={value <= 1}
          className="w-14 h-14 rounded-full border border-border/50 bg-card/50 flex items-center justify-center text-2xl text-foreground hover:bg-card hover:border-primary/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          -
        </button>

        <div className="inline-flex items-center gap-3 px-8 py-5 rounded-2xl bg-primary/10 border border-primary/20 min-w-[180px] justify-center">
          <Users className="w-7 h-7 text-primary" />
          <span className="text-5xl font-serif text-primary">{value}</span>
        </div>

        <button
          onClick={handleIncrement}
          disabled={value >= MAX_GUESTS}
          className="w-14 h-14 rounded-full border border-border/50 bg-card/50 flex items-center justify-center text-2xl text-foreground hover:bg-card hover:border-primary/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          +
        </button>
      </div>

      <div className="text-center">
        <p className="text-muted-foreground text-sm">
          {getGuestsLabel()}
        </p>
        <p className="text-xs text-muted-foreground/70 mt-1">
          Maximum {MAX_GUESTS} voyageurs
        </p>
      </div>

      {/* Quick select buttons */}
      <div className="flex justify-center gap-2 flex-wrap">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <button
            key={num}
            onClick={() => onChange(num)}
            className={`w-10 h-10 rounded-full border text-sm font-medium transition-all ${
              value === num
                ? "bg-primary border-primary text-primary-foreground"
                : "border-border/50 bg-card/50 text-muted-foreground hover:border-primary/30"
            }`}
          >
            {num}
          </button>
        ))}
      </div>
    </div>
  );
}

// Intensity Selector Component
function IntensitySelector({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect: (id: string) => void;
}) {
  // Icon mapping for each intensity level
  const getIcon = (id: string, isSelected: boolean) => {
    const iconClass = `w-10 h-10 transition-colors ${isSelected ? "text-primary" : "text-muted-foreground"}`;
    switch (id) {
      case "relaxed":
        return <Coffee className={iconClass} />;
      case "moderate":
        return <Gauge className={iconClass} />;
      case "intense":
        return <Flame className={iconClass} />;
      default:
        return <Gauge className={iconClass} />;
    }
  };

  return (
    <div className="grid gap-4 mb-12 grid-cols-1 sm:grid-cols-3 animate-fade-up">
      {INTENSITY_OPTIONS.map((option, index) => {
        const isSelected = selected === option.id;
        return (
          <button
            key={option.id}
            onClick={() => onSelect(option.id)}
            style={{ animationDelay: `${index * 50}ms` }}
            className={`animate-fade-up group relative p-6 rounded-xl border text-center transition-all duration-300 ${
              isSelected
                ? "bg-primary/10 border-primary/50"
                : "bg-card/50 border-border/50 hover:border-primary/30 hover:bg-card"
            }`}
          >
            <div className="flex flex-col items-center gap-4">
              {getIcon(option.id, isSelected)}
              <h3 className={`font-medium transition-colors ${
                isSelected ? "text-primary" : "text-foreground"
              }`}>
                {option.label}
              </h3>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                isSelected
                  ? "bg-primary border-primary"
                  : "border-border group-hover:border-primary/50"
              }`}>
                {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

// Multi-select grid component
function MultiSelectGrid({
  options,
  selected,
  onToggle,
}: {
  options: { id: string; label: string; description: string }[];
  selected: string[];
  onToggle: (id: string) => void;
}) {
  return (
    <div className="grid gap-3 mb-12 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 animate-fade-up">
      {options.map((option, index) => {
        const isSelected = selected.includes(option.id);
        return (
          <button
            key={option.id}
            onClick={() => onToggle(option.id)}
            style={{ animationDelay: `${index * 50}ms` }}
            className={`animate-fade-up group relative p-5 rounded-xl border text-left transition-all duration-300 ${
              isSelected
                ? "bg-primary/10 border-primary/50"
                : "bg-card/50 border-border/50 hover:border-primary/30 hover:bg-card"
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className={`font-medium mb-1 transition-colors ${
                  isSelected ? "text-primary" : "text-foreground"
                }`}>
                  {option.label}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {option.description}
                </p>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                isSelected
                  ? "bg-primary border-primary"
                  : "border-border group-hover:border-primary/50"
              }`}>
                {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

// Multi-select grid with exclusive option (for museums and nightlife with "aucun")
function MultiSelectGridWithExclusive({
  options,
  selected,
  onToggle,
  exclusiveId,
}: {
  options: { id: string; label: string; description: string }[];
  selected: string[];
  onToggle: (id: string) => void;
  exclusiveId: string;
}) {
  return (
    <div className="grid gap-3 mb-12 grid-cols-1 sm:grid-cols-2 animate-fade-up">
      {options.map((option, index) => {
        const isSelected = selected.includes(option.id);
        const isExclusive = option.id === exclusiveId;
        return (
          <button
            key={option.id}
            onClick={() => onToggle(option.id)}
            style={{ animationDelay: `${index * 50}ms` }}
            className={`animate-fade-up group relative p-5 rounded-xl border text-left transition-all duration-300 ${
              isSelected
                ? "bg-primary/10 border-primary/50"
                : "bg-card/50 border-border/50 hover:border-primary/30 hover:bg-card"
            } ${isExclusive ? "sm:col-span-2" : ""}`}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className={`font-medium mb-1 transition-colors ${
                  isSelected ? "text-primary" : "text-foreground"
                }`}>
                  {option.label}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {option.description}
                </p>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                isSelected
                  ? "bg-primary border-primary"
                  : "border-border group-hover:border-primary/50"
              }`}>
                {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

// Yes/No selector component
function YesNoSelector({
  value,
  onChange,
  yesLabel,
  noLabel,
  yesDescription,
  noDescription,
}: {
  value: boolean;
  onChange: (value: boolean) => void;
  yesLabel: string;
  noLabel: string;
  yesDescription?: string;
  noDescription?: string;
}) {
  return (
    <div className="grid gap-4 mb-12 grid-cols-1 sm:grid-cols-2 animate-fade-up">
      <button
        onClick={() => onChange(true)}
        className={`p-6 rounded-xl border text-left transition-all duration-300 ${
          value
            ? "bg-primary/10 border-primary/50"
            : "bg-card/50 border-border/50 hover:border-primary/30 hover:bg-card"
        }`}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className={`font-medium mb-1 transition-colors ${
              value ? "text-primary" : "text-foreground"
            }`}>
              {yesLabel}
            </h3>
            {yesDescription && (
              <p className="text-sm text-muted-foreground">{yesDescription}</p>
            )}
          </div>
          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
            value ? "bg-primary border-primary" : "border-border"
          }`}>
            {value && <Check className="w-3 h-3 text-primary-foreground" />}
          </div>
        </div>
      </button>

      <button
        onClick={() => onChange(false)}
        className={`p-6 rounded-xl border text-left transition-all duration-300 ${
          !value
            ? "bg-primary/10 border-primary/50"
            : "bg-card/50 border-border/50 hover:border-primary/30 hover:bg-card"
        }`}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className={`font-medium mb-1 transition-colors ${
              !value ? "text-primary" : "text-foreground"
            }`}>
              {noLabel}
            </h3>
            {noDescription && (
              <p className="text-sm text-muted-foreground">{noDescription}</p>
            )}
          </div>
          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
            !value ? "bg-primary border-primary" : "border-border"
          }`}>
            {!value && <Check className="w-3 h-3 text-primary-foreground" />}
          </div>
        </div>
      </button>
    </div>
  );
}

// Shopping selector with shop list (updated to show 6 random shops, max 4 selections)
function ShoppingSelector({
  wantsShopping,
  selectedShops,
  shopsList,
  onWantsShoppingChange,
  onToggleShop,
}: {
  wantsShopping: boolean;
  selectedShops: string[];
  shopsList: { name: string; address: string }[];
  onWantsShoppingChange: (value: boolean) => void;
  onToggleShop: (shopName: string) => void;
}) {
  return (
    <div className="space-y-6 mb-12 animate-fade-up">
      {/* Yes/No choice */}
      <YesNoSelector
        value={wantsShopping}
        onChange={onWantsShoppingChange}
        yesLabel="Oui, inclure du shopping"
        noLabel="Non merci"
        yesDescription="Selectionnez jusqu'a 4 boutiques"
        noDescription="Pas de shopping prevu"
      />

      {/* Shop selection (only if wants shopping) - showing 6 random shops */}
      {wantsShopping && shopsList.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Store className="w-4 h-4" />
              Selectionnez vos boutiques ({selectedShops.length}/4)
            </p>
          </div>

          <div className="grid gap-2 grid-cols-1 sm:grid-cols-2">
            {shopsList.map((shop) => {
              const isSelected = selectedShops.includes(shop.name);
              return (
                <button
                  key={shop.name}
                  onClick={() => onToggleShop(shop.name)}
                  disabled={!isSelected && selectedShops.length >= 4}
                  className={`w-full p-3 rounded-lg border text-left transition-all ${
                    isSelected
                      ? "bg-primary/10 border-primary/50"
                      : selectedShops.length >= 4
                      ? "bg-muted/30 border-transparent opacity-50 cursor-not-allowed"
                      : "bg-card/50 border-border/30 hover:border-primary/30"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className={`font-medium text-sm ${isSelected ? "text-primary" : "text-foreground"}`}>
                      {shop.name}
                    </p>
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                      isSelected
                        ? "bg-primary border-primary"
                        : "border-border"
                    }`}>
                      {isSelected && <Check className="w-2.5 h-2.5 text-primary-foreground" />}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
