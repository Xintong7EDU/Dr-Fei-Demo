import { notFound } from "next/navigation"
import { getMeeting } from "@/app/actions"
import { EditMeetingForm } from "@/components/edit-meeting-form"
import type { ReactElement } from 'react';

export default async function EditMeetingPage({ 
  params,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}): Promise<ReactElement> {
  const { id } = await params
  const meetingId = Number.parseInt(id)

  if (isNaN(meetingId)) {
    notFound()
  }

  const meeting = await getMeeting(meetingId)
  if (!meeting) {
    notFound()
  }

  return <EditMeetingForm meeting={meeting} />
}
