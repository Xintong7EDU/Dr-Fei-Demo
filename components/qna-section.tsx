"use client"

import type React from "react"

import { useState } from "react"
import { askQuestion } from "@/app/actions"
import type { QnAEntry } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Loader2, Search, MessageSquare, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface QnASectionProps {
  meetingId: number
  initialEntries: QnAEntry[]
}

export function QnASection({ meetingId, initialEntries }: QnASectionProps) {
  const [entries, setEntries] = useState<QnAEntry[]>(initialEntries)
  const [question, setQuestion] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [expandedItems, setExpandedItems] = useState<string[]>([])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!question.trim()) return

    setIsLoading(true)
    try {
      const newEntry = await askQuestion(question, meetingId)
      setEntries([newEntry, ...entries])
      setQuestion("")
      
      // Auto-expand the new entry
      setExpandedItems([newEntry.qna_id.toString()])
    } catch (error) {
      console.error("Error asking question:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Filter entries based on search term
  const filteredEntries = searchTerm.trim() === "" 
    ? entries 
    : entries.filter(entry => 
        entry.term_or_question.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.gpt4_response.toLowerCase().includes(searchTerm.toLowerCase())
      )

  // Handle accordion state change
  const handleAccordionChange = (value: string) => {
    if (expandedItems.includes(value)) {
      setExpandedItems(expandedItems.filter(item => item !== value))
    } else {
      setExpandedItems([...expandedItems, value])
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask a supply chain question..."
            disabled={isLoading}
            className="pr-10"
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
            "Ask"
          )}
        </Button>
      </form>

      {entries.length > 0 && (
        <div className="relative">
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search in Q&A..."
            className="mb-3 pr-10"
            aria-label="Search in Q&A"
          />
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        </div>
      )}

      {filteredEntries.length > 0 ? (
        <Accordion 
          type="multiple" 
          value={expandedItems}
          className="w-full space-y-2"
        >
          {filteredEntries.map((entry) => (
            <AccordionItem 
              key={entry.qna_id} 
              value={entry.qna_id.toString()}
              className="border border-border rounded-md overflow-hidden shadow-sm hover:shadow-md transition-all"
            >
              <AccordionTrigger 
                onClick={() => handleAccordionChange(entry.qna_id.toString())}
                className="px-4 py-3 text-left font-medium hover:bg-muted/50"
              >
                <div className="flex items-start">
                  <span className="text-purple-600 dark:text-purple-400 mr-2">Q:</span>
                  <span>{entry.term_or_question}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4 pt-1">
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <div className="flex items-start">
                    <span className="text-purple-600 dark:text-purple-400 mr-2 font-medium">A:</span>
                    <p className="mt-0">{entry.gpt4_response}</p>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      ) : entries.length > 0 ? (
        <div className="flex flex-col items-center justify-center p-8 text-center border rounded-md bg-muted/20">
          <AlertCircle className="h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-muted-foreground">No matching Q&A entries found.</p>
          <p className="text-sm text-muted-foreground">Try a different search term.</p>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-8 text-center border rounded-md bg-muted/20">
          <MessageSquare className="h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-muted-foreground">No Q&A entries for this meeting yet.</p>
          <p className="text-sm text-muted-foreground">Ask a question to get started.</p>
        </div>
      )}
    </div>
  )
}
