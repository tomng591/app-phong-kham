import { useApp } from '../../context/AppContext';
import { Input } from '../ui/Input';
import { LABELS } from '../../constants/labels';

export function GeneralSettings() {
  const { settings, updateSettings } = useApp();

  const handleBreakTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 0;
    updateSettings({ ...settings, break_between_tasks: Math.max(0, value) });
  };

  const handleBreakTimeDoctorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 0;
    updateSettings({ ...settings, break_between_tasks_doctor: Math.max(0, value) });
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="max-w-xs space-y-4">
        <Input
          type="number"
          label={LABELS.settings.breakTime}
          value={settings.break_between_tasks}
          onChange={handleBreakTimeChange}
          min={0}
        />
        <Input
          type="number"
          label={LABELS.settings.breakTimeDoctor}
          value={settings.break_between_tasks_doctor}
          onChange={handleBreakTimeDoctorChange}
          min={0}
        />
      </div>
    </div>
  );
}
