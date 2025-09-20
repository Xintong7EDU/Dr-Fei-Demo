/**
 * Data access layer for chat functionality
 * Handles threads and messages CRUD operations with RLS
 */

import { supabase } from './supabase'
import type { Thread, Message, MessageContent } from './types'

/**
 * Create a new chat thread
 */
export const createThread = async (userId: string, title?: string): Promise<Thread> => {
  const { data, error } = await supabase
    .from('threads')
    .insert({
      user_id: userId,
      title: title || null,
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create thread: ${error.message}`)
  }

  return data
}

/**
 * Get all threads for a user
 */
export const getUserThreads = async (userId: string): Promise<Thread[]> => {
  const { data, error } = await supabase
    .from('threads')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to get user threads: ${error.message}`)
  }

  return data || []
}

/**
 * Get a specific thread by ID (with ownership check via RLS)
 */
export const getThread = async (threadId: string): Promise<Thread | null> => {
  const { data, error } = await supabase
    .from('threads')
    .select('*')
    .eq('id', threadId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null // Thread not found or no access
    }
    throw new Error(`Failed to get thread: ${error.message}`)
  }

  return data
}

/**
 * Update thread title
 */
export const updateThreadTitle = async (threadId: string, title: string): Promise<Thread> => {
  const { data, error } = await supabase
    .from('threads')
    .update({ title })
    .eq('id', threadId)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update thread title: ${error.message}`)
  }

  return data
}

/**
 * Soft delete a thread (mark as deleted)
 */
export const deleteThread = async (threadId: string): Promise<void> => {
  const { error } = await supabase
    .from('threads')
    .delete()
    .eq('id', threadId)

  if (error) {
    throw new Error(`Failed to delete thread: ${error.message}`)
  }
}

/**
 * Create a new message
 */
export const createMessage = async (
  threadId: string,
  role: Message['role'],
  content: MessageContent,
  tokenCount?: number
): Promise<Message> => {
  const { data, error } = await supabase
    .from('messages')
    .insert({
      thread_id: threadId,
      role,
      content,
      token_count: tokenCount || null,
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create message: ${error.message}`)
  }

  return data
}

/**
 * Get messages for a thread with pagination
 */
export const getThreadMessages = async (
  threadId: string,
  limit: number = 50,
  offset: number = 0
): Promise<Message[]> => {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('thread_id', threadId)
    .order('created_at', { ascending: true })
    .range(offset, offset + limit - 1)

  if (error) {
    throw new Error(`Failed to get thread messages: ${error.message}`)
  }

  return data || []
}

/**
 * Get recent messages for a thread (last N messages)
 */
export const getRecentMessages = async (
  threadId: string,
  limit: number = 10
): Promise<Message[]> => {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('thread_id', threadId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    throw new Error(`Failed to get recent messages: ${error.message}`)
  }

  // Reverse to get chronological order
  return (data || []).reverse()
}

/**
 * Update message content (for streaming completion)
 */
export const updateMessage = async (
  messageId: string,
  content: MessageContent,
  tokenCount?: number
): Promise<Message> => {
  const { data, error } = await supabase
    .from('messages')
    .update({
      content,
      token_count: tokenCount || null,
    })
    .eq('id', messageId)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update message: ${error.message}`)
  }

  return data
}

/**
 * Get message count for a thread
 */
export const getMessageCount = async (threadId: string): Promise<number> => {
  const { count, error } = await supabase
    .from('messages')
    .select('*', { count: 'exact', head: true })
    .eq('thread_id', threadId)

  if (error) {
    throw new Error(`Failed to get message count: ${error.message}`)
  }

  return count || 0
}

/**
 * Touch thread updated_at timestamp
 */
export const touchThread = async (threadId: string): Promise<void> => {
  const { error } = await supabase
    .from('threads')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', threadId)

  if (error) {
    throw new Error(`Failed to touch thread: ${error.message}`)
  }
}

/**
 * Subscribe to new messages in a thread
 */
export const subscribeToMessages = (
  threadId: string,
  callback: (message: Message) => void
) => {
  return supabase
    .channel(`messages:${threadId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `thread_id=eq.${threadId}`,
      },
      (payload) => {
        callback(payload.new as Message)
      }
    )
    .subscribe()
}

/**
 * Subscribe to thread updates
 */
export const subscribeToThread = (
  threadId: string,
  callback: (thread: Thread) => void
) => {
  return supabase
    .channel(`thread:${threadId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'threads',
        filter: `id=eq.${threadId}`,
      },
      (payload) => {
        callback(payload.new as Thread)
      }
    )
    .subscribe()
}
