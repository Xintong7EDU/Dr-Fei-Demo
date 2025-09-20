/**
 * Message list component for chat interface
 * Displays conversation messages with citations and formatting
 */

'use client'

import React, { useEffect, useRef } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { User, Bot, FileText } from 'lucide-react'
import { Citations } from './Citations'
import type { Message } from '@/lib/types'

interface MessageListProps {
  messages: Message[]
  isLoading?: boolean
  streamingMessage?: string
}

/**
 * Format message timestamp
 */
const formatMessageTime = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false 
  })
}

/**
 * Individual message component
 */
const MessageItem: React.FC<{
  message: Message
  isStreaming?: boolean
  streamingContent?: string
}> = ({ message, isStreaming = false, streamingContent }) => {
  const isUser = message.role === 'user'
  const isSystem = message.role === 'system'
  
  // Don't render system messages in UI
  if (isSystem) return null

  const content = typeof message.content === 'string' 
    ? message.content 
    : message.content.text

  const citations = typeof message.content !== 'string' 
    ? message.content.citations 
    : undefined

  const displayContent = isStreaming && streamingContent !== undefined 
    ? streamingContent 
    : content

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      <Avatar className="h-8 w-8 flex-shrink-0">
        {isUser ? (
          <User className="h-4 w-4" />
        ) : (
          <Bot className="h-4 w-4" />
        )}
      </Avatar>

      {/* Message content */}
      <div className={`flex-1 max-w-[80%] ${isUser ? 'items-end' : 'items-start'} flex flex-col`}>
        <Card className={`p-3 ${
          isUser 
            ? 'bg-primary text-primary-foreground ml-auto' 
            : 'bg-muted'
        }`}>
          <div className="space-y-2">
            {/* Message text */}
            <div className="text-sm whitespace-pre-wrap break-words">
              {displayContent}
              {isStreaming && (
                <span className="inline-block w-2 h-4 bg-current opacity-75 animate-pulse ml-1" />
              )}
            </div>

            {/* Citations */}
            {citations && citations.length > 0 && !isStreaming && (
              <Citations citations={citations} />
            )}
          </div>
        </Card>

        {/* Timestamp */}
        <div className={`text-xs text-muted-foreground mt-1 ${
          isUser ? 'text-right' : 'text-left'
        }`}>
          {formatMessageTime(message.created_at)}
          {message.token_count && (
            <span className="ml-2">
              {message.token_count} tokens
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * Loading indicator for message generation
 */
const LoadingMessage: React.FC = () => (
  <div className="flex gap-3">
    <Avatar className="h-8 w-8 flex-shrink-0">
      <Bot className="h-4 w-4" />
    </Avatar>
    <Card className="p-3 bg-muted">
      <div className="flex items-center gap-2">
        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-current rounded-full animate-bounce" />
          <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
          <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
        </div>
        <span className="text-sm text-muted-foreground">Thinking...</span>
      </div>
    </Card>
  </div>
)

/**
 * Empty state component
 */
const EmptyState: React.FC = () => (
  <div className="flex-1 flex items-center justify-center">
    <div className="text-center space-y-4 max-w-md">
      <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mx-auto">
        <FileText className="h-8 w-8 text-muted-foreground" />
      </div>
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Start a conversation</h3>
        <p className="text-sm text-muted-foreground">
          Ask questions about your notes and I&apos;ll help you find relevant information with citations.
        </p>
      </div>
      <div className="flex flex-wrap gap-2 justify-center">
        <Badge variant="outline" className="text-xs">
          &ldquo;Summarize my meeting notes from today&rdquo;
        </Badge>
        <Badge variant="outline" className="text-xs">
          &ldquo;What action items do I have?&rdquo;
        </Badge>
        <Badge variant="outline" className="text-xs">
          &ldquo;Find notes about project planning&rdquo;
        </Badge>
      </div>
    </div>
  </div>
)

/**
 * Main message list component
 */
export const MessageList: React.FC<MessageListProps> = ({
  messages,
  isLoading = false,
  streamingMessage,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingMessage])

  // Filter out system messages for display
  const displayMessages = messages.filter(msg => msg.role !== 'system')

  if (displayMessages.length === 0 && !isLoading && !streamingMessage) {
    return <EmptyState />
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {displayMessages.map((message, index) => {
        const isLastAssistantMessage = 
          index === displayMessages.length - 1 && 
          message.role === 'assistant'

        return (
          <MessageItem
            key={message.id}
            message={message}
            isStreaming={isLastAssistantMessage && !!streamingMessage}
            streamingContent={isLastAssistantMessage ? streamingMessage : undefined}
          />
        )
      })}

      {/* Show loading indicator when generating response */}
      {isLoading && !streamingMessage && <LoadingMessage />}

      {/* Scroll anchor */}
      <div ref={messagesEndRef} />
    </div>
  )
}
