/**
 * Chat input component with send functionality
 * Handles message composition and submission
 */

'use client'

import React, { useState, useRef, KeyboardEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { Send, Square, Loader2 } from 'lucide-react'

interface ChatInputProps {
  onSendMessage: (message: string) => void
  onStopGeneration?: () => void
  isLoading?: boolean
  isStreaming?: boolean
  disabled?: boolean
  placeholder?: string
}

/**
 * Auto-resizing textarea component
 */
const AutoResizeTextarea: React.FC<{
  value: string
  onChange: (value: string) => void
  onKeyDown?: (e: KeyboardEvent<HTMLTextAreaElement>) => void
  placeholder?: string
  disabled?: boolean
  maxRows?: number
}> = ({ 
  value, 
  onChange, 
  onKeyDown, 
  placeholder = "Type your message...",
  disabled = false,
  maxRows = 6 
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value)
    
    // Auto-resize logic
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      const scrollHeight = textarea.scrollHeight
      const lineHeight = 24 // Approximate line height
      const maxHeight = lineHeight * maxRows
      
      textarea.style.height = `${Math.min(scrollHeight, maxHeight)}px`
    }
  }

  return (
    <Textarea
      ref={textareaRef}
      value={value}
      onChange={handleChange}
      onKeyDown={onKeyDown}
      placeholder={placeholder}
      disabled={disabled}
      className="min-h-[44px] resize-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent"
      rows={1}
    />
  )
}

/**
 * Main chat input component
 */
export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  onStopGeneration,
  isLoading = false,
  isStreaming = false,
  disabled = false,
  placeholder = "Ask about your notes...",
}) => {
  const [message, setMessage] = useState('')

  /**
   * Handle message submission
   */
  const handleSendMessage = () => {
    const trimmedMessage = message.trim()
    if (!trimmedMessage || disabled || isLoading) return

    onSendMessage(trimmedMessage)
    setMessage('')
  }

  /**
   * Handle stop generation
   */
  const handleStopGeneration = () => {
    onStopGeneration?.()
  }

  /**
   * Handle keyboard shortcuts
   */
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const canSend = message.trim().length > 0 && !disabled && !isLoading
  const showStop = isStreaming && onStopGeneration

  return (
    <div className="border-t bg-background p-4">
      <Card className="relative">
        <div className="flex items-end gap-2 p-2">
          {/* Message input */}
          <div className="flex-1">
            <AutoResizeTextarea
              value={message}
              onChange={setMessage}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={disabled || isLoading}
              maxRows={6}
            />
          </div>

          {/* Send/Stop button */}
          <div className="flex-shrink-0 pb-2">
            {showStop ? (
              <Button
                size="sm"
                variant="outline"
                onClick={handleStopGeneration}
                className="h-8 w-8 p-0"
                title="Stop generation"
              >
                <Square className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={handleSendMessage}
                disabled={!canSend}
                className="h-8 w-8 p-0"
                title={canSend ? "Send message (Enter)" : "Type a message to send"}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Character count and shortcuts hint */}
        <div className="flex items-center justify-between px-3 pb-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span>Press Enter to send, Shift+Enter for new line</span>
          </div>
          <div className="flex items-center gap-2">
            {message.length > 0 && (
              <span className={message.length > 3000 ? 'text-destructive' : ''}>
                {message.length}/4000
              </span>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}

/**
 * Compact chat input variant for smaller spaces
 */
export const CompactChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  onStopGeneration,
  isLoading = false,
  isStreaming = false,
  disabled = false,
  placeholder = "Ask about your notes...",
}) => {
  const [message, setMessage] = useState('')

  const handleSendMessage = () => {
    const trimmedMessage = message.trim()
    if (!trimmedMessage || disabled || isLoading) return

    onSendMessage(trimmedMessage)
    setMessage('')
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const canSend = message.trim().length > 0 && !disabled && !isLoading
  const showStop = isStreaming && onStopGeneration

  return (
    <div className="flex items-center gap-2 p-2 border-t bg-background">
      <div className="flex-1">
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled || isLoading}
          className="min-h-[36px] resize-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-muted/50 rounded-lg"
          rows={1}
        />
      </div>

      {showStop ? (
        <Button
          size="sm"
          variant="outline"
          onClick={onStopGeneration}
          className="h-9 w-9 p-0"
        >
          <Square className="h-4 w-4" />
        </Button>
      ) : (
        <Button
          size="sm"
          onClick={handleSendMessage}
          disabled={!canSend}
          className="h-9 w-9 p-0"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      )}
    </div>
  )
}
