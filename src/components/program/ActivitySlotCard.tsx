import { useState, useEffect } from "react";
import {
  Clock,
  Check,
  Ban,
  MapPin,
  Phone,
  StickyNote,
  Loader2,
  UserCircle,
  ShoppingBag,
  Landmark,
  CalendarClock,
  RefreshCw,
  Coffee,
  MoreVertical,
  Play,
  Square,
  CheckSquare,
  ChevronUp,
  ChevronDown,
  Repeat,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ActivitySlot, ActivityOption, ViewMode } from "./types";
import { TIME_SLOT_LABELS, ACTIVITY_TYPE_LABELS } from "./types";

// Helper function to adjust time by minutes
function adjustTime(currentTime: string, minutes: number): string {
  const [h, m] = currentTime.split(":").map(Number);
  let totalMinutes = (h || 0) * 60 + (m || 0) + minutes;
  // Clamp between 07:00 and 23:45
  totalMinutes = Math.max(7 * 60, Math.min(23 * 60 + 45, totalMinutes));
  const newH = Math.floor(totalMinutes / 60);
  const newM = totalMinutes % 60;
  return `${newH.toString().padStart(2, "0")}:${newM.toString().padStart(2, "0")}`;
}

interface ActivitySlotCardProps {
  activity: ActivitySlot;
  viewMode: ViewMode;
  isLast: boolean;
  onSelectOption: (activityId: string, optionId: string) => void;
  onSelectMultipleOptions?: (activityId: string, optionIds: string[]) => void;
  onUpdateNotes: (activityId: string, notes: string) => void;
  onUpdateTime: (activityId: string, newTime: string) => void;
  onExcludeVenue: (venueName: string, category: string) => void;
  onRegenerateOption: (activityId: string, optionId: string) => void;
  onSetRest: (activityId: string) => void;
  onSwitchActivityType?: (activityId: string, newCategory: string) => void;
  isSelectingOption: boolean;
  isSavingNotes: boolean;
  isUpdatingTime?: boolean;
  isSwitchingType?: boolean;
}

