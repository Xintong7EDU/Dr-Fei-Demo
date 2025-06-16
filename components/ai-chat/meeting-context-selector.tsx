'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Calendar, Search, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getRecentMeetings } from '@/app/actions'
import type { Meeting } from '@/lib/types'

interface MeetingContextSelectorProps {
  selectedMeetingIds: number[]
  onMeetingIdsChange: (ids: number[]) => void
  className?: string
}

export function MeetingContextSelector({
  selectedMeetingIds,
  onMeetingIdsChange,
  className
}: MeetingContextSelectorProps) {
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [filteredMeetings, setFilteredMeetings] = useState<Meeting[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load meetings on component mount
  useEffect(() => {
    const loadMeetings = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        const recentMeetings = await getRecentMeetings({
          limit: 50
        })
        
        setMeetings(recentMeetings)
        setFilteredMeetings(recentMeetings)
      } catch (err) {
        console.error('Failed to load meetings:', err)
        setError('Failed to load meetings. Please try again.')
      } finally {
        setIsLoading(false)
      }
    }

    loadMeetings()
  }, [])

  // Filter meetings based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredMeetings(meetings)
      return
    }

    const query = searchQuery.toLowerCase()
    const filtered = meetings.filter(meeting => 
      meeting.topic_overview?.toLowerCase().includes(query) ||
      meeting.meeting_link?.toLowerCase().includes(query)
    )
    
    setFilteredMeetings(filtered)
  }, [searchQuery, meetings])

  const handleMeetingToggle = (meetingId: number, checked: boolean) => {
    if (checked) {
      onMeetingIdsChange([...selectedMeetingIds, meetingId])
    } else {
      onMeetingIdsChange(selectedMeetingIds.filter(id => id !== meetingId))
    }
  }

  const handleSelectAll = () => {
    const allIds = filteredMeetings.map(m => m.meeting_id)
    onMeetingIdsChange(allIds)
  }

  const handleClearAll = () => {
    onMeetingIdsChange([])
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formatTime = (startTime: string, endTime: string) => {
    return `${startTime} - ${endTime}`
  }

  if (isLoading) {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="flex items-center justify-center py-8">
          <div className="text-sm text-muted-foreground">Loading meetings...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="text-sm text-red-600 dark:text-red-400 text-center py-4">
          {error}
        </div>
      </div>
    )
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Select Meeting Context</Label>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSelectAll}
            disabled={filteredMeetings.length === 0}
          >
            Select All
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearAll}
            disabled={selectedMeetingIds.length === 0}
          >
            Clear
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search meetings..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Selected count */}
      {selectedMeetingIds.length > 0 && (
        <div className="text-sm text-muted-foreground">
          {selectedMeetingIds.length} meeting{selectedMeetingIds.length !== 1 ? 's' : ''} selected
        </div>
      )}

      {/* Meetings list */}
      <div className="max-h-60 overflow-y-auto space-y-2 border rounded-lg p-2">
        {filteredMeetings.length === 0 ? (
          <div className="text-center py-4 text-sm text-muted-foreground">
            {searchQuery ? 'No meetings found matching your search.' : 'No meetings available.'}
          </div>
        ) : (
          filteredMeetings.map((meeting) => (
            <div
              key={meeting.meeting_id}
              className={cn(
                "flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer",
                selectedMeetingIds.includes(meeting.meeting_id) && "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800"
              )}
              onClick={() => handleMeetingToggle(meeting.meeting_id, !selectedMeetingIds.includes(meeting.meeting_id))}
            >
              <div className="flex items-center justify-center w-4 h-4 mt-1 border rounded border-gray-300">
                {selectedMeetingIds.includes(meeting.meeting_id) && (
                  <div className="w-2 h-2 bg-blue-500 rounded-sm" />
                )}
              </div>
              
              <div className="flex-1 min-w-0 space-y-1">
                <div className="font-medium text-sm truncate">
                  {meeting.topic_overview || 'Meeting Overview'}
                </div>
                
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDate(meeting.meeting_date)}
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatTime(meeting.start_time, meeting.end_time)}
                  </div>
                </div>
                
                {meeting.meeting_link && (
                  <div className="text-xs text-blue-600 truncate">
                    {meeting.meeting_link}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
} 