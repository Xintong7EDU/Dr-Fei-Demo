import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"
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
  // Check authentication
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookies) {
          cookies.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login')
  }

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
      </main>
    </div>
  )
}
