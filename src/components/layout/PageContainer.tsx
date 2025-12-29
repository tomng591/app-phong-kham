import { Header } from './Header';
import { TabNavigation } from './TabNavigation';
import { useApp } from '../../context/AppContext';
import { SettingsTab } from '../settings/SettingsTab';
import { DailyScheduleTab } from '../daily-schedule/DailyScheduleTab';
import { ResultsTab } from '../results/ResultsTab';

export function PageContainer() {
  const { activeTab } = useApp();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <TabNavigation />
        <div className="mt-6">
          {activeTab === 'settings' && <SettingsTab />}
          {activeTab === 'daily' && <DailyScheduleTab />}
          {activeTab === 'results' && <ResultsTab />}
        </div>
      </main>
    </div>
  );
}
