'use client'

import { useState, useEffect } from "react"
import { getMeetings } from "../actions"
import { MeetingList } from "@/components/meeting-list"
import { RecentMeetingsStats } from "@/components/recent-meetings-stats"
import { RecentMeetingsFilters } from "@/components/recent-meetings-filters"
import { RefreshButton } from "@/components/refresh-button"
import { FadeIn, SlideUp, StaggerContainer, StaggerItem } from "@/components/ui/motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Calendar, Clock, BookOpen, Plus, MapPin, CalendarDays } from "lucide-react"
import Link from "next/link"
import { Suspense } from "react"
import { formatDate, getCurrentDateStringPST } from "@/lib/utils"
import type { Meeting } from "@/lib/types"

interface MeetingsPageProps {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>
}

/**
 * Unified Meetings Page - Displays both upcoming and past meetings with tabs
 * Features: Statistics, filtering, search, and unified meeting management
 * All times displayed in Pacific Standard Time (PST)
 */
export default function MeetingsPage({ searchParams }: MeetingsPageProps) {
  const [upcomingMeetings, setUpcomingMeetings] = useState<Meeting[]>([])
  const [pastMeetings, setPastMeetings] = useState<Meeting[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("upcoming")
  const [params, setParams] = useState<{ [key: string]: string | string[] | undefined }>({})

  // Load search params and meetings data
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true)
        const [upcoming, past, searchParamsResolved] = await Promise.all([
          getMeetings("upcoming"),
          getMeetings("past"),
          searchParams || Promise.resolve({})
        ])
        
        setUpcomingMeetings(upcoming)
        setPastMeetings(past)
        setParams(await searchParamsResolved)
      } catch (error) {
        console.error('Error loading meetings:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [searchParams])

  // Extract search and filter parameters
  const searchQuery = params?.search as string || ""
  const dateFilter = params?.date as string || ""
  const topicFilter = params?.topic as string || ""

  // Filter meetings based on search parameters
  const filterMeetings = (meetings: Meeting[]) => {
    return meetings.filter((meeting) => {
      const matchesSearch = !searchQuery || 
        meeting.topic_overview.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesDate = !dateFilter || meeting.meeting_date.includes(dateFilter)
      
      const matchesTopic = !topicFilter || 
        meeting.topic_overview.toLowerCase().includes(topicFilter.toLowerCase())
      
      return matchesSearch && matchesDate && matchesTopic
    })
  }

  const filteredUpcoming = filterMeetings(upcomingMeetings)
  const filteredPast = filterMeetings(pastMeetings)

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        <div className="h-20 bg-muted/20 rounded-lg animate-pulse" />
        <div className="h-32 bg-muted/20 rounded-lg animate-pulse" />
        <div className="h-96 bg-muted/20 rounded-lg animate-pulse" />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Header Section */}
      <FadeIn>
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="icon" 
            asChild 
            className="hover:scale-105 transition-transform shadow-sm hover:shadow-md"
          >
            <Link href="/" aria-label="Back to home">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <Calendar className="h-8 w-8 text-primary" />
              Meetings
            </h1>
            <p className="text-muted-foreground mt-1 flex items-center gap-2">
              Manage all your meetings - upcoming and past records.
              <span className="inline-flex items-center gap-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full">
                <MapPin className="h-3 w-3" />
                PST Timezone
              </span>
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild size="default" className="shadow-sm hover:shadow-md">
              <Link href="/meetings/new" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                New Meeting
              </Link>
            </Button>
            <RefreshButton 
              variant="outline" 
              size="default"
              label="Refresh Data"
              className="shadow-sm hover:shadow-md"
            />
          </div>
        </div>
      </FadeIn>

      {/* PST Timezone Info Banner */}
      <SlideUp delay={0.05}>
        <Card className="border-l-4 border-l-blue-500 bg-gradient-to-r from-blue-50/50 to-blue-100/30 dark:from-blue-950/20 dark:to-blue-900/10">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <div>
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    All meeting times are displayed in Pacific Standard Time (PST)
                  </p>
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    Today is {formatDate(getCurrentDateStringPST())} in PST
                  </p>
                </div>
              </div>
              <div className="text-xs text-blue-600 dark:text-blue-400 font-mono">
                UTC-8
              </div>
            </div>
          </CardContent>
        </Card>
      </SlideUp>

      {/* Statistics Cards - Only show for past meetings */}
      {activeTab === "past" && (
        <SlideUp delay={0.1}>
          <Suspense fallback={<div className="h-32 bg-muted/20 rounded-lg animate-pulse" />}>
            <RecentMeetingsStats meetings={pastMeetings} />
          </Suspense>
        </SlideUp>
      )}

      {/* Main Tabs Interface */}
      <SlideUp delay={0.2}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="flex items-center justify-between">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="upcoming" className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4" />
                Upcoming ({filteredUpcoming.length})
              </TabsTrigger>
              <TabsTrigger value="past" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Past ({filteredPast.length})
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Search and Filters */}
          <Card className="border-l-4 border-l-primary shadow-sm hover:shadow-md transition-all">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                Filter & Search
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<div className="h-20 bg-muted/20 rounded-lg animate-pulse" />}>
                <RecentMeetingsFilters 
                  meetings={activeTab === "upcoming" ? upcomingMeetings : pastMeetings}
                  currentSearch={searchQuery}
                  currentDateFilter={dateFilter}
                  currentTopicFilter={topicFilter}
                />
              </Suspense>
            </CardContent>
          </Card>

          {/* Tab Content */}
          <TabsContent value="upcoming" className="space-y-6">
            <Card className="shadow-sm hover:shadow-md transition-all">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <CalendarDays className="h-5 w-5 text-primary" />
                    Upcoming Meetings
                    <span className="text-sm font-normal text-muted-foreground">
                      ({filteredUpcoming.length} {filteredUpcoming.length === 1 ? 'meeting' : 'meetings'})
                    </span>
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <RefreshButton 
                      variant="outline" 
                      size="sm"
                      label="Refresh"
                    />
                    <Button asChild size="sm">
                      <Link href="/meetings/new">
                        <Plus className="h-4 w-4 mr-2" />
                        Schedule
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <StaggerContainer>
                  <StaggerItem index={0}>
                    <MeetingList
                      meetings={filteredUpcoming}
                      emptyMessage={
                        searchQuery || dateFilter || topicFilter
                          ? "No upcoming meetings found matching your filters. Try adjusting your search criteria."
                          : "No upcoming meetings scheduled. Create your first meeting to get started."
                      }
                      linkBasePath="/meetings"
                      showDeleteButton={true}
                    />
                  </StaggerItem>
                </StaggerContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="past" className="space-y-6">
            <Card className="shadow-sm hover:shadow-md transition-all">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    Meeting History
                    <span className="text-sm font-normal text-muted-foreground">
                      ({filteredPast.length} {filteredPast.length === 1 ? 'meeting' : 'meetings'})
                    </span>
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <RefreshButton 
                      variant="outline" 
                      size="sm"
                      label="Refresh"
                    />
                    {filteredPast.length > 0 && (
                      <Button variant="outline" size="sm" asChild>
                        <Link href="/archive">
                          View Archive
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <StaggerContainer>
                  <StaggerItem index={0}>
                    <MeetingList
                      meetings={filteredPast}
                      emptyMessage={
                        searchQuery || dateFilter || topicFilter
                          ? "No past meetings found matching your filters. Try adjusting your search criteria."
                          : "No past meetings found. Your completed meetings will appear here."
                      }
                      linkBasePath="/meetings"
                      showDeleteButton={true}
                    />
                  </StaggerItem>
                </StaggerContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </SlideUp>

      {/* Quick Actions */}
      <SlideUp delay={0.4}>
        <Card className="bg-gradient-to-r from-primary/5 to-secondary/5 border-dashed">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold flex items-center gap-2">
                  <Plus className="h-5 w-5 text-primary" />
                  Ready to schedule your next meeting?
                </h3>
                <p className="text-sm text-muted-foreground">
                  Create and manage your meetings with automatic PST timezone handling.
                </p>
              </div>
              <div className="flex gap-2">
                <Button asChild size="lg">
                  <Link href="/meetings/new" className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Schedule New Meeting
                  </Link>
                </Button>
                <Button variant="outline" asChild size="lg">
                  <Link href="/schedule">
                    View Schedule
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </SlideUp>
    </div>
  )
}
