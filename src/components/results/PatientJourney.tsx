import { SessionType } from '../../types';
import { useApp } from '../../context/AppContext';
import { minutesToTime } from '../../utils/timeUtils';
import { Badge, getBadgeColor } from '../ui/Badge';
import { LABELS } from '../../constants/labels';

interface PatientJourneyProps {
  session: SessionType;
}

export function PatientJourney({ session }: PatientJourneyProps) {
  const { morning, afternoon, tasks, doctors } = useApp();

  const sessionData = session === 'morning' ? morning : afternoon;
  const { scheduleResult, patients } = sessionData;

  if (!scheduleResult) return null;

  // Group scheduled tasks by patient
  const tasksByPatient = new Map<string, typeof scheduleResult.scheduled>();
  patients.forEach((p) => tasksByPatient.set(p.id, []));

  scheduleResult.scheduled.forEach((s) => {
    const patientTasks = tasksByPatient.get(s.patient_id);
    if (patientTasks) {
      patientTasks.push(s);
    }
  });

  // Sort each patient's tasks by start time
  tasksByPatient.forEach((tasks) => {
    tasks.sort((a, b) => a.start_time - b.start_time);
  });

  const getTaskName = (taskId: string) =>
    tasks.find((t) => t.id === taskId)?.name || taskId;

  const getDoctorName = (doctorId: string) =>
    doctors.find((d) => d.id === doctorId)?.name || doctorId;

  const getPatientCompletionTime = (patientId: string) => {
    const patientTasks = tasksByPatient.get(patientId) || [];
    if (patientTasks.length === 0) return null;
    return Math.max(...patientTasks.map((t) => t.patient_end_time));
  };

  // Filter to only show patients with scheduled tasks
  const patientsWithTasks = patients.filter((p) => {
    const tasks = tasksByPatient.get(p.id);
    return tasks && tasks.length > 0;
  });

  if (patientsWithTasks.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 text-center text-gray-500">
        Không có bệnh nhân nào được xếp lịch
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-200">
      {patientsWithTasks.map((patient) => {
        const patientTasks = tasksByPatient.get(patient.id) || [];
        const completionTime = getPatientCompletionTime(patient.id);

        return (
          <div key={patient.id} className="p-4">
            <div className="flex items-start gap-4">
              {/* Patient ID */}
              <div className="w-10 text-center font-bold text-gray-600">
                {patient.daily_id}
              </div>
              {/* Patient Name */}
              <div className="font-medium text-gray-900 min-w-[100px]">
                {patient.name}
              </div>

              {/* Journey */}
              <div className="flex-1 flex flex-wrap items-center gap-2">
                {patientTasks.map((task, index) => {
                  const taskIndex = tasks.findIndex((t) => t.id === task.task_id);
                  return (
                    <div key={`${task.task_id}-${index}`} className="flex items-center gap-2">
                      {index > 0 && (
                        <span className="text-gray-400">→</span>
                      )}
                      <div className="flex flex-col items-center">
                        <Badge color={getBadgeColor(taskIndex)}>
                          {getTaskName(task.task_id)}
                        </Badge>
                        <span className="text-xs text-gray-500 mt-1">
                          {minutesToTime(task.start_time, session)}-{minutesToTime(task.patient_end_time, session)}
                        </span>
                        <span className="text-xs text-gray-400">
                          {getDoctorName(task.doctor_id)}
                        </span>
                      </div>
                    </div>
                  );
                })}

                {/* Completion */}
                {completionTime !== null && (
                  <>
                    <span className="text-gray-400">→</span>
                    <div className="flex items-center gap-1 text-green-600">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm font-medium">
                        {LABELS.results.completed}: {minutesToTime(completionTime, session)}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
