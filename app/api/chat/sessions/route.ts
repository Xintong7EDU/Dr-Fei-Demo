/**
 * API routes for chat sessions (threads)
 * Handles CRUD operations for chat threads
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createThread, getUserThreads, deleteThread, updateThreadTitle } from '@/lib/chat'

/**
 * GET /api/chat/sessions - List user's chat threads
 */
export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { session } } = await supabase.auth.getSession()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const threads = await getUserThreads(session.user.id)
    
    return NextResponse.json({ threads })
  } catch (error) {
    console.error('Failed to get threads:', error)
    return NextResponse.json(
      { error: 'Failed to get threads' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/chat/sessions - Create new chat thread
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { session } } = await supabase.auth.getSession()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { title } = body

    const thread = await createThread(session.user.id, title)
    
    return NextResponse.json({ thread })
  } catch (error) {
    console.error('Failed to create thread:', error)
    return NextResponse.json(
      { error: 'Failed to create thread' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/chat/sessions - Update thread title
 */
export async function PUT(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { session } } = await supabase.auth.getSession()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { threadId, title } = body

    if (!threadId || !title) {
      return NextResponse.json(
        { error: 'Missing threadId or title' },
        { status: 400 }
      )
    }

    const thread = await updateThreadTitle(threadId, title)
    
    return NextResponse.json({ thread })
  } catch (error) {
    console.error('Failed to update thread:', error)
    return NextResponse.json(
      { error: 'Failed to update thread' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/chat/sessions - Delete thread
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { session } } = await supabase.auth.getSession()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const threadId = searchParams.get('id')

    if (!threadId) {
      return NextResponse.json(
        { error: 'Missing thread ID' },
        { status: 400 }
      )
    }

    await deleteThread(threadId)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete thread:', error)
    return NextResponse.json(
      { error: 'Failed to delete thread' },
      { status: 500 }
    )
  }
}
