import Link from "next/link"
import type { Meeting } from "@/lib/types"
import { formatDate, formatTimeRange } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { Clock } from "lucide-react"
import { StaggerContainer, StaggerItem } from "@/components/ui/motion"
import { DeleteMeetingButton } from "@/components/delete-meeting-button"

interface MeetingListProps {
  meetings: Meeting[]
  emptyMessage?: string
  /** Base path for meeting detail links */
  linkBasePath?: string
  /** Whether to show delete buttons */
  showDeleteButton?: boolean
}

export function MeetingList({
  meetings,
  emptyMessage = "No meetings found",
  linkBasePath = "/meetings",
  showDeleteButton = false,
}: MeetingListProps) {
  if (!meetings.length) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        {emptyMessage}
      </div>
    )
  }

  return (
    <StaggerContainer className="grid gap-4">
      {meetings.map((meeting, index) => (
        <StaggerItem key={meeting.meeting_id} index={index}>
          <Card className="transition-all hover:shadow-md hover:bg-accent/5">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <Link href={`${linkBasePath}/${meeting.meeting_id}`} className="flex-1 cursor-pointer">
                  <div>
                    <h3 className="font-medium">{meeting.topic_overview}</h3>
                    <div className="flex items-center text-sm text-muted-foreground mt-1">
                      <Clock className="mr-2 h-3 w-3" />
                      <span>
                        {formatDate(meeting.meeting_date)} • {formatTimeRange(meeting.start_time, meeting.end_time)}
                      </span>
                    </div>
                  </div>
                </Link>
                <div className="flex items-center gap-2">
                  <Link href={`${linkBasePath}/${meeting.meeting_id}`}>
                    <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors cursor-pointer">
                      View Details
                    </span>
                  </Link>
                  {showDeleteButton && (
                    <DeleteMeetingButton
                      meetingId={meeting.meeting_id}
                      meetingTitle={meeting.topic_overview}
                      size="sm"
                    />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </StaggerItem>
      ))}
    </StaggerContainer>
  )
}
