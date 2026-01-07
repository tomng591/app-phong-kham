export interface Settings {
  break_between_tasks: number; // minutes - mandatory break for patients between tasks
  break_between_tasks_doctor: number; // minutes - mandatory break for doctors between tasks
}

export interface Task {
  id: string;
  name: string;
  doctor_duration: number; // minutes - how long doctor is occupied
  patient_duration: number; // minutes - how long patient is occupied
  is_manual_schedulable?: boolean; // if true, can be manually scheduled with specific time/doctor
}

export interface ManualAppointment {
  id: string;
  patient_id: string;
  task_id: string;
  doctor_id: string;
  start_time: number; // minutes from session start
}

export interface Doctor {
  id: string;
  name: string;
  can_do: string[]; // array of task IDs this doctor can perform
}

export interface Patient {
  id: string;
  daily_id: number; // incremental daily ID (1, 2, 3...), resets each day
  name: string;
  needs: string[]; // array of task IDs this patient needs
}

export interface ScheduledTask {
  patient_id: string;
  doctor_id: string;
  task_id: string;
  start_time: number; // minutes from start of session
  doctor_end_time: number; // when doctor is free
  patient_end_time: number; // when patient is free
}

export interface UnhandledTask {
  patient_id: string;
  task_id: string;
  reason: string;
}

export interface ScheduleResult {
  scheduled: ScheduledTask[];
  unhandled: UnhandledTask[];
}

export type TabType = 'settings' | 'daily' | 'results' | 'history';

export interface ScheduleHistoryEntry {
  id: string;
  date: string; // YYYY-MM-DD
  session: SessionType;
  createdAt: string; // ISO timestamp
  scheduleResult: ScheduleResult;
  // Snapshot of data at time of generation
  patients: Patient[];
  tasks: Task[];
  doctors: Doctor[];
  workingDoctorIds: string[];
}

// Index for lazy loading - only stores dates that have schedules
export interface ScheduleHistoryIndex {
  [date: string]: {
    morning?: string; // entry id
    afternoon?: string; // entry id
  };
}

export type SessionType = 'morning' | 'afternoon';

// Session time constants (in hours and minutes)
export const SESSION_TIMES = {
  morning: {
    startHour: 7,
    startMinute: 0,
    endHour: 11,
    endMinute: 30,
    durationMinutes: 270, // 4.5 hours
  },
  afternoon: {
    startHour: 13,
    startMinute: 30,
    endHour: 18,
    endMinute: 0,
    durationMinutes: 270, // 4.5 hours
  },
} as const;
