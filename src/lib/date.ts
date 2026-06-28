import { toZonedTime, format as formatTZ } from 'date-fns-tz'
import { format } from 'date-fns'

const TZ = 'America/Argentina/Buenos_Aires'

export function nowInAR(): Date {
  return toZonedTime(new Date(), TZ)
}

export function todayAR(): string {
  return formatTZ(new Date(), 'yyyy-MM-dd', { timeZone: TZ })
}

export function formatInAR(date: string | Date, fmt: string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return formatTZ(d, fmt, { timeZone: TZ })
}

export function dateToAR(date: string | Date): Date {
  // Date-only strings (e.g. "2026-06-24") are parsed as UTC midnight by the
  // Date constructor, which shifts to the previous AR day when converted.
  // Appending noon UTC keeps it on the right calendar date in any timezone.
  const d = typeof date === 'string'
    ? new Date(date.length === 10 ? `${date}T12:00:00Z` : date)
    : date
  return toZonedTime(d, TZ)
}
