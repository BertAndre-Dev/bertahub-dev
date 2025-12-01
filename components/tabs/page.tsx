'use client';

import React, { useState, useEffect } from 'react';

interface TabProps {
  titles: string[];
  renderContent: (role: string) => React.ReactNode;
  onTabChange?: (index: number, role: string) => void;
}

const Tab: React.FC<TabProps> = ({ titles, renderContent, onTabChange }) => {
  const [activeTab, setActiveTab] = useState(0);
  useEffect(() => {
    onTabChange?.(activeTab, titles[activeTab]);
  }, [activeTab]);

  

  return (
    <div>
      {/* Tab Titles */}
      <div className="flex space-x-4">
        {titles.map((title, index) => (
          <button
            key={index}
            className={`py-2 px-4 cursor-pointer ${
              activeTab === index ? 'text-primary border-b-2 border-primary font-bold' : 'font-medium text-sidebar-foreground/60'
            }`}
             onClick={() => setActiveTab(index)}
          >
            {title}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="mt-4">{renderContent(titles[activeTab])}</div>
    </div>
  );
};

export default Tab;
