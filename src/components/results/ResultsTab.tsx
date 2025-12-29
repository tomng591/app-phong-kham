import { useApp } from '../../context/AppContext';
import { DoctorTimeline } from './DoctorTimeline';
import { PatientJourney } from './PatientJourney';
import { UnhandledTasks } from './UnhandledTasks';
import { LABELS } from '../../constants/labels';

export function ResultsTab() {
  const { scheduleResult } = useApp();

  if (!scheduleResult) {
    return (
      <div className="text-center py-12 text-gray-500">
        {LABELS.results.noSchedule}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Doctor Timeline (Gantt Chart) */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          {LABELS.results.doctorTimeline}
        </h2>
        <DoctorTimeline />
      </section>

      {/* Patient Journey */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          {LABELS.results.patientJourney}
        </h2>
        <PatientJourney />
      </section>

      {/* Unhandled Tasks */}
      {scheduleResult.unhandled.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {LABELS.results.unhandled}
          </h2>
          <UnhandledTasks />
        </section>
      )}
    </div>
  );
}
