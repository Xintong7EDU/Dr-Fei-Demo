import { getMeetings } from "../actions"
import { MeetingList } from "@/components/meeting-list"

export default async function ArchivePage() {
  const pastMeetings = await getMeetings("past")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Meeting Archive</h1>
        <p className="text-muted-foreground">View past meetings and their notes</p>
      </div>

      <MeetingList meetings={pastMeetings} emptyMessage="No past meetings found" />
    </div>
  )
}
