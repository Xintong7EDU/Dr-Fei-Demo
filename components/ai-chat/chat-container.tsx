'use client'

import { useState, useEffect } from 'react'
import { useChat } from '@/hooks/use-chat'
import { MessageBubble } from './message-bubble'
import { ChatInput } from './chat-input'
import { TypingIndicator } from './typing-indicator'
import { MeetingContextSelector } from './meeting-context-selector'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Trash2, Settings, ChevronDown, ChevronUp, Calendar, Clock, FileText, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Meeting, MeetingNote } from '@/lib/types'
import { getMeeting, getMeetingNotes } from '@/app/actions'

interface ChatContainerProps {
  className?: string
  initialMeetingIds?: number[]
  title?: string
}

interface MeetingContextDetails {
  meeting: Meeting
  notes?: MeetingNote | null
}

export function ChatContainer({ 
  className,
  initialMeetingIds = [],
  title = "AI Meeting Assistant"
}: ChatContainerProps) {
  const [showContextSelector, setShowContextSelector] = useState(false)
  const [showContextDetails, setShowContextDetails] = useState(true)
  const [meetingDetails, setMeetingDetails] = useState<MeetingContextDetails[]>([])
  const [loadingDetails, setLoadingDetails] = useState(false)
  
  const {
    messages,
    isLoading,
    error,
    sendMessage,
    clearMessages,
    setMeetingIds,
    meetingIds,
    abortResponse
  } = useChat({ meetingIds: initialMeetingIds })

  // Load meeting details whenever meetingIds change
  useEffect(() => {
    const loadMeetingDetails = async () => {
      if (meetingIds.length === 0) {
        setMeetingDetails([])
        return
      }

      setLoadingDetails(true)
      try {
        const details = await Promise.all(
          meetingIds.map(async (id) => {
            const meeting = await getMeeting(id)
            const notes = await getMeetingNotes(id)
            return {
              meeting,
              notes
            }
          })
        )
        // Filter out any entries where meeting is null
        const validDetails = details.filter((detail): detail is MeetingContextDetails => 
          detail.meeting !== null
        )
        setMeetingDetails(validDetails)
      } catch (err) {
        console.error('Failed to load meeting details:', err)
      } finally {
        setLoadingDetails(false)
      }
    }

    loadMeetingDetails()
  }, [meetingIds])

  const handleSendMessage = async (content: string) => {
    await sendMessage(content)
  }

  const handleMeetingIdsChange = (ids: number[]) => {
    setMeetingIds(ids)
    setShowContextSelector(false)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString([], {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formatTime = (startTime: string, endTime: string) => {
    return `${startTime} - ${endTime}`
  }

  const formatDuration = (startTime: string, endTime: string) => {
    const start = new Date(`2000-01-01 ${startTime}`)
    const end = new Date(`2000-01-01 ${endTime}`)
    const diffMs = end.getTime() - start.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const hours = Math.floor(diffMins / 60)
    const mins = diffMins % 60
    
    if (hours > 0) {
      return `${hours}h ${mins}m`
    }
    return `${mins}m`
  }

  return (
    <Card className={cn("flex flex-col h-full", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-xl font-semibold">{title}</CardTitle>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowContextSelector(!showContextSelector)}
            className="flex items-center gap-1"
          >
            <Settings className="h-4 w-4" />
            Context ({meetingIds.length})
          </Button>
          {messages.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearMessages}
              className="flex items-center gap-1"
            >
              <Trash2 className="h-4 w-4" />
              Clear
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex flex-col flex-1 min-h-0 space-y-4">
        {/* Context Selector */}
        {showContextSelector && (
          <div className="border rounded-lg p-4 bg-muted/30">
            <MeetingContextSelector
              selectedMeetingIds={meetingIds}
              onMeetingIdsChange={handleMeetingIdsChange}
            />
          </div>
        )}

        {/* Context Details */}
        {meetingIds.length > 0 && !showContextSelector && (
          <div className="space-y-3">
            <Button
              variant="ghost"
              onClick={() => setShowContextDetails(!showContextDetails)}
              className="w-full justify-between p-3 h-auto bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-950/30"
            >
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-600" />
                <span className="font-medium">
                  Context: {meetingIds.length} meeting{meetingIds.length !== 1 ? 's' : ''} selected
                </span>
              </div>
              {showContextDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
            
            {showContextDetails && (
              <div className="space-y-3">
                {loadingDetails ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="text-sm text-muted-foreground">Loading context details...</div>
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {meetingDetails.map(({ meeting, notes }) => (
                      <Card key={meeting.meeting_id} className="border-l-4 border-l-blue-500">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <CardTitle className="text-sm font-medium line-clamp-2">
                                {meeting.topic_overview}
                              </CardTitle>
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {formatDate(meeting.meeting_date)}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {formatTime(meeting.start_time, meeting.end_time)}
                                </div>
                                <Badge variant="secondary" className="text-xs">
                                  {formatDuration(meeting.start_time, meeting.end_time)}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </CardHeader>
                        
                        {(notes?.note_content || notes?.summary || meeting.meeting_link) && (
                          <CardContent className="pt-0 space-y-3">
                            {meeting.meeting_link && (
                              <div className="space-y-1">
                                <div className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                                  <Users className="h-3 w-3" />
                                  Meeting Link
                                </div>
                                <div className="text-xs text-blue-600 break-all bg-blue-50 dark:bg-blue-950/20 p-2 rounded">
                                  {meeting.meeting_link}
                                </div>
                              </div>
                            )}
                            
                            {notes?.summary && (
                              <div className="space-y-1">
                                <div className="text-xs font-medium text-muted-foreground">Summary</div>
                                <div className="text-xs text-foreground bg-muted/50 p-2 rounded line-clamp-3">
                                  {notes.summary}
                                </div>
                              </div>
                            )}
                            
                            {notes?.note_content && (
                              <div className="space-y-1">
                                <div className="text-xs font-medium text-muted-foreground">Notes</div>
                                <div className="text-xs text-foreground bg-muted/50 p-2 rounded line-clamp-3">
                                  {notes.note_content}
                                </div>
                              </div>
                            )}
                          </CardContent>
                        )}
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Basic Context Info (fallback) */}
        {meetingIds.length > 0 && !showContextDetails && !showContextSelector && (
          <div className="text-sm text-muted-foreground bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            Using context from {meetingIds.length} meeting{meetingIds.length !== 1 ? 's' : ''}
          </div>
        )}

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-center">
              <div className="max-w-md space-y-3">
                <div className="text-lg font-medium text-muted-foreground">
                  Start a conversation
                </div>
                <div className="text-sm text-muted-foreground">
                  Ask questions about your meetings, get summaries, or discuss action items.
                  {meetingIds.length === 0 && (
                    <span className="block mt-2">
                      Use the Context button above to select meetings for AI reference.
                    </span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
              />
            ))
          )}
          
          {isLoading && <TypingIndicator />}
        </div>

        {/* Error Display */}
        {error && (
          <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
            {error}
            <Button
              variant="ghost"
              size="sm"
              className="ml-2 h-auto p-1 text-red-600 hover:text-red-700"
              onClick={() => window.location.reload()}
            >
              Retry
            </Button>
          </div>
        )}

        {/* Chat Input */}
        <div className="flex-shrink-0">
          <ChatInput
            onSendMessage={handleSendMessage}
            disabled={isLoading}
            onAbort={isLoading ? abortResponse : undefined}
            placeholder={
              meetingIds.length > 0 
                ? "Ask about your meetings..." 
                : "Type your message..."
            }
          />
        </div>
      </CardContent>
    </Card>
  )
} 