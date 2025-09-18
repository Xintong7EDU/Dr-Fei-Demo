"use client"

import { useEffect, useRef, useState } from "react"
import { createNote } from "@/app/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { useToastContext } from "@/hooks/use-toast-context"
import { sanitizeAndBeautifyHtml, DEFAULT_NOTE_TITLE } from "@/lib/utils"
import { cn } from "@/lib/utils"
import { Send, Eye } from "lucide-react"

interface NoteComposerProps {
  /** Optional callback after note is created */
  onCreated?: () => void
}

/**
 * Rich composer for creating standalone HTML notes.
 * Supports pasting from Google Docs, sanitizes and previews before submit.
 */
export const NoteComposer = ({ onCreated }: NoteComposerProps) => {
  const [title, setTitle] = useState<string>("")
  const [rawHtml, setRawHtml] = useState<string>("")
  const [previewHtml, setPreviewHtml] = useState<string>("")
  const [meetingDate, setMeetingDate] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const editorRef = useRef<HTMLDivElement | null>(null)
  const { toast } = useToastContext()

  // Update preview when rawHtml changes
  useEffect(() => {
    setPreviewHtml(sanitizeAndBeautifyHtml(rawHtml))
  }, [rawHtml])

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault()
    const html = e.clipboardData.getData('text/html') || e.clipboardData.getData('text/plain')
    const clean = sanitizeAndBeautifyHtml(html)
    setRawHtml(clean)
    if (editorRef.current) {
      editorRef.current.innerHTML = clean
    }
  }

  const handleInput = () => {
    if (!editorRef.current) return
    setRawHtml(editorRef.current.innerHTML)
  }

  const handleSubmit = async () => {
    if (!rawHtml.trim()) {
      toast({ title: "Empty content", description: "Please paste or type content first.", variant: "destructive" })
      return
    }
    setIsSubmitting(true)
    try {
      await createNote({ title: title.trim() || DEFAULT_NOTE_TITLE, html: rawHtml, meeting_date: meetingDate || null })
      setTitle("")
      setRawHtml("")
      setPreviewHtml("")
      setMeetingDate("")
      if (editorRef.current) editorRef.current.innerHTML = ""
      toast({ title: "Saved", description: "New note has been created.", variant: "success" })
      onCreated?.()
    } catch {
      toast({ title: "Save failed", description: "Please try again.", variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="bg-background">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Optional title"
            aria-label="Note title"
          />
          <Input
            type="date"
            value={meetingDate}
            onChange={(e) => setMeetingDate(e.target.value)}
            placeholder="Meeting date (optional)"
            aria-label="Meeting date (optional)"
            className="w-[12rem]"
          />
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            aria-label={isSubmitting ? "Saving note" : "Save note"}
            className="shrink-0"
          >
            {isSubmitting ? 'Saving…' : (<><Send className="mr-2 h-4 w-4" /> Publish</>)}
          </Button>
        </div>

        <div className="grid md:grid-cols-2 gap-3">
          <div>
            <div
              ref={editorRef}
              role="textbox"
              tabIndex={0}
              aria-label="Note content editor"
              onPaste={handlePaste}
              onInput={handleInput}
              className={cn(
                "min-h-40 w-full rounded-md border bg-background p-3 outline-none",
                "focus-visible:ring-2 focus-visible:ring-offset-2"
              )}
              contentEditable
              suppressContentEditableWarning
            />
            <p className="mt-1 text-xs text-muted-foreground">You can paste from Google Docs; we will sanitize and beautify HTML automatically.</p>
          </div>
          <div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Eye className="h-4 w-4" /> Preview
            </div>
            <div
              className="prose prose-sm max-w-none dark:prose-invert border rounded-md p-3 overflow-auto"
              aria-label="Note preview"
              dangerouslySetInnerHTML={{ __html: previewHtml }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}


