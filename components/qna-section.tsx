"use client"

import type React from "react"

import { useState } from "react"
import { askQuestion } from "@/app/actions"
import type { QnAEntry } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Loader2 } from "lucide-react"

interface QnASectionProps {
  meetingId: number
  initialEntries: QnAEntry[]
}

export function QnASection({ meetingId, initialEntries }: QnASectionProps) {
  const [entries, setEntries] = useState<QnAEntry[]>(initialEntries)
  const [question, setQuestion] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!question.trim()) return

    setIsLoading(true)
    try {
      const newEntry = await askQuestion(question, meetingId)
      setEntries([newEntry, ...entries])
      setQuestion("")
    } catch (error) {
      console.error("Error asking question:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ask about supply chain terminology</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Enter a term or question..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button type="submit" disabled={isLoading || !question.trim()}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Get Explanation"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {entries.length > 0 ? (
        <Accordion type="single" collapsible className="w-full">
          {entries.map((entry) => (
            <AccordionItem key={entry.qna_id} value={entry.qna_id.toString()}>
              <AccordionTrigger className="text-left">{entry.term_or_question}</AccordionTrigger>
              <AccordionContent>
                <div className="prose prose-sm dark:prose-invert">
                  <p>{entry.gpt4_response}</p>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      ) : (
        <p className="text-center text-muted-foreground py-4">
          No Q&A entries for this meeting yet. Ask a question to get started.
        </p>
      )}
    </div>
  )
}
