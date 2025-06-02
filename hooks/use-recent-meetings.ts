"use client"

import { useState, useEffect, useCallback } from "react"
import { getRecentMeetings, getMeetingStats } from "@/app/actions"
import type { Meeting } from "@/lib/types"

interface UseRecentMeetingsOptions {
  limit?: number
  searchQuery?: string
  dateFrom?: string
  dateTo?: string
  sortBy?: 'meeting_date' | 'topic_overview' | 'created_at'
  sortOrder?: 'asc' | 'desc'
  autoRefresh?: boolean
  refreshInterval?: number
}

interface RecentMeetingsStats {
  totalMeetings: number
  thisMonthMeetings: number
  lastWeekMeetings: number
  averageDuration: number
  totalHours: number
  mostActiveMonth: string
}

interface UseRecentMeetingsReturn {
  meetings: Meeting[]
  stats: RecentMeetingsStats | null
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
  updateFilters: (filters: Partial<UseRecentMeetingsOptions>) => void
}

/**
 * Custom hook for managing recent meetings with database synchronization
 * Provides real-time updates, filtering, and statistics
 */
export function useRecentMeetings(options: UseRecentMeetingsOptions = {}): UseRecentMeetingsReturn {
  const {
    limit = 50,
    searchQuery = '',
    dateFrom,
    dateTo,
    sortBy = 'meeting_date',
    sortOrder = 'desc',
    autoRefresh = true,
    refreshInterval = 30000, // 30 seconds
  } = options

  // State management
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [stats, setStats] = useState<RecentMeetingsStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<UseRecentMeetingsOptions>(options)

  // Fetch meetings from database
  const fetchMeetings = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const [meetingsData, statsData] = await Promise.all([
        getRecentMeetings({
          limit: filters.limit || limit,
          searchQuery: filters.searchQuery || searchQuery,
          dateFrom: filters.dateFrom || dateFrom,
          dateTo: filters.dateTo || dateTo,
          sortBy: filters.sortBy || sortBy,
          sortOrder: filters.sortOrder || sortOrder,
        }),
        getMeetingStats()
      ])

      setMeetings(meetingsData)
      setStats(statsData)
    } catch (err) {
      console.error('Error fetching recent meetings:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch meetings')
    } finally {
      setIsLoading(false)
    }
  }, [filters, limit, searchQuery, dateFrom, dateTo, sortBy, sortOrder])

  // Update filters and refetch data
  const updateFilters = useCallback((newFilters: Partial<UseRecentMeetingsOptions>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
  }, [])

  // Manual refetch function
  const refetch = useCallback(async () => {
    await fetchMeetings()
  }, [fetchMeetings])

  // Initial fetch and auto-refresh setup
  useEffect(() => {
    fetchMeetings()

    // Set up auto-refresh if enabled
    if (autoRefresh && refreshInterval > 0) {
      const interval = setInterval(fetchMeetings, refreshInterval)
      return () => clearInterval(interval)
    }
  }, [fetchMeetings, autoRefresh, refreshInterval])

  // Refetch when filters change
  useEffect(() => {
    if (filters !== options) {
      fetchMeetings()
    }
  }, [filters, fetchMeetings, options])

  return {
    meetings,
    stats,
    isLoading,
    error,
    refetch,
    updateFilters,
  }
}

/**
 * Simplified hook for just getting recent meetings without filters
 */
export function useSimpleRecentMeetings() {
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchMeetings = async () => {
      try {
        const data = await getRecentMeetings({ limit: 10 })
        setMeetings(data)
      } catch (error) {
        console.error('Error fetching recent meetings:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchMeetings()
  }, [])

  return { meetings, isLoading }
}

/**
 * Hook for real-time meeting statistics
 */
export function useMeetingStats() {
  const [stats, setStats] = useState<RecentMeetingsStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await getMeetingStats()
        setStats(data)
      } catch (error) {
        console.error('Error fetching meeting stats:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()

    // Refresh stats every minute
    const interval = setInterval(fetchStats, 60000)
    return () => clearInterval(interval)
  }, [])

  return { stats, isLoading }
} 