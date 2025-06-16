"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import type { Meeting } from "@/lib/types"
import { updateMeeting } from "@/app/actions"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Link as LinkIcon, Calendar, Clock, FileText } from "lucide-react"

interface EditMeetingFormProps {
  meeting: Meeting
}

export function EditMeetingForm({ meeting }: EditMeetingFormProps) {
  const [meetingDate, setMeetingDate] = useState(meeting.meeting_date)
  const [startTime, setStartTime] = useState(meeting.start_time)
  const [endTime, setEndTime] = useState(meeting.end_time)
  const [topic, setTopic] = useState(meeting.topic_overview)
  const [meetingLink, setMeetingLink] = useState(meeting.meeting_link || '')
  const [isSaving, setIsSaving] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  // Helper function to validate URLs
  const isValidUrl = (string: string) => {
    try {
      new URL(string)
      return true
    } catch {
      return false
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    // Validate meeting link if provided
    if (meetingLink.trim() && !isValidUrl(meetingLink.trim())) {
      toast({
        title: 'Invalid Meeting Link',
        description: 'Please enter a valid URL for the meeting link',
        variant: 'destructive',
      })
      return
    }

    setIsSaving(true)
    try {
      await updateMeeting(meeting.meeting_id, {
        meeting_date: meetingDate,
        start_time: startTime,
        end_time: endTime,
        topic_overview: topic,
        meeting_link: meetingLink.trim() || undefined,
      })
      toast({ title: "Meeting updated" })
      router.push(`/meetings/${meeting.meeting_id}`)
    } catch {
      toast({ title: "Error updating meeting", variant: "destructive" })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Edit Meeting</h1>
      </div>
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
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
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Meeting Time
              </Label>
              <div className="flex gap-2">
                <Input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                  className="flex-1"
                />
                <Input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  required
                  className="flex-1"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="topic" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Meeting Topic
              </Label>
              <Textarea
                id="topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="meeting-link" className="flex items-center gap-2">
                <LinkIcon className="h-4 w-4" />
                Meeting Link
              </Label>
              <Input
                id="meeting-link"
                value={meetingLink}
                onChange={(e) => setMeetingLink(e.target.value)}
                placeholder="Enter the meeting link..."
              />
            </div>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

