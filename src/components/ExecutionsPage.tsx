import React, { useEffect, useState } from 'react';
import { Search, Filter, RefreshCw } from 'lucide-react';
import { TestResult } from '../types';
import { TestCard } from './TestCard';
import { TestResultModal } from './TestResultModal';

interface ExecutionsPageProps {
  tests: TestResult[];
  currentEnvironment: 'ci' | 'sit' | 'prod' | 'stg';
  onBack: () => void;
  onRefresh: () => void;
  loading: boolean;
}

export const ExecutionsPage: React.FC<ExecutionsPageProps> = ({
  tests,
  currentEnvironment,
  onBack,
  onRefresh,
  loading
}) => {
  const [filteredTests, setFilteredTests] = useState<TestResult[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedTest, setSelectedTest] = useState<TestResult | null>(null);
  const [testResultModalOpen, setTestResultModalOpen] = useState(false);

  useEffect(() => {
    let filtered = tests.filter(test =>
      test.environment?.toLowerCase() === currentEnvironment.toLowerCase()
    );

    if (searchTerm) {
      filtered = filtered.filter(test =>
        test.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        test.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
        test.branch.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      if (statusFilter === 'success') {
        filtered = filtered.filter(test => {
          const successCount = test.successCount || 0;
          const failureCount = test.failureCount || 0;
          const totalTests = successCount + failureCount;
          return totalTests > 0 && failureCount === 0;
        });
      } else if (statusFilter === 'failed') {
        filtered = filtered.filter(test => {
          const failureCount = test.failureCount || 0;
          return test.status === 'failed' || failureCount > 0;
        });
      } else {
        filtered = filtered.filter(test => test.status === statusFilter);
      }
    }

    setFilteredTests(filtered);
  }, [tests, searchTerm, statusFilter, currentEnvironment]);

  const handleViewTestDetails = (test: TestResult) => {
    setSelectedTest(test);
    setTestResultModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="flex items-center space-x-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
              >
                ← Retour au dashboard
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Toutes les exécutions</h1>
                <p className="text-gray-600">Environnement : {currentEnvironment.toUpperCase()}</p>
              </div>
            </div>
            <button
              onClick={onRefresh}
              disabled={loading}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Actualiser</span>
            </button>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Rechercher par nom ou branche..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Tous les statuts</option>
              <option value="success">Succès</option>
              <option value="failed">Échec</option>
              <option value="running">En cours</option>
              <option value="pending">En attente</option>
            </select>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <p className="text-sm text-gray-600 mb-1">Total</p>
            <p className="text-2xl font-bold text-gray-900">{filteredTests.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <p className="text-sm text-gray-600 mb-1">Succès</p>
            <p className="text-2xl font-bold text-green-600">
              {filteredTests.filter(test => {
                const successCount = test.successCount || 0;
                const failureCount = test.failureCount || 0;
                const totalTests = successCount + failureCount;
                return totalTests > 0 && failureCount === 0;
              }).length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <p className="text-sm text-gray-600 mb-1">Échecs</p>
            <p className="text-2xl font-bold text-red-600">
              {filteredTests.filter(test => {
                const failureCount = test.failureCount || 0;
                return test.status === 'failed' || failureCount > 0;
              }).length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <p className="text-sm text-gray-600 mb-1">En cours</p>
            <p className="text-2xl font-bold text-blue-600">
              {filteredTests.filter(test =>
                test.status === 'running' || test.status === 'pending'
              ).length}
            </p>
          </div>
        </div>

        {/* Tests Grid */}
        {loading ? (
          <div className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-8 flex flex-col items-center space-y-4">
              <div className="w-64 bg-gray-200 rounded-full h-3">
                <div className="bg-blue-600 h-3 rounded-full animate-pulse" style={{ width: '60%' }}></div>
              </div>
              <div className="flex items-center space-x-2">
                <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
                <span className="text-gray-700 font-medium">Chargement des tests...</span>
              </div>
            </div>
          </div>
        ) : filteredTests.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Filter className="w-16 h-16 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Aucun résultat trouvé
            </h3>
            <p className="text-gray-600 mb-4">
              Vos filtres de recherche ne correspondent à aucun test pour l'environnement {currentEnvironment.toUpperCase()}.
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
              }}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            >
              Réinitialiser les filtres
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTests.map((test) => (
              <TestCard
                key={test.id}
                test={test}
                onViewDetails={handleViewTestDetails}
              />
            ))}
          </div>
        )}
      </div>

      {/* Test Result Modal */}
      {selectedTest && (
        <TestResultModal
          isOpen={testResultModalOpen}
          onClose={() => {
            setTestResultModalOpen(false);
            setSelectedTest(null);
          }}
          test={selectedTest}
        />
      )}
    </div>
  );
};
