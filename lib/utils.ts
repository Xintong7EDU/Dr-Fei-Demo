import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Default title for new notes when user doesn't provide one
export const DEFAULT_NOTE_TITLE = 'TPE&SF Sync Meeting'

// HTML sanitization and beautification utilities for notes
import sanitizeHtml from 'sanitize-html'
import { html as beautifyHtml } from 'js-beautify'

/**
 * Sanitize pasted HTML (e.g., from Google Docs) and beautify for storage.
 * Strips dangerous tags/attrs and normalizes markup.
 */
export const sanitizeAndBeautifyHtml = (dirtyHtml: string): string => {
  if (!dirtyHtml) return ''

  const clean = sanitizeHtml(dirtyHtml, {
    allowedTags: [
      'p','br','div','span','strong','em','b','i','u','s','blockquote','pre','code','ul','ol','li','hr',
      'h1','h2','h3','h4','h5','h6','table','thead','tbody','tr','th','td','img','figure','figcaption','a'
    ],
    allowedAttributes: {
      a: ['href', 'name', 'target', 'rel'],
      img: ['src', 'alt', 'title', 'width', 'height'],
      '*': ['style']
    },
    allowedSchemesByTag: { a: ['http', 'https', 'mailto'] },
    // keep spans to preserve inline styles; we'll allow a safe subset of styles
    allowedStyles: {
      '*': {
        'text-align': [/^left$|^right$|^center$|^justify$/],
        'font-weight': [/^bold$|^bolder$|^lighter$|^\d{3}$/],
        'font-style': [/^italic$|^normal$/],
        'text-decoration': [/^none$|^underline$|^line-through$/],
      },
    },
    nonTextTags: ['style', 'script', 'textarea', 'option'],
  })

  return beautifyHtml(clean, {
    indent_size: 2,
    wrap_line_length: 120,
    preserve_newlines: true,
  })
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
  const now = new Date()
  
  // Get the current time in PST using Intl.DateTimeFormat
  const pstTime = new Intl.DateTimeFormat('en-US', {
    timeZone: PST_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).formatToParts(now)
  
  // Extract date components
  const year = parseInt(pstTime.find(p => p.type === 'year')?.value || '0')
  const month = parseInt(pstTime.find(p => p.type === 'month')?.value || '0') - 1 // months are 0-indexed
  const day = parseInt(pstTime.find(p => p.type === 'day')?.value || '0')
  const hour = parseInt(pstTime.find(p => p.type === 'hour')?.value || '0')
  const minute = parseInt(pstTime.find(p => p.type === 'minute')?.value || '0')
  const second = parseInt(pstTime.find(p => p.type === 'second')?.value || '0')
  
  return new Date(year, month, day, hour, minute, second)
}

/**
 * Get current date string in PST timezone (YYYY-MM-DD format)
 * @returns Date string in YYYY-MM-DD format in PST
 */
export function getCurrentDateStringPST(): string {
  const now = new Date()
  
  // Use Intl.DateTimeFormatter to get PST date components
  const pstTime = new Intl.DateTimeFormat('en-US', {
    timeZone: PST_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(now)
  
  const year = pstTime.find(p => p.type === 'year')?.value
  const month = pstTime.find(p => p.type === 'month')?.value
  const day = pstTime.find(p => p.type === 'day')?.value
  
  return `${year}-${month}-${day}`
}

/**
 * Format a date string to a more readable format in PST
 * @param dateString - Date string in YYYY-MM-DD format
 * @returns Formatted date string in PST
 */
export function formatDate(dateString: string): string {
  const [year, month, day] = dateString.split('-').map(Number);
  // Create a local date object without timezone conversion
  // Since the database stores dates as intended for PST display, we treat them as local
  const date = new Date(year, month - 1, day);
  
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Format a time string to include PST timezone
 * @param timeString - Time string in HH:MM format
 * @returns Formatted time string with PST indicator
 */
export function formatTime(timeString: string): string {
  const [hours, minutes] = timeString.split(':')
  const date = new Date(2000, 0, 1, parseInt(hours), parseInt(minutes))
  
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  }) + ' PST'
}

/**
 * Format a time range string with PST timezone
 * @param startTime - Start time in HH:MM format
 * @param endTime - End time in HH:MM format
 * @returns Formatted time range string with PST indicator
 */
export function formatTimeRange(startTime: string, endTime: string): string {
  const formatSingleTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    // Create a date object and set the time directly without timezone conversion
    // We want to display the time as-is since it's already stored in PST
    const date = new Date(2000, 0, 1, parseInt(hours), parseInt(minutes));
    
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };
  
  return `${formatSingleTime(startTime)} - ${formatSingleTime(endTime)} PST`;
}

// Meeting-related utility functions removed

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
  // Create a proper PST date by using the timezone-aware formatter
  const pstFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: PST_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
  
  // Parse the input date and format it according to PST timezone
  const inputDate = new Date(`${dateString}T12:00:00`)
  const [month, day, year] = pstFormatter.format(inputDate).split('/')
  return new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
}

// Format a date string (YYYY-MM-DD) for HTML date input
export function formatDateForInput(dateString: string): string {
  return dateString; // Already in YYYY-MM-DD format
}

// Format a time string (HH:MM:SS) for HTML time input (HH:MM)
export function formatTimeForInput(timeString: string): string {
  return timeString.substring(0, 5); // Extract HH:MM from HH:MM:SS
}

/**
 * Debug function to compare different timezone implementations
 * This helps verify that our PST functions work correctly
 */
export function debugTimezone(): {
  currentUTC: string
  currentLocal: string
  currentPST: string
  currentPSTString: string
  serverTimezone: string
} {
  const now = new Date()
  
  return {
    currentUTC: now.toISOString(),
    currentLocal: now.toString(),
    currentPST: getCurrentDatePST().toString(),
    currentPSTString: getCurrentDateStringPST(),
    serverTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  }
}
