import { SessionType } from '../../types';
import { useApp } from '../../context/AppContext';
import { GanttChart } from './GanttChart';

interface DoctorTimelineProps {
  session: SessionType;
}

export function DoctorTimeline({ session }: DoctorTimelineProps) {
  const { morning, afternoon, doctors, tasks } = useApp();

  const sessionData = session === 'morning' ? morning : afternoon;
  const { scheduleResult, workingDoctorIds, patients } = sessionData;

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
        session={session}
      />
    </div>
  );
}
