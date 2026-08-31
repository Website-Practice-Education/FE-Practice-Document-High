export interface TabItem {
  id: string;
  label: string;
  count?: number | null;
  badge?: number;
}

interface TabBarProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}

export default function TabBar({ tabs, activeTab, onChange, className = '' }: TabBarProps) {
  return (
    <div className={`tab-bar ${className}`} role="tablist">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={`tab-bar-item ${isActive ? 'active' : ''}`}
          >
            <span className="tab-bar-label">{tab.label}</span>
            {tab.count != null && (
              <span className={`tab-bar-count ${isActive ? 'active' : ''}`}>{tab.count}</span>
            )}
            {tab.badge != null && tab.badge > 0 && (
              <span className="tab-bar-badge">{tab.badge}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
