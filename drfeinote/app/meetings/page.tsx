import { getMeetings } from "../actions"
import { MeetingList } from "@/components/meeting-list"

export default async function MeetingsPage() {
  const upcomingMeetings = await getMeetings("upcoming")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Upcoming Meetings</h1>
        <p className="text-muted-foreground">Manage your scheduled meetings</p>
      </div>

      <MeetingList
        meetings={upcomingMeetings}
        emptyMessage="No upcoming meetings found"
      />
    </div>
  )
}
