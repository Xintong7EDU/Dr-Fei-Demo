'use client'

import { useState, useEffect } from 'react'
import { useChat } from '@/hooks/use-chat'
import { MessageBubble } from './message-bubble'
import { ChatInput } from './chat-input'
import { TypingIndicator } from './typing-indicator'
import { MeetingContextSelector } from './meeting-context-selector'
import { PresetQuestions } from './preset-questions'
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
  const [expandedNotes, setExpandedNotes] = useState<Set<number>>(new Set())
  
  const {
    messages,
    isLoading,
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
        // Filter out any entries where meeting is null and cast the valid ones
        const validDetails = details
          .filter((detail): detail is { meeting: Meeting; notes: MeetingNote | null } => 
            detail.meeting !== null
          )
          .map((detail) => ({
            meeting: detail.meeting,
            notes: detail.notes
          }))
        setMeetingDetails(validDetails)
        // Reset expanded notes when meetings change
        setExpandedNotes(new Set())
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

  const toggleNoteExpansion = (meetingId: number) => {
    setExpandedNotes(prev => {
      const newSet = new Set(prev)
      if (newSet.has(meetingId)) {
        newSet.delete(meetingId)
      } else {
        newSet.add(meetingId)
      }
      return newSet
    })
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
                        
                        {(notes?.note_content || meeting.meeting_link) && (
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
                            
                            {notes?.note_content && (
                              <div className="space-y-2">
                                <Button
                                  variant="ghost"
                                  onClick={() => toggleNoteExpansion(meeting.meeting_id)}
                                  className="w-full justify-between p-2 h-auto text-xs font-medium text-muted-foreground hover:bg-muted/50"
                                >
                                  <div className="flex items-center gap-1">
                                    <FileText className="h-3 w-3" />
                                    Meeting Notes
                                  </div>
                                  {expandedNotes.has(meeting.meeting_id) ? 
                                    <ChevronUp className="h-3 w-3" /> : 
                                    <ChevronDown className="h-3 w-3" />
                                  }
                                </Button>
                                
                                {expandedNotes.has(meeting.meeting_id) && (
                                  <div className="text-sm text-foreground bg-muted/50 p-3 rounded-md border max-h-96 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                                    {notes.note_content}
                                  </div>
                                )}
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
        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto space-y-4 p-1">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-medium text-lg">AI Meeting Assistant</h3>
                  <p className="text-sm text-muted-foreground">
                    {meetingIds.length > 0 
                      ? "Ask me anything about your selected meetings"
                      : "Select meeting context and start chatting"}
                  </p>
                </div>
              </div>
            ) : (
              messages.map((message, index) => (
                <MessageBubble key={index} message={message} />
              ))
            )}
            {isLoading && <TypingIndicator />}
          </div>
        </div>

        {/* Chat Input */}
        <div className="border-t pt-4 space-y-4">
          {/* Show preset questions when there are no messages or when it makes sense */}
          {(messages.length === 0 || (messages.length <= 2 && meetingIds.length > 0)) && (
            <PresetQuestions
              onQuestionClick={handleSendMessage}
              disabled={isLoading}
              meetingIds={meetingIds}
            />
          )}
          
          <ChatInput 
            onSendMessage={handleSendMessage}
            disabled={isLoading}
            onAbort={abortResponse}
            placeholder={meetingIds.length > 0 
              ? "Ask about your meetings..." 
              : "Select meeting context first..."
            }
          />
        </div>
      </CardContent>
    </Card>
  )
} 