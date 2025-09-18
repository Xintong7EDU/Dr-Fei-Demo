"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import type { Meeting } from "@/lib/types"
import { updateMeeting } from "@/app/actions"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"

interface EditMeetingFormProps {
  meeting: Meeting
}

export function EditMeetingForm({ meeting }: EditMeetingFormProps) {
  const [meetingDate, setMeetingDate] = useState(meeting.meeting_date)
  const [startTime, setStartTime] = useState(meeting.start_time)
  const [endTime, setEndTime] = useState(meeting.end_time)
  const [topic, setTopic] = useState(meeting.topic_overview)
  const [isSaving, setIsSaving] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      await updateMeeting(meeting.meeting_id, {
        meeting_date: meetingDate,
        start_time: startTime,
        end_time: endTime,
        topic_overview: topic,
      })
      toast({ title: "Meeting updated" })
      router.push(`/`)
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
            <Input
              type="date"
              value={meetingDate}
              onChange={(e) => setMeetingDate(e.target.value)}
              required
            />
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
            <Textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              required
            />
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

