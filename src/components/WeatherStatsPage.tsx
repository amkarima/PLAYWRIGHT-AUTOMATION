import React from 'react';
import { Sun, CloudRain, ArrowLeft } from 'lucide-react';

interface TestStep {
  title: string;
  duration: number;
  status: 'passed' | 'failed' | 'skipped';
  error?: string;
  file?: string;
  video?: string;
}

interface WeatherStatsPageProps {
  individualTests: TestStep[];
  selectedTestName?: string;
  onBack: () => void;
}

export const WeatherStatsPage: React.FC<WeatherStatsPageProps> = ({ 
  individualTests, 
  selectedTestName,
  onBack 
}) => {
  const passedTests = individualTests.filter(test => test.status === 'passed');
  const failedTests = individualTests.filter(test => test.status === 'failed');
  const skippedTests = individualTests.filter(test => test.status === 'skipped');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Retour à la météo</span>
          </button>
          
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Statistiques des Tests</h1>
            {selectedTestName && (
              <p className="text-gray-600">{selectedTestName}</p>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Tests réussis</p>
                <p className="text-2xl font-bold text-green-600">
                  {passedTests.length}
                </p>
              </div>
              <Sun className="w-8 h-8 text-green-500" />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Tests échoués</p>
                <p className="text-2xl font-bold text-red-600">
                  {failedTests.length}
                </p>
              </div>
              <CloudRain className="w-8 h-8 text-red-500" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Tests ignorés</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {skippedTests.length}
                </p>
              </div>
              <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                <span className="text-yellow-600 text-lg">⊘</span>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Lists */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Passed Tests */}
          {passedTests.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6 border-b bg-green-50">
                <h2 className="text-xl font-semibold text-green-800 flex items-center space-x-2">
                  <Sun className="w-5 h-5" />
                  <span>Tests réussis ({passedTests.length})</span>
                </h2>
              </div>
              <div className="p-6 max-h-96 overflow-y-auto">
                <div className="space-y-3">
                  {passedTests.map((test, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex-1">
                        <p className="font-medium text-green-800">{test.title}</p>
                        {test.file && (
                          <p className="text-xs text-green-600 mt-1">{test.file}</p>
                        )}
                      </div>
                      <span className="text-sm font-medium text-green-600">
                        {test.duration < 1000 ? `${test.duration}ms` : `${Math.floor(test.duration / 1000)}s`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Failed Tests */}
          {failedTests.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6 border-b bg-red-50">
                <h2 className="text-xl font-semibold text-red-800 flex items-center space-x-2">
                  <CloudRain className="w-5 h-5" />
                  <span>Tests échoués ({failedTests.length})</span>
                </h2>
              </div>
              <div className="p-6 max-h-96 overflow-y-auto">
                <div className="space-y-3">
                  {failedTests.map((test, index) => (
                    <div key={index} className="p-3 bg-red-50 rounded-lg border border-red-200">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <p className="font-medium text-red-800">{test.title}</p>
                          {test.file && (
                            <p className="text-xs text-red-600 mt-1">{test.file}</p>
                          )}
                        </div>
                        <span className="text-sm font-medium text-red-600">
                          {test.duration < 1000 ? `${test.duration}ms` : `${Math.floor(test.duration / 1000)}s`}
                        </span>
                      </div>
                      {test.error && (
                        <div className="mt-2 p-2 bg-red-100 border border-red-200 rounded text-xs">
                          <pre className="whitespace-pre-wrap text-red-800">{test.error}</pre>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Skipped Tests */}
        {skippedTests.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border mt-6">
            <div className="p-6 border-b bg-yellow-50">
              <h2 className="text-xl font-semibold text-yellow-800 flex items-center space-x-2">
                <span className="text-yellow-600 text-lg">⊘</span>
                <span>Tests ignorés ({skippedTests.length})</span>
              </h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {skippedTests.map((test, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div className="flex-1">
                      <p className="font-medium text-yellow-800">{test.title}</p>
                      {test.file && (
                        <p className="text-xs text-yellow-600 mt-1">{test.file}</p>
                      )}
                    </div>
                    <span className="text-sm font-medium text-yellow-600">Ignoré</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};