'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createMeeting } from '@/app/actions'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'

export default function NewMeetingPage() {
  const [meetingDate, setMeetingDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [topic, setTopic] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      const meeting = await createMeeting({
        meeting_date: meetingDate,
        start_time: startTime,
        end_time: endTime,
        topic_overview: topic,
      })
      toast({ title: 'Meeting scheduled' })
      router.push(`/meetings/${meeting.meeting_id}`)
    } catch {
      toast({
        title: 'Error scheduling meeting',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Schedule a New Meeting</h1>
        <p className="text-muted-foreground">Enter details for your meeting.</p>
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
              placeholder="Topic overview"
              required
            />
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Create Meeting'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
