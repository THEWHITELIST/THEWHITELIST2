import { ChevronDown } from "lucide-react";
import type { ProgramDay, ViewMode } from "./types";
import { ActivitySlotCard } from "./ActivitySlotCard";
import { EditableTitle } from "./EditableTitle";

interface DayCardProps {
  day: ProgramDay;
  startDate?: string; // ISO date string (YYYY-MM-DD) for the trip start
  isExpanded: boolean;
  onToggle: () => void;
  viewMode: ViewMode;
  animationDelay: number;
  onSelectOption: (activityId: string, optionId: string) => void;
  onSelectMultipleOptions?: (activityId: string, optionIds: string[]) => void;
  onUpdateNotes: (activityId: string, notes: string) => void;
  onUpdateTime: (activityId: string, newTime: string) => void;
  onExcludeVenue: (venueName: string, category: string) => void;
  onRegenerateOption: (activityId: string, optionId: string) => void;
  onSetRest: (activityId: string) => void;
  onUpdateDayTitle?: (dayId: string, title: string) => void;
  onSwitchActivityType?: (activityId: string, newCategory: string) => void;
  isSelectingOption: boolean;
  isSavingNotes: boolean;
  isUpdatingTime?: boolean;
  isSwitchingType?: boolean;
}

// Format the actual date for a given day
function formatDayDate(day: ProgramDay, startDate?: string): string {
  // Prefer actualDate if available
  const dateToUse = day.actualDate || (startDate ? calculateDate(startDate, day.dayNumber) : null);

  if (!dateToUse) return `Jour ${day.dayNumber}`;

  try {
    const date = new Date(dateToUse);
    const dayName = date.toLocaleDateString("fr-FR", { weekday: "long" });
    const dayNum = date.getDate().toString().padStart(2, "0");
    const month = date.toLocaleDateString("fr-FR", { month: "long" });
    const year = date.getFullYear();

    // Capitalize first letter
    const capitalizedDay = dayName.charAt(0).toUpperCase() + dayName.slice(1);

    return `${capitalizedDay} ${dayNum} ${month} ${year}`;
  } catch {
    return `Jour ${day.dayNumber}`;
  }
}

// Calculate the date based on startDate and day number
function calculateDate(startDate: string, dayNumber: number): string {
  const start = new Date(startDate);
  start.setDate(start.getDate() + dayNumber - 1);
  return start.toISOString().split("T")[0];
}

export function DayCard({
  day,
  startDate,
  isExpanded,
  onToggle,
  viewMode,
  animationDelay,
  onSelectOption,
  onSelectMultipleOptions,
  onUpdateNotes,
  onUpdateTime,
  onExcludeVenue,
  onRegenerateOption,
  onSetRest,
  onUpdateDayTitle,
  onSwitchActivityType,
  isSelectingOption,
  isSavingNotes,
  isUpdatingTime,
  isSwitchingType,
}: DayCardProps) {
  // Count unselected slots in this day
  const unselectedInDay = day.activities.filter(
    (a) => !a.options.some((o) => o.isSelected)
  ).length;

  // Get the formatted date label
  const dateLabel = formatDayDate(day, startDate);

  // Determine if title is editable and what title to display
  // V7 FIX: Both views should use themeClient since that's what goes in the PDF
  // The concierge can edit it, the client sees it read-only
  const isTitleEditable = viewMode === "concierge" && !!onUpdateDayTitle;
  const displayTitle = day.themeClient || dateLabel;

  const handleTitleSave = (newTitle: string) => {
    if (onUpdateDayTitle) {
      onUpdateDayTitle(day.id, newTitle);
    }
  };

  const handleTitleClick = (e: React.MouseEvent) => {
    if (isTitleEditable) {
      e.stopPropagation();
    }
  };

  return (
    <div
      className="rounded-xl border border-amber-500/10 overflow-hidden bg-[#12121a]"
      style={{
        animationDelay: `${animationDelay}ms`,
        animation: "fadeIn 0.3s ease-out forwards",
      }}
    >
      {/* Day header */}
      <button
        onClick={onToggle}
        className="w-full p-4 sm:p-5 flex items-center justify-between hover:bg-white/5 transition-colors text-left"
      >
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs tracking-widest uppercase text-amber-500 font-medium">
              {dateLabel}
            </span>
            {viewMode === "concierge" && unselectedInDay > 0 && (
              <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-500 text-xs">
                {unselectedInDay} a selectionner
              </span>
            )}
          </div>
          <h3 className="font-serif text-lg sm:text-xl text-white" onClick={handleTitleClick}>
            <EditableTitle
              value={displayTitle}
              onSave={handleTitleSave}
              isEditable={isTitleEditable}
              inputClassName="font-serif text-lg sm:text-xl text-white"
              placeholder="Theme du jour..."
            />
          </h3>
        </div>
        <ChevronDown
          className={`w-5 h-5 text-gray-400 transition-transform duration-300 flex-shrink-0 ml-4 ${
            isExpanded ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Activities */}
      {isExpanded && (
        <div className="border-t border-amber-500/10">
          {day.activities.map((activity, index) => (
            <ActivitySlotCard
              key={activity.id}
              activity={activity}
              viewMode={viewMode}
              isLast={index === day.activities.length - 1}
              onSelectOption={onSelectOption}
              onSelectMultipleOptions={onSelectMultipleOptions}
              onUpdateNotes={onUpdateNotes}
              onUpdateTime={onUpdateTime}
              onExcludeVenue={onExcludeVenue}
              onRegenerateOption={onRegenerateOption}
              onSetRest={onSetRest}
              onSwitchActivityType={onSwitchActivityType}
              isSelectingOption={isSelectingOption}
              isSavingNotes={isSavingNotes}
              isUpdatingTime={isUpdatingTime}
              isSwitchingType={isSwitchingType}
            />
          ))}
        </div>
      )}
    </div>
  );
}
