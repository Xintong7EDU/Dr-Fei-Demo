"use client"

import { useState } from "react"
import { saveNotes } from "@/app/actions"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Save } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface NotesEditorProps {
  meetingId: number
  initialContent: string
}

export function NotesEditor({ meetingId, initialContent }: NotesEditorProps) {
  const [content, setContent] = useState(initialContent)
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await saveNotes(meetingId, content)
      toast({
        title: "Notes saved",
        description: "Your meeting notes have been saved successfully.",
      })
    } catch (error) {
      toast({
        title: "Error saving notes",
        description: "There was a problem saving your notes. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Enter meeting notes here..."
          className="min-h-[300px] resize-none"
        />
        <div className="mt-4 flex justify-end">
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>Saving...</>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Notes
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
