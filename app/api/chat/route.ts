import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { AIService } from '@/lib/ai-service'
import { ChatContextService } from '@/lib/chat-context'
import type { ChatMessage, MeetingContext } from '@/lib/types'

async function createSupabaseServer() {
  const cookieStore = await cookies()
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    }
  )
}

// Initialize AI service
const aiService = new AIService()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { messages, meetingIds = [], stream = true }: {
      messages: ChatMessage[]
      meetingIds?: number[]
      stream?: boolean
    } = body

    // Validate request
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      )
    }

    // Validate OpenAI API key
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }

    // Initialize services with server-side Supabase client
    const supabase = await createSupabaseServer()
    const contextService = new ChatContextService(supabase)

    // Prepare meeting context if meeting IDs are provided
    let meetingContexts: MeetingContext[] = []
    if (meetingIds.length > 0) {
      meetingContexts = await contextService.prepareOptimizedContext(meetingIds, 12000)
    }

    if (stream) {
      // Return streaming response
      const encoder = new TextEncoder()
      
      const customReadable = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of aiService.createStreamingChatCompletion(messages, meetingContexts)) {
              const data = `data: ${JSON.stringify({ content: chunk })}\n\n`
              controller.enqueue(encoder.encode(data))
            }
            
            // Send done signal
            const doneData = `data: ${JSON.stringify({ done: true })}\n\n`
            controller.enqueue(encoder.encode(doneData))
            controller.close()
          } catch (error) {
            console.error('Streaming error:', error)
            const errorData = `data: ${JSON.stringify({ error: 'Stream failed' })}\n\n`
            controller.enqueue(encoder.encode(errorData))
            controller.close()
          }
        }
      })

      return new Response(customReadable, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Transfer-Encoding': 'chunked',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive'
        }
      })
    } else {
      // Return non-streaming response
      const response = await aiService.createChatCompletion(messages, meetingContexts)
      
      return NextResponse.json({
        content: response,
        contextUsed: meetingContexts.length > 0,
        meetingsIncluded: meetingContexts.map(ctx => ({
          id: ctx.meeting.meeting_id,
          date: ctx.meeting.meeting_date,
          topic: ctx.meeting.topic_overview
        }))
      })
    }
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
} 