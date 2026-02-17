import type { SettingsTab } from "../types";

type SettingsTabsProps = {
  tabs: SettingsTab[];
  activeTab: SettingsTab["id"];
  onTabChange: (tabId: SettingsTab["id"]) => void;
};

export function SettingsTabs({
  tabs,
  activeTab,
  onTabChange,
}: SettingsTabsProps) {
  return (
    <div className="flex gap-2 border-b border-border overflow-x-auto">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === tab.id
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
