import { getAllQnA } from "../actions"
import { Glossary } from "@/components/glossary"
import { FadeIn } from "@/components/ui/motion"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default async function GlossaryPage() {
  const allQnA = await getAllQnA()
  
  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <FadeIn>
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild className="hover:scale-105 transition-transform">
            <Link href="/">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Supply Chain Glossary</h1>
            <p className="text-muted-foreground">
              Reference for terminology and definitions from all meetings.
            </p>
          </div>
        </div>
      </FadeIn>
      
      <FadeIn delay={0.2}>
        <div className="bg-card rounded-lg border shadow-sm p-6 transition-all hover:shadow-md">
          <Glossary entries={allQnA} />
        </div>
      </FadeIn>
    </div>
  )
}

