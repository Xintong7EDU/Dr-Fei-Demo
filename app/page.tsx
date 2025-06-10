import { MainNav } from "@/components/main-nav"
import { MeetingList } from "@/components/meeting-list"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PlusIcon, BookOpenIcon, ArchiveIcon } from "lucide-react"
import Link from "next/link"
import { MeetingsService } from "@/lib/meetings"
import { supabase } from "@/lib/supabase"
import { ThemeToggle } from "@/components/theme-toggle"
import { 
  FadeIn, 
  SlideUp, 
  StaggerContainer, 
  StaggerItem, 
  HoverCard 
} from "@/components/ui/motion"

export default async function Home() {
  const meetingsService = new MeetingsService(supabase)
  const upcomingMeetings = await meetingsService.list("upcoming")
  const recentMeetings = await meetingsService.list("past")

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

        {/* Quick Actions */}
        <StaggerContainer className="grid gap-6 md:grid-cols-3 mb-8">
          <StaggerItem index={0}>
            <Link href="/meetings/new">
              <HoverCard className="transition-all hover:shadow-md cursor-pointer">
                <Card>
                  <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">New Meeting</CardTitle>
                    <PlusIcon className="h-4 w-4 ml-auto" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">Schedule</div>
                    <p className="text-xs text-muted-foreground">
                      Create a new meeting session
                    </p>
                  </CardContent>
                </Card>
              </HoverCard>
            </Link>
          </StaggerItem>

          <StaggerItem index={1}>
            <Link href="/archive">
              <HoverCard className="transition-all hover:shadow-md cursor-pointer">
                <Card>
                  <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Archive</CardTitle>
                    <ArchiveIcon className="h-4 w-4 ml-auto" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">Browse</div>
                    <p className="text-xs text-muted-foreground">
                      View past meeting records
                    </p>
                  </CardContent>
                </Card>
              </HoverCard>
            </Link>
          </StaggerItem>

          <StaggerItem index={2}>
            <Link href="/glossary">
              <HoverCard className="transition-all hover:shadow-md cursor-pointer">
                <Card>
                  <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Glossary</CardTitle>
                    <BookOpenIcon className="h-4 w-4 ml-auto" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">Reference</div>
                    <p className="text-xs text-muted-foreground">
                      Access terminology and definitions
                    </p>
                  </CardContent>
                </Card>
              </HoverCard>
            </Link>
          </StaggerItem>
        </StaggerContainer>

        {/* Upcoming Meetings Section */}
        <SlideUp delay={0.2} className="space-y-6 mb-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold tracking-tight">Upcoming Meetings</h2>
            <Link
              href="/meetings"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              View all →
            </Link>
          </div>

          <MeetingList
            meetings={upcomingMeetings}
            emptyMessage="No meetings scheduled."
            linkBasePath="/meetings"
          />
        </SlideUp>

        {/* Recent Meetings Section */}
        <SlideUp delay={0.3} className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold tracking-tight">Recent Meetings</h2>
            <Link 
              href="/recent" 
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              View all →
            </Link>
          </div>
          
          <MeetingList
            meetings={recentMeetings}
            emptyMessage="No recent meetings found. Schedule your first meeting to get started."
            linkBasePath="/recent"
          />
        </SlideUp>

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
              <h4 className="font-medium mb-2">📝 Take Notes</h4>
              <p className="text-sm text-muted-foreground">
                Capture important discussions, decisions, and action items during meetings.
              </p>
            </div>
            <div className="p-3 rounded-md hover:bg-background/50 transition-colors">
              <h4 className="font-medium mb-2">🔍 Search & Reference</h4>
              <p className="text-sm text-muted-foreground">
                Quickly find past meeting notes and reference important terminology.
              </p>
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
