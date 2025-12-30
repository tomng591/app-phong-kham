import { SessionType } from '../../types';
import { useApp } from '../../context/AppContext';
import { DoctorTimeline } from './DoctorTimeline';
import { PatientJourney } from './PatientJourney';
import { UnhandledTasks } from './UnhandledTasks';
import { getSessionLabel, getSessionTimeRange } from '../../utils/timeUtils';
import { LABELS } from '../../constants/labels';

interface SessionResultsProps {
  session: SessionType;
}

export function SessionResults({ session }: SessionResultsProps) {
  const { morning, afternoon } = useApp();
  const scheduleResult = session === 'morning' ? morning.scheduleResult : afternoon.scheduleResult;

  if (!scheduleResult) return null;

  return (
    <section className="space-y-6">
      {/* Session Header */}
      <div className="flex items-center gap-3">
        <h2 className="text-xl font-bold text-gray-900">
          {getSessionLabel(session)}
        </h2>
        <span className="text-sm text-gray-500">({getSessionTimeRange(session)})</span>
      </div>

      {/* Doctor Timeline (Gantt Chart) */}
      <div>
        <h3 className="text-base font-semibold text-gray-800 mb-3">
          {LABELS.results.doctorTimeline}
        </h3>
        <DoctorTimeline session={session} />
      </div>

      {/* Patient Journey */}
      <div>
        <h3 className="text-base font-semibold text-gray-800 mb-3">
          {LABELS.results.patientJourney}
        </h3>
        <PatientJourney session={session} />
      </div>

      {/* Unhandled Tasks */}
      {scheduleResult.unhandled.length > 0 && (
        <div>
          <h3 className="text-base font-semibold text-gray-800 mb-3">
            {LABELS.results.unhandled}
          </h3>
          <UnhandledTasks session={session} />
        </div>
      )}
    </section>
  );
}
