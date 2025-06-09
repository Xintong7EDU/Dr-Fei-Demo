"use client"

import type { Meeting } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, Clock, TrendingUp, MapPin } from "lucide-react"
import { getCurrentDateStringPST, parseDatePST, getLastWeekDatePST } from "@/lib/utils"

interface RecentMeetingsStatsProps {
  meetings: Meeting[]
}

/**
 * Displays statistics and analytics for recent meetings
 * Syncs with database data to show real-time metrics
 * All date calculations use PST timezone
 */
export function RecentMeetingsStats({ meetings }: RecentMeetingsStatsProps) {
  // Calculate current month meetings (using PST timezone)
  const currentDate = new Date(getCurrentDateStringPST() + 'T00:00:00')
  const currentMonth = currentDate.getMonth()
  const currentYear = currentDate.getFullYear()
  const thisMonthMeetings = meetings.filter((meeting) => {
    const meetingDate = parseDatePST(meeting.meeting_date)
    return meetingDate.getMonth() === currentMonth && meetingDate.getFullYear() === currentYear
  }).length

  // Calculate last week meetings (using PST timezone)
  const lastWeekDate = getLastWeekDatePST()
  const lastWeekMeetings = meetings.filter((meeting) => {
    const meetingDate = parseDatePST(meeting.meeting_date)
    return meetingDate >= lastWeekDate
  }).length

  // Calculate total hours and average duration
  const totalHours = meetings.reduce((total, meeting) => {
    const startTime = new Date(`1970-01-01 ${meeting.start_time}`)
    const endTime = new Date(`1970-01-01 ${meeting.end_time}`)
    const durationMs = endTime.getTime() - startTime.getTime()
    const durationHours = durationMs / (1000 * 60 * 60)
    return total + durationHours
  }, 0)

  const averageDuration = meetings.length > 0 ? totalHours / meetings.length : 0

  // Find most active month
  const monthCounts = meetings.reduce((acc, meeting) => {
    const date = parseDatePST(meeting.meeting_date)
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    acc[monthKey] = (acc[monthKey] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const mostActiveMonthData = Object.entries(monthCounts).reduce(
    (max, [month, count]) => count > max.count ? { month, count } : max,
    { month: '', count: 0 }
  )

  const mostActiveMonth = mostActiveMonthData.month 
    ? new Date(mostActiveMonthData.month + '-01').toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
    : 'N/A'

  const stats = [
    {
      title: "Total Meetings",
      value: meetings.length.toString(),
      icon: Calendar,
      description: "All completed meetings"
    },
    {
      title: "This Month",
      value: thisMonthMeetings.toString(),
      icon: TrendingUp,
      description: `Meetings in ${currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`
    },
    {
      title: "Last 7 Days",
      value: lastWeekMeetings.toString(),
      icon: Clock,
      description: "Recent meeting activity"
    },
    {
      title: "Total Hours",
      value: totalHours.toFixed(1),
      icon: Clock,
      description: `Avg ${averageDuration.toFixed(1)}h per meeting`
    },
    {
      title: "Most Active Month",
      value: mostActiveMonth,
      icon: TrendingUp,
      description: `${mostActiveMonthData.count} meeting${mostActiveMonthData.count !== 1 ? 's' : ''}`
    }
  ]

  return (
    <div className="space-y-4">
      {/* PST Timezone Notice */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <MapPin className="h-3 w-3" />
        <span>Statistics calculated using Pacific Standard Time (PST)</span>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {stats.map((stat, index) => (
          <Card key={index} className="shadow-sm hover:shadow-md transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
} 