"use client"

import { useState, useEffect } from "react"
import { saveNotes } from "@/app/actions"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Save, Clock, AlertCircle } from "lucide-react"
import { useToastContext } from "@/hooks/use-toast-context"
import { cn } from "@/lib/utils"

interface NotesEditorProps {
  meetingId: number
  initialContent: string
}

export function NotesEditor({ meetingId, initialContent }: NotesEditorProps) {
  const [content, setContent] = useState(initialContent)
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [isDirty, setIsDirty] = useState(false)
  const { toast } = useToastContext()

  // Reset dirty state when initialContent changes
  useEffect(() => {
    setContent(initialContent)
    setIsDirty(false)
  }, [initialContent])

  // Handle content change
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value)
    setIsDirty(e.target.value !== initialContent)
  }

  const handleSave = async () => {
    if (!isDirty) return
    
    setIsSaving(true)
    try {
      await saveNotes(meetingId, content)
      setLastSaved(new Date())
      setIsDirty(false)
      toast({
        title: "Notes saved",
        description: "Your meeting notes have been saved successfully.",
        variant: "success"
      })
    } catch (error) {
      toast({
        title: "Error saving notes",
        description: "There was a problem saving your notes. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Format the last saved time
  const formatLastSaved = () => {
    if (!lastSaved) return null
    
    return new Intl.RelativeTimeFormat('en', { 
      numeric: 'auto' 
    }).format(0, 'second').replace('in ', '') + ' ago'
  }

  return (
    <div className="space-y-4">
      <Textarea
        value={content}
        onChange={handleContentChange}
        placeholder="Enter meeting notes here..."
        className={cn(
          "min-h-[300px] resize-none transition-all focus-visible:ring-2 focus-visible:ring-offset-2",
          isDirty ? "border-amber-300 dark:border-amber-700" : ""
        )}
        aria-label="Meeting notes"
      />
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <div className="text-sm text-muted-foreground flex items-center">
          {lastSaved ? (
            <>
              <Clock className="h-3.5 w-3.5 mr-1.5" />
              <span>Last saved: {formatLastSaved()}</span>
            </>
          ) : isDirty ? (
            <>
              <AlertCircle className="h-3.5 w-3.5 mr-1.5 text-amber-500" />
              <span className="text-amber-500 dark:text-amber-400">Unsaved changes</span>
            </>
          ) : null}
        </div>
        
        <Button 
          onClick={handleSave} 
          disabled={isSaving || !isDirty}
          className={cn(
            "transition-all",
            isDirty ? "bg-amber-500 hover:bg-amber-600 text-white" : ""
          )}
          aria-label={isSaving ? "Saving notes" : "Save notes"}
        >
          {isSaving ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Notes
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
