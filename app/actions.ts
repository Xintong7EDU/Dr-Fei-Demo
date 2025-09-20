"use server"

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { revalidatePath, revalidateTag } from 'next/cache'
import type { Note } from '@/lib/types'
import { NotesService } from '@/lib/notes'
import { sanitizeAndBeautifyHtml, DEFAULT_NOTE_TITLE } from '@/lib/utils'

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

/**
 * List notes with optional limit
 */
export async function listNotes(limit = 50): Promise<Note[]> {
  const supabase = await createSupabaseServer()
  const notesSvc = new NotesService(supabase)
  return notesSvc.list(limit)
}

/**
 * Create a new note from HTML content
 */
export async function createNote(params: { title?: string | null; html: string; meeting_date?: string | null }): Promise<Note> {
  const supabase = await createSupabaseServer()
  const notesSvc = new NotesService(supabase)
  const html_content = sanitizeAndBeautifyHtml(params.html)
  const computedTitle = params.title?.trim() || DEFAULT_NOTE_TITLE
  const note = await notesSvc.create({ title: computedTitle, html_content, meeting_date: params.meeting_date ?? null })
  revalidatePath('/')
  return note
}

/**
 * Update an existing note
 */
export async function updateNote(noteId: number, updates: { title?: string | null; html?: string; meeting_date?: string | null }): Promise<Note> {
  const supabase = await createSupabaseServer()
  const notesSvc = new NotesService(supabase)
  const payload: { title?: string | null; html_content?: string; meeting_date?: string | null } = {}
  if (typeof updates.title !== 'undefined') payload.title = updates.title
  if (typeof updates.html !== 'undefined') payload.html_content = sanitizeAndBeautifyHtml(updates.html)
  if (typeof updates.meeting_date !== 'undefined') payload.meeting_date = updates.meeting_date
  const note = await notesSvc.update(noteId, payload)
  revalidatePath('/')
  return note
}

/**
 * Delete a note by ID
 */
export async function deleteNote(noteId: number): Promise<{ success: true }> {
  const supabase = await createSupabaseServer()
  const notesSvc = new NotesService(supabase)
  await notesSvc.delete(noteId)
  revalidatePath('/')
  return { success: true }
}

/**
 * Revalidate notes data across the application
 */
export async function revalidateNotesData(): Promise<void> {
  try {
    // Revalidate specific paths that display notes data
    revalidatePath('/')
    revalidatePath('/chat')
    // Revalidate any cached notes data
    revalidateTag('notes')
    
    console.log('Notes data revalidation completed')
  } catch (error) {
    console.error('Error revalidating notes data:', error)
    throw error
  }
}