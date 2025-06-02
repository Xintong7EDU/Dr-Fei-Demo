import { getMeetings } from "../actions"
import { MeetingList } from "@/components/meeting-list"
import { FadeIn, SlideUp } from "@/components/ui/motion"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default async function ArchivePage() {
  const pastMeetings = await getMeetings("past")

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
            <h1 className="text-3xl font-bold tracking-tight">Meeting Archive</h1>
            <p className="text-muted-foreground">
              View past meetings and their notes.
            </p>
          </div>
        </div>
      </FadeIn>

      <SlideUp delay={0.2}>
        <div className="bg-card rounded-lg border shadow-sm p-6 transition-all hover:shadow-md">
          <MeetingList
            meetings={pastMeetings}
            emptyMessage="No past meetings found"
          />
        </div>
      </SlideUp>
    </div>
  )
}
