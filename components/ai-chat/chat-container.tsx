'use client'

import { useState } from 'react'
import { useChat } from '@/hooks/use-chat'
import { MessageBubble } from './message-bubble'
import { ChatInput } from './chat-input'
import { TypingIndicator } from './typing-indicator'
import { MeetingContextSelector } from './meeting-context-selector'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Trash2, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ChatContainerProps {
  className?: string
  initialMeetingIds?: number[]
  title?: string
}

export function ChatContainer({ 
  className,
  initialMeetingIds = [],
  title = "AI Meeting Assistant"
}: ChatContainerProps) {
  const [showContextSelector, setShowContextSelector] = useState(false)
  
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

  const handleSendMessage = async (content: string) => {
    await sendMessage(content)
  }

  const handleMeetingIdsChange = (ids: number[]) => {
    setMeetingIds(ids)
    setShowContextSelector(false)
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

        {/* Context Info */}
        {meetingIds.length > 0 && !showContextSelector && (
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