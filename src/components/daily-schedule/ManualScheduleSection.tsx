import { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { SessionType, ManualAppointment, SESSION_TIMES } from '../../types';
import { Button } from '../ui/Button';
import { Badge, getBadgeColor } from '../ui/Badge';
import { ConfirmModal } from '../ui/Modal';
import { LABELS } from '../../constants/labels';
import { minutesToTime, timeToMinutes } from '../../utils/timeUtils';

interface ManualScheduleSectionProps {
  session: SessionType;
}

interface ManualTaskEntry {
  patientId: string;
  patientName: string;
  patientDailyId: number;
  taskId: string;
  taskName: string;
  taskIndex: number;
  appointment: ManualAppointment | null;
}

export function ManualScheduleSection({ session }: ManualScheduleSectionProps) {
  const {
    morning,
    afternoon,
    tasks,
    doctors,
    addManualAppointment,
    updateManualAppointment,
    deleteManualAppointment,
  } = useApp();

  const [deletingAppointment, setDeletingAppointment] = useState<ManualAppointment | null>(null);

  const sessionData = session === 'morning' ? morning : afternoon;
  const { patients, workingDoctorIds, manualAppointments } = sessionData;

  // Get all manual-schedulable tasks
  const manualSchedulableTasks = useMemo(() => {
    return tasks.filter((t) => t.is_manual_schedulable);
  }, [tasks]);

  // Build list of (patient, task) pairs that can be manually scheduled
  const manualTaskEntries: ManualTaskEntry[] = useMemo(() => {
    const entries: ManualTaskEntry[] = [];

    patients.forEach((patient) => {
      patient.needs.forEach((taskId) => {
        const task = manualSchedulableTasks.find((t) => t.id === taskId);
        if (task) {
          const appointment = manualAppointments.find(
            (a) => a.patient_id === patient.id && a.task_id === taskId
          );
          const taskIndex = tasks.findIndex((t) => t.id === taskId);
          entries.push({
            patientId: patient.id,
            patientName: patient.name,
            patientDailyId: patient.daily_id,
            taskId: taskId,
            taskName: task.name,
            taskIndex,
            appointment: appointment || null,
          });
        }
      });
    });

    return entries;
  }, [patients, manualSchedulableTasks, manualAppointments, tasks]);

  // Get working doctors
  const workingDoctors = useMemo(() => {
    return doctors.filter((d) => workingDoctorIds.includes(d.id));
  }, [doctors, workingDoctorIds]);

  // Get doctors who can do a specific task
  const getDoctorsForTask = (taskId: string) => {
    return workingDoctors.filter((d) => d.can_do.includes(taskId));
  };

  // Get session time bounds
  const sessionConfig = SESSION_TIMES[session];
  const minTime = `${sessionConfig.startHour.toString().padStart(2, '0')}:${sessionConfig.startMinute.toString().padStart(2, '0')}`;
  const maxTime = `${sessionConfig.endHour.toString().padStart(2, '0')}:${sessionConfig.endMinute.toString().padStart(2, '0')}`;

  const handleTimeChange = (entry: ManualTaskEntry, timeValue: string) => {
    if (!timeValue) return;

    const startTime = timeToMinutes(timeValue, session);

    if (entry.appointment) {
      // Update existing
      updateManualAppointment(session, {
        ...entry.appointment,
        start_time: startTime,
      });
    } else {
      // Create new - need to have a doctor selected first
      // For now, just skip if no appointment exists
    }
  };

  const handleDoctorChange = (entry: ManualTaskEntry, doctorId: string) => {
    if (!doctorId) {
      // If clearing doctor, delete the appointment
      if (entry.appointment) {
        deleteManualAppointment(session, entry.appointment.id);
      }
      return;
    }

    if (entry.appointment) {
      // Update existing
      updateManualAppointment(session, {
        ...entry.appointment,
        doctor_id: doctorId,
      });
    } else {
      // Create new with default time (session start)
      addManualAppointment(session, {
        patient_id: entry.patientId,
        task_id: entry.taskId,
        doctor_id: doctorId,
        start_time: 0,
      });
    }
  };

  const handleDelete = () => {
    if (deletingAppointment) {
      deleteManualAppointment(session, deletingAppointment.id);
      setDeletingAppointment(null);
    }
  };

  // Don't render if no manual-schedulable tasks exist
  if (manualTaskEntries.length === 0) {
    return null;
  }

  return (
    <div className="bg-amber-50 rounded-lg border border-amber-200 p-4">
      <h4 className="text-sm font-semibold text-amber-800 mb-3">
        {LABELS.manualAppointment.title}
      </h4>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-amber-200">
          <thead>
            <tr className="text-left text-xs font-medium text-amber-700 uppercase tracking-wider">
              <th className="px-3 py-2">{LABELS.manualAppointment.patient}</th>
              <th className="px-3 py-2">{LABELS.manualAppointment.task}</th>
              <th className="px-3 py-2">{LABELS.manualAppointment.time}</th>
              <th className="px-3 py-2">{LABELS.manualAppointment.doctor}</th>
              <th className="px-3 py-2 text-right"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-amber-100">
            {manualTaskEntries.map((entry) => {
              const capableDoctors = getDoctorsForTask(entry.taskId);
              const currentTime = entry.appointment
                ? minutesToTime(entry.appointment.start_time, session)
                : '';
              const currentDoctorId = entry.appointment?.doctor_id || '';

              return (
                <tr key={`${entry.patientId}-${entry.taskId}`} className="text-sm">
                  <td className="px-3 py-2">
                    <span className="font-medium text-gray-900">
                      #{entry.patientDailyId} {entry.patientName}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <Badge color={getBadgeColor(entry.taskIndex)}>
                      {entry.taskName}
                    </Badge>
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="time"
                      value={currentTime}
                      onChange={(e) => handleTimeChange(entry, e.target.value)}
                      min={minTime}
                      max={maxTime}
                      disabled={!entry.appointment}
                      className="block w-28 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <select
                      value={currentDoctorId}
                      onChange={(e) => handleDoctorChange(entry, e.target.value)}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                    >
                      <option value="">{LABELS.manualAppointment.selectDoctor}</option>
                      {capableDoctors.map((doctor) => (
                        <option key={doctor.id} value={doctor.id}>
                          {doctor.name}
                        </option>
                      ))}
                    </select>
                    {capableDoctors.length === 0 && (
                      <p className="text-xs text-red-500 mt-1">
                        {LABELS.results.noDoctor}
                      </p>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {entry.appointment && (
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => setDeletingAppointment(entry.appointment)}
                      >
                        {LABELS.actions.delete}
                      </Button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-amber-600 mt-3">
        Chọn bác sĩ để đặt lịch thủ công. Sau khi chọn bác sĩ, bạn có thể điều chỉnh thời gian.
      </p>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deletingAppointment}
        onClose={() => setDeletingAppointment(null)}
        onConfirm={handleDelete}
        title={LABELS.actions.delete}
        message={LABELS.messages.confirmDelete}
      />
    </div>
  );
}
