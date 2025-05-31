"use client"

import { useState } from "react"
import type { QnAEntry } from "@/lib/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

interface GlossaryProps {
  entries: QnAEntry[]
}

export function Glossary({ entries }: GlossaryProps) {
  const [search, setSearch] = useState("")

  const filteredEntries = entries.filter((entry) =>
    entry.term_or_question.toLowerCase().includes(search.toLowerCase())
  )

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

      <div className="grid gap-6">
        {filteredEntries.length > 0 ? (
          filteredEntries.map((entry) => (
            <Card key={entry.qna_id}>
              <CardHeader>
                <CardTitle>{entry.term_or_question}</CardTitle>
                {entry.meeting_id && (
                  <CardDescription>From meeting #{entry.meeting_id}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <p>{entry.gpt4_response}</p>
              </CardContent>
            </Card>
          ))
        ) : (
          <p className="text-muted-foreground">No results found.</p>
        )}
      </div>
    </div>
  )
}

