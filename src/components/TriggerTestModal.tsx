import React, { useState, useMemo, useEffect } from 'react';
import { X, Play, GitBranch, ChevronLeft, ChevronRight, Link2, Copy, Check, Smartphone, QrCode, Tag, Plus, ChevronDown, ChevronUp, Settings, Sparkles, Zap, FileText, Loader2 } from 'lucide-react';
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

type TestItem = { id: string; name: string; testType: string; partner?: Partner; tags: string[]; isAutomated: boolean };

interface TagGroup {
  id: string;
  name: string;
  description: string;
  tags: string[];
  color: string;
  sort_order: number;
}

const TAG_COLOR_MAP: Record<string, { bg: string; border: string; text: string; badge: string; dot: string }> = {
  red: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', badge: 'bg-red-100 text-red-700', dot: 'bg-red-500' },
  green: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', badge: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
  blue: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', badge: 'bg-blue-100 text-blue-700', dot: 'bg-blue-500' },
  orange: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', badge: 'bg-orange-100 text-orange-700', dot: 'bg-orange-500' },
  purple: { bg: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-700', badge: 'bg-violet-100 text-violet-700', dot: 'bg-violet-500' },
  teal: { bg: 'bg-teal-50', border: 'border-teal-200', text: 'text-teal-700', badge: 'bg-teal-100 text-teal-700', dot: 'bg-teal-500' },
  yellow: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', badge: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' },
  gray: { bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-700', badge: 'bg-slate-100 text-slate-700', dot: 'bg-slate-500' },
};

const TYPE_BADGE: Record<string, string> = {
  Manual: 'bg-blue-100 text-blue-700',
  Cucumber: 'bg-amber-100 text-amber-700',
  Generic: 'bg-violet-100 text-violet-700',
};

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
  const [executionMode, setExecutionMode] = useState<'auto' | 'tags' | 'manual'>('auto');
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

  // Tags mode state
  const [tagGroups, setTagGroups] = useState<TagGroup[]>([]);
  const [loadingTagGroups, setLoadingTagGroups] = useState(true);
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [customTagInput, setCustomTagInput] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const generateOrderId = () => {
    const randomDigits = Math.floor(10000000 + Math.random() * 90000000);
    return `TestAuto${randomDigits}`;
  };

  useEffect(() => {
    loadPresets();
    loadTestCatalog();
    loadTagGroups();
  }, []);

  const loadTestCatalog = async () => {
    try {
      const { data, error } = await supabase
        .from('automated_test_catalog')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) throw error;

      const tests: TestItem[] = data?.map((test) => ({
        id: test.id,
        name: test.name,
        testType: test.test_type,
        partner: test.partner as Partner,
        tags: test.tags || [],
        isAutomated: test.is_automated ?? false,
      })) || [];

      setAvailableTests(tests);
    } catch (error) {
      console.error('Error loading test catalog:', error);
    } finally {
      setLoadingTests(false);
    }
  };

  const loadTagGroups = async () => {
    try {
      const { data, error } = await supabase
        .from('tag_groups')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      if (error) throw error;
      setTagGroups(data || []);
    } catch (err) {
      console.error('Error loading tag groups:', err);
    } finally {
      setLoadingTagGroups(false);
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

  // Auto mode
  const TEST_TYPES = [...new Set(availableTests.map(test => test.testType))];
  const [activeTestTypes, setActiveTestTypes] = useState<string[]>([]);
  const toggleTestType = (type: string) =>
    setActiveTestTypes(prev => (prev.includes(type) ? prev.filter(x => x !== type) : [...prev, type]));

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  const filteredTests = useMemo(() => {
    const arr = activeTestTypes.length === 0 ? availableTests : availableTests.filter(t => activeTestTypes.includes(t.testType));
    const totalPages = Math.max(1, Math.ceil(arr.length / pageSize));
    if (currentPage > totalPages) setCurrentPage(1);
    return arr;
  }, [availableTests, activeTestTypes, currentPage, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filteredTests.length / pageSize));
  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);
  const paginatedTests = filteredTests.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const toggleTest = (id: string) => {
    const test = availableTests.find(t => t.id === id);
    if (test && !test.isAutomated) return;
    setSelectedTests(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
  };

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

  // Tags mode helpers
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    availableTests.forEach(t => (t.tags || []).forEach(tag => tagSet.add(tag)));
    return Array.from(tagSet).sort();
  }, [availableTests]);

  const matchingTests = useMemo(() => {
    if (activeTags.length === 0) return [];
    return availableTests.filter(test =>
      activeTags.some(tag => (test.tags || []).includes(tag))
    );
  }, [availableTests, activeTags]);

  const toggleTag = (tag: string) =>
    setActiveTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);

  const addCustomTag = () => {
    const t = customTagInput.trim();
    if (!t || activeTags.includes(t)) return;
    setActiveTags(prev => [...prev, t]);
    setCustomTagInput('');
  };

  const applyTagGroup = (group: TagGroup) => {
    const newTags = group.tags.filter(t => !activeTags.includes(t));
    setActiveTags(prev => [...prev, ...newTags]);
  };

  const toggleGroupExpand = (id: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // Generate URL (manual mode)
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

    if (executionMode === 'auto' || executionMode === 'tags') {
      if (selectedTests.length === 0) return;
      onTrigger(selectedTests, variables, eSignature);
    }
  };

  if (!isOpen) return null;

  const MODE_TABS = [
    { id: 'auto' as const, label: 'Automatique', icon: Zap, desc: 'Lancer des tests automatisés' },
    { id: 'tags' as const, label: 'Par tag', icon: Tag, desc: 'Filtrer et sélectionner par tags' },
    { id: 'manual' as const, label: 'Manuel (URL)', icon: Link2, desc: 'Générer une URL de test' },
  ];

  const renderSelectedChips = () => {
    if (selectedTests.length === 0) return null;
    return (
      <div className="flex flex-wrap gap-2 mt-3">
        {selectedTests.map(testId => {
          const test = availableTests.find(t => t.id === testId);
          if (!test) return null;
          const partnerLogo = test.partner ? getPartnerLogo(test.partner) : null;
          return (
            <span key={testId} className="inline-flex items-center gap-1.5 pl-1.5 pr-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
              {partnerLogo && (
                <img src={partnerLogo.src} alt={partnerLogo.alt} className="w-4 h-4 object-contain rounded" />
              )}
              <span>{test.name}</span>
              <button type="button" onClick={() => toggleTest(testId)} className="text-emerald-600 hover:text-emerald-800 font-bold leading-none">×</button>
            </span>
          );
        })}
      </div>
    );
  };

  const renderVariables = (accent: 'emerald' | 'blue') => {
    const ring = accent === 'emerald' ? 'focus:ring-emerald-500' : 'focus:ring-blue-500';
    return (
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">Variables (optionnel)</label>
        {Object.entries(variables).map(([key, value]) => (
          <div key={key} className="flex items-center space-x-2 mb-2">
            <input type="text" value={key} readOnly className="flex-1 px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-sm font-mono" />
            <input type="text" value={value} readOnly className="flex-1 px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-sm font-mono" />
            <button type="button" onClick={() => removeVariable(key)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
        <div className="flex items-center space-x-2">
          <input type="text" value={newVarKey} onChange={(e) => setNewVarKey(e.target.value)} placeholder="Nom" className={`flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 ${ring} focus:border-transparent`} />
          <input type="text" value={newVarValue} onChange={(e) => setNewVarValue(e.target.value)} placeholder="Valeur" className={`flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 ${ring} focus:border-transparent`} />
          <button type="button" onClick={addVariable} disabled={!newVarKey.trim() || !newVarValue.trim()} className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-40">
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  };

  const renderActionButtons = (accent: 'emerald' | 'blue', label: string) => {
    const primary = accent === 'emerald' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-blue-600 hover:bg-blue-700';
    return (
      <div className="flex space-x-3 pt-2">
        <button type="button" onClick={onClose} disabled={loading} className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors font-medium disabled:opacity-50">
          Annuler
        </button>
        <button
          type="submit"
          disabled={loading || selectedTests.length === 0}
          className={`flex-1 px-4 py-2.5 ${primary} text-white rounded-xl transition-colors flex items-center justify-center space-x-2 font-semibold disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
          <span>{label}</span>
        </button>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col animate-[fadeIn_0.2s_ease-out]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-sm">
              <Play className="w-5 h-5 text-white" fill="white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Lancer un nouveau test</h2>
              <p className="text-sm text-slate-500">Sélectionnez les tests et options avant l'exécution</p>
            </div>
          </div>
          <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode tabs */}
        <div className="px-6 pt-4 pb-2 border-b border-slate-100">
          <div className="flex gap-2">
            {MODE_TABS.map(tab => {
              const active = executionMode === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => { setExecutionMode(tab.id); setSelectedTests([]); setActiveTags([]); }}
                  className={`flex-1 flex items-center gap-3 px-4 py-3 rounded-xl transition-all border ${
                    active
                      ? 'bg-white border-slate-300 shadow-sm'
                      : 'bg-slate-50 border-transparent hover:bg-slate-100'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${active ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-500'}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <div className={`text-sm font-semibold ${active ? 'text-slate-900' : 'text-slate-500'}`}>{tab.label}</div>
                    <div className={`text-xs ${active ? 'text-slate-400' : 'text-slate-400'}`}>{tab.desc}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="overflow-y-auto flex-1">
          <form onSubmit={handleSubmit} className="p-6 space-y-5">

            {/* ── AUTO MODE ── */}
            {executionMode === 'auto' && (
              <>
                {/* Filter bar */}
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Type</span>
                    <button
                      type="button"
                      onClick={() => setActiveTestTypes([])}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${activeTestTypes.length === 0 ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                    >
                      Tous
                    </button>
                    {TEST_TYPES.map(type => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => toggleTestType(type)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${activeTestTypes.includes(type) ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                  <div className="text-sm text-slate-500 font-medium">
                    {filteredTests.length} test{filteredTests.length > 1 ? 's' : ''}
                  </div>
                </div>

                {/* Selection summary */}
                {selectedTests.length > 0 && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600" />
                      <p className="text-sm font-semibold text-emerald-800">
                        {selectedTests.length} test{selectedTests.length > 1 ? 's' : ''} sélectionné{selectedTests.length > 1 ? 's' : ''}
                      </p>
                    </div>
                    {renderSelectedChips()}
                  </div>
                )}

                {/* Tests grid */}
                <div>
                  {loadingTests ? (
                    <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                      <Loader2 className="w-8 h-8 animate-spin mb-3" />
                      <p className="text-sm">Chargement du catalogue…</p>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {paginatedTests.map(test => {
                          const selected = selectedTests.includes(test.id);
                          const disabled = !test.isAutomated;
                          const typeClass = TYPE_BADGE[test.testType] || 'bg-slate-100 text-slate-600';
                          const partnerLogo = test.partner ? getPartnerLogo(test.partner) : null;
                          return (
                            <button
                              key={test.id}
                              type="button"
                              disabled={disabled}
                              onClick={() => toggleTest(test.id)}
                              className={`group text-left p-4 border rounded-xl transition-all focus:outline-none ${
                                disabled
                                  ? 'border-slate-100 bg-slate-50/50 opacity-60 cursor-not-allowed'
                                  : selected
                                  ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-200 shadow-sm'
                                  : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-md'
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                {partnerLogo ? (
                                  <div className="flex-shrink-0 w-11 h-11 rounded-lg overflow-hidden border border-slate-100 bg-white flex items-center justify-center p-1">
                                    <img src={partnerLogo.src} alt={partnerLogo.alt} className="w-full h-full object-contain" />
                                  </div>
                                ) : (
                                  <div className="flex-shrink-0 w-11 h-11 rounded-lg bg-slate-100 flex items-center justify-center">
                                    <FileText className="w-5 h-5 text-slate-300" />
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="text-sm font-semibold text-slate-800 line-clamp-2 leading-snug">{test.name}</div>
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold whitespace-nowrap ${typeClass}`}>{test.testType}</span>
                                  </div>
                                  <div className="text-xs text-slate-400 mt-1 font-mono">{test.id}</div>
                                  <div className="mt-2 text-xs font-medium">
                                    {disabled ? (
                                      <span className="text-slate-400">Non automatisé</span>
                                    ) : selected ? (
                                      <span className="text-emerald-600 flex items-center gap-1"><Check className="w-3 h-3" /> Sélectionné</span>
                                    ) : (
                                      <span className="text-slate-400 group-hover:text-slate-600 transition-colors">Cliquer pour sélectionner</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      {/* Pagination */}
                      {totalPages > 1 && (
                        <div className="flex flex-col items-center mt-5">
                          <div className="flex items-center gap-1.5">
                            <button type="button" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors" aria-label="Previous page">
                              <ChevronLeft className="w-4 h-4" />
                            </button>
                            {pageNumbers.map(num => (
                              <button key={num} type="button" onClick={() => setCurrentPage(num)} className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${num === currentPage ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>
                                {num}
                              </button>
                            ))}
                            <button type="button" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors" aria-label="Next page">
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="text-xs text-slate-400 mt-2">
                            Page {currentPage} sur {totalPages}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* E-signature */}
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative">
                    <input type="checkbox" checked={eSignature} onChange={(e) => setESignature(e.target.checked)} className="sr-only peer" />
                    <div className="w-10 h-6 bg-slate-200 rounded-full peer-checked:bg-emerald-500 transition-colors" />
                    <div className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform peer-checked:translate-x-4" />
                  </div>
                  <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900 transition-colors">Signature électronique</span>
                </label>

                {renderVariables('emerald')}
                {renderActionButtons('emerald', loading ? 'Lancement…' : selectedTests.length === 0 ? 'Sélectionnez des tests' : `Lancer ${selectedTests.length} test${selectedTests.length > 1 ? 's' : ''}`)}
              </>
            )}

            {/* ── TAGS MODE ── */}
            {executionMode === 'tags' && (
              <div className="space-y-5">
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
                  {/* Left: tag selection (2/5) */}
                  <div className="lg:col-span-2 space-y-4">
                    {/* Tag groups */}
                    {!loadingTagGroups && tagGroups.length > 0 && (
                      <div className="border border-slate-200 rounded-xl overflow-hidden">
                        <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-100">
                          <p className="text-sm font-semibold text-slate-700">Groupes suggérés</p>
                          <p className="text-xs text-slate-400">Cliquez pour appliquer les tags du groupe</p>
                        </div>
                        <div className="divide-y divide-slate-50 max-h-48 overflow-y-auto">
                          {tagGroups.map(group => {
                            const colors = TAG_COLOR_MAP[group.color] || TAG_COLOR_MAP.gray;
                            const isExpanded = expandedGroups.has(group.id);
                            const allApplied = group.tags.every(t => activeTags.includes(t));
                            const groupTests = availableTests.filter(t =>
                              group.tags.some(tag => (t.tags || []).includes(tag))
                            );
                            return (
                              <div key={group.id} className={`px-4 py-2.5 ${colors.bg}`}>
                                <div className="flex items-center gap-2">
                                  <div className={`w-2 h-2 rounded-full ${colors.dot} flex-shrink-0`} />
                                  <div className="flex-1 min-w-0">
                                    <div className={`text-sm font-semibold ${colors.text}`}>{group.name}</div>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                      {group.tags.map(tag => (
                                        <span key={tag} className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${colors.badge}`}>{tag}</span>
                                      ))}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1 flex-shrink-0">
                                    <button type="button" onClick={() => toggleGroupExpand(group.id)} className="text-xs text-slate-400 hover:text-slate-600 px-1.5 py-1 rounded flex items-center gap-0.5 transition-colors">
                                      {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                      <span>{groupTests.length}</span>
                                    </button>
                                    <button type="button" onClick={() => applyTagGroup(group)} disabled={allApplied} className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-all ${allApplied ? 'bg-slate-100 text-slate-300 cursor-not-allowed' : `${colors.badge} hover:opacity-80`}`}>
                                      {allApplied ? <Check className="w-3 h-3" /> : 'Appliquer'}
                                    </button>
                                  </div>
                                </div>
                                {isExpanded && groupTests.length > 0 && (
                                  <div className="mt-2 space-y-1 pl-4">
                                    {groupTests.map(t => (
                                      <div key={t.id} className="text-xs text-slate-400 flex items-center gap-1.5">
                                        <span className="w-1 h-1 rounded-full bg-slate-300 flex-shrink-0" />
                                        <span className="truncate">{t.name}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* All tags */}
                    <div className="border border-slate-200 rounded-xl p-4">
                      <p className="text-sm font-semibold text-slate-700 mb-2">Tags disponibles</p>
                      {allTags.length === 0 ? (
                        <p className="text-xs text-slate-400">Aucun tag défini. Ajoutez des tags aux tests dans la Configuration.</p>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {allTags.map(tag => (
                            <button
                              key={tag}
                              type="button"
                              onClick={() => toggleTag(tag)}
                              className={`text-sm px-3 py-1 rounded-full font-medium border transition-all ${
                                activeTags.includes(tag)
                                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                  : 'bg-white text-slate-600 border-slate-200 hover:border-blue-400 hover:text-blue-600'
                              }`}
                            >
                              {tag}
                            </button>
                          ))}
                        </div>
                      )}
                      <div className="mt-3 pt-3 border-t border-slate-100 flex gap-2">
                        <input
                          type="text"
                          value={customTagInput}
                          onChange={e => setCustomTagInput(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCustomTag())}
                          placeholder="Tag personnalisé…"
                          className="flex-1 text-sm px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button type="button" onClick={addCustomTag} disabled={!customTagInput.trim()} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40 transition-colors">
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Active tags */}
                    {activeTags.length > 0 && (
                      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold text-blue-800">Tags actifs</span>
                          <button type="button" onClick={() => setActiveTags([])} className="text-xs text-blue-600 hover:text-blue-800 font-medium">
                            Effacer
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {activeTags.map(tag => (
                            <span key={tag} className="inline-flex items-center gap-1 text-xs px-2.5 py-1 bg-blue-600 text-white rounded-full font-medium">
                              {tag}
                              <button type="button" onClick={() => toggleTag(tag)} className="hover:opacity-75">
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right: matching tests (3/5) */}
                  <div className="lg:col-span-3">
                    {activeTags.length === 0 ? (
                      <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-slate-200 rounded-xl">
                        <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
                          <Tag className="w-7 h-7 text-slate-300" />
                        </div>
                        <p className="text-sm font-medium text-slate-500">Sélectionnez des tags</p>
                        <p className="text-xs text-slate-400 mt-1">Les tests correspondants apparaîtront ici</p>
                      </div>
                    ) : (
                      <div className="border border-slate-200 rounded-xl overflow-hidden">
                        <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                          <div>
                            <p className="text-sm font-semibold text-slate-700">Tests correspondants</p>
                            <p className="text-xs text-slate-400">{matchingTests.length} résultat{matchingTests.length > 1 ? 's' : ''}</p>
                          </div>
                          <div className="flex gap-2">
                            <button type="button" onClick={() => setSelectedTests(matchingTests.filter(t => t.isAutomated).map(t => t.id))} className="text-xs px-2.5 py-1.5 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 font-medium transition-colors">
                              Tout sélectionner
                            </button>
                            {selectedTests.length > 0 && (
                              <button type="button" onClick={() => setSelectedTests([])} className="text-xs px-2.5 py-1.5 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors">
                                Désélectionner
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="max-h-[400px] overflow-y-auto divide-y divide-slate-50">
                          {matchingTests.length === 0 ? (
                            <div className="p-8 text-center text-sm text-slate-400">
                              Aucun test ne correspond aux tags sélectionnés.
                            </div>
                          ) : matchingTests.map(test => {
                            const selected = selectedTests.includes(test.id);
                            const disabled = !test.isAutomated;
                            const logo = test.partner ? getPartnerLogo(test.partner) : null;
                            const matchedTags = (test.tags || []).filter(t => activeTags.includes(t));
                            return (
                              <button
                                key={test.id}
                                type="button"
                                disabled={disabled}
                                onClick={() => toggleTest(test.id)}
                                className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-colors ${disabled ? 'opacity-50 cursor-not-allowed' : selected ? 'bg-emerald-50' : 'hover:bg-slate-50'}`}
                              >
                                <div className={`w-5 h-5 rounded-md border-2 flex-shrink-0 flex items-center justify-center transition-colors ${selected ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300'}`}>
                                  {selected && <Check className="w-3 h-3 text-white" />}
                                </div>
                                {logo ? (
                                  <div className="w-8 h-8 rounded-lg border border-slate-100 bg-white flex items-center justify-center p-0.5 flex-shrink-0">
                                    <img src={logo.src} alt={logo.alt} className="w-full h-full object-contain" />
                                  </div>
                                ) : (
                                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                                    <FileText className="w-4 h-4 text-slate-300" />
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-medium text-slate-900 truncate">{test.name}</div>
                                  <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                    <span className="text-xs text-slate-400 font-mono">{test.id}</span>
                                    {matchedTags.map(tag => (
                                      <span key={tag} className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded-full font-medium">{tag}</span>
                                    ))}
                                    {disabled && <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-400 rounded-full font-medium">Non automatisé</span>}
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Selected summary */}
                {selectedTests.length > 0 && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600" />
                      <p className="text-sm font-semibold text-emerald-800">
                        {selectedTests.length} test{selectedTests.length > 1 ? 's' : ''} sélectionné{selectedTests.length > 1 ? 's' : ''}
                      </p>
                    </div>
                    {renderSelectedChips()}
                  </div>
                )}

                {/* E-signature toggle */}
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative">
                    <input type="checkbox" checked={eSignature} onChange={e => setESignature(e.target.checked)} className="sr-only peer" />
                    <div className="w-10 h-6 bg-slate-200 rounded-full peer-checked:bg-blue-500 transition-colors" />
                    <div className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform peer-checked:translate-x-4" />
                  </div>
                  <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900 transition-colors">Signature électronique</span>
                </label>

                {renderVariables('blue')}
                {renderActionButtons('blue', loading ? 'Lancement…' : selectedTests.length === 0 ? 'Sélectionnez des tests' : `Lancer ${selectedTests.length} test${selectedTests.length > 1 ? 's' : ''}`)}
              </div>
            )}

            {/* ── MANUAL MODE ── */}
            {executionMode === 'manual' && (
              <div className="space-y-5">
                {/* Test selection */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-3">Sélectionnez un test manuel</label>

                  {/* Filters */}
                  <div className="flex gap-4 mb-4">
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-slate-500 mb-1">Partenaire</label>
                      <select
                        value={partnerFilter}
                        onChange={(e) => setPartnerFilter(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      >
                        <option value="all">Tous les partenaires</option>
                        {Array.from(new Set(Object.values(manualTestPresets).map(p => p.partnerId))).map(partner => (
                          <option key={partner} value={partner}>{partner.replace('web_', '').toUpperCase()}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-slate-500 mb-1">Type de contrat</label>
                      <select
                        value={contractTypeFilter}
                        onChange={(e) => setContractTypeFilter(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
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
                        const isSelected = selectedManualTest === key;
                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => handleManualTestChange(key)}
                            className={`text-left p-4 border rounded-xl transition-all focus:outline-none ${
                              isSelected
                                ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200 shadow-sm'
                                : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-md'
                            }`}
                          >
                            <div className="flex items-start justify-between mb-3">
                              {partnerLogo ? (
                                <div className="w-11 h-11 rounded-lg overflow-hidden border border-slate-100 bg-white flex items-center justify-center p-1">
                                  <img src={partnerLogo.src} alt={partnerLogo.alt} className="w-full h-full object-contain" />
                                </div>
                              ) : (
                                <div className="w-11 h-11 rounded-lg bg-slate-100 flex items-center justify-center">
                                  <span className="text-slate-400 text-xs font-bold">
                                    {preset.partnerId.replace('web_', '').substring(0, 2).toUpperCase()}
                                  </span>
                                </div>
                              )}
                              {isSelected && (
                                <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                                  <Check className="w-3 h-3 text-white" />
                                </div>
                              )}
                            </div>
                            <div className="text-sm font-semibold text-slate-800 mb-1.5">{preset.name}</div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-600 rounded font-medium">{preset.partnerId.replace('web_', '').toUpperCase()}</span>
                              <span className="text-[10px] px-2 py-0.5 bg-blue-100 text-blue-700 rounded font-medium">{preset.sourceId}</span>
                            </div>
                          </button>
                        );
                      })}
                  </div>
                </div>

                {/* URL generation section */}
                <div className="border-t border-slate-100 pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-slate-700">Paramètres de génération d'URL</h3>
                    <button
                      type="button"
                      onClick={() => setShowUrlConfigModal(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors text-sm font-medium"
                    >
                      <Settings className="w-4 h-4" />
                      <span>Configurer</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={generateTestUrl}
                    disabled={generatingUrl}
                    className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-sm"
                  >
                    {generatingUrl ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                    <span>{generatingUrl ? 'Génération en cours…' : 'Générer l\'URL de test'}</span>
                  </button>

                  {generatedUrl && (
                    <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                      <div className="flex items-center gap-2 mb-3">
                        <Check className="w-4 h-4 text-emerald-600" />
                        <label className="text-sm font-semibold text-emerald-800">URL générée</label>
                      </div>
                      <div className="flex items-center space-x-2 mb-3">
                        <input
                          type="text"
                          value={generatedUrl}
                          readOnly
                          className="flex-1 px-3 py-2 border border-emerald-200 rounded-lg bg-white text-sm font-mono"
                        />
                        <button type="button" onClick={copyToClipboard} className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center space-x-2 text-sm font-medium">
                          {urlCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                          <span>{urlCopied ? 'Copié' : 'Copier'}</span>
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <button type="button" onClick={openInMobileSimulator} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2 text-sm font-medium">
                          <Smartphone className="w-4 h-4" />
                          <span>Mode mobile</span>
                        </button>
                        <button type="button" onClick={() => setShowQrCode(true)} className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition-colors flex items-center justify-center space-x-2 text-sm font-medium">
                          <QrCode className="w-4 h-4" />
                          <span>QR Code</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex space-x-3 pt-2">
                  <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors font-medium">
                    Fermer
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>

      {/* QR Code modal */}
      {showQrCode && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[60]" onClick={() => setShowQrCode(false)}>
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-900">QR Code</h3>
              <button onClick={() => setShowQrCode(false)} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex flex-col items-center justify-center">
              <p className="text-sm text-slate-500 mb-4 text-center">Scannez ce QR code avec votre mobile</p>
              <div className="bg-white p-4 rounded-xl border-2 border-slate-100">
                <QRCodeSVG value={generatedUrl} size={220} level="H" includeMargin={true} />
              </div>
              <p className="text-xs text-slate-400 mt-4 text-center">Le QR code redirige vers l'URL de test générée</p>
            </div>
          </div>
        </div>
      )}

      {/* URL Config modal */}
      {showUrlConfigModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[60]" onClick={() => setShowUrlConfigModal(false)}>
          <div className="bg-white rounded-2xl p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center">
                  <Settings className="w-5 h-5 text-slate-500" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Configuration des paramètres</h3>
              </div>
              <button onClick={() => setShowUrlConfigModal(false)} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Partner ID', key: 'partnerId' },
                { label: 'Source ID', key: 'sourceId' },
                { label: 'Scale ID', key: 'scaleId' },
                { label: 'Montant', key: 'amount' },
                { label: 'Durée (mois)', key: 'duration' },
                { label: 'Prénom', key: 'firstName' },
                { label: 'Nom', key: 'lastName' },
                { label: 'Date de naissance', key: 'birthDate', type: 'date' },
                { label: 'Email', key: 'email', type: 'email' },
                { label: 'Mobile', key: 'mobile', type: 'tel' },
                { label: 'Order ID', key: 'orderId' },
              ].map(field => (
                <div key={field.key}>
                  <label className="block text-sm font-medium text-slate-600 mb-1">{field.label}</label>
                  <input
                    type={field.type || 'text'}
                    value={apiParams[field.key] || ''}
                    onChange={(e) => setApiParams({ ...apiParams, [field.key]: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
              <button type="button" onClick={() => setShowUrlConfigModal(false)} className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors font-medium">
                Annuler
              </button>
              <button type="button" onClick={() => setShowUrlConfigModal(false)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
