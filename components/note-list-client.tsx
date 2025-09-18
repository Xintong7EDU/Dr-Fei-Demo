"use client"

import { useEffect, useRef, useState } from "react"
import type { Note } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { StaggerContainer, StaggerItem } from "@/components/ui/motion"
import { useToastContext } from "@/hooks/use-toast-context"
import { sanitizeAndBeautifyHtml, cn } from "@/lib/utils"
import { Edit, Trash2, Save, X, Eye, ChevronDown, ChevronUp } from "lucide-react"

interface NoteListClientProps {
  initialNotes: Note[]
  emptyMessage?: string
}

/**
 * Client-side list with inline edit/delete actions per note.
 */
export const NoteListClient = ({ initialNotes, emptyMessage = "No notes yet" }: NoteListClientProps) => {
  const [notes, setNotes] = useState<Note[]>(initialNotes)
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null)
  const [expanded, setExpanded] = useState<Set<number>>(new Set())
  const [editTitle, setEditTitle] = useState<string>("")
  const [editDate, setEditDate] = useState<string>("")
  const [editHtml, setEditHtml] = useState<string>("")
  const editorRef = useRef<HTMLDivElement | null>(null)
  const { toast } = useToastContext()

  useEffect(() => {
    if (!editingNoteId) return
    if (editorRef.current) {
      editorRef.current.innerHTML = editHtml
    }
  }, [editingNoteId, editHtml])

  const handleStartEdit = (note: Note) => {
    setEditingNoteId(note.note_id)
    setEditTitle(note.title ?? "")
    setEditDate(note.meeting_date ?? "")
    setEditHtml(note.html_content)
    // Ensure content is visible while editing
    setExpanded((prev) => new Set([...prev, note.note_id]))
  }

  const handleCancelEdit = () => {
    setEditingNoteId(null)
    setEditTitle("")
    setEditDate("")
    setEditHtml("")
  }

  const handleToggleExpand = (noteId: number) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(noteId)) next.delete(noteId)
      else next.add(noteId)
      return next
    })
  }

  const handleClose = (noteId: number) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      next.delete(noteId)
      return next
    })
    if (editingNoteId === noteId) handleCancelEdit()
  }

  const handleEditorInput = () => {
    if (!editorRef.current) return
    setEditHtml(editorRef.current.innerHTML)
  }

  const handleSaveEdit = async (noteId: number) => {
    const { updateNote } = await import("@/app/actions")
    const payloadHtml = sanitizeAndBeautifyHtml(editHtml)
    try {
      const updated = await updateNote(noteId, {
        title: editTitle.trim() || null,
        html: payloadHtml,
        meeting_date: editDate || null,
      })
      setNotes((prev) => prev.map((n) => (n.note_id === noteId ? updated : n)))
      handleCancelEdit()
      toast({ title: "Saved", description: "Note updated.", variant: "success" })
    } catch {
      toast({ title: "Save failed", description: "Please try again.", variant: "destructive" })
    }
  }

  const handleDelete = async (noteId: number) => {
    if (!confirm("Delete this note? This action cannot be undone.")) return
    const { deleteNote } = await import("@/app/actions")
    try {
      await deleteNote(noteId)
      setNotes((prev) => prev.filter((n) => n.note_id !== noteId))
      toast({ title: "Deleted", description: "Note removed.", variant: "success" })
    } catch {
      toast({ title: "Delete failed", description: "Please try again.", variant: "destructive" })
    }
  }

  if (!notes.length) {
    return <div className="text-center py-8 text-muted-foreground">{emptyMessage}</div>
  }

  return (
    <StaggerContainer className="grid gap-4">
      {notes.map((note, index) => {
        const isEditing = editingNoteId === note.note_id
        return (
          <StaggerItem key={note.note_id} index={index}>
            <Card className={cn("transition-all", isEditing ? "ring-2 ring-primary" : "hover:shadow-md")}> 
              <CardContent className="p-4 space-y-2">
                {/* Header row */}
                <div className="flex items-center justify-between gap-2">
                  {isEditing ? (
                    <div className="flex items-center gap-2 w-full">
                      <Input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        placeholder="Optional title"
                        aria-label="Note title"
                      />
                      <Input
                        type="date"
                        value={editDate}
                        onChange={(e) => setEditDate(e.target.value)}
                        aria-label="Meeting date (optional)"
                        className="w-[12rem]"
                      />
                    </div>
                  ) : (
                    <div className="flex flex-col">
                      {note.title ? (
                        <h3 className="text-base font-semibold tracking-tight">{note.title}</h3>
                      ) : (
                        <h3 className="text-base font-semibold tracking-tight text-muted-foreground">Untitled</h3>
                      )}
                      <div className="text-xs text-muted-foreground">
                        {(note.meeting_date
                          ? new Date(note.meeting_date).toLocaleDateString()
                          : new Date(note.created_at).toLocaleDateString())}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    {/* Expand/Collapse toggle */}
                    {!isEditing && (
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => handleToggleExpand(note.note_id)} 
                        aria-label={expanded.has(note.note_id) ? "Collapse" : "Expand"}
                      >
                        {expanded.has(note.note_id) ? (
                          <>
                            <ChevronUp className="h-4 w-4 mr-1" /> Collapse
                          </>
                        ) : (
                          <>
                            <ChevronDown className="h-4 w-4 mr-1" /> Expand
                          </>
                        )}
                      </Button>
                    )}
                    {isEditing ? (
                      <>
                        <Button size="sm" onClick={() => handleSaveEdit(note.note_id)} aria-label="Save">
                          <Save className="h-4 w-4 mr-1" /> Save
                        </Button>
                        <Button size="sm" variant="outline" onClick={handleCancelEdit} aria-label="Cancel">
                          <X className="h-4 w-4 mr-1" /> Cancel
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button size="sm" variant="outline" onClick={() => handleStartEdit(note)} aria-label="Edit note">
                          <Edit className="h-4 w-4 mr-1" /> Edit
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleDelete(note.note_id)} aria-label="Delete note">
                          <Trash2 className="h-4 w-4 mr-1" /> Delete
                        </Button>
                        {expanded.has(note.note_id) && (
                          <Button size="sm" variant="ghost" onClick={() => handleClose(note.note_id)} aria-label="Close">
                            <X className="h-4 w-4 mr-1" /> Close
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Content */}
                {isEditing ? (
                  <div className="grid md:grid-cols-2 gap-3">
                    <div>
                      <div
                        ref={editorRef}
                        role="textbox"
                        tabIndex={0}
                        aria-label="Note content editor"
                        onInput={handleEditorInput}
                        className={cn(
                          "min-h-40 w-full rounded-md border bg-background p-3 outline-none",
                          "focus-visible:ring-2 focus-visible:ring-offset-2"
                        )}
                        contentEditable
                        suppressContentEditableWarning
                        dangerouslySetInnerHTML={{ __html: editHtml }}
                      />
                      <p className="mt-1 text-xs text-muted-foreground">Edit HTML; it will be sanitized and beautified on save.</p>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                        <Eye className="h-4 w-4" /> Preview
                      </div>
                      <div
                        className="prose prose-sm max-w-none dark:prose-invert border rounded-md p-3 overflow-auto"
                        aria-label="Note preview"
                        dangerouslySetInnerHTML={{ __html: sanitizeAndBeautifyHtml(editHtml) }}
                      />
                    </div>
                  </div>
                ) : expanded.has(note.note_id) ? (
                  <div
                    className="prose prose-sm max-w-none dark:prose-invert"
                    dangerouslySetInnerHTML={{ __html: note.html_content }}
                    aria-label="Note content"
                  />
                ) : null}

                {/* Meta removed: created time not displayed */}
              </CardContent>
            </Card>
          </StaggerItem>
        )
      })}
    </StaggerContainer>
  )
}


