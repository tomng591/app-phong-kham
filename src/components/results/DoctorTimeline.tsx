import { useApp } from '../../context/AppContext';
import { GanttChart } from './GanttChart';

export function DoctorTimeline() {
  const { scheduleResult, doctors, tasks, patients, workingDoctorIds } = useApp();

  if (!scheduleResult || scheduleResult.scheduled.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 text-center text-gray-500">
        Không có công việc nào được xếp lịch
      </div>
    );
  }

  // Filter to only show working doctors
  const workingDoctors = doctors.filter((d) => workingDoctorIds.includes(d.id));

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 overflow-x-auto">
      <GanttChart
        doctors={workingDoctors}
        scheduled={scheduleResult.scheduled}
        tasks={tasks}
        patients={patients}
      />
    </div>
  );
}
