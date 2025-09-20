/**
 * API route for chat messages with streaming support
 * Handles message creation and streaming LLM responses
 */

import { NextRequest } from 'next/server'
import { createRouteHandlerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { chatGraph } from '@/lib/llm/graph'
import { initializeEmbeddingService } from '@/lib/llm/embeddings'
import { getThread } from '@/lib/chat'

// Initialize services
initializeEmbeddingService()

/**
 * POST /api/chat/messages - Send message and stream response
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { session } } = await supabase.auth.getSession()

    if (!session?.user) {
      return new Response('Unauthorized', { status: 401 })
    }

    const body = await request.json()
    const { threadId, content } = body

    if (!threadId || !content) {
      return new Response('Missing threadId or content', { status: 400 })
    }

    // Validate thread ownership
    const thread = await getThread(threadId)
    if (!thread) {
      return new Response('Thread not found or access denied', { status: 404 })
    }

    const requestId = crypto.randomUUID()

    // Create streaming response
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Execute chat graph with streaming
          const streamGenerator = chatGraph.executeStream({
            userId: session.user.id,
            threadId,
            userMessage: content,
            requestId,
          })

          for await (const chunk of streamGenerator) {
            const data = `data: ${JSON.stringify(chunk)}\n\n`
            controller.enqueue(encoder.encode(data))
          }

          // Send completion signal
          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
          controller.close()
        } catch (error) {
          console.error('Streaming error:', error)
          
          // Send error to client
          const errorData = {
            type: 'error',
            data: { 
              error: 'An error occurred while processing your message.',
              details: (error as Error).message 
            }
          }
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(errorData)}\n\n`))
          controller.close()
        }
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    })
  } catch (error) {
    console.error('Chat API error:', error)
    return new Response('Internal server error', { status: 500 })
  }
}

/**
 * GET /api/chat/messages - Get messages for a thread
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { session } } = await supabase.auth.getSession()

    if (!session?.user) {
      return new Response('Unauthorized', { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const threadId = searchParams.get('threadId')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    if (!threadId) {
      return new Response('Missing threadId parameter', { status: 400 })
    }

    // Validate thread ownership
    const thread = await getThread(threadId)
    if (!thread) {
      return new Response('Thread not found or access denied', { status: 404 })
    }

    // Get messages using Supabase client with RLS
    const { data: messages, error } = await supabase
      .from('messages')
      .select('*')
      .eq('thread_id', threadId)
      .order('created_at', { ascending: true })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Failed to get messages:', error)
      return new Response('Failed to get messages', { status: 500 })
    }

    return Response.json({ messages: messages || [] })
  } catch (error) {
    console.error('Get messages error:', error)
    return new Response('Internal server error', { status: 500 })
  }
}

/**
 * OPTIONS /api/chat/messages - Handle preflight requests
 */
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
