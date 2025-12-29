import { Doctor, Task, Patient, ScheduledTask } from '../../types';
import { minutesToTime } from '../../utils/timeUtils';
import { getBadgeColor } from '../ui/Badge';
import { LABELS } from '../../constants/labels';

interface GanttChartProps {
  doctors: Doctor[];
  scheduled: ScheduledTask[];
  tasks: Task[];
  patients: Patient[];
}

const SLOT_WIDTH = 40; // pixels per 15-minute slot
const ROW_HEIGHT = 60; // pixels per doctor row
const LABEL_WIDTH = 150; // pixels for doctor name column
const HEADER_HEIGHT = 40; // pixels for time header

export function GanttChart({ doctors, scheduled, tasks, patients }: GanttChartProps) {
  // Calculate time range (in 15-minute slots)
  const maxEndTime = Math.max(
    ...scheduled.map((s) => s.doctor_end_time),
    60 // minimum 1 hour
  );
  const totalSlots = Math.ceil(maxEndTime / 15) + 1; // +1 for buffer

  // Helper functions
  const getPatientName = (patientId: string) =>
    patients.find((p) => p.id === patientId)?.name || patientId;

  const getTaskName = (taskId: string) =>
    tasks.find((t) => t.id === taskId)?.name || taskId;

  const getTaskColor = (taskId: string) => {
    const idx = tasks.findIndex((t) => t.id === taskId);
    return getBadgeColor(idx);
  };

  // Group scheduled tasks by doctor
  const tasksByDoctor = new Map<string, ScheduledTask[]>();
  doctors.forEach((d) => tasksByDoctor.set(d.id, []));
  scheduled.forEach((s) => {
    const doctorTasks = tasksByDoctor.get(s.doctor_id);
    if (doctorTasks) {
      doctorTasks.push(s);
    }
  });

  const chartWidth = LABEL_WIDTH + totalSlots * SLOT_WIDTH;
  const chartHeight = HEADER_HEIGHT + doctors.length * ROW_HEIGHT;

  // Color classes for task blocks
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    orange: 'bg-orange-500',
    pink: 'bg-pink-500',
    teal: 'bg-teal-500',
    indigo: 'bg-indigo-500',
    red: 'bg-red-400',
    gray: 'bg-gray-500',
  };

  return (
    <div className="relative" style={{ minWidth: chartWidth, height: chartHeight }}>
      {/* Time Header */}
      <div
        className="absolute top-0 left-0 flex border-b border-gray-200 bg-gray-50"
        style={{ height: HEADER_HEIGHT }}
      >
        {/* Corner cell */}
        <div
          className="flex items-center justify-center border-r border-gray-200 font-medium text-sm text-gray-600"
          style={{ width: LABEL_WIDTH }}
        >
          {LABELS.time.label}
        </div>
        {/* Time slots */}
        {Array.from({ length: totalSlots }).map((_, i) => (
          <div
            key={i}
            className="flex items-center justify-center border-r border-gray-100 text-xs text-gray-500"
            style={{ width: SLOT_WIDTH }}
          >
            {i % 2 === 0 ? minutesToTime(i * 15) : ''}
          </div>
        ))}
      </div>

      {/* Doctor Rows */}
      {doctors.map((doctor, rowIndex) => {
        const doctorTasks = tasksByDoctor.get(doctor.id) || [];
        const topOffset = HEADER_HEIGHT + rowIndex * ROW_HEIGHT;

        return (
          <div
            key={doctor.id}
            className="absolute left-0 flex border-b border-gray-200"
            style={{ top: topOffset, height: ROW_HEIGHT }}
          >
            {/* Doctor name */}
            <div
              className="flex items-center px-3 border-r border-gray-200 bg-gray-50 font-medium text-sm text-gray-700 truncate"
              style={{ width: LABEL_WIDTH }}
              title={doctor.name}
            >
              {doctor.name}
            </div>

            {/* Timeline area */}
            <div className="relative" style={{ width: totalSlots * SLOT_WIDTH }}>
              {/* Grid lines */}
              {Array.from({ length: totalSlots }).map((_, i) => (
                <div
                  key={i}
                  className="absolute top-0 bottom-0 border-r border-gray-100"
                  style={{ left: i * SLOT_WIDTH }}
                />
              ))}

              {/* Task blocks */}
              {doctorTasks.map((task, taskIndex) => {
                const left = (task.start_time / 15) * SLOT_WIDTH;
                const width = ((task.doctor_end_time - task.start_time) / 15) * SLOT_WIDTH;
                const color = getTaskColor(task.task_id) || 'blue';
                const bgClass = colorClasses[color] || 'bg-blue-500';

                return (
                  <div
                    key={`${task.patient_id}-${task.task_id}-${taskIndex}`}
                    className={`absolute top-2 rounded px-2 py-1 text-white shadow-sm cursor-default ${bgClass}`}
                    style={{
                      left,
                      width: Math.max(width - 2, 30),
                      height: ROW_HEIGHT - 16,
                    }}
                    title={`${getPatientName(task.patient_id)} - ${getTaskName(task.task_id)}\n${minutesToTime(task.start_time)} - ${minutesToTime(task.doctor_end_time)}`}
                  >
                    <div className="text-xs font-medium truncate">
                      {getPatientName(task.patient_id)}
                    </div>
                    <div className="text-xs opacity-80 truncate">
                      {getTaskName(task.task_id)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
