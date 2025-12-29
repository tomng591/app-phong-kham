export interface Settings {
  break_between_tasks: number; // minutes - mandatory break for doctors between tasks
}

export interface Task {
  id: string;
  name: string;
  doctor_duration: number; // minutes - how long doctor is occupied
  patient_duration: number; // minutes - how long patient is occupied
}

export interface Doctor {
  id: string;
  name: string;
  can_do: string[]; // array of task IDs this doctor can perform
}

export interface Patient {
  id: string;
  name: string;
  needs: string[]; // array of task IDs this patient needs
}

export interface ScheduledTask {
  patient_id: string;
  doctor_id: string;
  task_id: string;
  start_time: number; // minutes from start of day (0 = clinic opening)
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

export type TabType = 'settings' | 'daily' | 'results';
