import React, { useState } from 'react';
import { Settings, List, Tag, Calendar } from 'lucide-react';
import { TestCatalogPage } from './TestCatalogPage';
import TestPresetsConfig from './TestPresetsConfig';
import TagGroupsConfig from './TagGroupsConfig';
import { PlanificationPage } from './PlanificationPage';

export const ConfigPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'catalog' | 'presets' | 'tags' | 'planification'>('catalog');

  const tabs = [
    { id: 'catalog' as const, label: 'Catalogue des tests', icon: List },
    { id: 'presets' as const, label: 'Presets de tests manuels', icon: Settings },
    { id: 'tags' as const, label: 'Groupes de tags', icon: Tag },
    { id: 'planification' as const, label: 'Planification', icon: Calendar },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Configuration</h1>

          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-all ${
                      isActive
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        <div className="mt-6">
          {activeTab === 'catalog' ? (
            <TestCatalogPage />
          ) : activeTab === 'presets' ? (
            <TestPresetsConfig />
          ) : activeTab === 'planification' ? (
            <PlanificationPage embedded />
          ) : (
            <TagGroupsConfig />
          )}
        </div>
      </div>
    </div>
  );
};
