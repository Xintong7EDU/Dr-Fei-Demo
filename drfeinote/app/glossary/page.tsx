import { getAllQnA } from "../actions"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

export default async function GlossaryPage() {
  const allQnA = await getAllQnA()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Supply Chain Glossary</h1>
        <p className="text-muted-foreground">Browse all supply chain terminology and explanations</p>
      </div>

      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input type="search" placeholder="Search glossary..." className="w-full pl-8 md:max-w-sm" />
        <p className="text-xs text-muted-foreground mt-1">Note: Search functionality is a placeholder for v0</p>
      </div>

      <div className="grid gap-6">
        {allQnA.map((entry) => (
          <Card key={entry.qna_id}>
            <CardHeader>
              <CardTitle>{entry.term_or_question}</CardTitle>
              {entry.meeting_id && <CardDescription>From meeting #{entry.meeting_id}</CardDescription>}
            </CardHeader>
            <CardContent>
              <p>{entry.gpt4_response}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
