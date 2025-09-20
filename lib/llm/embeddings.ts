/**
 * Embedding service for text vectorization
 * Supports OpenAI and other embedding providers
 */

/**
 * Embedding provider interface
 */
export interface EmbeddingProvider {
  embed(text: string): Promise<number[]>
  embedBatch(texts: string[]): Promise<number[][]>
  getDimension(): number
  getModel(): string
}

/**
 * OpenAI embedding provider
 */
export class OpenAIEmbeddingProvider implements EmbeddingProvider {
  private readonly apiKey: string
  private readonly model: string
  private readonly dimension: number

  constructor(
    apiKey: string,
    model: string = 'text-embedding-ada-002',
    dimension: number = 1536
  ) {
    this.apiKey = apiKey
    this.model = model
    this.dimension = dimension
  }

  async embed(text: string): Promise<number[]> {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.model,
        input: text,
        encoding_format: 'float',
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    return data.data[0].embedding
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.model,
        input: texts,
        encoding_format: 'float',
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    return data.data.map((item: { embedding: number[] }) => item.embedding)
  }

  getDimension(): number {
    return this.dimension
  }

  getModel(): string {
    return this.model
  }
}

/**
 * Mock embedding provider for testing
 */
export class MockEmbeddingProvider implements EmbeddingProvider {
  private readonly dimension: number

  constructor(dimension: number = 1536) {
    this.dimension = dimension
  }

  async embed(text: string): Promise<number[]> {
    // Generate deterministic mock embedding based on text hash
    const hash = this.simpleHash(text)
    return Array.from({ length: this.dimension }, (_, i) => {
      return Math.sin(hash + i) * 0.1
    })
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    return Promise.all(texts.map(text => this.embed(text)))
  }

  getDimension(): number {
    return this.dimension
  }

  getModel(): string {
    return 'mock-embedding-model'
  }

  private simpleHash(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash)
  }
}

/**
 * Embedding service singleton
 */
class EmbeddingService {
  private provider: EmbeddingProvider | null = null

  /**
   * Initialize the embedding service with a provider
   */
  initialize(provider: EmbeddingProvider): void {
    this.provider = provider
  }

  /**
   * Get the current provider
   */
  getProvider(): EmbeddingProvider {
    if (!this.provider) {
      throw new Error('Embedding service not initialized. Call initialize() first.')
    }
    return this.provider
  }

  /**
   * Embed a single text
   */
  async embed(text: string): Promise<number[]> {
    return this.getProvider().embed(text)
  }

  /**
   * Embed multiple texts in batch
   */
  async embedBatch(texts: string[]): Promise<number[][]> {
    return this.getProvider().embedBatch(texts)
  }

  /**
   * Get embedding dimension
   */
  getDimension(): number {
    return this.getProvider().getDimension()
  }

  /**
   * Get model name
   */
  getModel(): string {
    return this.getProvider().getModel()
  }
}

// Export singleton instance
export const embeddingService = new EmbeddingService()

/**
 * Initialize embedding service based on environment
 */
export const initializeEmbeddingService = (): void => {
  const openaiApiKey = process.env.OPENAI_API_KEY

  if (openaiApiKey) {
    // Use OpenAI in production
    const provider = new OpenAIEmbeddingProvider(openaiApiKey)
    embeddingService.initialize(provider)
  } else {
    // Use mock provider for development/testing
    console.warn('OPENAI_API_KEY not found, using mock embedding provider')
    const provider = new MockEmbeddingProvider()
    embeddingService.initialize(provider)
  }
}

/**
 * Utility functions
 */

/**
 * Normalize embedding vector to unit length
 */
export const normalizeEmbedding = (embedding: number[]): number[] => {
  const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0))
  return magnitude === 0 ? embedding : embedding.map(val => val / magnitude)
}

/**
 * Calculate cosine similarity between two embeddings
 */
export const cosineSimilarity = (a: number[], b: number[]): number => {
  if (a.length !== b.length) {
    throw new Error('Embeddings must have the same dimension')
  }

  let dotProduct = 0
  let normA = 0
  let normB = 0

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }

  normA = Math.sqrt(normA)
  normB = Math.sqrt(normB)

  if (normA === 0 || normB === 0) {
    return 0
  }

  return dotProduct / (normA * normB)
}

/**
 * Batch embedding with retry logic
 */
export const embedWithRetry = async (
  text: string,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<number[]> => {
  let lastError: Error | null = null

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await embeddingService.embed(text)
    } catch (error) {
      lastError = error as Error
      
      if (attempt < maxRetries - 1) {
        // Wait before retry with exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt)))
      }
    }
  }

  throw new Error(`Failed to embed text after ${maxRetries} attempts: ${lastError?.message}`)
}
