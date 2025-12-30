import { useApp } from '../../context/AppContext';
import { SessionResults } from './SessionResults';
import { LABELS } from '../../constants/labels';

export function ResultsTab() {
  const { morning, afternoon } = useApp();

  const hasMorningSchedule = morning.scheduleResult !== null;
  const hasAfternoonSchedule = afternoon.scheduleResult !== null;

  if (!hasMorningSchedule && !hasAfternoonSchedule) {
    return (
      <div className="text-center py-12 text-gray-500">
        {LABELS.results.noSchedule}
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Morning Results */}
      {hasMorningSchedule && (
        <SessionResults session="morning" />
      )}

      {/* Divider */}
      {hasMorningSchedule && hasAfternoonSchedule && (
        <div className="border-t-2 border-gray-300" />
      )}

      {/* Afternoon Results */}
      {hasAfternoonSchedule && (
        <SessionResults session="afternoon" />
      )}
    </div>
  );
}
