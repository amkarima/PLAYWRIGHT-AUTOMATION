import React, { useState } from 'react';
import { Settings, List } from 'lucide-react';
import { TestCatalogPage } from './TestCatalogPage';
import TestPresetsConfig from './TestPresetsConfig';

export const ConfigPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'catalog' | 'presets'>('catalog');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Configuration</h1>

          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('catalog')}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'catalog'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <List className="w-5 h-5" />
                <span>Catalogue des tests</span>
              </button>

              <button
                onClick={() => setActiveTab('presets')}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'presets'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Settings className="w-5 h-5" />
                <span>Presets de tests manuels</span>
              </button>
            </nav>
          </div>
        </div>

        <div className="mt-6">
          {activeTab === 'catalog' ? (
            <TestCatalogPage />
          ) : (
            <TestPresetsConfig />
          )}
        </div>
      </div>
    </div>
  );
};
