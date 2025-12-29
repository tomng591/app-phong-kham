import { WorkingDoctorSelector } from './WorkingDoctorSelector';
import { PatientList } from './PatientList';
import { Button } from '../ui/Button';
import { useApp } from '../../context/AppContext';
import { LABELS } from '../../constants/labels';

export function DailyScheduleTab() {
  const { workingDoctorIds, patients, runScheduler } = useApp();

  const canGenerate = workingDoctorIds.length > 0 && patients.length > 0;

  return (
    <div className="space-y-8">
      {/* Working Doctors Selection */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          {LABELS.daily.selectDoctors}
        </h2>
        <WorkingDoctorSelector />
      </section>

      {/* Patient List */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          {LABELS.patient.list}
        </h2>
        <PatientList />
      </section>

      {/* Generate Schedule Button */}
      <section className="flex justify-center pt-4">
        <Button
          size="lg"
          onClick={runScheduler}
          disabled={!canGenerate}
          className="px-12"
        >
          {LABELS.daily.generateSchedule}
        </Button>
      </section>

      {!canGenerate && (
        <p className="text-center text-sm text-gray-500">
          {workingDoctorIds.length === 0 && LABELS.messages.noWorkingDoctors}
          {workingDoctorIds.length > 0 && patients.length === 0 && LABELS.messages.noPatients}
        </p>
      )}
    </div>
  );
}