export function ActivitySlotCard({
  activity,
  viewMode,
  isLast,
  onSelectOption,
  onSelectMultipleOptions,
  onUpdateNotes,
  onUpdateTime,
  onExcludeVenue,
  onRegenerateOption,
  onSetRest,
  onSwitchActivityType,
  isSelectingOption,
  isSavingNotes,
  isUpdatingTime,
  isSwitchingType,
}: ActivitySlotCardProps) {
  const [notesValue, setNotesValue] = useState(activity.conciergeNotes || "");
  const [showNotes, setShowNotes] = useState(!!activity.conciergeNotes);

  // Sync notes value when activity data changes (after save)
  useEffect(() => {
    setNotesValue(activity.conciergeNotes || "");
    setShowNotes(!!activity.conciergeNotes);
  }, [activity.conciergeNotes]);

  const selectedOption = activity.options.find((o) => o.isSelected);
  const selectedOptions = activity.options.filter((o) => o.isSelected);
  const isShoppingActivity = activity.type === "shopping";

  // Client view: show only selected option or rest state
  if (viewMode === "client") {
    // V3: If rest slot, hide completely in client view (no "Temps libre" mention)
    if (activity.isRest) {
      return null;
    }

    // Shopping: show all selected boutiques
    if (isShoppingActivity && selectedOptions.length > 0) {
      return (
        <div className={`p-4 sm:p-5 ${!isLast ? "border-b border-amber-500/5" : ""}`}>
          <div className="flex gap-4">
            {/* Time */}
            <div className="flex-shrink-0 w-16 text-sm text-gray-500">
              {activity.time || TIME_SLOT_LABELS[activity.timeSlot]}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-3">
                <ShoppingBag className="w-4 h-4 text-amber-500" />
                <h4 className="font-medium text-white">Shopping</h4>
                <span className="text-xs text-gray-500">({selectedOptions.length} boutique{selectedOptions.length > 1 ? "s" : ""})</span>
              </div>

              <div className="space-y-3">
                {selectedOptions.map((option) => (
                  <div key={option.id} className="pl-3 border-l-2 border-amber-500/30">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h5 className="font-medium text-white text-sm">{option.venueName}</h5>
                      {option.venueReservationRequired && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-600/20 text-amber-600 text-xs">
                          <CalendarClock className="w-3 h-3" />
                          RDV requis
                        </span>
                      )}
                    </div>
                    {option.venueAddress && (
                      <p className="text-xs text-gray-400 flex items-center gap-1.5 mt-1">
                        <MapPin className="w-3 h-3" />
                        {option.venueAddress}
                      </p>
                    )}
                    {option.venuePhone && (
                      <p className="text-xs text-gray-400 flex items-center gap-1.5 mt-1">
                        <Phone className="w-3 h-3" />
                        {option.venuePhone}
                      </p>
                    )}
                    {option.venueReservationNote && (
                      <p className="text-xs text-amber-600 mt-1">{option.venueReservationNote}</p>
                    )}
                  </div>
                ))}
              </div>

              {activity.conciergeNotes && (
                <div className="mt-3 p-3 rounded-lg bg-amber-500/5 border border-amber-500/10">
                  <p className="text-sm text-amber-500/80 italic">
                    {activity.conciergeNotes}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    if (!selectedOption) return null;

    return (
      <div className={`p-4 sm:p-5 ${!isLast ? "border-b border-amber-500/5" : ""}`}>
        <div className="flex gap-4">
          {/* Time */}
          <div className="flex-shrink-0 w-16 text-sm text-gray-500">
            {activity.time || TIME_SLOT_LABELS[activity.timeSlot]}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-medium text-white">
                {selectedOption.venueName}
              </h4>
              {selectedOption.isEiffelView && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-500 text-xs">
                  <Landmark className="w-3 h-3" />
                  Vue Tour Eiffel
                </span>
              )}
              {selectedOption.venueReservationRequired && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-600/20 text-amber-600 text-xs">
                  <CalendarClock className="w-3 h-3" />
                  RDV requis
                </span>
              )}
            </div>
            {selectedOption.venueDescription && (
              <p className="text-sm text-gray-400 italic mt-1">
                {selectedOption.venueDescription}
              </p>
            )}
            {selectedOption.venueAddress && (
              <p className="text-sm text-gray-400 flex items-center gap-1.5 mt-2">
                <MapPin className="w-3.5 h-3.5" />
                {selectedOption.venueAddress}
              </p>
            )}
            {selectedOption.venueReservationNote && (
              <p className="text-xs text-amber-600 mt-2">
                {selectedOption.venueReservationNote}
              </p>
            )}
            {selectedOption.venueStyle && (
              <p className="text-sm text-gray-500 italic mt-1">
                {selectedOption.venueStyle}
              </p>
            )}
            {activity.conciergeNotes && (
              <div className="mt-3 p-3 rounded-lg bg-amber-500/5 border border-amber-500/10">
                <p className="text-sm text-amber-500/80 italic">
                  {activity.conciergeNotes}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Concierge view: handle rest state
  if (activity.isRest) {
    return (
      <div className={`p-4 sm:p-5 ${!isLast ? "border-b border-amber-500/5" : ""}`}>
        {/* Time slot header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center gap-2 text-gray-400">
            <Clock className="w-4 h-4" />
            {/* Time adjustment controls */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => onUpdateTime(activity.id, adjustTime(activity.time || TIME_SLOT_LABELS[activity.timeSlot], -15))}
                disabled={isUpdatingTime}
                className="w-5 h-5 rounded-full flex items-center justify-center hover:bg-amber-500/20 text-gray-500 hover:text-amber-500 transition-colors disabled:opacity-50"
                title="-15 min"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
              <span className="text-sm font-medium min-w-[45px] text-center">
                {activity.time || TIME_SLOT_LABELS[activity.timeSlot]}
              </span>
              <button
                onClick={() => onUpdateTime(activity.id, adjustTime(activity.time || TIME_SLOT_LABELS[activity.timeSlot], 15))}
                disabled={isUpdatingTime}
                className="w-5 h-5 rounded-full flex items-center justify-center hover:bg-amber-500/20 text-gray-500 hover:text-amber-500 transition-colors disabled:opacity-50"
                title="+15 min"
              >
                <ChevronUp className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-500/70 text-xs">
            Temps libre
          </span>
        </div>

        {/* Rest state display */}
        <div className="flex flex-col items-center justify-center py-8 px-4 rounded-lg bg-white/5 border border-white/10">
          <Coffee className="w-8 h-8 text-amber-500/50 mb-3" />
          <p className="text-gray-400 text-center mb-4">
            Ce creneau est defini comme temps libre
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onSetRest(activity.id)}
            className="border-amber-500/30 text-amber-500 hover:bg-amber-500/10 hover:text-amber-400"
          >
            <Play className="w-3.5 h-3.5 mr-1.5" />
            Reprendre l'activite
          </Button>
        </div>
      </div>
    );
  }

  // Concierge view: show dual options
  // For shopping, show special multi-select interface
  if (isShoppingActivity && activity.options.length > 2) {
    return (
      <ShoppingSlotCard
        activity={activity}
        isLast={isLast}
        onSelectMultipleOptions={onSelectMultipleOptions}
        onExcludeVenue={onExcludeVenue}
        onRegenerateOption={onRegenerateOption}
        onSetRest={onSetRest}
        onUpdateNotes={onUpdateNotes}
        onUpdateTime={onUpdateTime}
        onSwitchActivityType={onSwitchActivityType}
        isSelectingOption={isSelectingOption}
        isSavingNotes={isSavingNotes}
        isUpdatingTime={isUpdatingTime}
        isSwitchingType={isSwitchingType}
        notesValue={notesValue}
        setNotesValue={setNotesValue}
        showNotes={showNotes}
        setShowNotes={setShowNotes}
        selectedOptions={selectedOptions}
      />
    );
  }

  return (
    <div className={`p-4 sm:p-5 ${!isLast ? "border-b border-amber-500/5" : ""}`}>
      {/* Time slot header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center gap-2 text-gray-400">
          <Clock className="w-4 h-4" />
          {/* Time adjustment controls */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => onUpdateTime(activity.id, adjustTime(activity.time || TIME_SLOT_LABELS[activity.timeSlot], -15))}
              disabled={isUpdatingTime}
              className="w-5 h-5 rounded-full flex items-center justify-center hover:bg-amber-500/20 text-gray-500 hover:text-amber-500 transition-colors disabled:opacity-50"
              title="-15 min"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
            <span className="text-sm font-medium min-w-[45px] text-center">
              {activity.time || TIME_SLOT_LABELS[activity.timeSlot]}
            </span>
            <button
              onClick={() => onUpdateTime(activity.id, adjustTime(activity.time || TIME_SLOT_LABELS[activity.timeSlot], 15))}
              disabled={isUpdatingTime}
              className="w-5 h-5 rounded-full flex items-center justify-center hover:bg-amber-500/20 text-gray-500 hover:text-amber-500 transition-colors disabled:opacity-50"
              title="+15 min"
            >
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        <span className="px-2 py-0.5 rounded bg-white/5 text-gray-500 text-xs">
          {ACTIVITY_TYPE_LABELS[activity.type] || activity.type}
        </span>

        {/* Switch Activity Type Dropdown */}
        {onSwitchActivityType && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                disabled={isSwitchingType}
                className="ml-auto px-2 py-1 rounded text-xs text-amber-500 hover:bg-amber-500/10 border border-amber-500/30 hover:border-amber-500/50 transition-colors flex items-center gap-1.5 disabled:opacity-50"
                title="Changer le type d'activite"
              >
                <Repeat className="w-3 h-3" />
                Changer type
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-[#1a1a24] border-white/10">
              <DropdownMenuItem
                onClick={() => onSwitchActivityType(activity.id, "spas")}
                className="text-gray-300 hover:text-white hover:bg-white/10 focus:bg-white/10 focus:text-white cursor-pointer"
              >
                Spa
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onSwitchActivityType(activity.id, "musees")}
                className="text-gray-300 hover:text-white hover:bg-white/10 focus:bg-white/10 focus:text-white cursor-pointer"
              >
                Musee
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onSwitchActivityType(activity.id, "shopping")}
                className="text-gray-300 hover:text-white hover:bg-white/10 focus:bg-white/10 focus:text-white cursor-pointer"
              >
                Shopping
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onSwitchActivityType(activity.id, "activites")}
                className="text-gray-300 hover:text-white hover:bg-white/10 focus:bg-white/10 focus:text-white cursor-pointer"
              >
                Activite
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Dual options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {activity.options.map((option, index) => (
          <OptionCard
            key={option.id}
            option={option}
            activityId={activity.id}
            activityType={activity.type}
            optionNumber={index + 1}
            onSelect={onSelectOption}
            onExclude={onExcludeVenue}
            onRegenerate={onRegenerateOption}
            isSelecting={isSelectingOption}
          />
        ))}
      </div>

      {/* Rest button */}
      <div className="mt-4 flex justify-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onSetRest(activity.id)}
          className="text-gray-500 hover:text-amber-500 hover:bg-amber-500/10"
        >
          <Coffee className="w-3.5 h-3.5 mr-1.5" />
          Definir comme temps libre
        </Button>
      </div>

      {/* Concierge notes section */}
      {selectedOption && (
        <div className="mt-4">
          {!showNotes ? (
            <button
              onClick={() => setShowNotes(true)}
              className="text-sm text-amber-500 hover:text-amber-400 flex items-center gap-1.5"
            >
              <StickyNote className="w-3.5 h-3.5" />
              Ajouter une note concierge
            </button>
          ) : (
            <div className="space-y-2">
              <label className="text-sm text-amber-500 flex items-center gap-1.5">
                <StickyNote className="w-3.5 h-3.5" />
                Notes concierge
              </label>
              <Textarea
                value={notesValue}
                onChange={(e) => setNotesValue(e.target.value)}
                placeholder="Ajouter des notes pour cette activite..."
                className="bg-[#0a0a0f] border-amber-500/20 text-white placeholder:text-gray-500 min-h-[80px] focus:border-amber-500/50"
              />
              <div className="flex justify-end gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setNotesValue(activity.conciergeNotes || "");
                    setShowNotes(false);
                  }}
                  className="text-gray-400 hover:text-white"
                >
                  Annuler
                </Button>
                <Button
                  size="sm"
                  onClick={() => onUpdateNotes(activity.id, notesValue)}
                  disabled={isSavingNotes}
                  className="bg-amber-500 hover:bg-amber-600 text-black"
                >
                  {isSavingNotes ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Enregistrer"
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface OptionCardProps {
  option: ActivityOption;
  activityId: string;
  activityType: string;
  optionNumber: number;
  onSelect: (activityId: string, optionId: string) => void;
  onExclude: (venueName: string, category: string) => void;
  onRegenerate: (activityId: string, optionId: string) => void;
  isSelecting: boolean;
}

function OptionCard({
  option,
  activityId,
  activityType,
  optionNumber,
  onSelect,
  onExclude,
  onRegenerate,
  isSelecting,
}: OptionCardProps) {
  // Local state for internal contact (concierge only, not persisted to backend)
  const [internalContact, setInternalContact] = useState("");
  const [showContactField, setShowContactField] = useState(false);

  // Check if this is a shopping-related activity
  const isShoppingActivity = activityType === "shopping" || option.category === "shoppers";

  return (
    <div
      className={`relative p-4 rounded-lg border transition-all cursor-pointer ${
        option.isSelected
          ? "bg-amber-500/10 border-amber-500/50"
          : "bg-white/5 border-white/10 hover:border-white/20 opacity-70 hover:opacity-100"
      }`}
      onClick={() => !isSelecting && onSelect(activityId, option.id)}
    >
      {/* Selection indicator */}
      <div className="absolute top-3 right-3">
        {option.isSelected ? (
          <div className="w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center">
            <Check className="w-3 h-3 text-black" />
          </div>
        ) : (
          <div className="w-5 h-5 rounded-full border-2 border-gray-500" />
        )}
      </div>

      {/* Option number */}
      <span className="text-xs text-gray-500 mb-2 block">
        Option {optionNumber}
      </span>

      {/* Venue info */}
      <div className="flex items-center gap-2 flex-wrap mb-1 pr-6">
        <h5 className="font-medium text-white">
          {isShoppingActivity && <ShoppingBag className="w-3.5 h-3.5 inline mr-1.5 text-amber-500" />}
          {option.venueName}
        </h5>
        {option.isEiffelView && (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-500 text-xs">
            <Landmark className="w-3 h-3" />
            Vue Tour Eiffel
          </span>
        )}
        {option.venueReservationRequired && (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-600/20 text-amber-600 text-xs">
            <CalendarClock className="w-3 h-3" />
            RDV requis
          </span>
        )}
      </div>

      {option.venueDescription && (
        <p className="text-xs text-gray-400 italic mb-2">{option.venueDescription}</p>
      )}

      {option.venueAddress && (
        <p className="text-xs text-gray-400 flex items-center gap-1 mb-1">
          <MapPin className="w-3 h-3" />
          {option.venueAddress}
        </p>
      )}

      {option.venuePhone && (
        <p className="text-xs text-gray-400 flex items-center gap-1 mb-1">
          <Phone className="w-3 h-3" />
          {option.venuePhone}
        </p>
      )}

      {option.venueStyle && (
        <p className="text-xs text-gray-500 italic mt-2">{option.venueStyle}</p>
      )}

      {option.venueType && (
        <span className="inline-block mt-2 px-2 py-0.5 rounded bg-white/5 text-gray-500 text-xs">
          {option.venueType}
        </span>
      )}

      {option.venueReservationNote && (
        <p className="text-xs text-amber-600 mt-2">{option.venueReservationNote}</p>
      )}

      {/* Internal Contact for Shopping (Concierge only) */}
      {isShoppingActivity && option.isSelected && (
        <div className="mt-3 pt-3 border-t border-amber-500/10" onClick={(e) => e.stopPropagation()}>
          {!showContactField && !internalContact ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowContactField(true);
              }}
              className="text-xs text-amber-500/70 hover:text-amber-500 flex items-center gap-1"
            >
              <UserCircle className="w-3 h-3" />
              + Contact interne
            </button>
          ) : (
            <div className="space-y-1.5">
              <label className="text-xs text-amber-500/70 flex items-center gap-1">
                <UserCircle className="w-3 h-3" />
                Contact interne (concierge)
              </label>
              <Input
                value={internalContact}
                onChange={(e) => setInternalContact(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                placeholder="Nom / Tel du contact..."
                className="h-7 text-xs bg-[#0a0a0f] border-amber-500/20 text-amber-500 placeholder:text-gray-600 focus:border-amber-500/40"
              />
              <p className="text-[10px] text-gray-500 italic">
                Non visible par le client
              </p>
            </div>
          )}
        </div>
      )}

      {/* Action buttons at bottom right */}
      <div className="absolute bottom-3 right-3 flex items-center gap-1">
        {/* Main action: Changer (Regenerate) */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRegenerate(activityId, option.id);
                }}
                className="p-1.5 rounded hover:bg-amber-500/10 text-gray-500 hover:text-amber-500 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent
              side="top"
              className="bg-[#1a1a24] border-amber-500/20 text-gray-300"
            >
              <p className="text-xs">Remplacer par une autre option</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Secondary actions dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              onClick={(e) => e.stopPropagation()}
              className="p-1.5 rounded hover:bg-white/10 text-gray-500 hover:text-gray-400 transition-colors"
            >
              <MoreVertical className="w-3.5 h-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="bg-[#1a1a24] border-white/10"
          >
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onExclude(option.venueName, option.category);
              }}
              className="text-red-400 hover:text-red-300 hover:bg-red-500/10 focus:bg-red-500/10 focus:text-red-300 cursor-pointer"
            >
              <Ban className="w-3.5 h-3.5 mr-2" />
              Ne plus jamais proposer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

// Shopping Slot Card with multi-select checkboxes
interface ShoppingSlotCardProps {
  activity: ActivitySlot;
  isLast: boolean;
  onSelectMultipleOptions?: (activityId: string, optionIds: string[]) => void;
  onExcludeVenue: (venueName: string, category: string) => void;
  onRegenerateOption: (activityId: string, optionId: string) => void;
  onSetRest: (activityId: string) => void;
  onUpdateNotes: (activityId: string, notes: string) => void;
  onUpdateTime: (activityId: string, newTime: string) => void;
  onSwitchActivityType?: (activityId: string, newCategory: string) => void;
  isSelectingOption: boolean;
  isSavingNotes: boolean;
  isUpdatingTime?: boolean;
  isSwitchingType?: boolean;
  notesValue: string;
  setNotesValue: (value: string) => void;
  showNotes: boolean;
  setShowNotes: (value: boolean) => void;
  selectedOptions: ActivityOption[];
}

function ShoppingSlotCard({
  activity,
  isLast,
  onSelectMultipleOptions,
  onExcludeVenue,
  onRegenerateOption,
  onSetRest,
  onUpdateNotes,
  onUpdateTime,
  onSwitchActivityType,
  isSelectingOption,
  isSavingNotes,
  isUpdatingTime,
  isSwitchingType,
  notesValue,
  setNotesValue,
  showNotes,
  setShowNotes,
  selectedOptions,
}: ShoppingSlotCardProps) {
  const [localSelectedIds, setLocalSelectedIds] = useState<string[]>(
    selectedOptions.map((o) => o.id)
  );

  // Sync local state when activity data changes
  useEffect(() => {
    setLocalSelectedIds(activity.options.filter((o) => o.isSelected).map((o) => o.id));
  }, [activity.options]);

  const handleToggleOption = (optionId: string) => {
    setLocalSelectedIds((prev) => {
      if (prev.includes(optionId)) {
        // Cannot deselect if it's the last one
        if (prev.length === 1) return prev;
        return prev.filter((id) => id !== optionId);
      } else {
        // Cannot select more than 4
        if (prev.length >= 4) return prev;
        return [...prev, optionId];
      }
    });
  };

  const handleConfirmSelection = () => {
    if (onSelectMultipleOptions && localSelectedIds.length >= 1) {
      onSelectMultipleOptions(activity.id, localSelectedIds);
    }
  };

  const hasChanges =
    localSelectedIds.length !== selectedOptions.length ||
    !localSelectedIds.every((id) => selectedOptions.some((o) => o.id === id));

  return (
    <div className={`p-4 sm:p-5 ${!isLast ? "border-b border-amber-500/5" : ""}`}>
      {/* Time slot header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center gap-2 text-gray-400">
          <Clock className="w-4 h-4" />
          {/* Time adjustment controls */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => onUpdateTime(activity.id, adjustTime(activity.time || TIME_SLOT_LABELS[activity.timeSlot], -15))}
              disabled={isUpdatingTime}
              className="w-5 h-5 rounded-full flex items-center justify-center hover:bg-amber-500/20 text-gray-500 hover:text-amber-500 transition-colors disabled:opacity-50"
              title="-15 min"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
            <span className="text-sm font-medium min-w-[45px] text-center">
              {activity.time || TIME_SLOT_LABELS[activity.timeSlot]}
            </span>
            <button
              onClick={() => onUpdateTime(activity.id, adjustTime(activity.time || TIME_SLOT_LABELS[activity.timeSlot], 15))}
              disabled={isUpdatingTime}
              className="w-5 h-5 rounded-full flex items-center justify-center hover:bg-amber-500/20 text-gray-500 hover:text-amber-500 transition-colors disabled:opacity-50"
              title="+15 min"
            >
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 text-xs flex items-center gap-1">
          <ShoppingBag className="w-3 h-3" />
          Shopping
        </span>

        {/* Switch Activity Type Dropdown */}
        {onSwitchActivityType && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                disabled={isSwitchingType}
                className="ml-auto px-2 py-1 rounded text-xs text-amber-500 hover:bg-amber-500/10 border border-amber-500/30 hover:border-amber-500/50 transition-colors flex items-center gap-1.5 disabled:opacity-50"
                title="Changer le type d'activite"
              >
                <Repeat className="w-3 h-3" />
                Changer type
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-[#1a1a24] border-white/10">
              <DropdownMenuItem
                onClick={() => onSwitchActivityType(activity.id, "spas")}
                className="text-gray-300 hover:text-white hover:bg-white/10 focus:bg-white/10 focus:text-white cursor-pointer"
              >
                Spa
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onSwitchActivityType(activity.id, "musees")}
                className="text-gray-300 hover:text-white hover:bg-white/10 focus:bg-white/10 focus:text-white cursor-pointer"
              >
                Musee
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onSwitchActivityType(activity.id, "shopping")}
                className="text-gray-300 hover:text-white hover:bg-white/10 focus:bg-white/10 focus:text-white cursor-pointer"
              >
                Shopping
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onSwitchActivityType(activity.id, "activites")}
                className="text-gray-300 hover:text-white hover:bg-white/10 focus:bg-white/10 focus:text-white cursor-pointer"
              >
                Activite
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Header text */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-white mb-1">
          Selectionnez vos boutiques (1 a 4)
        </h4>
        <p className="text-xs text-gray-500">
          {localSelectedIds.length} boutique{localSelectedIds.length > 1 ? "s" : ""} selectionnee{localSelectedIds.length > 1 ? "s" : ""}
        </p>
      </div>

      {/* Boutique grid with checkboxes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {activity.options.map((option) => {
          const isSelected = localSelectedIds.includes(option.id);
          return (
            <div
              key={option.id}
              className={`relative p-4 rounded-lg border transition-all cursor-pointer ${
                isSelected
                  ? "bg-amber-500/10 border-amber-500/50"
                  : "bg-white/5 border-white/10 hover:border-white/20 opacity-70 hover:opacity-100"
              }`}
              onClick={() => !isSelectingOption && handleToggleOption(option.id)}
            >
              {/* Checkbox indicator */}
              <div className="absolute top-3 right-3">
                {isSelected ? (
                  <CheckSquare className="w-5 h-5 text-amber-500" />
                ) : (
                  <Square className="w-5 h-5 text-gray-500" />
                )}
              </div>

              {/* Venue info - just the name for selection */}
              <div className="flex items-center gap-2 flex-wrap mb-1 pr-8">
                <ShoppingBag className="w-3.5 h-3.5 text-amber-500" />
                <h5 className="font-medium text-white">{option.venueName}</h5>
                {option.venueReservationRequired && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-600/20 text-amber-600 text-xs">
                    <CalendarClock className="w-3 h-3" />
                    RDV
                  </span>
                )}
              </div>

              {/* Show details only when selected */}
              {isSelected && (
                <div className="mt-2 pt-2 border-t border-amber-500/10">
                  {option.venueAddress && (
                    <p className="text-xs text-gray-400 flex items-center gap-1 mb-1">
                      <MapPin className="w-3 h-3" />
                      {option.venueAddress}
                    </p>
                  )}
                  {option.venuePhone && (
                    <p className="text-xs text-gray-400 flex items-center gap-1 mb-1">
                      <Phone className="w-3 h-3" />
                      {option.venuePhone}
                    </p>
                  )}
                  {option.venueReservationNote && (
                    <p className="text-xs text-amber-600 mt-1">{option.venueReservationNote}</p>
                  )}
                </div>
              )}

              {/* Action buttons */}
              <div className="absolute bottom-3 right-3 flex items-center gap-1">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRegenerateOption(activity.id, option.id);
                        }}
                        className="p-1.5 rounded hover:bg-amber-500/10 text-gray-500 hover:text-amber-500 transition-colors"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent
                      side="top"
                      className="bg-[#1a1a24] border-amber-500/20 text-gray-300"
                    >
                      <p className="text-xs">Remplacer par une autre boutique</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      onClick={(e) => e.stopPropagation()}
                      className="p-1.5 rounded hover:bg-white/10 text-gray-500 hover:text-gray-400 transition-colors"
                    >
                      <MoreVertical className="w-3.5 h-3.5" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="bg-[#1a1a24] border-white/10"
                  >
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        onExcludeVenue(option.venueName, option.category);
                      }}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10 focus:bg-red-500/10 focus:text-red-300 cursor-pointer"
                    >
                      <Ban className="w-3.5 h-3.5 mr-2" />
                      Ne plus jamais proposer
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          );
        })}
      </div>

      {/* Confirm selection button */}
      {hasChanges && (
        <div className="mt-4 flex justify-center">
          <Button
            size="sm"
            onClick={handleConfirmSelection}
            disabled={isSelectingOption || localSelectedIds.length === 0}
            className="bg-amber-500 hover:bg-amber-600 text-black"
          >
            {isSelectingOption ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Check className="w-4 h-4 mr-2" />
            )}
            Confirmer la selection
          </Button>
        </div>
      )}

      {/* Rest button */}
      <div className="mt-4 flex justify-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onSetRest(activity.id)}
          className="text-gray-500 hover:text-amber-500 hover:bg-amber-500/10"
        >
          <Coffee className="w-3.5 h-3.5 mr-1.5" />
          Definir comme temps libre
        </Button>
      </div>

      {/* Concierge notes section */}
      {selectedOptions.length > 0 && (
        <div className="mt-4">
          {!showNotes ? (
            <button
              onClick={() => setShowNotes(true)}
              className="text-sm text-amber-500 hover:text-amber-400 flex items-center gap-1.5"
            >
              <StickyNote className="w-3.5 h-3.5" />
              Ajouter une note concierge
            </button>
          ) : (
            <div className="space-y-2">
              <label className="text-sm text-amber-500 flex items-center gap-1.5">
                <StickyNote className="w-3.5 h-3.5" />
                Notes concierge
              </label>
              <Textarea
                value={notesValue}
                onChange={(e) => setNotesValue(e.target.value)}
                placeholder="Ajouter des notes pour cette activite..."
                className="bg-[#0a0a0f] border-amber-500/20 text-white placeholder:text-gray-500 min-h-[80px] focus:border-amber-500/50"
              />
              <div className="flex justify-end gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setNotesValue(activity.conciergeNotes || "");
                    setShowNotes(false);
                  }}
                  className="text-gray-400 hover:text-white"
                >
                  Annuler
                </Button>
                <Button
                  size="sm"
                  onClick={() => onUpdateNotes(activity.id, notesValue)}
                  disabled={isSavingNotes}
                  className="bg-amber-500 hover:bg-amber-600 text-black"
                >
                  {isSavingNotes ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Enregistrer"
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
