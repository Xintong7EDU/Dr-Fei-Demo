import { notFound } from "next/navigation"
import { getMeeting } from "@/app/actions"
import { EditMeetingForm } from "@/components/edit-meeting-form"

export default async function EditMeetingPage({ params }: { params: { id: string } }) {
  const meetingId = Number.parseInt(params.id)

  if (isNaN(meetingId)) {
    notFound()
  }

  const meeting = await getMeeting(meetingId)
  if (!meeting) {
    notFound()
  }

  return <EditMeetingForm meeting={meeting} />
}
