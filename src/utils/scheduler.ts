import { Settings, Task, Doctor, Patient, ScheduleResult, ScheduledTask, UnhandledTask } from '../types';

interface DoctorState {
  id: string;
  freeAt: number; // includes break time for next task
  canDo: Set<string>;
}

interface PatientState {
  id: string;
  freeAt: number;
}

/**
 * Generate a schedule using a greedy algorithm
 *
 * Algorithm:
 * 1. Initialize doctor and patient states with freeAt = 0
 * 2. Build queue of (patient, task) pairs from patient needs
 * 3. For each pair:
 *    - Find doctors who can perform the task
 *    - Find earliest time when both doctor (with break) and patient are free
 *    - Schedule the task
 * 4. Mark as unhandled if no doctor can perform the task
 */
export function generateSchedule(
  settings: Settings,
  tasks: Task[],
  workingDoctors: Doctor[],
  patients: Patient[]
): ScheduleResult {
  const scheduled: ScheduledTask[] = [];
  const unhandled: UnhandledTask[] = [];

  // Initialize doctor states
  const doctorStates = new Map<string, DoctorState>();
  workingDoctors.forEach((d) => {
    doctorStates.set(d.id, {
      id: d.id,
      freeAt: 0,
      canDo: new Set(d.can_do),
    });
  });

  // Initialize patient states
  const patientStates = new Map<string, PatientState>();
  patients.forEach((p) => {
    patientStates.set(p.id, { id: p.id, freeAt: 0 });
  });

  // Build task lookup
  const taskMap = new Map<string, Task>();
  tasks.forEach((t) => taskMap.set(t.id, t));

  // Build queue of (patient, task) pairs
  const queue: { patientId: string; taskId: string }[] = [];
  patients.forEach((patient) => {
    patient.needs.forEach((taskId) => {
      queue.push({ patientId: patient.id, taskId });
    });
  });

  // Process each pair
  for (const { patientId, taskId } of queue) {
    const task = taskMap.get(taskId);
    if (!task) {
      unhandled.push({
        patient_id: patientId,
        task_id: taskId,
        reason: 'Không tìm thấy công việc',
      });
      continue;
    }

    const patientState = patientStates.get(patientId);
    if (!patientState) {
      continue;
    }

    // Find doctors who can do this task
    const capableDoctors = Array.from(doctorStates.values()).filter((d) =>
      d.canDo.has(taskId)
    );

    if (capableDoctors.length === 0) {
      unhandled.push({
        patient_id: patientId,
        task_id: taskId,
        reason: 'Không có bác sĩ nào thực hiện được',
      });
      continue;
    }

    // Find doctor with earliest possible start time
    let bestDoctor: DoctorState | null = null;
    let earliestStart = Infinity;

    for (const doctor of capableDoctors) {
      // Start time must be when BOTH doctor and patient are free
      const possibleStart = Math.max(doctor.freeAt, patientState.freeAt);
      if (possibleStart < earliestStart) {
        earliestStart = possibleStart;
        bestDoctor = doctor;
      }
    }

    if (bestDoctor && earliestStart !== Infinity) {
      const startTime = earliestStart;
      const doctorEndTime = startTime + task.doctor_duration;
      const patientEndTime = startTime + task.patient_duration;

      // Schedule the task
      scheduled.push({
        patient_id: patientId,
        doctor_id: bestDoctor.id,
        task_id: taskId,
        start_time: startTime,
        doctor_end_time: doctorEndTime,
        patient_end_time: patientEndTime,
      });

      // Update states (doctor gets break time added)
      bestDoctor.freeAt = doctorEndTime + settings.break_between_tasks;
      patientState.freeAt = patientEndTime;
    }
  }

  // Sort scheduled tasks by start time
  scheduled.sort((a, b) => a.start_time - b.start_time);

  return { scheduled, unhandled };
}
