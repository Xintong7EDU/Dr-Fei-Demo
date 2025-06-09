"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, TrendingUp, Archive } from "lucide-react"
import type { Meeting } from "@/lib/types"
import { formatDate, getCurrentDatePST, getLastWeekDatePST, parseDatePST } from "@/lib/utils"

interface RecentMeetingsStatsProps {
  meetings: Meeting[]
}

/**
 * Displays statistics and analytics for recent meetings
 * Syncs with database data to show real-time metrics
 * All date calculations use PST timezone
 */
export function RecentMeetingsStats({ meetings }: RecentMeetingsStatsProps) {
  // Calculate statistics from meetings data
  const totalMeetings = meetings.length
  const currentDatePST = getCurrentDatePST()
  const currentMonth = currentDatePST.getMonth()
  const currentYear = currentDatePST.getFullYear()

  // Get meetings from this month (PST timezone)
  const thisMonthMeetings = meetings.filter((meeting) => {
    const meetingDate = parseDatePST(meeting.meeting_date)
    return meetingDate.getMonth() === currentMonth && meetingDate.getFullYear() === currentYear
  })

  // Get meetings from last 7 days (PST timezone)
  const lastWeekDatePST = getLastWeekDatePST()
  const lastWeekMeetings = meetings.filter((meeting) => {
    const meetingDate = parseDatePST(meeting.meeting_date)
    return meetingDate >= lastWeekDatePST
  })

  // Calculate total meeting hours
  const totalHours = meetings.reduce((total, meeting) => {
    const startTime = new Date(`1970-01-01 ${meeting.start_time}`)
    const endTime = new Date(`1970-01-01 ${meeting.end_time}`)
    const durationMs = endTime.getTime() - startTime.getTime()
    const durationHours = durationMs / (1000 * 60 * 60)
    return total + durationHours
  }, 0)

  // Find most recent meeting
  const mostRecentMeeting = meetings.length > 0 ? meetings[0] : null

  // Calculate average meeting duration
  const averageDuration = totalMeetings > 0 ? totalHours / totalMeetings : 0

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Total Meetings Card */}
      <Card className="border-l-4 border-l-blue-500 hover:shadow-md transition-all">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Meetings</CardTitle>
          <Archive className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalMeetings}</div>
          <p className="text-xs text-muted-foreground">
            {thisMonthMeetings.length} this month
          </p>
        </CardContent>
      </Card>

      {/* Recent Activity Card */}
      <Card className="border-l-4 border-l-green-500 hover:shadow-md transition-all">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
          <TrendingUp className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{lastWeekMeetings.length}</div>
          <p className="text-xs text-muted-foreground">
            meetings last 7 days
          </p>
        </CardContent>
      </Card>

      {/* Total Hours Card */}
      <Card className="border-l-4 border-l-purple-500 hover:shadow-md transition-all">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
          <Clock className="h-4 w-4 text-purple-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalHours.toFixed(1)}h</div>
          <p className="text-xs text-muted-foreground">
            {averageDuration.toFixed(1)}h average duration
          </p>
        </CardContent>
      </Card>

      {/* Last Meeting Card */}
      <Card className="border-l-4 border-l-orange-500 hover:shadow-md transition-all">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Last Meeting</CardTitle>
          <Calendar className="h-4 w-4 text-orange-500" />
        </CardHeader>
        <CardContent>
          {mostRecentMeeting ? (
            <>
              <div className="text-2xl font-bold">
                {formatDate(mostRecentMeeting.meeting_date)}
              </div>
              <div className="flex items-center gap-1 mt-1">
                <Badge variant="secondary" className="text-xs">
                  {mostRecentMeeting.topic_overview.substring(0, 20)}
                  {mostRecentMeeting.topic_overview.length > 20 ? "..." : ""}
                </Badge>
              </div>
            </>
          ) : (
            <>
              <div className="text-2xl font-bold text-muted-foreground">-</div>
              <p className="text-xs text-muted-foreground">No meetings yet</p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 