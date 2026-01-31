import { useState, useMemo, useCallback, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { id as instantId } from "@instantdb/react";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { db, type UserProfile } from "@/lib/instantdb";
import type { Program } from "@/components/program/types";
import { ProgramHeader } from "@/components/program/ProgramHeader";
import { ProgramIntro } from "@/components/program/ProgramIntro";
import { DayCard } from "@/components/program/DayCard";
import { ProgramFooter } from "@/components/program/ProgramFooter";
import { TransferOptions } from "@/components/program/TransferOptions";
import { ProgramNotes } from "@/components/program/ProgramNotes";

export default function ProgramPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<"concierge" | "client">("concierge");
  const [expandedDays, setExpandedDays] = useState<number[]>([1]);
  const [exportLanguage, setExportLanguage] = useState<string>("fr");
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // Get current user for saving
  const { user } = db.useAuth();

  // Query user profile to get hotel name
  const { data: profileData } = db.useQuery(
    user
      ? {
          userProfiles: {
            $: {
              where: {
                odukiogaUserId: user.id,
              },
            },
          },
        }
      : null
  );

  const userProfile = profileData?.userProfiles?.[0] as UserProfile | undefined;

  // Check if this program is already saved
  const { data: savedData } = db.useQuery(
    user && id
      ? {
          itineraries: {
            $: {
              where: {
                odukiogaUserId: user.id,
                programId: id,
              },
            },
          },
        }
      : null
  );

  const existingItinerary = savedData?.itineraries?.[0];

  // Query note attachments to get PDF URLs for merging
  const { data: attachmentsData } = db.useQuery(
    id
      ? {
          noteAttachments: {
            $: {
              where: {
                programId: id,
              },
            },
          },
        }
      : null
  );

  // Get PDF attachment URLs
  const pdfAttachmentUrls = useMemo(() => {
    const attachments = attachmentsData?.noteAttachments || [];
    return attachments
      .filter((a) => a.fileType === "application/pdf")
      .map((a) => a.fileUrl);
  }, [attachmentsData]);

  // Fetch program data
  const {
    data: program,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["program", id],
    queryFn: () => api.get<Program>(`/api/programs/${id}`),
    enabled: !!id,
  });

  // Select activity option mutation
  const selectOptionMutation = useMutation({
    mutationFn: ({
      activityId,
      optionId,
    }: {
      activityId: string;
      optionId: string;
    }) =>
      api.put(`/api/programs/${id}/activities/${activityId}/select`, {
        optionId,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["program", id] });
    },
  });

  // Update concierge notes mutation
  const updateNotesMutation = useMutation({
    mutationFn: ({
      activityId,
      notes,
    }: {
      activityId: string;
      notes: string;
    }) =>
      api.put(`/api/programs/${id}/activities/${activityId}/notes`, { notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["program", id] });
    },
  });

  // Validate program mutation
  const validateMutation = useMutation({
    mutationFn: () => api.put(`/api/programs/${id}/validate`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["program", id] });
    },
  });

  // Exclude venue mutation
  const excludeVenueMutation = useMutation({
    mutationFn: ({
      venueName,
      category,
    }: {
      venueName: string;
      category: string;
    }) => api.post(`/api/programs/${id}/exclude`, { venueName, category }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["program", id] });
    },
  });

  // Regenerate option mutation
  const regenerateOptionMutation = useMutation({
    mutationFn: ({
      activityId,
      optionId,
    }: {
      activityId: string;
      optionId: string;
    }) =>
      api.put(`/api/programs/${id}/activities/${activityId}/regenerate`, {
        optionId,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["program", id] });
    },
  });

  // Set rest mutation
  const setRestMutation = useMutation({
    mutationFn: ({ activityId }: { activityId: string }) =>
      api.put(`/api/programs/${id}/activities/${activityId}/rest`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["program", id] });
    },
  });

  // Select multiple options mutation (for shopping)
  const selectMultipleOptionsMutation = useMutation({
    mutationFn: ({
      activityId,
      optionIds,
    }: {
      activityId: string;
      optionIds: string[];
    }) =>
      api.put(`/api/programs/${id}/activities/${activityId}/select-multiple`, {
        optionIds,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["program", id] });
    },
  });

  // Update activity time mutation
  const updateTimeMutation = useMutation({
    mutationFn: ({
      activityId,
      newTime,
    }: {
      activityId: string;
      newTime: string;
    }) =>
      api.put(`/api/programs/${id}/activities/${activityId}/time`, {
        time: newTime,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["program", id] });
    },
  });

  // Update program title mutation
  const updateProgramTitleMutation = useMutation({
    mutationFn: ({ title }: { title: string }) =>
      api.put(`/api/programs/${id}/title`, { title }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["program", id] });
    },
  });

  // Update day title mutation
  const updateDayTitleMutation = useMutation({
    mutationFn: ({ dayId, title }: { dayId: string; title: string }) =>
      api.put(`/api/programs/${id}/days/${dayId}/title`, { title }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["program", id] });
    },
  });

  // Switch activity type mutation
  const switchActivityTypeMutation = useMutation({
    mutationFn: ({
      activityId,
      newCategory,
    }: {
      activityId: string;
      newCategory: string;
    }) =>
      api.put(`/api/programs/${id}/activities/${activityId}/switch-type`, {
        newCategory,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["program", id] });
    },
  });

  // Save to InstantDB function
  const saveToInstantDB = useCallback(async (markPdfExported = false) => {
    if (!user || !program || !id) return;

    setIsSaving(true);
    try {
      const now = Date.now();
      // Map pace to intensity for display
      const paceToIntensity: Record<string, string> = {
        relaxed: "DETENDU",
        balanced: "MODERE",
        intense: "INTENSE",
      };

      const itineraryData = {
        odukiogaUserId: user.id,
        programId: id,
        title: program.title || `Sejour a ${program.city}`,
        city: program.city,
        startDate: program.startDate || "",
        endDate: program.endDate || "",
        intensity: paceToIntensity[program.pace] || "MODERE",
        totalDays: program.days.length,
        status: program.status,
        programData: JSON.stringify(program),
        updatedAt: now,
        ...(markPdfExported ? { pdfExportedAt: now } : {}),
      };

      if (existingItinerary) {
        // Update existing
        await db.transact(
          db.tx.itineraries[existingItinerary.id].update(itineraryData)
        );
      } else {
        // Create new
        await db.transact(
          db.tx.itineraries[instantId()].update({
            ...itineraryData,
            createdAt: now,
          })
        );
      }

      setIsSaved(true);
      // Reset saved indicator after 3 seconds
      setTimeout(() => setIsSaved(false), 3000);
    } catch (err) {
      console.error("Error saving to InstantDB:", err);
    } finally {
      setIsSaving(false);
    }
  }, [user, program, id, existingItinerary]);

  // Check if all slots have selections
  const allSlotsSelected = useMemo(() => {
    if (!program) return false;
    return program.days.every((day) =>
      day.activities.every((activity) =>
        activity.options.some((opt) => opt.isSelected)
      )
    );
  }, [program]);

  // Count unselected slots
  const unselectedCount = useMemo(() => {
    if (!program) return 0;
    return program.days.reduce(
      (acc, day) =>
        acc +
        day.activities.filter((a) => !a.options.some((o) => o.isSelected))
          .length,
      0
    );
  }, [program]);

  const toggleDay = (dayNumber: number) => {
    setExpandedDays((prev) =>
      prev.includes(dayNumber)
        ? prev.filter((d) => d !== dayNumber)
        : [...prev, dayNumber]
    );
  };

  const handleSelectOption = (activityId: string, optionId: string) => {
    selectOptionMutation.mutate({ activityId, optionId });
  };

  const handleUpdateNotes = (activityId: string, notes: string) => {
    updateNotesMutation.mutate({ activityId, notes });
  };

  const handleValidate = () => {
    validateMutation.mutate();
  };

  const handleExcludeVenue = (venueName: string, category: string) => {
    excludeVenueMutation.mutate({ venueName, category });
  };

  const handleRegenerateOption = (activityId: string, optionId: string) => {
    regenerateOptionMutation.mutate({ activityId, optionId });
  };

  const handleSetRest = (activityId: string) => {
    setRestMutation.mutate({ activityId });
  };

  const handleSelectMultipleOptions = (activityId: string, optionIds: string[]) => {
    selectMultipleOptionsMutation.mutate({ activityId, optionIds });
  };

  const handleUpdateTime = (activityId: string, newTime: string) => {
    updateTimeMutation.mutate({ activityId, newTime });
  };

  const handleUpdateProgramTitle = async (title: string) => {
    // Update in backend
    updateProgramTitleMutation.mutate({ title });

    // Also update in InstantDB if itinerary exists
    if (existingItinerary) {
      try {
        await db.transact(
          db.tx.itineraries[existingItinerary.id].update({
            title,
            updatedAt: Date.now(),
          })
        );
      } catch (err) {
        console.error("Error updating title in InstantDB:", err);
      }
    }
  };

  const handleUpdateDayTitle = (dayId: string, title: string) => {
    updateDayTitleMutation.mutate({ dayId, title });
  };

  const handleSwitchActivityType = (activityId: string, newCategory: string) => {
    switchActivityTypeMutation.mutate({ activityId, newCategory });
  };

  const handleSave = () => {
    saveToInstantDB(false);
  };

  const handleExportPdf = async () => {
    // Save to InstantDB when exporting PDF (with pdfExportedAt timestamp)
    await saveToInstantDB(true);

    const baseUrl = import.meta.env.VITE_BACKEND_URL || "";
    try {
      // Use POST endpoint with attachment URLs for merging
      const hasPdfAttachments = pdfAttachmentUrls.length > 0;

      let response: Response;

      if (hasPdfAttachments) {
        // POST request with attachment URLs
        console.log("Exporting PDF with", pdfAttachmentUrls.length, "attachments");
        response = await fetch(`${baseUrl}/api/programs/${id}/pdf`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            attachmentUrls: pdfAttachmentUrls,
            language: exportLanguage,
          }),
        });
      } else {
        // GET request for simple PDF (backwards compatible)
        response = await fetch(`${baseUrl}/api/programs/${id}/pdf?lang=${exportLanguage}`, {
          method: "GET",
          credentials: "include",
        });
      }

      if (!response.ok) {
        throw new Error("Failed to generate PDF");
      }

      // Get the blob from response
      const blob = await response.blob();

      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;

      // Extract filename from Content-Disposition header or use default
      const contentDisposition = response.headers.get("Content-Disposition");
      let filename = `programme-${program?.city || "paris"}.pdf`;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?([^";\n]+)"?/);
        if (filenameMatch?.[1]) {
          filename = filenameMatch[1];
        }
      }

      link.download = filename;
      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading PDF:", error);
      // Fallback to opening in new tab if direct download fails
      window.open(`${baseUrl}/api/programs/${id}/pdf?lang=${exportLanguage}`, "_blank");
    }
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (error || !program) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-medium text-white mb-2">
            Programme introuvable
          </h2>
          <p className="text-gray-400 mb-6">
            Ce programme n'existe pas ou a ete supprime.
          </p>
          <Button
            onClick={() => navigate("/")}
            className="bg-amber-500 hover:bg-amber-600 text-black"
          >
            Retour a l'accueil
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Header */}
      <ProgramHeader
        program={program}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onBack={() => navigate("/")}
        onUpdateTitle={handleUpdateProgramTitle}
        hotelName={userProfile?.hotelName}
      />

      {/* Main content */}
      <main className="container max-w-4xl mx-auto px-4 sm:px-6 py-6">
        {/* Concierge Warning Banner */}
        {viewMode === "concierge" && unselectedCount > 0 && (
          <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-amber-500">
                  {unselectedCount} creneau(x) sans selection
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  Selectionnez une option pour chaque creneau avant validation.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Validated Banner */}
        {program.status === "validated" && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-emerald-500">Programme valide</p>
                <p className="text-sm text-gray-400 mt-1">
                  Ce programme a ete valide et est pret pour export.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Program Info */}
        <ProgramIntro program={program} viewMode={viewMode} />

        {/* Transfer Options (Voiturier) */}
        <TransferOptions
          viewMode={viewMode}
          startDate={program.startDate}
          endDate={program.endDate}
        />

        {/* Days */}
        <section className="space-y-4 mt-6">
          {program.days.map((day, index) => (
            <DayCard
              key={day.id}
              day={day}
              startDate={program.startDate}
              isExpanded={expandedDays.includes(day.dayNumber)}
              onToggle={() => toggleDay(day.dayNumber)}
              viewMode={viewMode}
              animationDelay={index * 50}
              onSelectOption={handleSelectOption}
              onSelectMultipleOptions={handleSelectMultipleOptions}
              onUpdateNotes={handleUpdateNotes}
              onUpdateTime={handleUpdateTime}
              onExcludeVenue={handleExcludeVenue}
              onRegenerateOption={handleRegenerateOption}
              onSetRest={handleSetRest}
              onUpdateDayTitle={handleUpdateDayTitle}
              onSwitchActivityType={handleSwitchActivityType}
              isSelectingOption={selectOptionMutation.isPending || selectMultipleOptionsMutation.isPending}
              isSavingNotes={updateNotesMutation.isPending}
              isUpdatingTime={updateTimeMutation.isPending}
              isSwitchingType={switchActivityTypeMutation.isPending}
            />
          ))}
        </section>

        {/* Closing Note */}
        <section className="mt-8">
          <div
            className={`p-5 rounded-xl border ${
              viewMode === "concierge"
                ? "bg-amber-500/5 border-amber-500/20"
                : "bg-amber-500/5 border-amber-500/20"
            }`}
          >
            <p className="text-sm text-gray-400 leading-relaxed">
              {viewMode === "concierge"
                ? program.closingInternal ||
                  "Verifier toutes les disponibilites avant envoi au client."
                : program.closingClient ||
                  "Notre equipe reste a votre disposition pour toute modification."}
            </p>
          </div>
        </section>

        {/* Program Notes - Concierge Only */}
        {viewMode === "concierge" && id && (
          <ProgramNotes programId={id} />
        )}

        {/* Footer Actions */}
        <ProgramFooter
          viewMode={viewMode}
          isValidated={program.status === "validated"}
          allSlotsSelected={allSlotsSelected}
          isValidating={validateMutation.isPending}
          isSaving={isSaving}
          isSaved={isSaved || !!existingItinerary}
          exportLanguage={exportLanguage}
          onExportLanguageChange={setExportLanguage}
          onValidate={handleValidate}
          onExportPdf={handleExportPdf}
          onSave={handleSave}
        />
      </main>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center">
      <div className="w-14 h-14 rounded-full border-2 border-amber-500/30 border-t-amber-500 animate-spin mb-6" />
      <h2 className="font-serif text-xl text-white mb-2">Chargement</h2>
      <p className="text-gray-400 text-sm">Recuperation du programme...</p>
    </div>
  );
}
