import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * PST timezone identifier
 */
export const PST_TIMEZONE = 'America/Los_Angeles'

/**
 * Get current date in PST timezone
 * @returns Date object representing current time in PST
 */
export function getCurrentDatePST(): Date {
  return new Date(new Date().toLocaleString("en-US", { timeZone: PST_TIMEZONE }))
}

/**
 * Get current date string in PST timezone (YYYY-MM-DD format)
 * @returns Date string in YYYY-MM-DD format in PST
 */
export function getCurrentDateStringPST(): string {
  const pstDate = getCurrentDatePST()
  return pstDate.toISOString().split('T')[0]
}

/**
 * Format a date string to a more readable format in PST
 * @param dateString - Date string in YYYY-MM-DD format
 * @returns Formatted date string in PST
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString + 'T00:00:00')
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: PST_TIMEZONE
  })
}

/**
 * Format a time string to include PST timezone
 * @param timeString - Time string in HH:MM format
 * @returns Formatted time string with PST indicator
 */
export function formatTime(timeString: string): string {
  const [hours, minutes] = timeString.split(':')
  const date = new Date()
  date.setHours(parseInt(hours), parseInt(minutes), 0, 0)
  
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: PST_TIMEZONE,
    timeZoneName: 'short'
  })
}

/**
 * Format a time range string with PST timezone
 * @param startTime - Start time in HH:MM format
 * @param endTime - End time in HH:MM format
 * @returns Formatted time range string with PST indicator
 */
export function formatTimeRange(startTime: string, endTime: string): string {
  const formatSingleTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':')
    const date = new Date()
    date.setHours(parseInt(hours), parseInt(minutes), 0, 0)
    
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      timeZone: PST_TIMEZONE
    })
  }
  
  return `${formatSingleTime(startTime)} - ${formatSingleTime(endTime)} PST`
}

/**
 * Check if a meeting date is in the past relative to PST timezone
 * @param meetingDate - Meeting date string in YYYY-MM-DD format
 * @returns True if the meeting date is in the past in PST
 */
export function isPastMeetingPST(meetingDate: string): boolean {
  const today = getCurrentDateStringPST()
  return meetingDate < today
}

/**
 * Format a date for month filter display in PST
 * @param year - Year number
 * @param month - Month number (0-11)
 * @returns Formatted month string in PST
 */
export function formatMonthPST(year: number, month: number): string {
  const date = new Date(year, month, 1)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    timeZone: PST_TIMEZONE
  })
}

/**
 * Get date one week ago in PST
 * @returns Date object representing one week ago in PST
 */
export function getLastWeekDatePST(): Date {
  const currentPST = getCurrentDatePST()
  const lastWeek = new Date(currentPST)
  lastWeek.setDate(lastWeek.getDate() - 7)
  return lastWeek
}

/**
 * Parse a date string and ensure it's interpreted in PST context
 * @param dateString - Date string in YYYY-MM-DD format
 * @returns Date object in PST context
 */
export function parseDatePST(dateString: string): Date {
  // Add time to ensure it's interpreted as start of day in PST
  return new Date(dateString + 'T00:00:00-08:00') // PST is UTC-8 (or UTC-7 during PDT)
}

// Format a date string (YYYY-MM-DD) for HTML date input
export function formatDateForInput(dateString: string): string {
  return dateString; // Already in YYYY-MM-DD format
}

// Format a time string (HH:MM:SS) for HTML time input (HH:MM)
export function formatTimeForInput(timeString: string): string {
  return timeString.substring(0, 5); // Extract HH:MM from HH:MM:SS
}
