/**
 * LangGraph orchestration for chat with note context
 * Manages the flow from user input to streamed response
 */

import { StateGraph, END, START } from '@langchain/langgraph'
import { BaseMessage, HumanMessage, AIMessage } from '@langchain/core/messages'
import { retrieveNoteContext } from './retrieval'
import { createMessage, touchThread, getRecentMessages } from '../chat'
import type { Message, Citation, RetrievedChunk } from '../types'

/**
 * Graph state interface
 */
interface GraphState {
  userId: string
  threadId: string
  userMessage: string
  messages: Message[]
  retrievedChunks: RetrievedChunk[]
  contextSummary: string
  citations: Citation[]
  response: string
  requestId: string
  error?: string
}

/**
 * LLM provider interface
 */
export interface LLMProvider {
  generateStream(messages: BaseMessage[]): AsyncGenerator<string, void, unknown>
  generate(messages: BaseMessage[]): Promise<string>
}

/**
 * OpenAI LLM provider
 */
export class OpenAIProvider implements LLMProvider {
  private readonly apiKey: string
  private readonly model: string

  constructor(apiKey: string, model: string = 'gpt-4-turbo-preview') {
    this.apiKey = apiKey
    this.model = model
  }

  async *generateStream(messages: BaseMessage[]): AsyncGenerator<string, void, unknown> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.model,
        messages: messages.map(msg => ({
          role: msg._getType() === 'human' ? 'user' : 'assistant',
          content: msg.content,
        })),
        stream: true,
        temperature: 0.7,
        max_tokens: 2000,
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`)
    }

    const reader = response.body?.getReader()
    if (!reader) throw new Error('No response body')

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
            if (data === '[DONE]') return

            try {
              const parsed = JSON.parse(data)
              const content = parsed.choices?.[0]?.delta?.content
              if (content) {
                yield content
              }
            } catch {
              // Skip invalid JSON
            }
          }
        }
      }
    } finally {
      reader.releaseLock()
    }
  }

  async generate(messages: BaseMessage[]): Promise<string> {
    const chunks: string[] = []
    for await (const chunk of this.generateStream(messages)) {
      chunks.push(chunk)
    }
    return chunks.join('')
  }
}

/**
 * Mock LLM provider for testing
 */
export class MockLLMProvider implements LLMProvider {
  async *generateStream(messages: BaseMessage[]): AsyncGenerator<string, void, unknown> {
    const response = `Mock response to: ${messages[messages.length - 1]?.content}`
    const words = response.split(' ')
    
    for (const word of words) {
      yield word + ' '
      await new Promise(resolve => setTimeout(resolve, 50)) // Simulate streaming delay
    }
  }

  async generate(messages: BaseMessage[]): Promise<string> {
    const chunks: string[] = []
    for await (const chunk of this.generateStream(messages)) {
      chunks.push(chunk)
    }
    return chunks.join('')
  }
}

/**
 * Chat orchestration graph
 */
export class ChatGraph {
  private graph: StateGraph<GraphState>
  private llmProvider: LLMProvider

  constructor(llmProvider: LLMProvider) {
    this.llmProvider = llmProvider
    this.graph = this.buildGraph()
  }

  private buildGraph(): StateGraph<GraphState> {
    const graph = new StateGraph<GraphState>({
      channels: {
        userId: null,
        threadId: null,
        userMessage: null,
        messages: null,
        retrievedChunks: null,
        contextSummary: null,
        citations: null,
        response: null,
        requestId: null,
        error: null,
      }
    })

    // Add nodes
    graph.addNode('inputGate', this.inputGate.bind(this))
    graph.addNode('loadHistory', this.loadHistory.bind(this))
    graph.addNode('retrieveNotes', this.retrieveNotes.bind(this))
    graph.addNode('composePrompt', this.composePrompt.bind(this))
    graph.addNode('generateResponse', this.generateResponse.bind(this))
    graph.addNode('saveMessage', this.saveMessage.bind(this))

    // Define flow
    graph.addEdge(START, 'inputGate')
    graph.addEdge('inputGate', 'loadHistory')
    graph.addEdge('loadHistory', 'retrieveNotes')
    graph.addEdge('retrieveNotes', 'composePrompt')
    graph.addEdge('composePrompt', 'generateResponse')
    graph.addEdge('generateResponse', 'saveMessage')
    graph.addEdge('saveMessage', END)

    return graph
  }

  /**
   * Input validation and normalization
   */
  private async inputGate(state: GraphState): Promise<Partial<GraphState>> {
    if (!state.userId || !state.threadId || !state.userMessage) {
      return { error: 'Missing required fields: userId, threadId, or userMessage' }
    }

    if (state.userMessage.trim().length === 0) {
      return { error: 'User message cannot be empty' }
    }

    if (state.userMessage.length > 4000) {
      return { error: 'User message too long (max 4000 characters)' }
    }

    return {}
  }

  /**
   * Load recent conversation history
   */
  private async loadHistory(state: GraphState): Promise<Partial<GraphState>> {
    try {
      const recentMessages = await getRecentMessages(state.threadId, 10)
      return { messages: recentMessages }
    } catch (error) {
      console.error('Failed to load history:', error)
      return { messages: [] }
    }
  }

  /**
   * Retrieve relevant note context
   */
  private async retrieveNotes(state: GraphState): Promise<Partial<GraphState>> {
    try {
      const result = await retrieveNoteContext(state.userMessage, state.userId, {
        maxResults: 15,
        maxContextTokens: 3000,
      })

      return {
        retrievedChunks: result.chunks,
        contextSummary: result.contextSummary,
        citations: result.citations,
      }
    } catch (error) {
      console.error('Failed to retrieve notes:', error)
      return {
        retrievedChunks: [],
        contextSummary: '',
        citations: [],
      }
    }
  }

  /**
   * Compose the prompt with context
   */
  private async composePrompt(state: GraphState): Promise<Partial<GraphState>> {
    const systemPrompt = this.buildSystemPrompt(state.contextSummary, state.retrievedChunks)
    const conversationMessages = this.buildConversationMessages(state.messages, state.userMessage)

    return {
      response: '', // Reset response for streaming
      messages: [
        ...state.messages,
        {
          id: crypto.randomUUID(),
          thread_id: state.threadId,
          role: 'system' as const,
          content: { text: systemPrompt },
          token_count: null,
          created_at: new Date().toISOString(),
        },
        ...conversationMessages,
      ]
    }
  }

  /**
   * Generate streaming response
   */
  private async generateResponse(state: GraphState): Promise<Partial<GraphState>> {
    try {
      const messages = this.convertToLangChainMessages(state.messages)
      const response = await this.llmProvider.generate(messages)

      return { response }
    } catch (error) {
      console.error('Failed to generate response:', error)
      return { 
        response: 'I apologize, but I encountered an error generating a response. Please try again.',
        error: (error as Error).message 
      }
    }
  }

  /**
   * Save messages to database
   */
  private async saveMessage(state: GraphState): Promise<Partial<GraphState>> {
    try {
      // Save user message
      await createMessage(
        state.threadId,
        'user',
        { text: state.userMessage },
        Math.ceil(state.userMessage.length / 4)
      )

      // Save assistant response with citations
      await createMessage(
        state.threadId,
        'assistant',
        { 
          text: state.response,
          citations: state.citations,
          metadata: { 
            contextSummary: state.contextSummary,
            requestId: state.requestId 
          }
        },
        Math.ceil(state.response.length / 4)
      )

      // Update thread timestamp
      await touchThread(state.threadId)

      return {}
    } catch (error) {
      console.error('Failed to save messages:', error)
      return { error: (error as Error).message }
    }
  }

  /**
   * Build system prompt with context
   */
  private buildSystemPrompt(contextSummary: string, chunks: RetrievedChunk[]): string {
    const contextText = chunks.length > 0 
      ? chunks.map((chunk, i) => `[${i + 1}] ${chunk.text}`).join('\n\n')
      : 'No relevant notes found.'

    return `You are an AI assistant that helps users with questions about their personal notes and meetings.

CONTEXT FROM USER'S NOTES:
${contextText}

INSTRUCTIONS:
- Answer based on the provided context when relevant
- If the context doesn't contain relevant information, say so clearly
- Always cite your sources using the format [1], [2], etc. when referencing the context
- Be concise but helpful
- If asked about something not in the context, provide general knowledge but clearly distinguish it

Context Summary: ${contextSummary}`
  }

  /**
   * Build conversation messages
   */
  private buildConversationMessages(history: Message[], newUserMessage: string): Message[] {
    const userMessage: Message = {
      id: crypto.randomUUID(),
      thread_id: history[0]?.thread_id || '',
      role: 'user',
      content: { text: newUserMessage },
      token_count: Math.ceil(newUserMessage.length / 4),
      created_at: new Date().toISOString(),
    }

    return [...history.slice(-8), userMessage] // Keep last 8 messages for context
  }

  /**
   * Convert to LangChain message format
   */
  private convertToLangChainMessages(messages: Message[]): BaseMessage[] {
    return messages.map(msg => {
      const content = typeof msg.content === 'string' ? msg.content : msg.content.text
      
      switch (msg.role) {
        case 'user':
          return new HumanMessage(content)
        case 'assistant':
          return new AIMessage(content)
        default:
          return new HumanMessage(content) // Fallback
      }
    })
  }

  /**
   * Execute the graph
   */
  async execute(input: {
    userId: string
    threadId: string
    userMessage: string
    requestId: string
  }): Promise<GraphState> {
    const compiled = this.graph.compile()
    
    const initialState: GraphState = {
      userId: input.userId,
      threadId: input.threadId,
      userMessage: input.userMessage,
      requestId: input.requestId,
      messages: [],
      retrievedChunks: [],
      contextSummary: '',
      citations: [],
      response: '',
    }

    const result = await compiled.invoke(initialState)
    return result
  }

  /**
   * Execute with streaming support
   */
  async *executeStream(input: {
    userId: string
    threadId: string
    userMessage: string
    requestId: string
  }): AsyncGenerator<{ type: 'token' | 'complete' | 'error'; data: string | { message?: Message; citations?: Citation[]; error?: string; token?: string; response?: string; contextSummary?: string } }, void, unknown> {
    // Run through retrieval and prompt composition
    
    const initialState: GraphState = {
      userId: input.userId,
      threadId: input.threadId,
      userMessage: input.userMessage,
      requestId: input.requestId,
      messages: [],
      retrievedChunks: [],
      contextSummary: '',
      citations: [],
      response: '',
    }

    // Execute up to prompt composition
    let state = initialState
    for (const node of ['inputGate', 'loadHistory', 'retrieveNotes', 'composePrompt']) {
      const nodeFunc = (this as unknown as Record<string, (state: GraphState) => Promise<Partial<GraphState>>>)[node].bind(this)
      const update = await nodeFunc(state)
      state = { ...state, ...update }
      
      if (state.error) {
        yield { type: 'complete', data: { error: state.error } }
        return
      }
    }

    // Stream the response
    try {
      const messages = this.convertToLangChainMessages(state.messages)
      let fullResponse = ''

      for await (const token of this.llmProvider.generateStream(messages)) {
        fullResponse += token
        yield { type: 'token', data: { token } }
      }

      // Save messages
      state.response = fullResponse
      await this.saveMessage(state)

      yield { 
        type: 'complete', 
        data: { 
          response: fullResponse,
          citations: state.citations,
          contextSummary: state.contextSummary 
        } 
      }
    } catch (error) {
      yield { 
        type: 'complete', 
        data: { 
          error: (error as Error).message,
          response: 'I apologize, but I encountered an error generating a response.'
        } 
      }
    }
  }
}

/**
 * Initialize chat graph with appropriate LLM provider
 */
export const initializeChatGraph = (): ChatGraph => {
  const openaiApiKey = process.env.OPENAI_API_KEY

  if (openaiApiKey) {
    return new ChatGraph(new OpenAIProvider(openaiApiKey))
  } else {
    console.warn('OPENAI_API_KEY not found, using mock LLM provider')
    return new ChatGraph(new MockLLMProvider())
  }
}

// Export singleton instance
export const chatGraph = initializeChatGraph()
