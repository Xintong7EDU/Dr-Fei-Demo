import type { Note } from "@/lib/types"
import { Card, CardContent } from "@/components/ui/card"
import { StaggerContainer, StaggerItem } from "@/components/ui/motion"

interface NoteListProps {
  notes: Note[]
  emptyMessage?: string
}

/** Display recent notes in cards with rendered HTML content */
export const NoteList = ({ notes, emptyMessage = "暂无笔记" }: NoteListProps) => {
  if (!notes.length) {
    return <div className="text-center py-8 text-muted-foreground">{emptyMessage}</div>
  }

  return (
    <StaggerContainer className="grid gap-4">
      {notes.map((note, index) => (
        <StaggerItem key={note.note_id} index={index}>
          <Card className="hover:shadow-md transition-all">
            <CardContent className="p-4 space-y-2">
              {note.title ? (
                <h3 className="text-base font-semibold tracking-tight">{note.title}</h3>
              ) : null}
              <div
                className="prose prose-sm max-w-none dark:prose-invert"
                dangerouslySetInnerHTML={{ __html: note.html_content }}
                aria-label="Note content"
              />
              <div className="text-xs text-muted-foreground">
                {note.meeting_date ? (
                  <span>Meeting date: {new Date(note.meeting_date).toLocaleDateString()}</span>
                ) : null}
                <span className="ml-2">Created: {new Date(note.created_at).toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>
        </StaggerItem>
      ))}
    </StaggerContainer>
  )
}


