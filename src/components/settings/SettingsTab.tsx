import { GeneralSettings } from './GeneralSettings';
import { TaskManagement } from './TaskManagement';
import { DoctorManagement } from './DoctorManagement';
import { DataExportImport } from './DataExportImport';
import { LABELS } from '../../constants/labels';

export function SettingsTab() {
  return (
    <div className="space-y-8">
      {/* General Settings */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          {LABELS.settings.title}
        </h2>
        <GeneralSettings />
      </section>

      {/* Task Management */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          {LABELS.settings.taskManagement}
        </h2>
        <TaskManagement />
      </section>

      {/* Doctor Management */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          {LABELS.settings.doctorManagement}
        </h2>
        <DoctorManagement />
      </section>

      {/* Data Export/Import */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          {LABELS.settings.dataManagement}
        </h2>
        <DataExportImport />
      </section>
    </div>
  );
}
