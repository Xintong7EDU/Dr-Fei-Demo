import { getMeetings } from "../actions"
import { MeetingList } from "@/components/meeting-list"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function SchedulePage() {
  const upcomingMeetings = await getMeetings("upcoming")
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Schedule</h1>
          <p className="text-muted-foreground">View and manage your upcoming meetings.</p>
        </div>
        <Button asChild>
          <Link href="/meetings/new">Add Meeting</Link>
        </Button>
      </div>
      <MeetingList meetings={upcomingMeetings} emptyMessage="No meetings scheduled." />
    </div>
  )
}
