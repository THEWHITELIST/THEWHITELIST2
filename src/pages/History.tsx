import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db, type Itinerary } from "@/lib/instantdb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Download,
  FileText,
  Loader2,
  MapPin,
  Pencil,
  Sparkles,
  Trash2,
  User,
} from "lucide-react";

// Editable title component for history items
function EditableHistoryTitle({
  value,
  onSave,
}: {
  value: string;
  onSave: (newValue: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = () => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== value) {
      onSave(trimmed);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      setEditValue(value);
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <Input
        ref={inputRef}
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        className="font-serif text-lg bg-transparent border-b border-primary h-auto py-0 px-1 rounded-none focus-visible:ring-0"
      />
    );
  }

  return (
    <button
      onClick={() => setIsEditing(true)}
      className="group inline-flex items-center gap-2 text-left"
    >
      <span className="font-serif text-lg text-foreground truncate group-hover:text-primary transition-colors">
        {value}
      </span>
      <Pencil className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
    </button>
  );
}

export default function History() {
  const navigate = useNavigate();
  const { user } = db.useAuth();

  // Query itineraries for the current user
  const { data, isLoading } = db.useQuery(
    user
      ? {
          itineraries: {
            $: {
              where: {
                odukiogaUserId: user.id,
              },
            },
          },
        }
      : null
  );

  const itineraries = (data?.itineraries || []) as Itinerary[];

  // Sort by most recent first
  const sortedItineraries = [...itineraries].sort(
    (a, b) => b.createdAt - a.createdAt
  );

  const handleUpdateTitle = async (itineraryId: string, newTitle: string) => {
    try {
      await db.transact(
        db.tx.itineraries[itineraryId].update({
          title: newTitle,
          updatedAt: Date.now(),
        })
      );
    } catch (err) {
      console.error("Error updating title:", err);
    }
  };

  const handleDelete = async (itineraryId: string) => {
    if (!confirm("Supprimer ce sejour de l'historique?")) return;

    try {
      await db.transact(db.tx.itineraries[itineraryId].delete());
    } catch (err) {
      console.error("Error deleting itinerary:", err);
    }
  };

  const handleDownloadPdf = async (itinerary: Itinerary) => {
    const baseUrl = import.meta.env.VITE_BACKEND_URL || "";
    try {
      const response = await fetch(
        `${baseUrl}/api/programs/${itinerary.programId}/pdf?lang=fr`,
        {
          method: "GET",
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to generate PDF");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `programme-${itinerary.city.toLowerCase()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading PDF:", error);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getIntensityLabel = (intensity: string) => {
    switch (intensity) {
      case "DETENDU":
        return "Detendu";
      case "MODERE":
        return "Modere";
      case "INTENSE":
        return "Intense";
      default:
        return intensity;
    }
  };

  const getIntensityColor = (intensity: string) => {
    switch (intensity) {
      case "DETENDU":
        return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
      case "MODERE":
        return "text-amber-400 bg-amber-500/10 border-amber-500/20";
      case "INTENSE":
        return "text-rose-400 bg-rose-500/10 border-rose-500/20";
      default:
        return "text-gray-400 bg-gray-500/10 border-gray-500/20";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/95 backdrop-blur-md">
        <div className="container max-w-4xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/")}
                className="hover:bg-primary/10"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="font-serif text-xl text-foreground">
                  Historique des Sejours
                </h1>
                <p className="text-sm text-muted-foreground">
                  {sortedItineraries.length} sejour
                  {sortedItineraries.length !== 1 ? "s" : ""} enregistre
                  {sortedItineraries.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Chargement de l'historique...</p>
          </div>
        ) : sortedItineraries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-6">
              <FileText className="w-8 h-8 text-primary" />
            </div>
            <h2 className="font-serif text-xl text-foreground mb-2">
              Aucun sejour enregistre
            </h2>
            <p className="text-muted-foreground text-center max-w-md mb-6">
              Les sejours sont enregistres lorsque vous cliquez sur "Enregistrer"
              ou "Generer le PDF" dans le planning.
            </p>
            <Button
              onClick={() => navigate("/")}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Creer un nouveau sejour
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedItineraries.map((itinerary) => (
              <div
                key={itinerary.id}
                className="group p-5 rounded-xl border border-border/50 bg-card/50 hover:bg-card/80 hover:border-primary/30 transition-all duration-300"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  {/* Left side - Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <EditableHistoryTitle
                        value={itinerary.title || `Sejour a ${itinerary.city}`}
                        onSave={(newTitle) => handleUpdateTitle(itinerary.id, newTitle)}
                      />
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full border ${getIntensityColor(
                          itinerary.intensity
                        )}`}
                      >
                        {getIntensityLabel(itinerary.intensity)}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5" />
                        {itinerary.city}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatDate(itinerary.startDate)} -{" "}
                        {formatDate(itinerary.endDate)}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        {itinerary.totalDays} jour
                        {itinerary.totalDays !== 1 ? "s" : ""}
                      </span>
                      {itinerary.clientName && (
                        <span className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5" />
                          {itinerary.clientName}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-muted-foreground/70 mt-2">
                      Enregistre le{" "}
                      {new Date(itinerary.createdAt).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>

                  {/* Right side - Actions */}
                  <div className="flex items-center gap-2 sm:flex-shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/program/${itinerary.programId}`)}
                      className="hover:bg-primary/10 hover:border-primary/30"
                    >
                      <FileText className="w-4 h-4 mr-1.5" />
                      Ouvrir
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadPdf(itinerary)}
                      className="hover:bg-primary/10 hover:border-primary/30"
                    >
                      <Download className="w-4 h-4 mr-1.5" />
                      PDF
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(itinerary.id)}
                      className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
