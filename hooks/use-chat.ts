/**
 * Chat hook for managing threads, messages, and streaming
 * Provides state management and real-time updates for chat interface
 */

'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { subscribeToMessages, subscribeToThread } from '@/lib/chat'
import type { Thread, Message } from '@/lib/types'

export interface ChatState {
  // Threads
  threads: Thread[]
  activeThread: Thread | null
  
  // Messages
  messages: Message[]
  streamingMessage: string
  
  // Loading states
  isLoadingThreads: boolean
  isLoadingMessages: boolean
  isStreaming: boolean
  isSending: boolean
  
  // Error states
  error: string | null
}

export interface ChatActions {
  // Thread management
  createThread: (title?: string) => Promise<Thread | null>
  selectThread: (threadId: string) => Promise<void>
  deleteThread: (threadId: string) => Promise<void>
  renameThread: (threadId: string, title: string) => Promise<void>
  
  // Message management
  sendMessage: (content: string) => Promise<void>
  stopGeneration: () => void
  loadMessages: (threadId: string) => Promise<void>
  
  // Utility
  clearError: () => void
  refreshThreads: () => Promise<void>
}

export interface UseChatReturn extends ChatState, ChatActions {}

/**
 * Main chat hook
 */
export const useChat = (): UseChatReturn => {
  // State
  const [threads, setThreads] = useState<Thread[]>([])
  const [activeThread, setActiveThread] = useState<Thread | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [streamingMessage, setStreamingMessage] = useState('')
  
  // Loading states
  const [isLoadingThreads, setIsLoadingThreads] = useState(true)
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const [isSending, setIsSending] = useState(false)
  
  // Error state
  const [error, setError] = useState<string | null>(null)
  
  // Refs for cleanup
  const abortControllerRef = useRef<AbortController | null>(null)
  const subscriptionRef = useRef<any>(null)
  const threadSubscriptionRef = useRef<any>(null)

  /**
   * Load user threads
   */
  const loadThreads = useCallback(async () => {
    try {
      setIsLoadingThreads(true)
      setError(null)

      const response = await fetch('/api/chat/sessions')
      
      if (!response.ok) {
        throw new Error(`Failed to load threads: ${response.statusText}`)
      }

      const data = await response.json()
      setThreads(data.threads || [])
    } catch (err) {
      console.error('Failed to load threads:', err)
      setError(err instanceof Error ? err.message : 'Failed to load threads')
    } finally {
      setIsLoadingThreads(false)
    }
  }, [])

  /**
   * Create new thread
   */
  const createThread = useCallback(async (title?: string): Promise<Thread | null> => {
    try {
      setError(null)

      const response = await fetch('/api/chat/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      })

      if (!response.ok) {
        throw new Error(`Failed to create thread: ${response.statusText}`)
      }

      const data = await response.json()
      const newThread = data.thread

      setThreads(prev => [newThread, ...prev])
      return newThread
    } catch (err) {
      console.error('Failed to create thread:', err)
      setError(err instanceof Error ? err.message : 'Failed to create thread')
      return null
    }
  }, [])

  /**
   * Select and load thread
   */
  const selectThread = useCallback(async (threadId: string) => {
    try {
      setError(null)
      setIsLoadingMessages(true)

      // Find thread in current list
      const thread = threads.find(t => t.id === threadId)
      if (thread) {
        setActiveThread(thread)
      }

      // Load messages for thread
      await loadMessages(threadId)
    } catch (err) {
      console.error('Failed to select thread:', err)
      setError(err instanceof Error ? err.message : 'Failed to load thread')
    } finally {
      setIsLoadingMessages(false)
    }
  }, [threads])

  /**
   * Load messages for a thread
   */
  const loadMessages = useCallback(async (threadId: string) => {
    try {
      const response = await fetch(`/api/chat/messages?threadId=${threadId}`)
      
      if (!response.ok) {
        throw new Error(`Failed to load messages: ${response.statusText}`)
      }

      const data = await response.json()
      setMessages(data.messages || [])
    } catch (err) {
      console.error('Failed to load messages:', err)
      setError(err instanceof Error ? err.message : 'Failed to load messages')
    }
  }, [])

  /**
   * Send message with streaming response
   */
  const sendMessage = useCallback(async (content: string) => {
    if (!activeThread || isSending) return

    try {
      setIsSending(true)
      setIsStreaming(true)
      setStreamingMessage('')
      setError(null)

      // Create abort controller for this request
      const abortController = new AbortController()
      abortControllerRef.current = abortController

      const response = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          threadId: activeThread.id,
          content,
        }),
        signal: abortController.signal,
      })

      if (!response.ok) {
        throw new Error(`Failed to send message: ${response.statusText}`)
      }

      const reader = response.body?.getReader()
      if (!reader) throw new Error('No response stream')

      const decoder = new TextDecoder()
      let buffer = ''

      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6)
              if (data === '[DONE]') {
                setIsStreaming(false)
                setStreamingMessage('')
                // Reload messages to get the final saved messages
                await loadMessages(activeThread.id)
                return
              }

              try {
                const parsed = JSON.parse(data)
                
                if (parsed.type === 'token') {
                  setStreamingMessage(prev => prev + parsed.data.token)
                } else if (parsed.type === 'complete') {
                  setIsStreaming(false)
                  setStreamingMessage('')
                  if (parsed.data.error) {
                    setError(parsed.data.error)
                  } else {
                    // Reload messages to get the final saved messages
                    await loadMessages(activeThread.id)
                  }
                } else if (parsed.type === 'error') {
                  setError(parsed.data.error)
                  setIsStreaming(false)
                  setStreamingMessage('')
                }
              } catch (e) {
                // Skip invalid JSON
              }
            }
          }
        }
      } finally {
        reader.releaseLock()
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        // Request was cancelled
        setIsStreaming(false)
        setStreamingMessage('')
        return
      }
      
      console.error('Failed to send message:', err)
      setError(err instanceof Error ? err.message : 'Failed to send message')
      setIsStreaming(false)
      setStreamingMessage('')
    } finally {
      setIsSending(false)
      abortControllerRef.current = null
    }
  }, [activeThread, isSending, loadMessages])

  /**
   * Stop message generation
   */
  const stopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    setIsStreaming(false)
    setIsSending(false)
    setStreamingMessage('')
  }, [])

  /**
   * Delete thread
   */
  const deleteThread = useCallback(async (threadId: string) => {
    try {
      setError(null)

      const response = await fetch(`/api/chat/sessions?id=${threadId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error(`Failed to delete thread: ${response.statusText}`)
      }

      setThreads(prev => prev.filter(t => t.id !== threadId))
      
      // If deleted thread was active, clear it
      if (activeThread?.id === threadId) {
        setActiveThread(null)
        setMessages([])
      }
    } catch (err) {
      console.error('Failed to delete thread:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete thread')
    }
  }, [activeThread])

  /**
   * Rename thread
   */
  const renameThread = useCallback(async (threadId: string, title: string) => {
    try {
      setError(null)

      const response = await fetch('/api/chat/sessions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ threadId, title }),
      })

      if (!response.ok) {
        throw new Error(`Failed to rename thread: ${response.statusText}`)
      }

      const data = await response.json()
      const updatedThread = data.thread

      setThreads(prev => prev.map(t => t.id === threadId ? updatedThread : t))
      
      if (activeThread?.id === threadId) {
        setActiveThread(updatedThread)
      }
    } catch (err) {
      console.error('Failed to rename thread:', err)
      setError(err instanceof Error ? err.message : 'Failed to rename thread')
    }
  }, [activeThread])

  /**
   * Clear error
   */
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  /**
   * Refresh threads
   */
  const refreshThreads = useCallback(async () => {
    await loadThreads()
  }, [loadThreads])

  // Setup real-time subscriptions
  useEffect(() => {
    if (!activeThread) return

    // Subscribe to new messages
    const messageSubscription = subscribeToMessages(
      activeThread.id,
      (newMessage) => {
        setMessages(prev => {
          // Avoid duplicates
          if (prev.some(m => m.id === newMessage.id)) return prev
          return [...prev, newMessage]
        })
      }
    )

    // Subscribe to thread updates
    const threadSubscription = subscribeToThread(
      activeThread.id,
      (updatedThread) => {
        setActiveThread(updatedThread)
        setThreads(prev => prev.map(t => t.id === updatedThread.id ? updatedThread : t))
      }
    )

    subscriptionRef.current = messageSubscription
    threadSubscriptionRef.current = threadSubscription

    return () => {
      messageSubscription?.unsubscribe()
      threadSubscription?.unsubscribe()
    }
  }, [activeThread])

  // Load threads on mount
  useEffect(() => {
    loadThreads()
  }, [loadThreads])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort()
      subscriptionRef.current?.unsubscribe()
      threadSubscriptionRef.current?.unsubscribe()
    }
  }, [])

  return {
    // State
    threads,
    activeThread,
    messages,
    streamingMessage,
    isLoadingThreads,
    isLoadingMessages,
    isStreaming,
    isSending,
    error,

    // Actions
    createThread,
    selectThread,
    deleteThread,
    renameThread,
    sendMessage,
    stopGeneration,
    loadMessages,
    clearError,
    refreshThreads,
  }
}
