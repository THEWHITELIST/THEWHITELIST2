import { ArrowLeft, Eye, EyeOff, MapPin, Clock, Users, Zap } from "lucide-react";
import type { Program, ViewMode } from "./types";
import { PROFILE_LABELS, PACE_LABELS } from "./types";
import { EditableTitle } from "./EditableTitle";

interface ProgramHeaderProps {
  program: Program;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onBack: () => void;
  onUpdateTitle?: (title: string) => void;
  hotelName?: string; // From user profile
}

// Helper to format dates for title
function formatDateRange(startDate?: string, endDate?: string): string {
  if (!startDate || !endDate) return "";

  const start = new Date(startDate);
  const end = new Date(endDate);

  const months = [
    "Janvier", "Fevrier", "Mars", "Avril", "Mai", "Juin",
    "Juillet", "Aout", "Septembre", "Octobre", "Novembre", "Decembre"
  ];

  const startDay = start.getDate();
  const endDay = end.getDate();
  const startMonth = months[start.getMonth()];
  const endMonth = months[end.getMonth()];

  if (startMonth === endMonth) {
    return `Du ${startDay} au ${endDay} ${endMonth}`;
  }
  return `Du ${startDay} ${startMonth} au ${endDay} ${endMonth}`;
}

export function ProgramHeader({
  program,
  viewMode,
  onViewModeChange,
  onBack,
  onUpdateTitle,
  hotelName,
}: ProgramHeaderProps) {
  const isEditable = viewMode === "concierge" && !!onUpdateTitle;

  // Generate suggested title format: "Votre sejour au [Hotel] - [Dates]"
  const dateRange = formatDateRange(program.startDate, program.endDate);
  const suggestedTitle = hotelName
    ? `Votre sejour au ${hotelName}${dateRange ? ` - ${dateRange}` : ""}`
    : `Programme ${program.duration} jours`;

  const displayTitle = program.title || suggestedTitle;

  return (
    <header className="relative bg-gradient-to-b from-[#1a1a24] to-[#0a0a0f] border-b border-amber-500/10">
      {/* Top bar */}
      <div className="container max-w-4xl mx-auto px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Back button */}
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm hidden sm:inline">Retour</span>
          </button>

          {/* View Toggle */}
          <div className="flex rounded-full bg-white/5 p-1">
            <button
              onClick={() => onViewModeChange("concierge")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                viewMode === "concierge"
                  ? "bg-amber-500 text-black"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <Eye className="w-4 h-4" />
              <span className="hidden sm:inline">Concierge</span>
            </button>
            <button
              onClick={() => onViewModeChange("client")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                viewMode === "client"
                  ? "bg-amber-500 text-black"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <EyeOff className="w-4 h-4" />
              <span className="hidden sm:inline">Client</span>
            </button>
          </div>
        </div>
      </div>

      {/* Program info */}
      <div className="container max-w-4xl mx-auto px-4 sm:px-6 pb-6">
        <div className="flex items-center gap-2 text-amber-500 mb-2">
          <MapPin className="w-4 h-4" />
          <span className="text-sm tracking-wide uppercase">
            {program.city}
          </span>
        </div>

        <h1 className="font-serif text-2xl md:text-3xl text-white mb-4">
          <EditableTitle
            value={displayTitle}
            onSave={(newTitle) => onUpdateTitle?.(newTitle)}
            isEditable={isEditable}
            inputClassName="font-serif text-2xl md:text-3xl text-white"
            placeholder="Titre du programme..."
          />
        </h1>

        {/* Meta info pills */}
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 text-gray-300 text-sm">
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            {program.duration} jours
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 text-gray-300 text-sm">
            <Users className="w-3.5 h-3.5 text-amber-500" />
            {PROFILE_LABELS[program.profile] || program.profile}
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 text-gray-300 text-sm">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            {PACE_LABELS[program.pace] || program.pace}
          </span>
          {program.guests > 1 && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 text-gray-300 text-sm">
              {program.guests} personnes
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
