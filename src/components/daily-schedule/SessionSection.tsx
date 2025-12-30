import { SessionType } from '../../types';
import { useApp } from '../../context/AppContext';
import { WorkingDoctorSelector } from './WorkingDoctorSelector';
import { PatientList } from './PatientList';
import { Button } from '../ui/Button';
import { getSessionLabel, getSessionTimeRange } from '../../utils/timeUtils';
import { LABELS } from '../../constants/labels';

interface SessionSectionProps {
  session: SessionType;
  disabled?: boolean;
}

export function SessionSection({ session, disabled = false }: SessionSectionProps) {
  const { morning, afternoon, runScheduler } = useApp();

  const sessionData = session === 'morning' ? morning : afternoon;
  const { workingDoctorIds, patients, scheduleResult } = sessionData;

  const canGenerate = workingDoctorIds.length > 0 && patients.length > 0 && !disabled;
  const hasSchedule = scheduleResult !== null;

  const handleGenerate = () => {
    runScheduler(session);
  };

  return (
    <section className={`space-y-6 ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
      {/* Session Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            {getSessionLabel(session)}
          </h2>
          <p className="text-sm text-gray-500">{getSessionTimeRange(session)}</p>
        </div>
        {hasSchedule && (
          <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
            Đã tạo lịch
          </span>
        )}
      </div>

      {/* Working Doctors */}
      <div>
        <h3 className="text-base font-semibold text-gray-800 mb-3">
          {LABELS.daily.selectDoctors}
        </h3>
        <WorkingDoctorSelector session={session} />
      </div>

      {/* Patient List */}
      <div>
        <h3 className="text-base font-semibold text-gray-800 mb-3">
          {LABELS.patient.list}
        </h3>
        <PatientList session={session} />
      </div>

      {/* Generate Button */}
      <div className="flex justify-center pt-2">
        <Button
          size="lg"
          onClick={handleGenerate}
          disabled={!canGenerate}
          className="px-12"
        >
          {LABELS.daily.generateSchedule} - {getSessionLabel(session)}
        </Button>
      </div>

      {!canGenerate && !disabled && (
        <p className="text-center text-sm text-gray-500">
          {workingDoctorIds.length === 0 && LABELS.messages.noWorkingDoctors}
          {workingDoctorIds.length > 0 && patients.length === 0 && LABELS.messages.noPatients}
        </p>
      )}
    </section>
  );
}
