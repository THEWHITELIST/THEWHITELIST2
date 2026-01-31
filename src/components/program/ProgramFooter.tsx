import { FileDown, Check, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ViewMode } from "./types";

const EXPORT_LANGUAGES = [
  { value: "fr", label: "Francais" },
  { value: "en", label: "English" },
  { value: "es", label: "Espanol" },
  { value: "it", label: "Italiano" },
  { value: "de", label: "Deutsch" },
  { value: "pt", label: "Portugues" },
  { value: "zh", label: "Chinese" },
  { value: "ar", label: "Arabic" },
  { value: "ru", label: "Russian" },
];

interface ProgramFooterProps {
  viewMode: ViewMode;
  isValidated: boolean;
  allSlotsSelected: boolean;
  isValidating: boolean;
  isSaving?: boolean;
  isSaved?: boolean;
  exportLanguage: string;
  onExportLanguageChange: (lang: string) => void;
  onValidate: () => void;
  onExportPdf: () => void;
  onSave?: () => void;
}

export function ProgramFooter({
  viewMode,
  isValidated,
  allSlotsSelected,
  isValidating,
  isSaving = false,
  isSaved = false,
  exportLanguage,
  onExportLanguageChange,
  onValidate,
  onExportPdf,
  onSave,
}: ProgramFooterProps) {
  return (
    <section className="mt-8 space-y-3">
      {/* Top row: Language selector, Export PDF, and Save */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 flex gap-2">
          <Select value={exportLanguage} onValueChange={onExportLanguageChange}>
            <SelectTrigger className="w-[130px] border-amber-500/30 text-amber-500 bg-transparent">
              <SelectValue placeholder="Langue" />
            </SelectTrigger>
            <SelectContent className="bg-[#1a1a24] border-amber-500/30">
              {EXPORT_LANGUAGES.map((lang) => (
                <SelectItem
                  key={lang.value}
                  value={lang.value}
                  className="text-gray-300 focus:bg-amber-500/10 focus:text-amber-500"
                >
                  {lang.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            onClick={onExportPdf}
            variant="outline"
            className="flex-1 py-5 border-amber-500/30 text-amber-500 hover:bg-amber-500/10 hover:border-amber-500/50"
          >
            <FileDown className="w-4 h-4 mr-2" />
            Exporter PDF
          </Button>
        </div>

        {/* Save button - only in concierge view */}
        {viewMode === "concierge" && onSave && (
          <Button
            onClick={onSave}
            disabled={isSaving}
            variant="outline"
            className={`flex-1 py-5 ${
              isSaved
                ? "border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10"
                : "border-primary/30 text-primary hover:bg-primary/10 hover:border-primary/50"
            }`}
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Enregistrement...
              </>
            ) : isSaved ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                Enregistre
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Enregistrer
              </>
            )}
          </Button>
        )}
      </div>

      {/* Bottom row: Validate button */}
      {/* Validate button - only in concierge view */}
      {viewMode === "concierge" && !isValidated && (
        <Button
          onClick={onValidate}
          disabled={!allSlotsSelected || isValidating}
          className={`w-full py-5 ${
            allSlotsSelected
              ? "bg-amber-500 hover:bg-amber-600 text-black"
              : "bg-gray-700 text-gray-400 cursor-not-allowed"
          }`}
        >
          {isValidating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Validation...
            </>
          ) : (
            <>
              <Check className="w-4 h-4 mr-2" />
              Valider le programme
            </>
          )}
        </Button>
      )}

      {/* Already validated message */}
      {viewMode === "concierge" && isValidated && (
        <div className="w-full py-5 px-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center gap-2 text-emerald-500">
          <Check className="w-4 h-4" />
          Programme valide
        </div>
      )}

      {/* Client view footer */}
      {viewMode === "client" && (
        <p className="text-center text-gray-500 text-sm py-4">
          Programme personnalise cree exclusivement pour vous.
        </p>
      )}
    </section>
  );
}
