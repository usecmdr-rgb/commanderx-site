/**
 * Calendar Date Utilities
 * 
 * Single source of truth for all calendar date/time operations using date-fns.
 * Handles timezone normalization, DST, and consistent date formatting.
 */

import { 
  format, 
  parseISO, 
  startOfWeek, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval,
  addDays,
  addWeeks,
  addMonths,
  isSameDay,
  isSameMonth,
  getHours,
  getMinutes,
  getDate,
  getMonth,
  getYear,
  differenceInMinutes,
  startOfDay,
  endOfDay,
  isWithinInterval,
  addMinutes,
  subDays,
} from 'date-fns';

/**
 * Get local date string (YYYY-MM-DD) from a Date object
 * Uses local timezone, not UTC
 */
export function getLocalDateString(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

/**
 * Parse a date string (YYYY-MM-DD) to a Date object in local timezone
 */
export function parseLocalDate(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Get local date from event (handles both dateTime and date formats)
 */
export function getEventLocalDate(event: { start: { dateTime?: string; date?: string } }): Date | null {
  if (event.start.dateTime) {
    // dateTime is in ISO format, parse it (date-fns handles timezone)
    return parseISO(event.start.dateTime);
  } else if (event.start.date) {
    // date is YYYY-MM-DD format (all-day event), parse as local date
    return parseLocalDate(event.start.date);
  }
  return null;
}

/**
 * Get local date string from event
 */
export function getEventLocalDateString(event: { start: { dateTime?: string; date?: string } }): string | null {
  const localDate = getEventLocalDate(event);
  return localDate ? getLocalDateString(localDate) : null;
}

/**
 * Get local time from event (returns hours, minutes, or null for all-day)
 */
export function getEventLocalTime(event: { start: { dateTime?: string; date?: string } }): { hour: number; minute: number } | null {
  if (!event.start.dateTime) return null; // All-day event
  const localDate = parseISO(event.start.dateTime);
  return {
    hour: getHours(localDate),
    minute: getMinutes(localDate),
  };
}

/**
 * Get event end time
 */
export function getEventEndTime(event: { end: { dateTime?: string; date?: string } }): Date | null {
  if (event.end.dateTime) {
    return parseISO(event.end.dateTime);
  } else if (event.end.date) {
    // For all-day events, end date is exclusive (next day)
    const [year, month, day] = event.end.date.split('-').map(Number);
    return new Date(year, month - 1, day);
  }
  return null;
}

/**
 * Check if event spans multiple days
 */
export function isMultiDayEvent(event: { 
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
}): boolean {
  const startDate = getEventLocalDateString(event);
  if (!startDate) return false;
  
  const endDate = getEventEndTime(event);
  if (!endDate) return false;
  
  const endDateString = getLocalDateString(endDate);
  return startDate !== endDateString;
}

/**
 * Get minutes since midnight for a given time
 */
export function getMinutesSinceMidnight(date: Date): number {
  return getHours(date) * 60 + getMinutes(date);
}

/**
 * Calculate vertical position for weekly view (in pixels)
 * @param hour - Hour (0-23)
 * @param minute - Minute (0-59)
 * @param minHour - Minimum hour in view
 * @param pixelsPerHour - Pixels per hour (default: 40)
 */
export function getHourPosition(
  hour: number, 
  minute: number = 0, 
  minHour: number = 0,
  pixelsPerHour: number = 40
): number {
  const totalMinutes = (hour - minHour) * 60 + minute;
  return (totalMinutes / 60) * pixelsPerHour;
}

/**
 * Get week start date (Sunday or Monday)
 */
export function getWeekStart(date: Date, weekStartsOn: 0 | 1 = 0): Date {
  return startOfWeek(date, { weekStartsOn });
}

/**
 * Get all days in a week
 */
export function getWeekDays(date: Date, weekStartsOn: 0 | 1 = 0): Date[] {
  const weekStart = getWeekStart(date, weekStartsOn);
  return eachDayOfInterval({
    start: weekStart,
    end: addDays(weekStart, 6),
  });
}

/**
 * Get all days in a month (including previous/next month padding)
 */
export function getMonthDays(date: Date): Date[] {
  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(date);
  const startDayOfWeek = monthStart.getDay();
  
  const days: Date[] = [];
  
  // Add days from previous month
  for (let i = 0; i < startDayOfWeek; i++) {
    days.push(subDays(monthStart, startDayOfWeek - i));
  }
  
  // Add days from current month
  const currentMonthDays = eachDayOfInterval({
    start: monthStart,
    end: monthEnd,
  });
  days.push(...currentMonthDays);
  
  return days;
}

/**
 * Format event time for display
 */
export function formatEventTime(event: { start: { dateTime?: string; date?: string } }, allDayText: string = 'All day'): string {
  if (!event.start.dateTime && event.start.date) {
    return allDayText;
  }
  if (!event.start.dateTime) {
    return '';
  }
  const date = parseISO(event.start.dateTime);
  return format(date, 'h:mm a');
}

/**
 * Format event date for display
 */
export function formatEventDate(event: { start: { dateTime?: string; date?: string } }): string {
  const localDate = getEventLocalDate(event);
  if (!localDate) return '';
  return format(localDate, 'MMM d, yyyy');
}

/**
 * Check if date is today
 */
export function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}

/**
 * Check if date is in current month
 */
export function isCurrentMonth(date: Date, currentMonth: Date): boolean {
  return isSameMonth(date, currentMonth);
}

/**
 * Get date range for calendar sync (past 30 days + next 90 days)
 */
export function getSyncDateRange(): { start: Date; end: Date } {
  const now = new Date();
  return {
    start: subDays(now, 30),
    end: addDays(now, 90),
  };
}

