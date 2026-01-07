import { Settings, Task, Doctor, Patient, ScheduleResult, ScheduledTask, UnhandledTask, ManualAppointment, SessionType, SESSION_TIMES } from '../types';
import { minutesToTime } from './timeUtils';

interface DoctorState {
  id: string;
  freeAt: number;
  canDo: Set<string>;
  // Track busy periods for conflict detection
  busyPeriods: { start: number; end: number }[];
}

interface PatientState {
  id: string;
  freeAt: number; // includes break time for next task
  // Track busy periods for conflict detection
  busyPeriods: { start: number; end: number }[];
}

interface ConflictError {
  patient_id: string;
  task_id: string;
  reason: string;
}

/**
 * Check if two time periods overlap
 */
function periodsOverlap(start1: number, end1: number, start2: number, end2: number): boolean {
  return start1 < end2 && end1 > start2;
}

/**
 * Validate manual appointments for conflicts
 * Returns array of conflict errors
 */
function validateManualAppointments(
  manualAppointments: ManualAppointment[],
  tasks: Map<string, Task>,
  patients: Map<string, Patient>,
  doctors: Map<string, Doctor>,
  session: SessionType
): ConflictError[] {
  const errors: ConflictError[] = [];
  const sessionDuration = SESSION_TIMES[session].durationMinutes;

  // Track doctor and patient schedules from manual appointments
  const doctorSchedules = new Map<string, { start: number; end: number; appointmentId: string }[]>();
  const patientSchedules = new Map<string, { start: number; end: number; appointmentId: string }[]>();

  for (const appointment of manualAppointments) {
    const task = tasks.get(appointment.task_id);
    const patient = patients.get(appointment.patient_id);
    const doctor = doctors.get(appointment.doctor_id);

    if (!task || !patient) continue;

    const startTime = appointment.start_time;
    const doctorEndTime = startTime + task.doctor_duration;
    const patientEndTime = startTime + task.patient_duration;

    // Check time bounds
    if (startTime < 0) {
      errors.push({
        patient_id: appointment.patient_id,
        task_id: appointment.task_id,
        reason: `Thời gian ${minutesToTime(startTime, session)} nằm ngoài ca làm việc`,
      });
      continue;
    }

    if (doctorEndTime > sessionDuration || patientEndTime > sessionDuration) {
      errors.push({
        patient_id: appointment.patient_id,
        task_id: appointment.task_id,
        reason: `Công việc kết thúc lúc ${minutesToTime(Math.max(doctorEndTime, patientEndTime), session)} nằm ngoài ca làm việc`,
      });
      continue;
    }

    // Check doctor conflicts
    const doctorExisting = doctorSchedules.get(appointment.doctor_id) || [];
    for (const existing of doctorExisting) {
      if (periodsOverlap(startTime, doctorEndTime, existing.start, existing.end)) {
        const doctorName = doctor?.name || 'Bác sĩ';
        errors.push({
          patient_id: appointment.patient_id,
          task_id: appointment.task_id,
          reason: `${doctorName} đã có lịch từ ${minutesToTime(existing.start, session)} đến ${minutesToTime(existing.end, session)}`,
        });
      }
    }
    doctorExisting.push({ start: startTime, end: doctorEndTime, appointmentId: appointment.id });
    doctorSchedules.set(appointment.doctor_id, doctorExisting);

    // Check patient conflicts
    const patientExisting = patientSchedules.get(appointment.patient_id) || [];
    for (const existing of patientExisting) {
      if (periodsOverlap(startTime, patientEndTime, existing.start, existing.end)) {
        errors.push({
          patient_id: appointment.patient_id,
          task_id: appointment.task_id,
          reason: `Bệnh nhân ${patient.name} đã có lịch từ ${minutesToTime(existing.start, session)} đến ${minutesToTime(existing.end, session)}`,
        });
      }
    }
    patientExisting.push({ start: startTime, end: patientEndTime, appointmentId: appointment.id });
    patientSchedules.set(appointment.patient_id, patientExisting);
  }

  return errors;
}

