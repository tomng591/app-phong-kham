const CLINIC_START_HOUR = 8; // 8:00 AM

/**
 * Convert internal minutes (from clinic start) to display time (HH:MM)
 * Example: 0 -> "08:00", 60 -> "09:00", 90 -> "09:30"
 */
export function minutesToTime(minutes: number): string {
  const totalMinutes = CLINIC_START_HOUR * 60 + minutes;
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

/**
 * Convert display time (HH:MM) to internal minutes
 * Example: "08:00" -> 0, "09:00" -> 60, "09:30" -> 90
 */
export function timeToMinutes(time: string): number {
  const [hours, mins] = time.split(':').map(Number);
  return (hours - CLINIC_START_HOUR) * 60 + mins;
}

/**
 * Format duration in minutes to a readable string
 * Example: 90 -> "1h 30'"
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}'`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${mins}'`;
}
