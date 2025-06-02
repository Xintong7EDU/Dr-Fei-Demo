"use client"

import { useState, useCallback, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Search, X, Filter, Calendar } from "lucide-react"
import type { Meeting } from "@/lib/types"

interface RecentMeetingsFiltersProps {
  meetings: Meeting[]
  currentSearch: string
  currentDateFilter: string
  currentTopicFilter: string
}

/**
 * Provides search and filtering functionality for recent meetings
 * Syncs filter state with URL parameters for bookmarkable filters
 */
export function RecentMeetingsFilters({
  meetings,
  currentSearch,
  currentDateFilter,
  currentTopicFilter,
}: RecentMeetingsFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Local state for input controls
  const [searchValue, setSearchValue] = useState(currentSearch)
  const [selectedMonth, setSelectedMonth] = useState(currentDateFilter)

  // Extract unique months from meetings for filter options
  const availableMonths = Array.from(
    new Set(
      meetings.map((meeting) => {
        const date = new Date(meeting.meeting_date)
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
      })
    )
  ).sort((a, b) => b.localeCompare(a)) // Most recent first

  // Extract unique topic keywords for suggestions
  const topicKeywords = Array.from(
    new Set(
      meetings
        .flatMap((meeting) => 
          meeting.topic_overview
            .toLowerCase()
            .split(/[\s,.-]+/)
            .filter((word) => word.length > 3)
        )
    )
  ).slice(0, 10) // Limit to 10 suggestions

  // Update URL with new search parameters
  const updateFilters = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString())
      
      Object.entries(updates).forEach(([key, value]) => {
        if (value) {
          params.set(key, value)
        } else {
          params.delete(key)
        }
      })

      router.push(`/recent?${params.toString()}`, { scroll: false })
    },
    [router, searchParams]
  )

  // Handle search input changes with debounce
  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchValue(value)
      // Debounce search updates
      const timeoutId = setTimeout(() => {
        updateFilters({ search: value })
      }, 300)
      
      return () => clearTimeout(timeoutId)
    },
    [updateFilters]
  )

  // Handle month filter changes
  const handleMonthChange = useCallback(
    (month: string) => {
      setSelectedMonth(month)
      updateFilters({ date: month })
    },
    [updateFilters]
  )

  // Handle topic filter clicks
  const handleTopicFilter = useCallback(
    (topic: string) => {
      updateFilters({ topic })
    },
    [updateFilters]
  )

  // Clear all filters
  const handleClearFilters = useCallback(() => {
    setSearchValue("")
    setSelectedMonth("")
    router.push("/recent", { scroll: false })
  }, [router])

  // Sync local state with URL params
  useEffect(() => {
    setSearchValue(currentSearch)
    setSelectedMonth(currentDateFilter)
  }, [currentSearch, currentDateFilter])

  const hasActiveFilters = currentSearch || currentDateFilter || currentTopicFilter

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search meetings by topic..."
          value={searchValue}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-9 pr-4"
          aria-label="Search meetings"
        />
        {searchValue && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleSearchChange("")}
            className="absolute right-1 top-1/2 h-6 w-6 -translate-y-1/2 p-0 hover:bg-transparent"
            aria-label="Clear search"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Month Filter */}
        <div className="flex-1">
          <label className="text-sm font-medium mb-2 flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Filter by Month
          </label>
          <select
            value={selectedMonth}
            onChange={(e) => handleMonthChange(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            aria-label="Filter by month"
          >
            <option value="">All months</option>
            {availableMonths.map((month) => {
              const [year, monthNum] = month.split("-")
              const monthName = new Date(parseInt(year), parseInt(monthNum) - 1).toLocaleDateString(
                "en-US",
                { year: "numeric", month: "long" }
              )
              return (
                <option key={month} value={month}>
                  {monthName}
                </option>
              )
            })}
          </select>
        </div>

        {/* Quick Topic Filters */}
        <div className="flex-1">
          <label className="text-sm font-medium mb-2 flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Quick Filters
          </label>
          <div className="flex flex-wrap gap-2">
            {topicKeywords.slice(0, 5).map((keyword) => (
              <Badge
                key={keyword}
                variant={currentTopicFilter === keyword ? "default" : "outline"}
                className="cursor-pointer hover:bg-primary/20 transition-colors"
                onClick={() => handleTopicFilter(currentTopicFilter === keyword ? "" : keyword)}
              >
                {keyword}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {/* Active Filters */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 p-3 bg-muted/50 rounded-lg">
          <span className="text-sm font-medium text-muted-foreground">Active filters:</span>
          
          {currentSearch && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Search: "{currentSearch}"
              <X
                className="h-3 w-3 cursor-pointer hover:text-destructive"
                onClick={() => handleSearchChange("")}
              />
            </Badge>
          )}
          
          {currentDateFilter && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Month: {new Date(currentDateFilter + "-01").toLocaleDateString("en-US", { year: "numeric", month: "long" })}
              <X
                className="h-3 w-3 cursor-pointer hover:text-destructive"
                onClick={() => handleMonthChange("")}
              />
            </Badge>
          )}
          
          {currentTopicFilter && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Topic: {currentTopicFilter}
              <X
                className="h-3 w-3 cursor-pointer hover:text-destructive"
                onClick={() => handleTopicFilter("")}
              />
            </Badge>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilters}
            className="text-muted-foreground hover:text-foreground"
          >
            Clear all
          </Button>
        </div>
      )}
    </div>
  )
} 