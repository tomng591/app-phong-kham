import { SessionSection } from './SessionSection';
import { useApp } from '../../context/AppContext';

export function DailyScheduleTab() {
  const { morning } = useApp();

  // Afternoon can only be generated after morning is generated
  const canGenerateAfternoon = morning.scheduleResult !== null;

  return (
    <div className="space-y-8">
      {/* Morning Session */}
      <SessionSection session="morning" />

      {/* Divider */}
      <div className="border-t border-gray-300" />

      {/* Afternoon Session */}
      <SessionSection session="afternoon" disabled={!canGenerateAfternoon} />

      {!canGenerateAfternoon && (
        <p className="text-center text-sm text-amber-600 bg-amber-50 py-3 px-4 rounded-lg">
          Vui lòng tạo lịch buổi sáng trước khi tạo lịch buổi chiều
        </p>
      )}
    </div>
  );
}
