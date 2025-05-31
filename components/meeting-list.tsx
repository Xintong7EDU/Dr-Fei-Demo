import Link from "next/link"
import type { Meeting } from "@/lib/types"
import { formatDate } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CalendarIcon } from "lucide-react"

interface MeetingListProps {
  meetings: Meeting[]
  emptyMessage: string
  /** Base path for meeting detail links */
  linkBasePath?: string
}

export function MeetingList({ meetings, emptyMessage, linkBasePath = "/meetings" }: MeetingListProps) {
  if (meetings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <CalendarIcon className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium">{emptyMessage}</h3>
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {meetings.map((meeting) => (
        <Link key={meeting.meeting_id} href={`${linkBasePath}/${meeting.meeting_id}`}>
          <Card className="h-full transition-all hover:shadow-md">
            <CardHeader>
              <CardTitle className="line-clamp-1">{meeting.topic_overview}</CardTitle>
              <CardDescription>
                {formatDate(meeting.meeting_date)} • {meeting.start_time.substring(0, 5)} -{" "}
                {meeting.end_time.substring(0, 5)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Click to view details and notes</p>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}
