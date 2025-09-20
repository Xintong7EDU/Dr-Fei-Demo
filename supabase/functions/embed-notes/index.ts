/**
 * Supabase Edge Function for note embedding pipeline
 * Processes notes into chunks and generates embeddings
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Types
interface Note {
  note_id: number
  title: string | null
  html_content: string
  user_id: string
}

interface NoteChunk {
  id: string
  note_id: number
  user_id: string
  chunk_index: number
  text: string
  token_count: number
  content_hash: string
}

// Configuration
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

// Initialize Supabase client with service role
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

/**
 * Text chunking utilities
 */
class TextChunker {
  private readonly maxTokens: number
  private readonly overlapTokens: number

  constructor(maxTokens: number = 400, overlapTokens: number = 50) {
    this.maxTokens = maxTokens
    this.overlapTokens = overlapTokens
  }

  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4)
  }

  private splitIntoSentences(text: string): string[] {
    return text
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 0)
  }

  chunk(text: string): string[] {
    const sentences = this.splitIntoSentences(text)
    const chunks: string[] = []
    let currentChunk: string[] = []
    let currentTokens = 0

    for (const sentence of sentences) {
      const sentenceTokens = this.estimateTokens(sentence)
      
      if (currentTokens + sentenceTokens > this.maxTokens && currentChunk.length > 0) {
        chunks.push(currentChunk.join('. ') + '.')
        
        const overlapSentences = currentChunk.slice(-Math.ceil(this.overlapTokens / 50))
        currentChunk = overlapSentences
        currentTokens = overlapSentences.reduce((sum, s) => sum + this.estimateTokens(s), 0)
      }

      currentChunk.push(sentence)
      currentTokens += sentenceTokens
    }

    if (currentChunk.length > 0) {
      chunks.push(currentChunk.join('. ') + '.')
    }

    return chunks.filter(chunk => chunk.trim().length > 10)
  }
}

/**
 * Convert HTML to plain text
 */
function htmlToText(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Generate content hash
 */
async function generateContentHash(content: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(content)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Get embeddings from OpenAI
 */
async function getEmbeddings(texts: string[]): Promise<number[][]> {
  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY not configured')
  }

  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'text-embedding-ada-002',
      input: texts,
      encoding_format: 'float',
    }),
  })

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()
  return data.data.map((item: any) => item.embedding)
}

/**
 * Process a single note
 */
async function processNote(note: Note): Promise<void> {
  console.log(`Processing note ${note.note_id} for user ${note.user_id}`)

  const plainText = htmlToText(note.html_content)
  const contentHash = await generateContentHash(plainText)

  // Check if content has changed
  const { data: existingChunks } = await supabase
    .from('note_chunks')
    .select('content_hash')
    .eq('note_id', note.note_id)
    .eq('user_id', note.user_id)
    .limit(1)

  if (existingChunks?.[0]?.content_hash === contentHash) {
    console.log(`Note ${note.note_id} unchanged, skipping`)
    return
  }

  // Delete existing chunks and embeddings
  await supabase
    .from('note_chunks')
    .delete()
    .eq('note_id', note.note_id)
    .eq('user_id', note.user_id)

  // Create new chunks
  const chunker = new TextChunker()
  const chunks = chunker.chunk(plainText)

  if (chunks.length === 0) {
    console.log(`Note ${note.note_id} has no valid chunks`)
    return
  }

  // Insert chunks
  const chunkRecords = chunks.map((text, index) => ({
    note_id: note.note_id,
    user_id: note.user_id,
    chunk_index: index,
    text,
    token_count: Math.ceil(text.length / 4),
    content_hash: contentHash,
  }))

  const { data: insertedChunks, error: chunkError } = await supabase
    .from('note_chunks')
    .insert(chunkRecords)
    .select()

  if (chunkError) {
    throw new Error(`Failed to insert chunks: ${chunkError.message}`)
  }

  // Generate embeddings
  try {
    const embeddings = await getEmbeddings(chunks)
    
    // Insert embeddings
    const embeddingRecords = insertedChunks!.map((chunk: any, index: number) => ({
      chunk_id: chunk.id,
      embedding: embeddings[index],
      model: 'text-embedding-ada-002',
    }))

    const { error: embeddingError } = await supabase
      .from('note_embeddings')
      .insert(embeddingRecords)

    if (embeddingError) {
      throw new Error(`Failed to insert embeddings: ${embeddingError.message}`)
    }

    console.log(`Successfully processed note ${note.note_id} with ${chunks.length} chunks`)
  } catch (error) {
    console.error(`Failed to generate embeddings for note ${note.note_id}:`, error)
    // Don't fail the entire process if embeddings fail
    // The chunks are still useful for full-text search
  }
}

/**
 * Process multiple notes
 */
async function processNotes(noteIds?: number[], userId?: string): Promise<void> {
  let query = supabase
    .from('notes')
    .select('note_id, title, html_content, user_id')

  if (noteIds && noteIds.length > 0) {
    query = query.in('note_id', noteIds)
  }

  if (userId) {
    query = query.eq('user_id', userId)
  }

  const { data: notes, error } = await query

  if (error) {
    throw new Error(`Failed to fetch notes: ${error.message}`)
  }

  if (!notes || notes.length === 0) {
    console.log('No notes to process')
    return
  }

  console.log(`Processing ${notes.length} notes`)

  // Process notes in batches to avoid overwhelming the API
  const batchSize = 5
  for (let i = 0; i < notes.length; i += batchSize) {
    const batch = notes.slice(i, i + batchSize)
    await Promise.all(batch.map(processNote))
    
    // Small delay between batches
    if (i + batchSize < notes.length) {
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }

  console.log(`Finished processing ${notes.length} notes`)
}

/**
 * Main handler
 */
serve(async (req) => {
  try {
    // CORS headers
    if (req.method === 'OPTIONS') {
      return new Response('ok', {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        },
      })
    }

    // Only allow POST requests
    if (req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 })
    }

    // Parse request body
    const body = await req.json()
    const { note_ids, user_id } = body

    console.log('Embed notes request:', { note_ids, user_id })

    // Process notes
    await processNotes(note_ids, user_id)

    // Refresh materialized view if it exists
    try {
      await supabase.rpc('refresh_note_chunks_fts')
    } catch (error) {
      console.log('Note: materialized view refresh failed (this is optional):', error)
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Notes processed successfully',
        processed_count: note_ids?.length || 'all'
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    )
  } catch (error) {
    console.error('Edge function error:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    )
  }
})
