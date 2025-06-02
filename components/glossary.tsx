"use client"

import { useState, useDeferredValue, useMemo } from "react"
import type { QnAEntry } from "@/lib/types"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

interface GlossaryProps {
  entries: QnAEntry[]
}

export function Glossary({ entries }: GlossaryProps) {
  const [search, setSearch] = useState("")

  const deferredSearch = useDeferredValue(search)

  const filteredEntries = useMemo(
    () =>
      entries.filter((entry) =>
        entry.term_or_question.toLowerCase().includes(deferredSearch.toLowerCase())
      ),
    [entries, deferredSearch]
  )

  const highlight = (text: string) => {
    if (!deferredSearch) return text
    const regex = new RegExp(`(${deferredSearch})`, "gi")
    const parts = text.split(regex)
    return parts.map((part, i) =>
      regex.test(part) ? <mark key={i}>{part}</mark> : part
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Supply Chain Glossary</h1>
        <p className="text-muted-foreground">
          Browse all supply chain terminology and explanations
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search glossary..."
          className="w-full pl-8 md:max-w-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <p className="text-sm text-muted-foreground">
        Showing {filteredEntries.length} of {entries.length} terms
      </p>
      <Accordion type="single" collapsible className="grid gap-4">
        {filteredEntries.length > 0 ? (
          filteredEntries.map((entry) => (
            <AccordionItem key={entry.qna_id} value={entry.qna_id.toString()}>
              <AccordionTrigger className="text-left">
                {highlight(entry.term_or_question)}
              </AccordionTrigger>
              <AccordionContent>
                <Card>
                  <CardHeader>
                    {entry.meeting_id && (
                      <CardDescription>From meeting #{entry.meeting_id}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <p>{entry.gpt4_response}</p>
                  </CardContent>
                </Card>
              </AccordionContent>
            </AccordionItem>
          ))
        ) : (
          <p className="text-muted-foreground">No results found.</p>
        )}
      </Accordion>
    </div>
  )
}

