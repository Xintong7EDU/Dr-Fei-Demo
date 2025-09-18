import { MainNav } from "@/components/main-nav"
// removed unused Card imports
import { NoteComposer } from "@/components/note-composer"
import { NoteListClient } from "@/components/note-list-client"
import { listNotes } from "@/app/actions"
// Meetings section removed
import { ThemeToggle } from "@/components/theme-toggle"
import { 
  FadeIn, 
  SlideUp 
} from "@/components/ui/motion"

export default async function Home() {
  const notes = await listNotes(20)

  return (
    <div className="min-h-screen bg-background">
      {/* Header with Navigation */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <MainNav />
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <FadeIn>
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight mb-2">
              Welcome to Dr. Fei Note
            </h1>
            <p className="text-muted-foreground text-lg">
              Your intelligent meeting management and note-taking platform
            </p>
          </div>
        </FadeIn>

        {/* Quick Actions removed */}

        {/* Upcoming Meetings Section removed */}

        {/* Notes composer + list */}
        <SlideUp className="space-y-6">
          <h2 className="text-2xl font-semibold tracking-tight">Notes</h2>
          {/* Client composer */}
          <NoteComposer />
          <NoteListClient initialNotes={notes} emptyMessage="No notes yet. Paste your first HTML note here." />
        </SlideUp>

        {/* Recent Meetings Section removed */}

        {/* Getting Started Section */}
        <SlideUp delay={0.5} className="mt-12 p-6 bg-muted/50 rounded-lg">
          <h3 className="text-lg font-semibold mb-3">Getting Started</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-3 rounded-md hover:bg-background/50 transition-colors">
              <h4 className="font-medium mb-2">📅 Schedule Meetings</h4>
              <p className="text-sm text-muted-foreground">
                Create and organize your meeting sessions with detailed topics and time slots.
              </p>
            </div>
            <div className="p-3 rounded-md hover:bg-background/50 transition-colors">
              <h4 className="font-medium mb-2">🔍 Search & Reference</h4>
              <p className="text-sm text-muted-foreground">Quickly find past meeting records.</p>
            </div>
            <div className="p-3 rounded-md hover:bg-background/50 transition-colors">
              <h4 className="font-medium mb-2">📊 Track Progress</h4>
              <p className="text-sm text-muted-foreground">
                Monitor meeting outcomes and follow up on action items effectively.
              </p>
            </div>
          </div>
        </SlideUp>
      </main>
    </div>
  )
}
