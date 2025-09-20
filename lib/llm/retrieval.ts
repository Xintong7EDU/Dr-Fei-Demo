/**
 * Hybrid retrieval service for RAG
 * Combines vector similarity and full-text search with ranking fusion
 */

import { embeddingService } from './embeddings'
import { hybridSearch, enrichChunksWithNoteTitles } from '../notes-index'
import type { RetrievedChunk, SearchResult, Citation } from '../types'

/**
 * Retrieval configuration
 */
export interface RetrievalConfig {
  maxResults: number
  minSimilarityThreshold: number
  diversityThreshold: number
  maxContextTokens: number
  citationLimit: number
}

export const DEFAULT_RETRIEVAL_CONFIG: RetrievalConfig = {
  maxResults: 20,
  minSimilarityThreshold: 0.6,
  diversityThreshold: 0.8, // Minimum similarity difference to consider chunks diverse
  maxContextTokens: 4000,
  citationLimit: 5,
}

/**
 * Retrieval service for note context
 */
export class RetrievalService {
  private config: RetrievalConfig

  constructor(config: RetrievalConfig = DEFAULT_RETRIEVAL_CONFIG) {
    this.config = config
  }

  /**
   * Retrieve relevant note chunks for a query
   */
  async retrieve(
    query: string,
    userId: string,
    config?: Partial<RetrievalConfig>
  ): Promise<{
    chunks: RetrievedChunk[]
    searchResult: SearchResult
    contextSummary: string
    citations: Citation[]
  }> {
    const effectiveConfig = { ...this.config, ...config }

    try {
      // Generate query embedding
      const queryEmbedding = await embeddingService.embed(query)

      // Perform hybrid search
      const searchResult = await hybridSearch(
        query,
        queryEmbedding,
        userId,
        effectiveConfig.maxResults
      )

      // Filter by minimum similarity threshold
      let filteredChunks = searchResult.fused.filter(
        chunk => chunk.score >= effectiveConfig.minSimilarityThreshold
      )

      // Apply diversity filtering
      filteredChunks = this.applyDiversityFiltering(
        filteredChunks,
        effectiveConfig.diversityThreshold
      )

      // Limit by context token budget
      const contextChunks = this.limitByTokenBudget(
        filteredChunks,
        effectiveConfig.maxContextTokens
      )

      // Enrich with note titles
      const enrichedChunks = await enrichChunksWithNoteTitles(contextChunks)

      // Generate context summary
      const contextSummary = this.generateContextSummary(enrichedChunks)

      // Create citations
      const citations = this.createCitations(
        enrichedChunks.slice(0, effectiveConfig.citationLimit)
      )

      return {
        chunks: enrichedChunks,
        searchResult,
        contextSummary,
        citations,
      }
    } catch (error) {
      console.error('Retrieval failed:', error)
      
      // Fallback to empty results
      return {
        chunks: [],
        searchResult: { dense: [], sparse: [], fused: [] },
        contextSummary: '',
        citations: [],
      }
    }
  }

  /**
   * Apply diversity filtering to avoid too many similar chunks
   */
  private applyDiversityFiltering(
    chunks: RetrievedChunk[],
    threshold: number
  ): RetrievedChunk[] {
    if (chunks.length === 0) return chunks

    const diverseChunks: RetrievedChunk[] = [chunks[0]] // Always include top result
    const noteIds = new Set<number>([chunks[0].note_id])

    for (let i = 1; i < chunks.length; i++) {
      const chunk = chunks[i]
      
      // Prefer chunks from different notes
      if (!noteIds.has(chunk.note_id)) {
        diverseChunks.push(chunk)
        noteIds.add(chunk.note_id)
        continue
      }

      // For chunks from same note, check if they're sufficiently different
      const isDiverse = diverseChunks.every(existing => {
        if (existing.note_id !== chunk.note_id) return true
        
        // Simple text overlap check (could be improved with semantic similarity)
        const overlap = this.calculateTextOverlap(existing.text, chunk.text)
        return overlap < threshold
      })

      if (isDiverse) {
        diverseChunks.push(chunk)
      }
    }

    return diverseChunks
  }

  /**
   * Calculate simple text overlap ratio
   */
  private calculateTextOverlap(text1: string, text2: string): number {
    const words1 = new Set(text1.toLowerCase().split(/\s+/))
    const words2 = new Set(text2.toLowerCase().split(/\s+/))
    
    const intersection = new Set([...words1].filter(x => words2.has(x)))
    const union = new Set([...words1, ...words2])
    
    return union.size === 0 ? 0 : intersection.size / union.size
  }

  /**
   * Limit chunks by token budget
   */
  private limitByTokenBudget(
    chunks: RetrievedChunk[],
    maxTokens: number
  ): RetrievedChunk[] {
    const result: RetrievedChunk[] = []
    let totalTokens = 0

    for (const chunk of chunks) {
      const chunkTokens = this.estimateTokens(chunk.text)
      
      if (totalTokens + chunkTokens <= maxTokens) {
        result.push(chunk)
        totalTokens += chunkTokens
      } else {
        break
      }
    }

    return result
  }

  /**
   * Estimate token count for text
   */
  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4) // Rough approximation
  }

  /**
   * Generate a summary of the retrieved context
   */
  private generateContextSummary(chunks: RetrievedChunk[]): string {
    if (chunks.length === 0) {
      return 'No relevant context found.'
    }

    const noteCount = new Set(chunks.map(c => c.note_id)).size
    const totalTokens = chunks.reduce((sum, c) => sum + this.estimateTokens(c.text), 0)

    const summary = [
      `Found ${chunks.length} relevant passage${chunks.length === 1 ? '' : 's'}`,
      `from ${noteCount} note${noteCount === 1 ? '' : 's'}`,
      `(~${totalTokens} tokens)`
    ].join(' ')

    return summary
  }

  /**
   * Create citations from chunks
   */
  private createCitations(chunks: RetrievedChunk[]): Citation[] {
    return chunks.map(chunk => ({
      note_id: chunk.note_id,
      chunk_id: chunk.chunk_id,
      title: chunk.note_title || `Note ${chunk.note_id}`,
      text: this.truncateText(chunk.text, 200),
      chunk_index: chunk.chunk_index,
    }))
  }

  /**
   * Truncate text to specified length with ellipsis
   */
  private truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text
    return text.slice(0, maxLength).trim() + '...'
  }

  /**
   * Format chunks for context injection
   */
  formatContextForPrompt(chunks: RetrievedChunk[]): string {
    if (chunks.length === 0) {
      return 'No relevant notes found.'
    }

    const formattedChunks = chunks.map((chunk, index) => {
      const title = chunk.note_title || `Note ${chunk.note_id}`
      return [
        `[Context ${index + 1}] From "${title}":`,
        chunk.text.trim(),
        ''
      ].join('\n')
    })

    return [
      '=== RELEVANT NOTES CONTEXT ===',
      '',
      ...formattedChunks,
      '=== END CONTEXT ===',
    ].join('\n')
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<RetrievalConfig>): void {
    this.config = { ...this.config, ...config }
  }
}

// Export singleton instance
export const retrievalService = new RetrievalService()

/**
 * Utility function for quick retrieval
 */
export const retrieveNoteContext = async (
  query: string,
  userId: string,
  config?: Partial<RetrievalConfig>
) => {
  return retrievalService.retrieve(query, userId, config)
}
