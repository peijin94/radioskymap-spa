import type { TimezoneMode } from '../types';

export interface DateParts {
  date: string;
  hour: number;
  minute: number;
  second: number;
}

const pad2 = (value: number): string => String(value).padStart(2, '0');

export function buildDateFromParts(parts: DateParts, timezoneMode: TimezoneMode): Date {
  const [year, month, day] = parts.date.split('-').map(Number);

  if (timezoneMode === 'utc') {
    return new Date(Date.UTC(year, month - 1, day, parts.hour, parts.minute, parts.second));
  }

  return new Date(year, month - 1, day, parts.hour, parts.minute, parts.second);
}

export function getCurrentDateParts(timezoneMode: TimezoneMode): DateParts {
  return extractDateParts(new Date(), timezoneMode);
}

export function extractDateParts(date: Date, timezoneMode: TimezoneMode): DateParts {
  if (timezoneMode === 'utc') {
    return {
      date: `${date.getUTCFullYear()}-${pad2(date.getUTCMonth() + 1)}-${pad2(date.getUTCDate())}`,
      hour: date.getUTCHours(),
      minute: date.getUTCMinutes(),
      second: date.getUTCSeconds(),
    };
  }

  return {
    date: `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`,
    hour: date.getHours(),
    minute: date.getMinutes(),
    second: date.getSeconds(),
  };
}

export function formatHms(hour: number, minute: number, second: number): string {
  return `${pad2(hour)}:${pad2(minute)}:${pad2(second)}`;
}

export function getTimezoneLabel(timezoneMode: TimezoneMode): string {
  if (timezoneMode === 'utc') {
    return 'UTC';
  }

  return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Local';
}

// Julian Day for a JavaScript Date interpreted as an absolute instant.
export function toJulianDay(date: Date): number {
  return date.getTime() / 86400000 + 2440587.5;
}

export function julianCenturiesSinceJ2000(date: Date): number {
  return (toJulianDay(date) - 2451545.0) / 36525.0;
}

// IAU-style GMST approximation in degrees, sufficient for an interactive sky plot.
export function greenwichMeanSiderealTimeDeg(date: Date): number {
  const jd = toJulianDay(date);
  const t = (jd - 2451545.0) / 36525.0;
  const gmst =
    280.46061837 +
    360.98564736629 * (jd - 2451545.0) +
    0.000387933 * t * t -
    (t * t * t) / 38710000;

  return normalizeDegrees(gmst);
}

export function localSiderealTimeDeg(date: Date, longitudeDeg: number): number {
  return normalizeDegrees(greenwichMeanSiderealTimeDeg(date) + longitudeDeg);
}

export function normalizeDegrees(value: number): number {
  return ((value % 360) + 360) % 360;
}
