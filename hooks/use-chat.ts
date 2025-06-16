'use client'

import { useState, useCallback, useRef } from 'react'
import type { ChatMessage } from '@/lib/types'

interface UseChatOptions {
  initialMessages?: ChatMessage[]
  meetingIds?: number[]
}

interface UseChatReturn {
  messages: ChatMessage[]
  isLoading: boolean
  error: string | null
  sendMessage: (content: string) => Promise<void>
  clearMessages: () => void
  setMeetingIds: (ids: number[]) => void
  meetingIds: number[]
  abortResponse: () => void
}

export function useChat(options: UseChatOptions = {}): UseChatReturn {
  const { initialMessages = [], meetingIds: initialMeetingIds = [] } = options
  
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [meetingIds, setMeetingIds] = useState<number[]>(initialMeetingIds)
  
  const abortControllerRef = useRef<AbortController | null>(null)

  const generateMessageId = useCallback(() => {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9)
  }, [])

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return

    // Create user message
    const userMessage: ChatMessage = {
      id: generateMessageId(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
      context_meetings: meetingIds.length > 0 ? meetingIds : undefined
    }

    // Add user message immediately
    setMessages(prev => [...prev, userMessage])
    setIsLoading(true)
    setError(null)

    try {
      // Create abort controller for this request
      abortControllerRef.current = new AbortController()

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          meetingIds,
          stream: true
        }),
        signal: abortControllerRef.current.signal
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to send message')
      }

      // Create assistant message
      const assistantMessage: ChatMessage = {
        id: generateMessageId(),
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        context_meetings: meetingIds.length > 0 ? meetingIds : undefined
      }

      // Add empty assistant message
      setMessages(prev => [...prev, assistantMessage])

      // Handle streaming response
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error('No response stream available')
      }

      let done = false
      while (!done) {
        const { value, done: readerDone } = await reader.read()
        done = readerDone

        if (value) {
          const chunk = decoder.decode(value)
          const lines = chunk.split('\n')

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6))
                
                if (data.error) {
                  throw new Error(data.error)
                }
                
                if (data.done) {
                  done = true
                  break
                }
                
                if (data.content) {
                  // Update the assistant message content
                  setMessages(prev => {
                    const updated = [...prev]
                    const lastMessage = updated[updated.length - 1]
                    if (lastMessage && lastMessage.role === 'assistant') {
                      updated[updated.length - 1] = {
                        ...lastMessage,
                        content: lastMessage.content + data.content
                      }
                    }
                    return updated
                  })
                }
              } catch (parseError) {
                console.error('Error parsing stream data:', parseError)
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Chat error:', error)
      
      // Don't show error if it was aborted
      if (error instanceof Error && error.name !== 'AbortError') {
        setError(error.message || 'Failed to send message')
        
        // Remove the empty assistant message if there was an error
        setMessages(prev => {
          const updated = [...prev]
          const lastMessage = updated[updated.length - 1]
          if (lastMessage && lastMessage.role === 'assistant' && !lastMessage.content) {
            updated.pop()
          }
          return updated
        })
      }
    } finally {
      setIsLoading(false)
      abortControllerRef.current = null
    }
  }, [messages, meetingIds, isLoading, generateMessageId])

  const clearMessages = useCallback(() => {
    setMessages([])
    setError(null)
  }, [])

  const abortResponse = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      setIsLoading(false)
    }
  }, [])

  const setMeetingIdsCallback = useCallback((ids: number[]) => {
    setMeetingIds(ids)
  }, [])

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearMessages,
    setMeetingIds: setMeetingIdsCallback,
    meetingIds,
    abortResponse
  }
} 