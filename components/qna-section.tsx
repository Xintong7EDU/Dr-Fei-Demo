"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { askQuestion } from "@/app/actions"
import type { QnAEntry } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, MessageSquare, Send, Bot, User } from "lucide-react"
import { cn } from "@/lib/utils"

interface QnASectionProps {
  meetingId: number
  initialEntries: QnAEntry[]
}

/**
 * QnASection component that displays an AI conversation interface
 * Users can ask questions and see AI responses in a chat-like format
 */
export function QnASection({ meetingId, initialEntries }: QnASectionProps) {
  const [entries, setEntries] = useState<QnAEntry[]>(initialEntries)
  const [question, setQuestion] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  /**
   * Scrolls to the bottom of the conversation
   * Used when new messages are added
   */
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  // Auto-scroll to bottom when entries change
  useEffect(() => {
    scrollToBottom()
  }, [entries])

  /**
   * Handles form submission to ask a new question
   * @param e - Form event
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!question.trim()) return

    setIsLoading(true)
    try {
      const newEntry = await askQuestion(question, meetingId)
      setEntries([...entries, newEntry]) // Add to end for chronological order
      setQuestion("")
    } catch (error) {
      console.error("Error asking question:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Sort entries by creation time for chronological display
  const sortedEntries = [...entries].sort((a, b) => a.qna_id - b.qna_id)

  return (
    <div className="flex flex-col h-[500px]">
      {/* Chat Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/20 rounded-t-lg">
        {sortedEntries.length > 0 ? (
          <>
            {sortedEntries.map((entry) => (
              <div key={entry.qna_id} className="space-y-3">
                {/* User Question */}
                <div className="flex justify-end">
                  <div className="flex items-start gap-2 max-w-[80%]">
                    <div className="bg-purple-600 text-white rounded-2xl rounded-br-sm px-4 py-2 shadow-sm">
                      <p className="text-sm">{entry.term_or_question}</p>
                    </div>
                    <div className="flex-shrink-0 w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    </div>
                  </div>
                </div>

                {/* AI Response */}
                <div className="flex justify-start">
                  <div className="flex items-start gap-2 max-w-[80%]">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                      <Bot className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="bg-card border rounded-2xl rounded-bl-sm px-4 py-2 shadow-sm">
                      <p className="text-sm leading-relaxed">{entry.gpt4_response}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Loading indicator for new message */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="flex items-start gap-2 max-w-[80%]">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                    <Bot className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="bg-card border rounded-2xl rounded-bl-sm px-4 py-2 shadow-sm">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">AI is thinking...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mb-4">
              <MessageSquare className="h-8 w-8 text-purple-600 dark:text-purple-400" />
            </div>
            <p className="text-muted-foreground font-medium">Start a conversation</p>
            <p className="text-sm text-muted-foreground">Ask your first supply chain question below</p>
          </div>
        )}
        
        {/* Scroll anchor */}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <div className="p-4 bg-card border-t rounded-b-lg">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask a supply chain question..."
              disabled={isLoading}
              className="pr-12"
              aria-label="Supply chain question"
            />
            <MessageSquare className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          </div>
          <Button 
            type="submit" 
            disabled={isLoading || !question.trim()}
            className={cn(
              "transition-all",
              question.trim() ? "bg-purple-600 hover:bg-purple-700" : ""
            )}
            aria-label={isLoading ? "Submitting question" : "Submit question"}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </div>
    </div>
  )
}
