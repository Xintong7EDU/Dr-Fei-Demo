import { notFound } from "next/navigation"
import { getMeeting, getMeetingNotes, getQnAForMeeting } from "@/app/actions"
import { formatDate } from "@/lib/utils"
import { NotesEditor } from "@/components/notes-editor"
import { QnASection } from "@/components/qna-section"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Clock } from "lucide-react"
import Link from "next/link"
import { FadeIn, SlideUp, StaggerContainer, StaggerItem } from "@/components/ui/motion"

interface MeetingDetailPageProps {
  params: {
    id: string
  }
}

export default async function MeetingDetailPage({ params }: MeetingDetailPageProps) {
  const meetingId = Number.parseInt(params.id)

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
    <div className="space-y-8 max-w-7xl mx-auto px-4 py-8">
      <FadeIn>
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild className="hover:scale-105 transition-transform">
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
      </FadeIn>

      <StaggerContainer className="grid gap-8 md:grid-cols-2">
        <StaggerItem index={0} className="space-y-4">
          <div className="flex items-center">
            <h2 className="text-xl font-semibold">Meeting Notes</h2>
            <div className="ml-2 h-1 w-1 rounded-full bg-primary animate-pulse"></div>
          </div>
          <div className="bg-card rounded-lg border shadow-sm p-4 transition-all hover:shadow-md">
            <NotesEditor meetingId={meetingId} initialContent={notes?.note_content || ""} />
          </div>
        </StaggerItem>

        <StaggerItem index={1} className="space-y-4">
          <div className="flex items-center">
            <h2 className="text-xl font-semibold">Supply Chain Q&A</h2>
            <div className="ml-2 h-1 w-1 rounded-full bg-primary animate-pulse"></div>
          </div>
          <div className="bg-card rounded-lg border shadow-sm p-4 transition-all hover:shadow-md">
            <QnASection meetingId={meetingId} initialEntries={qnaEntries} />
          </div>
        </StaggerItem>
      </StaggerContainer>
    </div>
  )
}
