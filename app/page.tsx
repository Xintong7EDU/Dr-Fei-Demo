"use client"

import { MainNav } from "@/components/main-nav"
import { MeetingList } from "@/components/meeting-list"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PlusIcon, BookOpenIcon, ArchiveIcon } from "lucide-react"
import Link from "next/link"

// Mock data for demonstration - in a real app this would come from a database
const recentMeetings = [
  {
    meeting_id: 1,
    topic_overview: "Weekly Research Review",
    meeting_date: "2024-01-15",
    start_time: "14:00:00",
    end_time: "15:30:00"
  },
  {
    meeting_id: 2, 
    topic_overview: "Project Planning Session",
    meeting_date: "2024-01-12",
    start_time: "10:00:00",
    end_time: "11:00:00"
  }
]

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header with Navigation */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <MainNav />
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2">
            Welcome to Dr. Fei Note
          </h1>
          <p className="text-muted-foreground text-lg">
            Your intelligent meeting management and note-taking platform
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <Link href="/meetings/new">
            <Card className="transition-all hover:shadow-md cursor-pointer">
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
          </Link>

          <Link href="/archive">
            <Card className="transition-all hover:shadow-md cursor-pointer">
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
          </Link>

          <Link href="/glossary">
            <Card className="transition-all hover:shadow-md cursor-pointer">
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
          </Link>
        </div>

        {/* Recent Meetings Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold tracking-tight">Recent Meetings</h2>
            <Link 
              href="/meetings" 
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              View all →
            </Link>
          </div>
          
          <MeetingList 
            meetings={recentMeetings} 
            emptyMessage="No recent meetings found. Schedule your first meeting to get started."
          />
        </div>

        {/* Getting Started Section */}
        <div className="mt-12 p-6 bg-muted/50 rounded-lg">
          <h3 className="text-lg font-semibold mb-3">Getting Started</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="font-medium mb-2">📅 Schedule Meetings</h4>
              <p className="text-sm text-muted-foreground">
                Create and organize your meeting sessions with detailed topics and time slots.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">📝 Take Notes</h4>
              <p className="text-sm text-muted-foreground">
                Capture important discussions, decisions, and action items during meetings.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">🔍 Search & Reference</h4>
              <p className="text-sm text-muted-foreground">
                Quickly find past meeting notes and reference important terminology.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">📊 Track Progress</h4>
              <p className="text-sm text-muted-foreground">
                Monitor meeting outcomes and follow up on action items effectively.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
