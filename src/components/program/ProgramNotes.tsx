import { useState, useRef } from "react";
import { db } from "@/lib/instantdb";
import { id, tx } from "@instantdb/react";
import {
  Plus,
  Trash2,
  Loader2,
  FileImage,
  StickyNote,
  X,
  Upload,
  Image as ImageIcon,
  Pencil,
  Save,
  ChevronDown,
  ChevronUp,
  FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

interface ProgramNotesProps {
  programId: string;
}

export function ProgramNotes({ programId }: ProgramNotesProps) {
  const user = db.useAuth();
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [newNoteContent, setNewNoteContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());
  const [uploadingNoteId, setUploadingNoteId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Query notes for this program
  const { data, isLoading } = db.useQuery({
    programNotes: {
      $: {
        where: { programId },
        order: { serverCreatedAt: "desc" }
      }
    },
    noteAttachments: {
      $: {
        where: { programId }
      }
    }
  });

  const notes = data?.programNotes || [];
  const attachments = data?.noteAttachments || [];

  const getAttachmentsForNote = (noteId: string) => {
    return attachments.filter(a => a.noteId === noteId);
  };

  const toggleNoteExpanded = (noteId: string) => {
    const newExpanded = new Set(expandedNotes);
    if (newExpanded.has(noteId)) {
      newExpanded.delete(noteId);
    } else {
      newExpanded.add(noteId);
    }
    setExpandedNotes(newExpanded);
  };

  const handleAddNote = async () => {
    if (!newNoteContent.trim() || !user.user) return;

    setIsSaving(true);
    try {
      const noteId = id();
      await db.transact([
        tx.programNotes[noteId].update({
          programId,
          title: newNoteTitle.trim() || undefined,
          content: newNoteContent.trim(),
          createdAt: Date.now(),
          updatedAt: Date.now(),
          userId: user.user.id,
          userEmail: user.user.email,
        })
      ]);
      setNewNoteTitle("");
      setNewNoteContent("");
      setIsAddingNote(false);
      // Auto-expand the new note
      setExpandedNotes(prev => new Set([...prev, noteId]));
    } catch (err) {
      console.error("Error adding note:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateNote = async (noteId: string) => {
    if (!editContent.trim()) return;

    setIsSaving(true);
    try {
      await db.transact([
        tx.programNotes[noteId].update({
          title: editTitle.trim() || undefined,
          content: editContent.trim(),
          updatedAt: Date.now(),
        })
      ]);
      setEditingNoteId(null);
    } catch (err) {
      console.error("Error updating note:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm("Supprimer cette note et toutes ses pièces jointes ?")) return;

    try {
      // Delete all attachments for this note first
      const noteAttachments = getAttachmentsForNote(noteId);
      const deleteTxs = noteAttachments.map(a => tx.noteAttachments[a.id].delete());

      // Then delete the note
      await db.transact([
        ...deleteTxs,
        tx.programNotes[noteId].delete()
      ]);
    } catch (err) {
      console.error("Error deleting note:", err);
    }
  };

  const handleFileUpload = async (noteId: string, file: File) => {
    if (!user.user) return;

    setUploadingNoteId(noteId);
    try {
      // Create a unique path for the file
      const timestamp = Date.now();
      const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
      const filePath = `programs/${programId}/notes/${noteId}/${timestamp}-${safeName}`;

      // Upload to InstantDB storage
      // The uploadFile returns the file path, we construct the URL
      await db.storage.uploadFile(filePath, file);

      // Construct the file URL from the storage path
      // InstantDB storage URLs follow this pattern
      const fileUrl = `https://instant-storage.s3.amazonaws.com/${filePath}`;

      // Save attachment record
      const attachmentId = id();
      await db.transact([
        tx.noteAttachments[attachmentId].update({
          noteId,
          programId,
          fileName: file.name,
          fileUrl,
          filePath,
          fileType: file.type,
          fileSize: file.size,
          createdAt: Date.now(),
          userId: user.user.id,
        })
      ]);
    } catch (err) {
      console.error("Error uploading file:", err);
      alert("Erreur lors de l'upload du fichier");
    } finally {
      setUploadingNoteId(null);
    }
  };

  const handleDeleteAttachment = async (attachmentId: string, filePath: string) => {
    if (!confirm("Supprimer cette pièce jointe ?")) return;

    try {
      // Delete from storage
      await db.storage.delete(filePath);
      // Delete record
      await db.transact([tx.noteAttachments[attachmentId].delete()]);
    } catch (err) {
      console.error("Error deleting attachment:", err);
    }
  };

  const startEditing = (note: { id: string; title?: string; content: string }) => {
    setEditingNoteId(note.id);
    setEditTitle(note.title || "");
    setEditContent(note.content);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <StickyNote className="w-5 h-5 text-amber-500" />
          <h3 className="font-medium text-white">Notes & Pièces jointes</h3>
          <span className="text-sm text-gray-400">({notes.length})</span>
        </div>

        {!isAddingNote && (
          <Button
            onClick={() => setIsAddingNote(true)}
            size="sm"
            className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/20"
          >
            <Plus className="w-4 h-4 mr-1" />
            Ajouter
          </Button>
        )}
      </div>

      {/* Add new note form */}
      {isAddingNote && (
        <div className="bg-[#1a1a24] rounded-lg border border-amber-500/20 p-4 space-y-3">
          <Input
            placeholder="Titre de la note (optionnel)"
            value={newNoteTitle}
            onChange={(e) => setNewNoteTitle(e.target.value)}
            className="bg-white/5 border-amber-500/20 text-white"
          />
          <Textarea
            placeholder="Contenu de la note..."
            value={newNoteContent}
            onChange={(e) => setNewNoteContent(e.target.value)}
            className="bg-white/5 border-amber-500/20 text-white min-h-[100px]"
          />
          <div className="flex gap-2 justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setIsAddingNote(false);
                setNewNoteTitle("");
                setNewNoteContent("");
              }}
            >
              Annuler
            </Button>
            <Button
              size="sm"
              onClick={handleAddNote}
              disabled={!newNoteContent.trim() || isSaving}
              className="bg-amber-500 hover:bg-amber-600 text-black"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Save className="w-4 h-4 mr-1" />
                  Enregistrer
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Notes list */}
      {notes.length === 0 && !isAddingNote ? (
        <div className="text-center py-8 text-gray-400">
          <StickyNote className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Aucune note pour ce séjour</p>
          <p className="text-sm">Ajoutez des notes ou des commentaires</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notes.map((note) => {
            const noteAttachments = getAttachmentsForNote(note.id);
            const isExpanded = expandedNotes.has(note.id);
            const isEditing = editingNoteId === note.id;

            return (
              <div
                key={note.id}
                className="bg-[#1a1a24] rounded-lg border border-amber-500/10 overflow-hidden"
              >
                {/* Note header */}
                <div
                  className="flex items-center justify-between p-3 cursor-pointer hover:bg-white/5"
                  onClick={() => !isEditing && toggleNoteExpanded(note.id)}
                >
                  <div className="flex items-center gap-3">
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    )}
                    <div>
                      <p className="text-white font-medium">
                        {note.title || "Note sans titre"}
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(note.createdAt).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                        {noteAttachments.length > 0 && (
                          <span className="ml-2">
                            <FileImage className="w-3 h-3 inline mr-1" />
                            {noteAttachments.length} fichier(s)
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  {!isEditing && (
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => startEditing(note)}
                        className="text-gray-400 hover:text-amber-500"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteNote(note.id)}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>

                {/* Note content (expanded) */}
                {isExpanded && (
                  <div className="border-t border-amber-500/10 p-4 space-y-4">
                    {isEditing ? (
                      <div className="space-y-3">
                        <Input
                          placeholder="Titre"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="bg-white/5 border-amber-500/20 text-white"
                        />
                        <Textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="bg-white/5 border-amber-500/20 text-white min-h-[100px]"
                        />
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingNoteId(null)}
                          >
                            Annuler
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleUpdateNote(note.id)}
                            disabled={!editContent.trim() || isSaving}
                            className="bg-amber-500 hover:bg-amber-600 text-black"
                          >
                            {isSaving ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              "Sauvegarder"
                            )}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-300 whitespace-pre-wrap">{note.content}</p>
                    )}

                    {/* Attachments */}
                    {noteAttachments.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm text-gray-400 font-medium">Pièces jointes :</p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {noteAttachments.map((attachment) => {
                            const isPdf = attachment.fileType === "application/pdf";
                            const isImage = attachment.fileType.startsWith("image/");

                            return (
                              <div
                                key={attachment.id}
                                className="relative group rounded-lg overflow-hidden bg-black/30 border border-amber-500/10"
                              >
                                {isImage ? (
                                  <a href={attachment.fileUrl} target="_blank" rel="noopener noreferrer">
                                    <img
                                      src={attachment.fileUrl}
                                      alt={attachment.fileName}
                                      className="w-full h-24 object-cover"
                                    />
                                  </a>
                                ) : (
                                  <a
                                    href={attachment.fileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex flex-col items-center justify-center h-24 p-2"
                                  >
                                    {isPdf ? (
                                      <FileText className="w-8 h-8 text-red-400 mb-1" />
                                    ) : (
                                      <FileImage className="w-8 h-8 text-amber-500 mb-1" />
                                    )}
                                    <span className="text-xs text-gray-400 truncate w-full text-center">
                                      {attachment.fileName}
                                    </span>
                                  </a>
                                )}
                                <button
                                  onClick={() => handleDeleteAttachment(attachment.id, attachment.filePath)}
                                  className="absolute top-1 right-1 p-1 rounded bg-black/70 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Upload button - DISABLED (V12) */}
                    <div className="relative">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*,application/pdf,.pdf,.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                        className="hidden"
                        disabled
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        disabled
                        className="border-gray-500/20 text-gray-500 cursor-not-allowed opacity-60"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Ajouter un fichier
                        <span className="ml-2 px-2 py-0.5 text-[10px] font-medium bg-amber-500/20 text-amber-400 rounded-full">
                          À venir
                        </span>
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
