import { toZonedTime, format as formatTZ } from 'date-fns-tz'

const TZ = 'America/Argentina/Buenos_Aires'

export function nowInAR(): Date {
  return toZonedTime(new Date(), TZ)
}

export function todayAR(): string {
  // IMPORTANTE: date-fns-tz `format` renderiza los números (yyyy-MM-dd) en la
  // zona del runtime; hay que convertir el instante con `toZonedTime` PRIMERO,
  // o en un server UTC (Vercel) esto devuelve el día equivocado después de las
  // 21hs AR.
  return formatTZ(toZonedTime(new Date(), TZ), 'yyyy-MM-dd', { timeZone: TZ })
}

export function formatInAR(date: string | Date, fmt: string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return formatTZ(toZonedTime(d, TZ), fmt, { timeZone: TZ })
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
