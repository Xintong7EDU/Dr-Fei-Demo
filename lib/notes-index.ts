/**
 * Notes indexing and retrieval for RAG
 * Handles chunking, embedding, and hybrid search
 */

import { supabase } from './supabase'
import type { NoteChunk, SearchResult } from './types'
import { createHash } from 'crypto'

/**
 * Text chunking utilities
 */
export class TextChunker {
  private readonly maxTokens: number
  private readonly overlapTokens: number

  constructor(maxTokens: number = 400, overlapTokens: number = 50) {
    this.maxTokens = maxTokens
    this.overlapTokens = overlapTokens
  }

  /**
   * Rough token estimation (1 token ≈ 4 characters for English)
   */
  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4)
  }

  /**
   * Split text into sentences
   */
  private splitIntoSentences(text: string): string[] {
    return text
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 0)
  }

  /**
   * Chunk text into segments with overlap
   */
  chunk(text: string): string[] {
    const sentences = this.splitIntoSentences(text)
    const chunks: string[] = []
    let currentChunk: string[] = []
    let currentTokens = 0

    for (const sentence of sentences) {
      const sentenceTokens = this.estimateTokens(sentence)
      
      // If adding this sentence exceeds max tokens, finalize current chunk
      if (currentTokens + sentenceTokens > this.maxTokens && currentChunk.length > 0) {
        chunks.push(currentChunk.join('. ') + '.')
        
        // Start new chunk with overlap
        const overlapSentences = currentChunk.slice(-Math.ceil(this.overlapTokens / 50))
        currentChunk = overlapSentences
        currentTokens = overlapSentences.reduce((sum, s) => sum + this.estimateTokens(s), 0)
      }

      currentChunk.push(sentence)
      currentTokens += sentenceTokens
    }

    // Add final chunk if any
    if (currentChunk.length > 0) {
      chunks.push(currentChunk.join('. ') + '.')
    }

    return chunks.filter(chunk => chunk.trim().length > 10) // Filter very short chunks
  }
}

/**
 * Generate content hash for change detection
 */
export const generateContentHash = (content: string): string => {
  return createHash('sha256').update(content).digest('hex')
}

/**
 * Convert HTML to plain text (basic implementation)
 */
export const htmlToText = (html: string): string => {
  return html
    .replace(/<[^>]*>/g, ' ') // Remove HTML tags
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim()
}

/**
 * Create or update note chunks
 */
export const upsertNoteChunks = async (
  noteId: number,
  userId: string,
  htmlContent: string
): Promise<NoteChunk[]> => {
  const plainText = htmlToText(htmlContent)
  const contentHash = generateContentHash(plainText)
  
  // Check if content has changed
  const { data: existingChunks } = await supabase
    .from('note_chunks')
    .select('content_hash')
    .eq('note_id', noteId)
    .eq('user_id', userId)
    .limit(1)

  if (existingChunks?.[0]?.content_hash === contentHash) {
    // Content unchanged, return existing chunks
    const { data } = await supabase
      .from('note_chunks')
      .select('*')
      .eq('note_id', noteId)
      .eq('user_id', userId)
      .order('chunk_index')

    return data || []
  }

  // Delete existing chunks for this note
  await supabase
    .from('note_chunks')
    .delete()
    .eq('note_id', noteId)
    .eq('user_id', userId)

  // Create new chunks
  const chunker = new TextChunker()
  const chunks = chunker.chunk(plainText)
  
  const chunkRecords: Omit<NoteChunk, 'id' | 'created_at' | 'updated_at'>[] = chunks.map((text, index) => ({
    note_id: noteId,
    user_id: userId,
    chunk_index: index,
    text,
    token_count: Math.ceil(text.length / 4), // Rough estimate
    content_hash: contentHash,
  }))

  const { data, error } = await supabase
    .from('note_chunks')
    .insert(chunkRecords)
    .select()

  if (error) {
    throw new Error(`Failed to create note chunks: ${error.message}`)
  }

  return data || []
}

/**
 * Get chunks for a note
 */
export const getNoteChunks = async (noteId: number, userId: string): Promise<NoteChunk[]> => {
  const { data, error } = await supabase
    .from('note_chunks')
    .select('*')
    .eq('note_id', noteId)
    .eq('user_id', userId)
    .order('chunk_index')

  if (error) {
    throw new Error(`Failed to get note chunks: ${error.message}`)
  }

  return data || []
}

/**
 * Vector similarity search
 */
