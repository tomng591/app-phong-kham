import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { SessionType, ScheduleHistoryEntry } from '../../types';
import { Button } from '../ui/Button';
import { ConfirmModal } from '../ui/Modal';
import { LABELS } from '../../constants/labels';
import { HistorySessionView } from './HistorySessionView';

export function HistoryTab() {
  const { historyIndex, getHistoryEntry, deleteHistoryEntry } = useApp();
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [deletingEntry, setDeletingEntry] = useState<{ date: string; session: SessionType } | null>(null);

  const morningEntry = getHistoryEntry(selectedDate, 'morning');
  const afternoonEntry = getHistoryEntry(selectedDate, 'afternoon');

  const hasSchedules = morningEntry || afternoonEntry;

  // Get dates that have schedules for highlighting in calendar
  const datesWithSchedules = Object.keys(historyIndex);

  const handleDelete = () => {
    if (deletingEntry) {
      deleteHistoryEntry(deletingEntry.date, deletingEntry.session);
      setDeletingEntry(null);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Date Picker */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          {LABELS.history.title}
        </h2>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <label className="text-sm font-medium text-gray-700">
            {LABELS.history.selectDate}:
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <span className="text-sm text-gray-500">
            {formatDate(selectedDate)}
          </span>
        </div>

        {/* Quick date buttons */}
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="text-sm text-gray-500 mr-2">Ngày có lịch:</span>
          {datesWithSchedules.length === 0 ? (
            <span className="text-sm text-gray-400">Chưa có lịch nào được lưu</span>
          ) : (
            datesWithSchedules
              .sort((a, b) => b.localeCompare(a)) // Most recent first
              .slice(0, 10) // Show last 10 days
              .map((date) => (
                <button
                  key={date}
                  onClick={() => setSelectedDate(date)}
                  className={`px-2 py-1 text-xs rounded ${
                    date === selectedDate
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {date}
                </button>
              ))
          )}
        </div>
      </div>

      {/* Schedule Display */}
      {!hasSchedules ? (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-500">
          {LABELS.history.noSchedule}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Morning Session */}
          {morningEntry && (
            <HistorySessionCard
              entry={morningEntry}
              onDelete={() => setDeletingEntry({ date: selectedDate, session: 'morning' })}
            />
          )}

          {/* Afternoon Session */}
          {afternoonEntry && (
            <HistorySessionCard
              entry={afternoonEntry}
              onDelete={() => setDeletingEntry({ date: selectedDate, session: 'afternoon' })}
            />
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deletingEntry}
        onClose={() => setDeletingEntry(null)}
        onConfirm={handleDelete}
        title={LABELS.history.deleteSchedule}
        message={LABELS.history.confirmDeleteSchedule}
      />
    </div>
  );
}

interface HistorySessionCardProps {
  entry: ScheduleHistoryEntry;
  onDelete: () => void;
}

function HistorySessionCard({ entry, onDelete }: HistorySessionCardProps) {
  const [expanded, setExpanded] = useState(false);

  const sessionLabel = entry.session === 'morning' ? LABELS.history.morning : LABELS.history.afternoon;
  const scheduledCount = entry.scheduleResult.scheduled.length;
  const unhandledCount = entry.scheduleResult.unhandled.length;

  const createdAt = new Date(entry.createdAt).toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div
        className="p-4 cursor-pointer hover:bg-gray-50 flex items-center justify-between"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-semibold text-gray-900">{sessionLabel}</h3>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-green-600">
              {scheduledCount} {LABELS.history.scheduledTasks}
            </span>
            {unhandledCount > 0 && (
              <span className="text-red-600">
                {unhandledCount} {LABELS.history.unhandledTasks}
              </span>
            )}
          </div>
          <span className="text-xs text-gray-400">
            {LABELS.history.generatedAt}: {createdAt}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="danger"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            {LABELS.actions.delete}
          </Button>
          <svg
            className={`w-5 h-5 text-gray-500 transition-transform ${expanded ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Expanded Content */}
      {expanded && (
        <div className="border-t border-gray-200 p-4">
          <HistorySessionView entry={entry} />
        </div>
      )}
    </div>
  );
}
