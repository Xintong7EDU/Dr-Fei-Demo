'use client'

import { useState, useRef, KeyboardEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Send, Square } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ChatInputProps {
  onSendMessage: (message: string) => void
  disabled?: boolean
  placeholder?: string
  onAbort?: () => void
  className?: string
}

export function ChatInput({
  onSendMessage,
  disabled = false,
  placeholder = "Type your message...",
  onAbort,
  className
}: ChatInputProps) {
  const [message, setMessage] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSend = () => {
    const trimmedMessage = message.trim()
    if (!trimmedMessage || disabled) return

    onSendMessage(trimmedMessage)
    setMessage('')
    
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value)
    
    // Auto-resize textarea
    const textarea = e.target
    textarea.style.height = 'auto'
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`
  }

  const canSend = message.trim().length > 0 && !disabled

  return (
    <div className={cn("flex items-end gap-2", className)}>
      <div className="flex-1 relative">
        <Textarea
          ref={textareaRef}
          value={message}
          onChange={handleTextareaChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          className="min-h-[44px] max-h-[120px] resize-none pr-12 py-3"
        />
        
        {/* Character count for long messages */}
        {message.length > 100 && (
          <div className="absolute bottom-1 right-2 text-xs text-muted-foreground">
            {message.length}/2000
          </div>
        )}
      </div>

      {/* Send/Abort Button */}
      <Button
        onClick={disabled && onAbort ? onAbort : handleSend}
        disabled={!canSend && !onAbort}
        size="sm"
        className="h-11 px-3"
        variant={disabled && onAbort ? "destructive" : "default"}
      >
        {disabled && onAbort ? (
          <Square className="h-4 w-4" />
        ) : (
          <Send className="h-4 w-4" />
        )}
      </Button>
    </div>
  )
} 