/**
 * Generate a schedule using a greedy algorithm with manual appointment priority
 *
 * Algorithm:
 * 1. Validate manual appointments for conflicts
 * 2. If conflicts exist, return early with errors
 * 3. Place manual appointments first, updating doctor/patient states
 * 4. Build queue of remaining (patient, task) pairs
 * 5. For each pair:
 *    - Find doctors who can perform the task
 *    - Find earliest time when both doctor and patient are free (avoiding busy periods)
 *    - Schedule the task
 * 6. Mark as unhandled if no doctor can perform the task
 *
 * Note: Break time can be configured for both patients and doctors.
 * Patients need rest between tasks, and doctors may also need breaks between tasks.
 */
export function generateSchedule(
  settings: Settings,
  tasks: Task[],
  workingDoctors: Doctor[],
  patients: Patient[],
  manualAppointments: ManualAppointment[] = [],
  session: SessionType = 'morning'
): ScheduleResult {
  const scheduled: ScheduledTask[] = [];
  const unhandled: UnhandledTask[] = [];

  // Build lookup maps
  const taskMap = new Map<string, Task>();
  tasks.forEach((t) => taskMap.set(t.id, t));

  const patientMap = new Map<string, Patient>();
  patients.forEach((p) => patientMap.set(p.id, p));

  const doctorMap = new Map<string, Doctor>();
  workingDoctors.forEach((d) => doctorMap.set(d.id, d));

  // Validate manual appointments
  const conflicts = validateManualAppointments(manualAppointments, taskMap, patientMap, doctorMap, session);
  if (conflicts.length > 0) {
    // Return conflicts as unhandled tasks
    conflicts.forEach((conflict) => {
      unhandled.push({
        patient_id: conflict.patient_id,
        task_id: conflict.task_id,
        reason: conflict.reason,
      });
    });
    return { scheduled, unhandled };
  }

  // Initialize doctor states
  const doctorStates = new Map<string, DoctorState>();
  workingDoctors.forEach((d) => {
    doctorStates.set(d.id, {
      id: d.id,
      freeAt: 0,
      canDo: new Set(d.can_do),
      busyPeriods: [],
    });
  });

  // Initialize patient states
  const patientStates = new Map<string, PatientState>();
  patients.forEach((p) => {
    patientStates.set(p.id, { id: p.id, freeAt: 0, busyPeriods: [] });
  });

  // Track which (patient, task) pairs are manually scheduled
  const manuallyScheduledPairs = new Set<string>();

  // Place manual appointments first
  for (const appointment of manualAppointments) {
    const task = taskMap.get(appointment.task_id);
    if (!task) continue;

    const startTime = appointment.start_time;
    const doctorEndTime = startTime + task.doctor_duration;
    const patientEndTime = startTime + task.patient_duration;

    // Add to scheduled
    scheduled.push({
      patient_id: appointment.patient_id,
      doctor_id: appointment.doctor_id,
      task_id: appointment.task_id,
      start_time: startTime,
      doctor_end_time: doctorEndTime,
      patient_end_time: patientEndTime,
    });

    // Update doctor state
    const doctorState = doctorStates.get(appointment.doctor_id);
    if (doctorState) {
      doctorState.busyPeriods.push({ start: startTime, end: doctorEndTime });
      doctorState.freeAt = Math.max(doctorState.freeAt, doctorEndTime + settings.break_between_tasks_doctor);
    }

    // Update patient state
    const patientState = patientStates.get(appointment.patient_id);
    if (patientState) {
      patientState.busyPeriods.push({ start: startTime, end: patientEndTime });
      patientState.freeAt = Math.max(patientState.freeAt, patientEndTime + settings.break_between_tasks);
    }

    // Mark as manually scheduled
    manuallyScheduledPairs.add(`${appointment.patient_id}-${appointment.task_id}`);
  }

  // Build queue of remaining (patient, task) pairs (excluding manually scheduled)
  const queue: { patientId: string; taskId: string }[] = [];
  patients.forEach((patient) => {
    patient.needs.forEach((taskId) => {
      const pairKey = `${patient.id}-${taskId}`;
      if (!manuallyScheduledPairs.has(pairKey)) {
        queue.push({ patientId: patient.id, taskId });
      }
    });
  });

  // Helper to find earliest available slot for a doctor considering busy periods
  const findEarliestSlot = (
    doctorState: DoctorState,
    patientState: PatientState,
    doctorDuration: number,
    patientDuration: number
  ): number | null => {
    // Start from 0 to find gaps between busy periods (not from freeAt which would miss gaps)
    let candidateStart = 0;
    const sessionDuration = SESSION_TIMES[session].durationMinutes;
    const maxIterations = 200; // Safety limit (increased for more complex schedules)

    // Sort busy periods by start time for efficient gap finding
    const sortedDoctorPeriods = [...doctorState.busyPeriods].sort((a, b) => a.start - b.start);
    const sortedPatientPeriods = [...patientState.busyPeriods].sort((a, b) => a.start - b.start);

    for (let i = 0; i < maxIterations; i++) {
      const doctorEnd = candidateStart + doctorDuration;
      const patientEnd = candidateStart + patientDuration;

      // Check if within session bounds
      if (doctorEnd > sessionDuration || patientEnd > sessionDuration) {
        return null;
      }

      // Check if doctor is busy during this period (considering doctor break time)
      let doctorConflict = false;
      for (const period of sortedDoctorPeriods) {
        // Skip periods that end before our candidate starts (with break time consideration)
        if (period.end + settings.break_between_tasks_doctor <= candidateStart) continue;
        // If period starts after our candidate ends (with break), no more conflicts possible
        if (period.start >= doctorEnd + settings.break_between_tasks_doctor) break;

        if (periodsOverlap(candidateStart, doctorEnd, period.start, period.end)) {
          candidateStart = period.end + settings.break_between_tasks_doctor; // Try after this busy period with break
          doctorConflict = true;
          break;
        }
      }
      if (doctorConflict) continue;

      // Check if patient is busy during this period
      let patientConflict = false;
      for (const period of sortedPatientPeriods) {
        // Skip periods that end before our candidate starts (with break time consideration)
        if (period.end + settings.break_between_tasks <= candidateStart) continue;
        // If period starts after our candidate ends (with break), no more conflicts possible
        if (period.start >= patientEnd + settings.break_between_tasks) break;

        if (periodsOverlap(candidateStart, patientEnd, period.start, period.end)) {
          candidateStart = period.end + settings.break_between_tasks; // Try after this busy period with break
          patientConflict = true;
          break;
        }
      }
      if (patientConflict) continue;

      // No conflicts, this slot works
      return candidateStart;
    }

    return null;
  };

  // Process each remaining pair
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

    // Find doctor with earliest possible start time (considering busy periods)
    let bestDoctor: DoctorState | null = null;
    let earliestStart: number | null = null;

    for (const doctor of capableDoctors) {
      const slot = findEarliestSlot(doctor, patientState, task.doctor_duration, task.patient_duration);
      if (slot !== null && (earliestStart === null || slot < earliestStart)) {
        earliestStart = slot;
        bestDoctor = doctor;
      }
    }

    if (bestDoctor && earliestStart !== null) {
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

      // Update states
      bestDoctor.busyPeriods.push({ start: startTime, end: doctorEndTime });
      bestDoctor.freeAt = Math.max(bestDoctor.freeAt, doctorEndTime + settings.break_between_tasks_doctor);
      patientState.busyPeriods.push({ start: startTime, end: patientEndTime });
      patientState.freeAt = Math.max(patientState.freeAt, patientEndTime + settings.break_between_tasks);
    } else {
      unhandled.push({
        patient_id: patientId,
        task_id: taskId,
        reason: 'Không tìm được khung giờ phù hợp',
      });
    }
  }

  // Sort scheduled tasks by start time
  scheduled.sort((a, b) => a.start_time - b.start_time);

  return { scheduled, unhandled };
}
