import { notFound } from "next/navigation"
import { getMeeting, getMeetingNotes } from "@/app/actions"
import { formatDate, formatTimeRange } from "@/lib/utils"
import { NotesEditor } from "@/components/notes-editor"
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
              {formatDate(meeting.meeting_date)} • {formatTimeRange(meeting.start_time, meeting.end_time)}
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
                <p>{formatTimeRange(meeting.start_time, meeting.end_time)}</p>
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

      {/* Main content area with notes */}
      <div className="grid gap-8">
        {/* Meeting Notes */}
        <div>
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
      </div>

    </div>
  )
}
