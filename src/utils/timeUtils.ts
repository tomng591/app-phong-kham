import { SessionType, SESSION_TIMES } from '../types';

/**
 * Convert internal minutes (from session start) to display time (HH:MM)
 * Morning (07:00-12:59): 0 -> "07:00", 60 -> "08:00"
 * Afternoon (13:30-19:00): 0 -> "13:30", 60 -> "14:30"
 */
export function minutesToTime(minutes: number, session: SessionType = 'morning'): string {
  const sessionConfig = SESSION_TIMES[session];
  const baseMinutes = sessionConfig.startHour * 60 + sessionConfig.startMinute;
  const totalMinutes = baseMinutes + minutes;
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

/**
 * Convert display time (HH:MM) to internal minutes for a session
 * Morning (07:00-12:59): "07:00" -> 0, "08:00" -> 60
 * Afternoon (13:30-19:00): "13:30" -> 0, "14:30" -> 60
 */
export function timeToMinutes(time: string, session: SessionType = 'morning'): number {
  const sessionConfig = SESSION_TIMES[session];
  const baseMinutes = sessionConfig.startHour * 60 + sessionConfig.startMinute;
  const [hours, mins] = time.split(':').map(Number);
  const totalMinutes = hours * 60 + mins;
  return totalMinutes - baseMinutes;
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

/**
 * Get session label in Vietnamese
 */
export function getSessionLabel(session: SessionType): string {
  return session === 'morning' ? 'Buổi sáng' : 'Buổi chiều';
}

/**
 * Get session time range string
 */
export function getSessionTimeRange(session: SessionType): string {
  const config = SESSION_TIMES[session];
  const startTime = `${config.startHour.toString().padStart(2, '0')}:${config.startMinute.toString().padStart(2, '0')}`;
  const endTime = `${config.endHour.toString().padStart(2, '0')}:${config.endMinute.toString().padStart(2, '0')}`;
  return `${startTime} - ${endTime}`;
}
