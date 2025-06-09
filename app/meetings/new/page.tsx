'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createMeeting } from '@/app/actions'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Calendar, Clock, FileText, Plus } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { getCurrentDateStringPST, formatDate } from '@/lib/utils'
import { FadeIn, SlideUp } from '@/components/ui/motion'
import Link from 'next/link'

export default function NewMeetingPage() {
  const [meetingDate, setMeetingDate] = useState(getCurrentDateStringPST())
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [topic, setTopic] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
    if (!meetingDate || !startTime || !endTime || !topic.trim()) {
      toast({
        title: 'Please fill in all fields',
        variant: 'destructive',
      })
      return
    }

    // Validate time range
    const start = new Date(`1970-01-01 ${startTime}`)
    const end = new Date(`1970-01-01 ${endTime}`)
    if (end <= start) {
      toast({
        title: 'End time must be after start time',
        variant: 'destructive',
      })
      return
    }

    setIsSaving(true)
    try {
      const meeting = await createMeeting({
        meeting_date: meetingDate,
        start_time: startTime,
        end_time: endTime,
        topic_overview: topic.trim(),
      })
      toast({ 
        title: 'Meeting scheduled successfully',
        description: `Meeting scheduled for ${formatDate(meetingDate)} at ${startTime} PST`
      })
      router.push(`/meetings/${meeting.meeting_id}`)
    } catch (error) {
      console.error('Error creating meeting:', error)
      toast({
        title: 'Error scheduling meeting',
        description: 'Please try again later',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const setTimeToCurrentPlus1Hour = () => {
    const now = new Date()
    const currentHour = now.getHours()
    const currentMinute = now.getMinutes()
    
    const startHour = String(currentHour).padStart(2, '0')
    const startMinutes = String(Math.ceil(currentMinute / 15) * 15).padStart(2, '0')
    const endHour = String(currentHour + 1).padStart(2, '0')
    
    setStartTime(`${startHour}:${startMinutes}`)
    setEndTime(`${endHour}:${startMinutes}`)
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      {/* Header Section */}
      <FadeIn>
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="icon" 
            asChild 
            className="hover:scale-105 transition-transform shadow-sm hover:shadow-md"
          >
            <Link href="/recent" aria-label="Back to recent meetings">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <Plus className="h-8 w-8 text-primary" />
              Schedule New Meeting
            </h1>
            <p className="text-muted-foreground mt-1">
              Create a new meeting with automatic PST timezone handling.
            </p>
          </div>
        </div>
      </FadeIn>

      {/* PST Timezone Notice */}
      <SlideUp delay={0.1}>
        <Card className="border-l-4 border-l-blue-500 bg-blue-50/50 dark:bg-blue-950/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
              <Clock className="h-4 w-4" />
              <span className="text-sm font-medium">
                All times are automatically set to Pacific Standard Time (PST)
              </span>
            </div>
          </CardContent>
        </Card>
      </SlideUp>

      {/* Meeting Form */}
      <SlideUp delay={0.2}>
        <Card className="shadow-sm hover:shadow-md transition-all">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Meeting Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Date Selection */}
              <div className="space-y-2">
                <Label htmlFor="meeting-date" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Meeting Date
                </Label>
                <Input
                  id="meeting-date"
                  type="date"
                  value={meetingDate}
                  onChange={(e) => setMeetingDate(e.target.value)}
                  required
                  min={getCurrentDateStringPST()}
                  className="text-base"
                />
                {meetingDate && (
                  <p className="text-sm text-muted-foreground">
                    {formatDate(meetingDate)}
                  </p>
                )}
              </div>

              {/* Time Selection */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Meeting Time (PST)
                  </Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={setTimeToCurrentPlus1Hour}
                    className="text-xs"
                  >
                    Set to Now + 1 Hour
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start-time" className="text-sm text-muted-foreground">
                      Start Time
                    </Label>
                    <Input
                      id="start-time"
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      required
                      className="text-base"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end-time" className="text-sm text-muted-foreground">
                      End Time
                    </Label>
                    <Input
                      id="end-time"
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      required
                      className="text-base"
                    />
                  </div>
                </div>
                {startTime && endTime && (
                  <p className="text-sm text-muted-foreground">
                    Duration: {(() => {
                      const start = new Date(`1970-01-01 ${startTime}`)
                      const end = new Date(`1970-01-01 ${endTime}`)
                      const diffMs = end.getTime() - start.getTime()
                      const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
                      const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
                      return diffHours > 0 ? `${diffHours}h ${diffMinutes}m` : `${diffMinutes}m`
                    })()}
                  </p>
                )}
              </div>

              {/* Topic Input */}
              <div className="space-y-2">
                <Label htmlFor="topic" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Meeting Topic
                </Label>
                <Textarea
                  id="topic"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Enter the main topic or agenda for this meeting..."
                  required
                  rows={4}
                  className="text-base resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  {topic.length} characters
                </p>
              </div>

              {/* Submit Button */}
              <div className="flex gap-3 pt-4">
                <Button 
                  type="submit" 
                  disabled={isSaving}
                  className="flex-1"
                  size="lg"
                >
                  {isSaving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Creating Meeting...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Meeting
                    </>
                  )}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  asChild
                  size="lg"
                >
                  <Link href="/recent">Cancel</Link>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </SlideUp>
    </div>
  )
}
