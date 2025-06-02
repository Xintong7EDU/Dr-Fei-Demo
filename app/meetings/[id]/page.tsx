import { notFound } from "next/navigation"
import { getMeeting, getMeetingNotes, getQnAForMeeting } from "@/app/actions"
import { formatDate } from "@/lib/utils"
import { NotesEditor } from "@/components/notes-editor"
import { QnASection } from "@/components/qna-section"
import { FAQSection } from "@/components/faq-section"
import { MeetingParticipants } from "@/components/meeting-participants"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ArrowLeft, Clock, Calendar, Tag } from "lucide-react"
import Link from "next/link"

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
  
  // Determine if meeting is past or upcoming
  const isPastMeeting = new Date(meeting.meeting_date) < new Date()

  return (
    <div className="container mx-auto py-8 space-y-8 max-w-7xl">
      {/* Header with back button and meeting title */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <Button variant="outline" size="icon" asChild className="w-10 h-10 rounded-full shadow-sm hover:shadow-md transition-all self-start">
          <Link href="/" aria-label="Back to meetings">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">{meeting.topic_overview}</h1>
          <div className="flex items-center text-muted-foreground mt-1">
            <Clock className="mr-2 h-4 w-4" />
            <span>
              {formatDate(meeting.meeting_date)} • {meeting.start_time.substring(0, 5)} -{" "}
              {meeting.end_time.substring(0, 5)}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
            isPastMeeting
              ? "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
              : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
          }`}>
            {isPastMeeting ? "Past Meeting" : "Upcoming Meeting"}
          </span>
          <Button size="sm" variant="outline" asChild>
            <Link href={`/meetings/${meetingId}/edit`}>Edit</Link>
          </Button>
        </div>
      </div>

      {/* Meeting details card */}
      <Card className="border-l-4 border-l-primary">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-start space-x-3">
              <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <h3 className="font-medium">Date</h3>
                <p>{formatDate(meeting.meeting_date)}</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <h3 className="font-medium">Time</h3>
                <p>{meeting.start_time.substring(0, 5)} - {meeting.end_time.substring(0, 5)}</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Tag className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <h3 className="font-medium">Topic</h3>
                <p className="line-clamp-2">{meeting.topic_overview}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main content area with notes on left and FAQ on right */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left column - Meeting Notes (2/3 width) */}
        <div className="lg:col-span-2">
          <Card className="border-t-4 border-t-blue-500 dark:border-t-blue-400 shadow-sm hover:shadow-md transition-all">
            <CardHeader className="pb-2">
              <CardTitle className="text-xl font-semibold flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-500 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Meeting Notes
              </CardTitle>
              <CardDescription>
                Record important points and action items from the meeting
              </CardDescription>
            </CardHeader>
            <CardContent>
              <NotesEditor meetingId={meetingId} initialContent={notes?.note_content || ""} />
            </CardContent>
          </Card>
        </div>

        {/* Right column - FAQ Section (1/3 width) */}
        <div className="lg:col-span-1">
          <Card className="border-t-4 border-t-green-500 dark:border-t-green-400 shadow-sm hover:shadow-md transition-all">
            <CardContent className="p-6">
              <FAQSection />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* AI Conversation Section at the bottom */}
      <Card className="border-t-4 border-t-purple-500 dark:border-t-purple-400 shadow-sm hover:shadow-md transition-all">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl font-semibold flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-purple-500 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            AI Conversation
          </CardTitle>
          <CardDescription>
            Chat with AI about supply chain topics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <QnASection meetingId={meetingId} initialEntries={qnaEntries} />
        </CardContent>
      </Card>
    </div>
  )
}
