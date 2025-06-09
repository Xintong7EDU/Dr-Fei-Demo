import { notFound } from "next/navigation"
import { getMeeting } from "@/app/actions"
import { formatDateForInput, formatTimeForInput } from "@/lib/utils"
import { EditMeetingForm } from "@/components/edit-meeting-form"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default async function EditMeetingPage({
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

  const meetingData = {
    meeting_id: meeting.meeting_id,
    topic_overview: meeting.topic_overview,
    meeting_date: formatDateForInput(meeting.meeting_date),
    start_time: formatTimeForInput(meeting.start_time),
    end_time: formatTimeForInput(meeting.end_time),
  }

  return (
    <div className="container mx-auto py-8 space-y-8 max-w-2xl">
      {/* Header with back button */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href={`/meetings/${meetingId}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Edit Meeting</h1>
          <p className="text-muted-foreground">Update meeting details and save changes</p>
        </div>
      </div>

      {/* Edit form */}
      <EditMeetingForm meeting={meetingData} />
    </div>
  )
}
