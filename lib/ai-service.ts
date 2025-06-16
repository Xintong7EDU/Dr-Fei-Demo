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
   * Generate a concise summary of meeting notes
   * @param noteContent - The full meeting notes content
   * @returns A concise summary of the notes
   */
  async generateMeetingSummary(noteContent: string): Promise<string> {
    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are an expert at summarizing meeting notes. Create a concise, well-structured summary that captures:
            - Key decisions made
            - Action items and assignments
            - Important discussion points
            - Next steps

            Keep the summary professional and under 200 words. Use bullet points when appropriate.`
          },
          {
            role: 'user',
            content: `Please summarize these meeting notes:\n\n${noteContent}`
          }
        ],
        max_tokens: 300,
        temperature: 0.3
      })

      return completion.choices[0]?.message?.content || 'Summary could not be generated.'
    } catch (error) {
      console.error('Error generating meeting summary:', error)
      throw new Error('Failed to generate meeting summary')
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
        max_tokens: 1000,
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
        model: 'gpt-4o-mini',
        messages: openaiMessages,
        max_tokens: 1000,
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
        
        if (context.summary) {
          prompt += `- Summary: ${context.summary}\n`
        } else if (context.notes?.note_content) {
          // If no summary, include truncated notes
          const truncatedNotes = context.notes.note_content.length > 500 
            ? context.notes.note_content.substring(0, 500) + '...'
            : context.notes.note_content
          prompt += `- Notes: ${truncatedNotes}\n`
        }
        prompt += '\n'
      })

      prompt += 'Use this meeting information to provide context-aware responses to user questions.'
    }

    return prompt
  }

  /**
   * Extract key topics from meeting notes
   * @param noteContent - The meeting notes content
   * @returns Array of key topics/themes
   */
  async extractKeyTopics(noteContent: string): Promise<string[]> {
    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Extract 3-5 key topics or themes from the following meeting notes. Return only the topics as a comma-separated list.'
          },
          {
            role: 'user',
            content: noteContent
          }
        ],
        max_tokens: 100,
        temperature: 0.3
      })

      const topics = completion.choices[0]?.message?.content
      return topics ? topics.split(',').map(topic => topic.trim()) : []
    } catch (error) {
      console.error('Error extracting key topics:', error)
      return []
    }
  }
} 