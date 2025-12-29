import { TabType } from '../../types';
import { LABELS } from '../../constants/labels';
import { useApp } from '../../context/AppContext';

const tabs: { key: TabType; label: string }[] = [
  { key: 'settings', label: LABELS.tabs.settings },
  { key: 'daily', label: LABELS.tabs.daily },
  { key: 'results', label: LABELS.tabs.results },
];

export function TabNavigation() {
  const { activeTab, setActiveTab, scheduleResult } = useApp();

  return (
    <div className="border-b border-gray-200">
      <nav className="flex gap-4" aria-label="Tabs">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          const isDisabled = tab.key === 'results' && !scheduleResult;

          return (
            <button
              key={tab.key}
              onClick={() => !isDisabled && setActiveTab(tab.key)}
              disabled={isDisabled}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                isActive
                  ? 'border-blue-600 text-blue-600'
                  : isDisabled
                  ? 'border-transparent text-gray-300 cursor-not-allowed'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
