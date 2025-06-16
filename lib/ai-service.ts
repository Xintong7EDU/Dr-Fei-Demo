import OpenAI from 'openai'
import type { ChatMessage, MeetingContext } from './types'

/**
 * Service for AI-powered features using OpenAI
 * Handles text summarization and chat completions with meeting context
 */
export class AIService {
  private openai: OpenAI

  constructor(apiKey?: string) {
    this.openai = new OpenAI({
      apiKey: apiKey || process.env.OPENAI_API_KEY
    })
  }

  /**
   * Send a message to the AI with meeting context
   * @param message - The user's message
   * @param meetingContexts - Array of meeting contexts to include
   * @returns AI response
   */
  async sendMessage(
    message: string, 
    meetingContexts: MeetingContext[] = []
  ): Promise<string> {
    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: this.buildSystemPrompt(meetingContexts)
          },
          {
            role: 'user',
            content: message
          }
        ],
        max_tokens: 2000,
        temperature: 0.7
      })

      return completion.choices[0]?.message?.content || 'I apologize, but I was unable to generate a response.'
    } catch (error) {
      console.error('Error sending message to AI:', error)
      throw new Error('Failed to get AI response')
    }
  }

  /**
   * Create a chat completion with meeting context
   * @param messages - The conversation history
   * @param meetingContexts - Array of meeting contexts to include
   * @returns AI response with meeting context
   */
  async createChatCompletion(
    messages: ChatMessage[],
    meetingContexts: MeetingContext[] = []
  ): Promise<string> {
    try {
      const systemPrompt = this.buildSystemPrompt(meetingContexts)
      
      const openaiMessages = [
        { role: 'system' as const, content: systemPrompt },
        ...messages.map(msg => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content
        }))
      ]

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: openaiMessages,
        max_tokens: 2000,
        temperature: 0.7,
        stream: false
      })

      return completion.choices[0]?.message?.content || 'I apologize, but I could not generate a response.'
    } catch (error) {
      console.error('Error creating chat completion:', error)
      throw new Error('Failed to generate AI response')
    }
  }

  /**
   * Create a streaming chat completion
   * @param messages - The conversation history
   * @param meetingContexts - Array of meeting contexts to include
   * @returns Async generator for streaming response
   */
  async *createStreamingChatCompletion(
    messages: ChatMessage[],
    meetingContexts: MeetingContext[] = []
  ): AsyncGenerator<string> {
    try {
      const systemPrompt = this.buildSystemPrompt(meetingContexts)
      
      const openaiMessages = [
        { role: 'system' as const, content: systemPrompt },
        ...messages.map(msg => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content
        }))
      ]

      const stream = await this.openai.chat.completions.create({
        model: 'gpt-4.1',
        messages: openaiMessages,
        max_tokens: 2000,
        temperature: 0.7,
        stream: true
      })

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content
        if (content) {
          yield content
        }
      }
    } catch (error) {
      console.error('Error creating streaming chat completion:', error)
      throw new Error('Failed to generate streaming AI response')
    }
  }

  /**
   * Build system prompt with meeting context
   * @param meetingContexts - Array of meeting contexts
   * @returns System prompt with injected context
   */
  private buildSystemPrompt(meetingContexts: MeetingContext[]): string {
    let prompt = `You are a helpful AI assistant for a meeting management system. You can answer questions about meetings, help analyze meeting content, and provide insights based on meeting notes and summaries.

    Be professional, concise, and helpful. When referencing specific meetings, include the meeting date and topic for clarity.`

    if (meetingContexts.length > 0) {
      prompt += `\n\nYou have access to the following meeting information:\n\n`
      
      meetingContexts.forEach((context, index) => {
        prompt += `Meeting ${index + 1}:\n`
        prompt += `- Date: ${context.meeting.meeting_date}\n`
        prompt += `- Time: ${context.meeting.start_time} - ${context.meeting.end_time}\n`
        prompt += `- Topic: ${context.meeting.topic_overview}\n`
        
        if (context.notes?.note_content) {
          // Include full notes content (no truncation here - let the context service handle optimization)
          prompt += `- Notes: ${context.notes.note_content}\n`
        }
        prompt += '\n'
      })

      prompt += 'Use this meeting information to provide context-aware responses to user questions.'
    }

    return prompt
  }
}