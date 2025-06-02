import { notFound } from "next/navigation"
import { getMeeting, getMeetingNotes, getQnAForMeeting } from "@/app/actions"
import { formatDate } from "@/lib/utils"
import { NotesEditor } from "@/components/notes-editor"
import { QnASection } from "@/components/qna-section"
import { FAQSection } from "@/components/faq-section"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ArrowLeft, Clock } from "lucide-react"
import Link from "next/link"
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/ui/motion"

export default async function MeetingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
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

      <StaggerContainer className="grid gap-8 lg:grid-cols-3">
        {/* Left column - Meeting Notes (2/3 width) */}
        <StaggerItem index={0} className="lg:col-span-2 space-y-4">
          <div className="flex items-center">
            <h2 className="text-xl font-semibold">Meeting Notes</h2>
            <div className="ml-2 h-1 w-1 rounded-full bg-primary animate-pulse"></div>
          </div>
          <div className="bg-card rounded-lg border shadow-sm p-4 transition-all hover:shadow-md">
            <NotesEditor meetingId={meetingId} initialContent={notes?.note_content || ""} />
          </div>
        </StaggerItem>

        {/* Right column - AI Conversation (1/3 width) */}
        <StaggerItem index={1} className="lg:col-span-1 space-y-4">
          <div className="flex items-center">
            <h2 className="text-xl font-semibold">AI Conversation</h2>
            <div className="ml-2 h-1 w-1 rounded-full bg-primary animate-pulse"></div>
          </div>
          <div className="bg-card rounded-lg border shadow-sm p-4 transition-all hover:shadow-md">
            <QnASection meetingId={meetingId} initialEntries={qnaEntries} />
          </div>
        </StaggerItem>
      </StaggerContainer>

      {/* FAQ Section at the bottom */}
      <FadeIn delay={0.4}>
        <Card className="border-t-4 border-t-green-500 dark:border-t-green-400 shadow-sm hover:shadow-md transition-all">
          <CardContent className="p-6">
            <FAQSection />
          </CardContent>
        </Card>
      </FadeIn>
    </div>
  )
}
