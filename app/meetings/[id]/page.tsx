import { notFound, params as getParams } from "next/navigation"
import { getMeeting, getMeetingNotes, getQnAForMeeting } from "@/app/actions"
import { formatDate } from "@/lib/utils"
import { NotesEditor } from "@/components/notes-editor"
import { QnASection } from "@/components/qna-section"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Clock } from "lucide-react"
import Link from "next/link"

export default async function MeetingDetailPage() {
  const { id } = await getParams<{ id: string }>()
  const meetingId = Number.parseInt(id)

  if (isNaN(meetingId)) {
    notFound()
  }

  const meeting = await getMeeting(meetingId)

  if (!meeting) {
    notFound()
  }

  const notes = await getMeetingNotes(meetingId)
  const qnaEntries = await getQnAForMeeting(meetingId)

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{meeting.topic_overview}</h1>
          <div className="flex items-center text-muted-foreground mt-1">
            <Clock className="mr-2 h-4 w-4" />
            <span>
              {formatDate(meeting.meeting_date)} • {meeting.start_time.substring(0, 5)} -{" "}
              {meeting.end_time.substring(0, 5)}
            </span>
          </div>
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Meeting Notes</h2>
          <NotesEditor meetingId={meetingId} initialContent={notes?.note_content || ""} />
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Supply Chain Q&A</h2>
          <QnASection meetingId={meetingId} initialEntries={qnaEntries} />
        </div>
      </div>
    </div>
  )
}
