import React, { useState, useMemo } from 'react';
import { X, Play, CheckCircle, XCircle, Search, Rocket } from 'lucide-react';
import { getPartnerLogo, type Partner } from '../utils/partnerLogos';

interface PartnerTest {
  title: string;
  passed: boolean;
  perimetre: string;
}

interface PartnerTestsModalProps {
  isOpen: boolean;
  onClose: () => void;
  partner: Partner | null;
  title?: string;
  tests: PartnerTest[];
  onTrigger: (selectedTests: string[], variables: Record<string, string>, eSignature: boolean) => void;
  loading?: boolean;
}

export const PartnerTestsModal: React.FC<PartnerTestsModalProps> = ({
  isOpen,
  onClose,
  partner,
  title,
  tests,
  onTrigger,
  loading = false,
}) => {
  const [search, setSearch] = useState('');
  const [selectedTests, setSelectedTests] = useState<string[]>([]);
  const [eSignature, setESignature] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'passed' | 'failed'>('all');

  const logo = partner ? getPartnerLogo(partner) : null;
  const displayName = title || partner;

  const filteredTests = useMemo(() => {
    let result = tests;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(t => t.title.toLowerCase().includes(q) || t.perimetre.toLowerCase().includes(q));
    }
    if (filterStatus === 'passed') result = result.filter(t => t.passed);
    if (filterStatus === 'failed') result = result.filter(t => !t.passed);
    return result;
  }, [tests, search, filterStatus]);

  const successCount = tests.filter(t => t.passed).length;
  const failureCount = tests.filter(t => !t.passed).length;
  const successRate = tests.length > 0 ? Math.round((successCount / tests.length) * 100) : 0;

  const perimetres = useMemo(() => {
    const set = new Set<string>();
    tests.forEach(t => set.add(t.perimetre));
    return Array.from(set).sort();
  }, [tests]);

  const toggleTest = (title: string) => {
    setSelectedTests(prev => prev.includes(title) ? prev.filter(t => t !== title) : [...prev, title]);
  };

  const selectAll = () => setSelectedTests(filteredTests.map(t => t.title));
  const deselectAll = () => setSelectedTests([]);

  const handleTrigger = () => {
    if (selectedTests.length === 0) {
      alert('Veuillez sélectionner au moins un test à exécuter.');
      return;
    }
    onTrigger(selectedTests, {}, eSignature);
  };

  if (!isOpen || !displayName) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b flex-shrink-0">
          <div className="flex items-center space-x-4">
            {logo && (
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center overflow-hidden border border-gray-200 bg-white flex-shrink-0"
                style={logo.bgColor ? { backgroundColor: logo.bgColor } : undefined}
              >
                <img src={logo.src} alt={logo.alt} className="w-full h-full object-contain" style={{ padding: '4px' }} />
              </div>
            )}
            <div>
              <h2 className="text-xl font-bold text-gray-900 capitalize">{displayName}</h2>
              <p className="text-sm text-gray-500">
                {tests.length} test{tests.length > 1 ? 's' : ''}{partner ? ` • ${perimetres.length} périmètre${perimetres.length > 1 ? 's' : ''}` : ''}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors" aria-label="Fermer">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Stats bar */}
        <div className="flex items-center gap-4 px-6 py-3 bg-gray-50 border-b flex-shrink-0">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span className="text-sm font-semibold text-green-700">{successCount} réussis</span>
          </div>
          <div className="flex items-center gap-2">
            <XCircle className="w-4 h-4 text-red-600" />
            <span className="text-sm font-semibold text-red-700">{failureCount} échecs</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-sm text-gray-600">Taux de réussite:</span>
            <span className={`text-lg font-bold ${successRate >= 90 ? 'text-green-600' : successRate >= 60 ? 'text-orange-600' : 'text-red-600'}`}>
              {successRate}%
            </span>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 px-6 py-3 border-b flex-shrink-0">
          <div className="relative flex-1 max-w-xs">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un test..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1.5 text-sm rounded-md font-medium transition-colors ${filterStatus === 'all' ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              Tous
            </button>
            <button
              onClick={() => setFilterStatus('passed')}
              className={`px-3 py-1.5 text-sm rounded-md font-medium transition-colors ${filterStatus === 'passed' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              Réussis
            </button>
            <button
              onClick={() => setFilterStatus('failed')}
              className={`px-3 py-1.5 text-sm rounded-md font-medium transition-colors ${filterStatus === 'failed' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              Échecs
            </button>
          </div>
          <div className="ml-auto text-sm text-gray-500">
            {filteredTests.length} résultat{filteredTests.length > 1 ? 's' : ''}
          </div>
        </div>

        {/* Test list */}
        <div className="flex-1 overflow-y-auto p-6">
          {filteredTests.length === 0 ? (
            <div className="text-center py-12">
              <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">Aucun test trouvé</p>
            </div>
          ) : (
            <>
              {/* Selection controls */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <button
                    onClick={selectedTests.length === filteredTests.length ? deselectAll : selectAll}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    {selectedTests.length === filteredTests.length && filteredTests.length > 0
                      ? 'Tout désélectionner'
                      : 'Tout sélectionner'}
                  </button>
                  {selectedTests.length > 0 && (
                    <span className="text-sm text-gray-600">
                      {selectedTests.length} sélectionné{selectedTests.length > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>

              {/* Selected tests badges */}
              {selectedTests.length > 0 && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex flex-wrap gap-1.5">
                    {selectedTests.map(title => (
                      <span key={title} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        <span className="truncate max-w-[200px]">{title}</span>
                        <button onClick={() => toggleTest(title)} className="text-blue-600 hover:text-blue-800 font-bold">×</button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Test cards */}
              <div className="space-y-2">
                {filteredTests.map((test, idx) => {
                  const selected = selectedTests.includes(test.title);
                  return (
                    <div
                      key={idx}
                      onClick={() => toggleTest(test.title)}
                      className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                        selected
                          ? 'border-blue-500 bg-blue-50'
                          : test.passed
                          ? 'border-green-200 bg-green-50/50 hover:border-green-300'
                          : 'border-red-200 bg-red-50/50 hover:border-red-300'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                        selected ? 'bg-blue-500 border-blue-500' : 'border-gray-300'
                      }`}>
                        {selected && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                      </div>
                      {test.passed ? (
                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{test.title}</p>
                        <p className="text-xs text-gray-500">{test.perimetre}</p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${
                        test.passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {test.passed ? 'Réussi' : 'Échec'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Footer with trigger */}
        <div className="flex items-center justify-between p-6 border-t bg-gray-50 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <input
              id="partner-e-signature"
              type="checkbox"
              checked={eSignature}
              onChange={(e) => setESignature(e.target.checked)}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded"
            />
            <label htmlFor="partner-e-signature" className="text-sm text-gray-700">Signature électronique</label>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100 transition-colors"
              disabled={loading}
            >
              Fermer
            </button>
            <button
              onClick={handleTrigger}
              disabled={loading || selectedTests.length === 0}
              className="flex items-center space-x-2 px-5 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  <span>Lancement...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  <span>
                    {selectedTests.length === 0
                      ? 'Sélectionnez des tests'
                      : `Lancer ${selectedTests.length} test${selectedTests.length > 1 ? 's' : ''}`}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
