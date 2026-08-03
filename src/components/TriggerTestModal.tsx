import React, { useState, useMemo, useEffect } from 'react';
import { X, Play, GitBranch, ChevronLeft, ChevronRight, Link2, Copy, Check, Smartphone, QrCode } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { QRCodeSVG } from 'qrcode.react';
import { getPartnerLogo, mapPartnerIdToPartner, type Partner } from '../utils/partnerLogos';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

interface TriggerTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTrigger: (
    selectedTests: string[],
    variables: Record<string, string>,
    eSignature: boolean
  ) => void;
  loading?: boolean;
  xrayConfig?: any;
}

type TestItem = { id: string; name: string; testType: string; partner?: Partner };

export const TriggerTestModal: React.FC<TriggerTestModalProps> = ({
  isOpen,
  onClose,
  onTrigger,
  loading = false,
  xrayConfig,
}) => {
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [newVarKey, setNewVarKey] = useState('');
  const [newVarValue, setNewVarValue] = useState('');
  const [selectedTests, setSelectedTests] = useState<string[]>([]);
  const [eSignature, setESignature] = useState(false);
  const [executionMode, setExecutionMode] = useState<'auto' | 'manual'>('auto');
  const [generatedUrl, setGeneratedUrl] = useState('');
  const [urlCopied, setUrlCopied] = useState(false);
  const [generatingUrl, setGeneratingUrl] = useState(false);
  const [selectedManualTest, setSelectedManualTest] = useState('cra_darty');
  const [manualTestPresets, setManualTestPresets] = useState<Record<string, { name: string; [key: string]: string }>>({});
  const [loadingPresets, setLoadingPresets] = useState(true);
  const [partnerFilter, setPartnerFilter] = useState<string>('all');
  const [contractTypeFilter, setContractTypeFilter] = useState<string>('all');
  const [showQrCode, setShowQrCode] = useState(false);
  const [availableTests, setAvailableTests] = useState<TestItem[]>([]);
  const [loadingTests, setLoadingTests] = useState(true);
  const [showUrlConfigModal, setShowUrlConfigModal] = useState(false);

  const generateOrderId = () => {
    const randomDigits = Math.floor(10000000 + Math.random() * 90000000);
    return `TestAuto${randomDigits}`;
  };

  useEffect(() => {
    loadPresets();
    loadTestCatalog();
  }, []);

  const loadTestCatalog = async () => {
    try {
      const { data, error } = await supabase
        .from('automated_test_catalog')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('Supabase error loading test catalog:', error);
        throw error;
      }

      console.log('Loaded test catalog data:', data);

      const tests: TestItem[] = data?.map((test) => ({
        id: test.id,
        name: test.name,
        testType: test.test_type,
        partner: test.partner as Partner
      })) || [];

      console.log('Mapped tests:', tests);
      setAvailableTests(tests);
    } catch (error) {
      console.error('Error loading test catalog:', error);
      alert('Erreur lors du chargement du catalogue de tests. Vérifiez la console.');
    } finally {
      setLoadingTests(false);
    }
  };

  const loadPresets = async () => {
    try {
      const { data, error } = await supabase
        .from('test_presets')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;

      const presetsMap: Record<string, { name: string; [key: string]: string }> = {};
      data?.forEach((preset) => {
        presetsMap[preset.key] = {
          name: preset.name,
          partnerId: preset.partner_id,
          sourceId: preset.source_id,
          scaleId: preset.scale_id,
          amount: preset.amount,
          duration: preset.duration,
          firstName: preset.first_name,
          lastName: preset.last_name,
          birthDate: preset.birth_date,
          email: preset.email,
          mobile: preset.mobile,
          returnUrl: preset.return_url,
          exchangeUrl: preset.exchange_url,
          ...(preset.business_provider_id && { businessProviderId: preset.business_provider_id }),
          orderId: generateOrderId()
        };
      });

      setManualTestPresets(presetsMap);
      if (Object.keys(presetsMap).length > 0) {
        const firstKey = Object.keys(presetsMap)[0];
        setSelectedManualTest(firstKey);
        setApiParams(presetsMap[firstKey]);
      }
    } catch (error) {
      console.error('Error loading presets:', error);
    } finally {
      setLoadingPresets(false);
    }
  };

  const [apiParams, setApiParams] = useState<{ name: string; [key: string]: string }>({} as any);

  const TEST_TYPES = [...new Set(availableTests.map(test => test.testType))];
  const [activeTestTypes, setActiveTestTypes] = useState<string[]>([]);
  const toggleTestType = (type: string) =>
    setActiveTestTypes(prev => (prev.includes(type) ? prev.filter(x => x !== type) : [...prev, type]));

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12; // tests par page

  const filteredTests = useMemo(() => {
    const arr = activeTestTypes.length === 0 ? availableTests : availableTests.filter(t => activeTestTypes.includes(t.testType));
    const totalPages = Math.max(1, Math.ceil(arr.length / pageSize));
    if (currentPage > totalPages) setCurrentPage(1);
    return arr;
  }, [availableTests, activeTestTypes, currentPage, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filteredTests.length / pageSize));
  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);
  const paginatedTests = filteredTests.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const toggleTest = (id: string) =>
    setSelectedTests(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));

  const addVariable = () => {
    if (!newVarKey.trim() || !newVarValue.trim()) return;
    setVariables(prev => ({ ...prev, [newVarKey.trim()]: newVarValue.trim() }));
    setNewVarKey('');
    setNewVarValue('');
  };

  const removeVariable = (key: string) => {
    setVariables(prev => {
      const copy = { ...prev };
      delete copy[key];
      return copy;
    });
  };

  const generateTestUrl = async () => {
    setGeneratingUrl(true);
    setGeneratedUrl('');

    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-test-url`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify(apiParams),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Échec de génération de l\'URL');
      }

      const data = await response.json();

      if (data.success && data.url) {
        setGeneratedUrl(data.url);
      } else {
        throw new Error('URL non trouvée dans la réponse');
      }

    } catch (error) {
      console.error('Erreur lors de la génération de l\'URL:', error);
      alert(`Erreur lors de la génération de l'URL de test: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    } finally {
      setGeneratingUrl(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedUrl);
    setUrlCopied(true);
    setTimeout(() => setUrlCopied(false), 2000);
  };

  const openInMobileSimulator = () => {
    const width = 375;
    const height = 812;
    const left = (window.screen.width - width) / 2;
    const top = (window.screen.height - height) / 2;
    window.open(
      generatedUrl,
      'MobileSimulator',
      `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
    );
  };

  const handleManualTestChange = (testKey: string) => {
    setSelectedManualTest(testKey);
    const preset = manualTestPresets[testKey];
    setApiParams({ ...preset, orderId: generateOrderId() });
    setGeneratedUrl('');
    setUrlCopied(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (executionMode === 'auto') {
      if (selectedTests.length === 0) {
        alert('Veuillez sélectionner au moins un test à exécuter.');
        return;
      }

      console.log('Submitting test trigger with:', {
        selectedTests,
        variables,
        eSignature
      });

      onTrigger(selectedTests, variables, eSignature);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl mx-4 max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <Play className="w-6 h-6 text-green-600" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Lancer un nouveau test</h2>
              <p className="text-sm text-gray-500">Sélectionnez les tests et options avant l'exécution</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors" aria-label="Close">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Mode selector */}
            <div className="flex items-center space-x-4 pb-4 border-b">
              <label className="text-sm font-medium text-gray-700">Mode d'exécution:</label>
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => setExecutionMode('auto')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    executionMode === 'auto'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Play className="w-4 h-4" />
                    <span>Automatique</span>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setExecutionMode('manual')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    executionMode === 'manual'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Link2 className="w-4 h-4" />
                    <span>Manuel (URL)</span>
                  </div>
                </button>
              </div>
            </div>

            {executionMode === 'auto' ? (
              <>
            {/* Test type filter + summary */}
            <div className="flex items-center justify-between space-x-4">
              <div className="flex items-center space-x-3">
                <label className="text-sm text-gray-700">Filtrer par type</label>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setActiveTestTypes([])}
                    className={`px-2 py-1 rounded-md text-sm ${activeTestTypes.length === 0 ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                  >
                    Tous
                  </button>
                  {TEST_TYPES.map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => toggleTestType(type)}
                      className={`px-2 py-1 rounded-md text-sm ${activeTestTypes.includes(type) ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
                <div className="text-sm text-gray-500">Résultats: {filteredTests.length}</div>
              </div>

              <div className="text-sm text-gray-600">Pages: {currentPage}/{totalPages}</div>
            </div>

            {/* Tests grid */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sélectionnez les tests à exécuter</label>

              {selectedTests.length > 0 && (
                <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-md">
                  <p className="text-sm text-green-800 font-medium">
                    {selectedTests.length} test{selectedTests.length > 1 ? 's' : ''} sélectionné{selectedTests.length > 1 ? 's' : ''}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {selectedTests.map(testId => {
                      const test = availableTests.find(t => t.id === testId);
                      if (!test) return null;
                      const partnerLogo = test.partner ? getPartnerLogo(test.partner) : null;
                      return (
                        <span key={testId} className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {partnerLogo && (
                            <img
                              src={partnerLogo.src}
                              alt={partnerLogo.alt}
                              className="w-4 h-4 object-contain rounded"
                            />
                          )}
                          <span>{test.name}</span>
                          <button
                            type="button"
                            onClick={() => toggleTest(testId)}
                            className="ml-0.5 text-green-600 hover:text-green-800 font-bold"
                          >
                            ×
                          </button>
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {paginatedTests.map(test => {
                  const selected = selectedTests.includes(test.id);
                  const typeClass =
                    test.testType === 'Manual'
                      ? 'bg-blue-100 text-blue-800'
                      : test.testType === 'Cucumber'
                      ? 'bg-yellow-100 text-yellow-800'
                      : test.testType === 'Generic'
                      ? 'bg-purple-100 text-purple-800'
                      : 'bg-gray-100 text-gray-800';
                  const partnerLogo = test.partner ? getPartnerLogo(test.partner) : null;
                  return (
                    <button
                      key={test.id}
                      type="button"
                      onClick={() => toggleTest(test.id)}
                      className={`text-left p-4 border rounded-lg transition-all hover:shadow-md focus:outline-none ${selected ? 'border-green-500 bg-green-50 ring-2 ring-green-200' : 'border-gray-200 bg-white'}`}
                    >
                      <div className="flex items-start gap-3">
                        {partnerLogo && (
                          <div className="flex-shrink-0">
                            <div className="w-12 h-12 rounded-lg overflow-hidden border border-gray-200 bg-white flex items-center justify-center p-1">
                              <img
                                src={partnerLogo.src}
                                alt={partnerLogo.alt}
                                className="w-full h-full object-contain"
                              />
                            </div>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <div className="text-sm font-semibold text-gray-800 line-clamp-2">{test.name}</div>
                              <div className="text-xs text-gray-500 mt-1">{test.id}</div>
                            </div>
                            <div className={`text-xs px-2 py-1 rounded-full font-semibold whitespace-nowrap ${typeClass}`}>{test.testType}</div>
                          </div>
                          <div className="mt-2 text-xs text-gray-500">
                            {selected ? '✓ Sélectionné' : 'Cliquer pour sélectionner'}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Pagination controls (centered) */}
              <div className="flex flex-col items-center mt-4">
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-2 py-1 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Previous page"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <div className="flex items-center space-x-2">
                    {pageNumbers.map(num => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setCurrentPage(num)}
                        className={`px-3 py-1 rounded-md ${num === currentPage ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-2 py-1 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Next page"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="text-sm text-gray-500 mt-2">
                  {filteredTests.length} tests — affichage {filteredTests.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, filteredTests.length)}
                </div>
              </div>
            </div>

            {/* E-signature */}
            <div className="flex items-center space-x-3">
              <input id="e-signature" type="checkbox" checked={eSignature} onChange={(e) => setESignature(e.target.checked)} className="h-4 w-4 text-green-600 border-gray-300 rounded" />
              <label htmlFor="e-signature" className="text-sm text-gray-700">Signature électronique</label>
            </div>

            {/* Variables */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Variables (optionnel)</label>

              {Object.entries(variables).map(([key, value]) => (
                <div key={key} className="flex items-center space-x-2 mb-2">
                  <input type="text" value={key} readOnly className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50" />
                  <input type="text" value={value} readOnly className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50" />
                  <button type="button" onClick={() => removeVariable(key)} className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-md transition-colors">×</button>
                </div>
              ))}

              <div className="flex items-center space-x-2">
                <input type="text" value={newVarKey} onChange={(e) => setNewVarKey(e.target.value)} placeholder="Nom de la variable" className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent" />
                <input type="text" value={newVarValue} onChange={(e) => setNewVarValue(e.target.value)} placeholder="Valeur" className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent" />
                <button type="button" onClick={addVariable} className="px-3 py-2 bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200 transition-colors" disabled={!newVarKey.trim() || !newVarValue.trim()}>+</button>
              </div>
            </div>

            <div className="flex space-x-3 pt-2">
              <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors" disabled={loading}>Annuler</button>
              <button
                type="submit"
                disabled={loading || selectedTests.length === 0}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <GitBranch className="w-4 h-4" />
                <span>
                  {loading ? 'Lancement...' : selectedTests.length === 0 ? 'Sélectionnez des tests' : `Lancer ${selectedTests.length} test${selectedTests.length > 1 ? 's' : ''}`}
                </span>
              </button>
            </div>
            </>
            ) : (
              <>
                {/* Manual mode - Test selection */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Sélectionnez un test manuel</label>

                    {/* Filters */}
                    <div className="flex gap-4 mb-4">
                      <div className="flex-1">
                        <label className="block text-xs font-medium text-gray-600 mb-1">Partenaire</label>
                        <select
                          value={partnerFilter}
                          onChange={(e) => setPartnerFilter(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="all">Tous les partenaires</option>
                          {Array.from(new Set(Object.values(manualTestPresets).map(p => p.partnerId))).map(partner => (
                            <option key={partner} value={partner}>{partner.replace('web_', '').toUpperCase()}</option>
                          ))}
                        </select>
                      </div>

                      <div className="flex-1">
                        <label className="block text-xs font-medium text-gray-600 mb-1">Type de contrat</label>
                        <select
                          value={contractTypeFilter}
                          onChange={(e) => setContractTypeFilter(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="all">Tous les types</option>
                          {Array.from(new Set(Object.values(manualTestPresets).map(p => p.sourceId))).map(type => (
                            <option key={type} value={type}>{type.toUpperCase()}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {Object.entries(manualTestPresets)
                        .filter(([_, preset]) => {
                          const matchesPartner = partnerFilter === 'all' || preset.partnerId === partnerFilter;
                          const matchesContractType = contractTypeFilter === 'all' || preset.sourceId === contractTypeFilter;
                          return matchesPartner && matchesContractType;
                        })
                        .map(([key, preset]) => {
                        const partner = mapPartnerIdToPartner(preset.partnerId);
                        const partnerLogo = partner ? getPartnerLogo(partner) : null;

                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => handleManualTestChange(key)}
                            className={`text-left p-4 border-2 rounded-lg transition-all hover:shadow-md focus:outline-none ${
                              selectedManualTest === key
                                ? 'border-blue-500 bg-blue-50 shadow-md ring-2 ring-blue-200'
                                : 'border-gray-200 bg-white hover:border-blue-300'
                            }`}
                          >
                            <div className="flex items-start gap-3 mb-3">
                              {partnerLogo ? (
                                <div className="flex-shrink-0">
                                  <div className="w-12 h-12 rounded-lg overflow-hidden border border-gray-200 bg-white flex items-center justify-center p-1">
                                    <img
                                      src={partnerLogo.src}
                                      alt={partnerLogo.alt}
                                      className="w-full h-full object-contain"
                                    />
                                  </div>
                                </div>
                              ) : (
                                <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                                  <span className="text-gray-400 text-xs font-semibold">
                                    {preset.partnerId.replace('web_', '').substring(0, 2).toUpperCase()}
                                  </span>
                                </div>
                              )}
                              {selectedManualTest === key && (
                                <div className="ml-auto">
                                  <Check className="w-5 h-5 text-blue-600 flex-shrink-0" />
                                </div>
                              )}
                            </div>
                            <div className="text-sm font-semibold text-gray-800 mb-1">{preset.name}</div>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <span className="px-2 py-0.5 bg-gray-100 rounded">{preset.partnerId.replace('web_', '').toUpperCase()}</span>
                              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded">{preset.sourceId}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t">
                    <h3 className="text-md font-semibold text-gray-800">Paramètres de génération d'URL</h3>
                    <button
                      type="button"
                      onClick={() => setShowUrlConfigModal(true)}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-sm font-medium"
                    >
                      Configurer les paramètres
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={generateTestUrl}
                    disabled={generatingUrl}
                    className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    <Link2 className="w-5 h-5" />
                    <span>{generatingUrl ? 'Génération en cours...' : 'Générer l\'URL de test'}</span>
                  </button>

                  {generatedUrl && (
                    <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                      <label className="block text-sm font-medium text-green-800 mb-2">URL générée:</label>
                      <div className="flex items-center space-x-2 mb-3">
                        <input
                          type="text"
                          value={generatedUrl}
                          readOnly
                          className="flex-1 px-3 py-2 border border-green-300 rounded-md bg-white text-sm"
                        />
                        <button
                          type="button"
                          onClick={copyToClipboard}
                          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center space-x-2"
                        >
                          {urlCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                          <span>{urlCopied ? 'Copié' : 'Copier'}</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <button
                          type="button"
                          onClick={openInMobileSimulator}
                          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                        >
                          <Smartphone className="w-4 h-4" />
                          <span>Ouvrir en mode mobile</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowQrCode(true)}
                          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
                        >
                          <QrCode className="w-4 h-4" />
                          <span>Afficher QR Code</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex space-x-3 pt-2">
                  <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors">Fermer</button>
                </div>
              </>
            )}
          </form>
        </div>
      </div>

      {showQrCode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]" onClick={() => setShowQrCode(false)}>
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">QR Code</h3>
              <button
                onClick={() => setShowQrCode(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex flex-col items-center justify-center">
              <p className="text-sm text-gray-600 mb-4 text-center">Scannez ce QR code avec votre mobile</p>
              <div className="bg-white p-4 rounded-lg border-2 border-gray-200">
                <QRCodeSVG
                  value={generatedUrl}
                  size={220}
                  level="H"
                  includeMargin={true}
                />
              </div>
              <p className="text-xs text-gray-500 mt-4 text-center">Le QR code redirige vers l'URL de test générée</p>
            </div>
          </div>
        </div>
      )}

      {showUrlConfigModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]" onClick={() => setShowUrlConfigModal(false)}>
          <div className="bg-white rounded-xl p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Configuration des paramètres d'URL</h3>
              <button
                onClick={() => setShowUrlConfigModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Partner ID</label>
                <input
                  type="text"
                  value={apiParams.partnerId}
                  onChange={(e) => setApiParams({ ...apiParams, partnerId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Source ID</label>
                <input
                  type="text"
                  value={apiParams.sourceId}
                  onChange={(e) => setApiParams({ ...apiParams, sourceId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Scale ID</label>
                <input
                  type="text"
                  value={apiParams.scaleId}
                  onChange={(e) => setApiParams({ ...apiParams, scaleId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Montant</label>
                <input
                  type="text"
                  value={apiParams.amount}
                  onChange={(e) => setApiParams({ ...apiParams, amount: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Durée (mois)</label>
                <input
                  type="text"
                  value={apiParams.duration}
                  onChange={(e) => setApiParams({ ...apiParams, duration: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prénom</label>
                <input
                  type="text"
                  value={apiParams.firstName}
                  onChange={(e) => setApiParams({ ...apiParams, firstName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                <input
                  type="text"
                  value={apiParams.lastName}
                  onChange={(e) => setApiParams({ ...apiParams, lastName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date de naissance</label>
                <input
                  type="date"
                  value={apiParams.birthDate}
                  onChange={(e) => setApiParams({ ...apiParams, birthDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={apiParams.email}
                  onChange={(e) => setApiParams({ ...apiParams, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mobile</label>
                <input
                  type="tel"
                  value={apiParams.mobile}
                  onChange={(e) => setApiParams({ ...apiParams, mobile: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Order ID</label>
                <input
                  type="text"
                  value={apiParams.orderId}
                  onChange={(e) => setApiParams({ ...apiParams, orderId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
              <button
                type="button"
                onClick={() => setShowUrlConfigModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => setShowUrlConfigModal(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};