export const searchSimilarChunks = async (
  queryEmbedding: number[],
  userId: string,
  matchThreshold: number = 0.7,
  matchCount: number = 24
): Promise<RetrievedChunk[]> => {
  const { data, error } = await supabase.rpc('search_notes_similarity', {
    query_embedding: queryEmbedding,
    user_id_param: userId,
    match_threshold: matchThreshold,
    match_count: matchCount,
  })

  if (error) {
    console.warn('Vector search failed, falling back to empty results:', error.message)
    return []
  }

  return (data || []).map((row: { chunk_id: string; note_id: number; text: string; similarity: number; chunk_index: number }) => ({
    chunk_id: row.chunk_id,
    note_id: row.note_id,
    text: row.text,
    score: row.similarity,
    chunk_index: row.chunk_index,
  }))
}

/**
 * Full-text search
 */
export const searchFullTextChunks = async (
  queryText: string,
  userId: string,
  matchCount: number = 24
): Promise<RetrievedChunk[]> => {
  const { data, error } = await supabase.rpc('search_notes_fulltext', {
    query_text: queryText,
    user_id_param: userId,
    match_count: matchCount,
  })

  if (error) {
    throw new Error(`Full-text search failed: ${error.message}`)
  }

  return (data || []).map((row: { chunk_id: string; note_id: number; text: string; rank: number; chunk_index: number }) => ({
    chunk_id: row.chunk_id,
    note_id: row.note_id,
    text: row.text,
    score: row.rank,
    chunk_index: row.chunk_index,
  }))
}

/**
 * Reciprocal Rank Fusion for combining search results
 */
export const reciprocalRankFusion = (
  denseResults: RetrievedChunk[],
  sparseResults: RetrievedChunk[],
  k: number = 60
): RetrievedChunk[] => {
  const scoreMap = new Map<string, { chunk: RetrievedChunk; score: number }>()

  // Process dense results
  denseResults.forEach((chunk, index) => {
    const rrfScore = 1 / (k + index + 1)
    scoreMap.set(chunk.chunk_id, { chunk, score: rrfScore })
  })

  // Process sparse results and combine scores
  sparseResults.forEach((chunk, index) => {
    const rrfScore = 1 / (k + index + 1)
    const existing = scoreMap.get(chunk.chunk_id)
    
    if (existing) {
      existing.score += rrfScore
    } else {
      scoreMap.set(chunk.chunk_id, { chunk, score: rrfScore })
    }
  })

  // Sort by combined RRF score and return
  return Array.from(scoreMap.values())
    .sort((a, b) => b.score - a.score)
    .map(item => ({ ...item.chunk, score: item.score }))
}

/**
 * Hybrid search combining vector and full-text search
 */
export const hybridSearch = async (
  queryText: string,
  queryEmbedding: number[],
  userId: string,
  maxResults: number = 20
): Promise<SearchResult> => {
  // Run both searches in parallel
  const [denseResults, sparseResults] = await Promise.all([
    searchSimilarChunks(queryEmbedding, userId, 0.7, 24),
    searchFullTextChunks(queryText, userId, 24),
  ])

  // Combine using reciprocal rank fusion
  const fusedResults = reciprocalRankFusion(denseResults, sparseResults)
    .slice(0, maxResults)

  return {
    dense: denseResults,
    sparse: sparseResults,
    fused: fusedResults,
  }
}

/**
 * Add note titles to retrieved chunks
 */
export const enrichChunksWithNoteTitles = async (
  chunks: RetrievedChunk[]
): Promise<RetrievedChunk[]> => {
  if (chunks.length === 0) return chunks

  const noteIds = [...new Set(chunks.map(c => c.note_id))]
  
  const { data: notes, error } = await supabase
    .from('notes')
    .select('note_id, title')
    .in('note_id', noteIds)

  if (error) {
    console.warn('Failed to fetch note titles:', error.message)
    return chunks
  }

  const titleMap = new Map(notes?.map(n => [n.note_id, n.title]) || [])

  return chunks.map(chunk => ({
    ...chunk,
    note_title: titleMap.get(chunk.note_id) || null,
  }))
}

/**
 * Get chunks that need embedding
 */
export const getChunksNeedingEmbedding = async (userId: string): Promise<NoteChunk[]> => {
  const { data, error } = await supabase
    .from('note_chunks')
    .select(`
      *,
      note_embeddings!left(id)
    `)
    .eq('user_id', userId)
    .is('note_embeddings.id', null)

  if (error) {
    throw new Error(`Failed to get chunks needing embedding: ${error.message}`)
  }

  return data || []
}

/**
 * Store embeddings for chunks
 */
export const storeEmbeddings = async (
  embeddings: { chunkId: string; embedding: number[]; model: string }[]
): Promise<void> => {
  const records = embeddings.map(({ chunkId, embedding, model }) => ({
    chunk_id: chunkId,
    embedding,
    model,
  }))

  const { error } = await supabase
    .from('note_embeddings')
    .insert(records)

  if (error) {
    throw new Error(`Failed to store embeddings: ${error.message}`)
  }
}
