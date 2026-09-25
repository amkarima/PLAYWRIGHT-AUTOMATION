import React, { useState, useEffect, useMemo } from 'react';
import { Play, Tag, RefreshCw, ChevronDown, ChevronUp, Check, X, Plus, Minus, GitBranch } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { getPartnerLogo } from '../utils/partnerLogos';
import type { Partner } from '../utils/partnerLogos';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

interface TestItem {
  id: string;
  name: string;
  test_type: string;
  partner: Partner;
  tags: string[];
  is_active: boolean;
}

interface TagGroup {
  id: string;
  name: string;
  description: string;
  tags: string[];
  color: string;
  sort_order: number;
  is_active: boolean;
}

interface TagExecutionPageProps {
  onBack: () => void;
  onTrigger: (selectedTests: string[], variables: Record<string, string>, eSignature: boolean) => void;
  loading?: boolean;
  currentEnvironment: string;
}

const COLOR_MAP: Record<string, { bg: string; border: string; text: string; badge: string }> = {
  red: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-800', badge: 'bg-red-100 text-red-700' },
  green: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-800', badge: 'bg-green-100 text-green-700' },
  blue: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800', badge: 'bg-blue-100 text-blue-700' },
  orange: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-800', badge: 'bg-orange-100 text-orange-700' },
  purple: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-800', badge: 'bg-purple-100 text-purple-700' },
  teal: { bg: 'bg-teal-50', border: 'border-teal-200', text: 'text-teal-800', badge: 'bg-teal-100 text-teal-700' },
  yellow: { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-800', badge: 'bg-yellow-100 text-yellow-700' },
  gray: { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-800', badge: 'bg-gray-100 text-gray-700' },
};

export const TagExecutionPage: React.FC<TagExecutionPageProps> = ({
  onBack,
  onTrigger,
  loading = false,
  currentEnvironment,
}) => {
  const [tests, setTests] = useState<TestItem[]>([]);
  const [tagGroups, setTagGroups] = useState<TagGroup[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState('');
  const [selectedTests, setSelectedTests] = useState<string[]>([]);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [eSignature, setESignature] = useState(false);
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [newVarKey, setNewVarKey] = useState('');
  const [newVarValue, setNewVarValue] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoadingData(true);
    try {
      const [testsRes, groupsRes] = await Promise.all([
        supabase.from('automated_test_catalog').select('*').eq('is_active', true).order('sort_order'),
        supabase.from('tag_groups').select('*').eq('is_active', true).order('sort_order'),
      ]);
      if (testsRes.data) setTests(testsRes.data as TestItem[]);
      if (groupsRes.data) setTagGroups(groupsRes.data as TagGroup[]);
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoadingData(false);
    }
  };

  // All unique tags across all tests
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    tests.forEach(t => (t.tags || []).forEach(tag => tagSet.add(tag)));
    return Array.from(tagSet).sort();
  }, [tests]);

  // Tests matching active tag selection (OR logic within group, AND between added tags)
  const matchingTests = useMemo(() => {
    if (activeTags.length === 0) return [];
    return tests.filter(test =>
      activeTags.some(tag => (test.tags || []).includes(tag))
    );
  }, [tests, activeTags]);

  const toggleTag = (tag: string) => {
    setActiveTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const addCustomTag = () => {
    const t = customTag.trim();
    if (!t || activeTags.includes(t)) return;
    setActiveTags(prev => [...prev, t]);
    setCustomTag('');
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

  const toggleTest = (id: string) =>
    setSelectedTests(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const selectAllMatching = () =>
    setSelectedTests(matchingTests.map(t => t.id));

  const clearSelection = () => setSelectedTests([]);

  const addVariable = () => {
    if (!newVarKey.trim() || !newVarValue.trim()) return;
    setVariables(prev => ({ ...prev, [newVarKey.trim()]: newVarValue.trim() }));
    setNewVarKey('');
    setNewVarValue('');
  };

  const removeVariable = (key: string) =>
    setVariables(prev => { const c = { ...prev }; delete c[key]; return c; });

  const handleLaunch = () => {
    if (selectedTests.length === 0) return;
    setShowConfirm(true);
  };

  const confirmLaunch = () => {
    setShowConfirm(false);
    onTrigger(selectedTests, variables, eSignature);
  };

  if (loadingData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-3">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors mb-4"
          >
            ← Retour au dashboard
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Tag className="w-6 h-6 text-blue-600" />
                Exécution par tag
              </h1>
              <p className="text-gray-500 text-sm mt-1">
                Sélectionnez des tags pour filtrer et lancer les tests correspondants
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="px-3 py-1.5 rounded-full bg-blue-100 text-blue-700 font-medium">
                {currentEnvironment.toUpperCase()}
              </span>
              <button
                onClick={loadData}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                title="Actualiser"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column: Tag selection */}
          <div className="lg:col-span-1 space-y-4">
            {/* Suggested tag groups */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="font-semibold text-gray-900 text-sm">Groupes de tags suggérés</h2>
                <p className="text-xs text-gray-500 mt-0.5">Cliquez pour ajouter tous les tags du groupe</p>
              </div>
              <div className="divide-y divide-gray-100">
                {tagGroups.length === 0 && (
                  <div className="px-5 py-6 text-center text-gray-400 text-sm">
                    Aucun groupe configuré
                  </div>
                )}
                {tagGroups.map(group => {
                  const colors = COLOR_MAP[group.color] || COLOR_MAP.gray;
                  const isExpanded = expandedGroups.has(group.id);
                  const groupTests = tests.filter(t =>
                    group.tags.some(tag => (t.tags || []).includes(tag))
                  );
                  const allApplied = group.tags.every(t => activeTags.includes(t));

                  return (
                    <div key={group.id} className={`${colors.bg}`}>
                      <div className="px-5 py-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className={`font-semibold text-sm ${colors.text}`}>{group.name}</span>
                              {allApplied && group.tags.length > 0 && (
                                <Check className={`w-3.5 h-3.5 ${colors.text}`} />
                              )}
                            </div>
                            {group.description && (
                              <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{group.description}</p>
                            )}
                            <div className="flex flex-wrap gap-1 mt-2">
                              {group.tags.map(tag => (
                                <span key={tag} className={`text-xs px-2 py-0.5 rounded-full font-medium ${colors.badge}`}>
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div className="flex flex-col gap-1 flex-shrink-0">
                            <button
                              onClick={() => applyTagGroup(group)}
                              disabled={allApplied}
                              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                                allApplied
                                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                  : `${colors.badge} hover:opacity-80`
                              }`}
                            >
                              {allApplied ? 'Appliqué' : 'Appliquer'}
                            </button>
                            <button
                              onClick={() => toggleGroupExpand(group.id)}
                              className="text-xs px-3 py-1 text-gray-500 hover:text-gray-700 flex items-center gap-1 justify-center"
                            >
                              {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                              {groupTests.length} tests
                            </button>
                          </div>
                        </div>
                        {isExpanded && groupTests.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {groupTests.map(t => (
                              <div key={t.id} className="text-xs text-gray-600 flex items-center gap-1.5 pl-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-gray-400 flex-shrink-0" />
                                <span className="truncate">{t.name}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* All available tags */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="font-semibold text-gray-900 text-sm">Tous les tags disponibles</h2>
              </div>
              <div className="p-4">
                {allTags.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-2">Aucun tag défini sur les tests</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {allTags.map(tag => (
                      <button
                        key={tag}
                        onClick={() => toggleTag(tag)}
                        className={`text-sm px-3 py-1.5 rounded-full font-medium border transition-all ${
                          activeTags.includes(tag)
                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                            : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400 hover:text-blue-600'
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                )}

                {/* Custom tag input */}
                <div className="mt-4 pt-3 border-t border-gray-100">
                  <p className="text-xs text-gray-500 mb-2">Ajouter un tag personnalisé</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customTag}
                      onChange={e => setCustomTag(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && addCustomTag()}
                      placeholder="Nom du tag..."
                      className="flex-1 text-sm px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={addCustomTag}
                      disabled={!customTag.trim()}
                      className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Active tags summary */}
            {activeTags.length > 0 && (
              <div className="bg-blue-50 rounded-xl border border-blue-200 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-blue-800">Tags actifs</span>
                  <button
                    onClick={() => setActiveTags([])}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    Tout effacer
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {activeTags.map(tag => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 text-xs px-2.5 py-1 bg-blue-600 text-white rounded-full font-medium"
                    >
                      {tag}
                      <button onClick={() => toggleTag(tag)} className="hover:opacity-75">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right column: Matching tests + launch */}
          <div className="lg:col-span-2 space-y-4">
            {activeTags.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
                <Tag className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-500 mb-2">Sélectionnez des tags</h3>
                <p className="text-gray-400 text-sm">
                  Choisissez un ou plusieurs tags dans le panneau de gauche pour voir les tests correspondants.
                </p>
              </div>
            ) : (
              <>
                {/* Results header */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                    <div>
                      <h2 className="font-semibold text-gray-900">
                        Tests correspondants
                        <span className="ml-2 text-sm font-normal text-gray-500">({matchingTests.length} résultats)</span>
                      </h2>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Tests contenant au moins un des tags sélectionnés
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={selectAllMatching}
                        className="text-xs px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors font-medium"
                      >
                        Tout sélectionner
                      </button>
                      {selectedTests.length > 0 && (
                        <button
                          onClick={clearSelection}
                          className="text-xs px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                          Désélectionner
                        </button>
                      )}
                    </div>
                  </div>

                  {matchingTests.length === 0 ? (
                    <div className="p-8 text-center text-gray-400 text-sm">
                      Aucun test ne correspond aux tags sélectionnés.
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-50">
                      {matchingTests.map(test => {
                        const selected = selectedTests.includes(test.id);
                        const logo = test.partner ? getPartnerLogo(test.partner) : null;
                        const matchedTags = (test.tags || []).filter(t => activeTags.includes(t));

                        return (
                          <button
                            key={test.id}
                            type="button"
                            onClick={() => toggleTest(test.id)}
                            className={`w-full text-left px-5 py-3 flex items-center gap-4 transition-colors ${
                              selected ? 'bg-green-50' : 'hover:bg-gray-50'
                            }`}
                          >
                            <div className={`w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                              selected ? 'bg-green-500 border-green-500' : 'border-gray-300'
                            }`}>
                              {selected && <Check className="w-3 h-3 text-white" />}
                            </div>

                            {logo && (
                              <div className="w-10 h-10 rounded-lg border border-gray-200 bg-white flex items-center justify-center p-1 flex-shrink-0">
                                <img src={logo.src} alt={logo.alt} className="w-full h-full object-contain" />
                              </div>
                            )}

                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-gray-900 text-sm truncate">{test.name}</div>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs text-gray-400">{test.id}</span>
                                <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">{test.test_type}</span>
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-1 flex-shrink-0">
                              {matchedTags.map(tag => (
                                <span key={tag} className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-medium">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Launch configuration */}
                {selectedTests.length > 0 && (
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-100">
                      <h2 className="font-semibold text-gray-900 text-sm">
                        Configuration du lancement
                        <span className="ml-2 text-sm font-normal text-gray-500">
                          {selectedTests.length} test{selectedTests.length > 1 ? 's' : ''} sélectionné{selectedTests.length > 1 ? 's' : ''}
                        </span>
                      </h2>
                    </div>
                    <div className="p-5 space-y-4">
                      {/* E-signature */}
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={eSignature}
                          onChange={e => setESignature(e.target.checked)}
                          className="h-4 w-4 text-green-600 border-gray-300 rounded"
                        />
                        <span className="text-sm text-gray-700">Signature électronique</span>
                      </label>

                      {/* Extra variables */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Variables supplémentaires</label>
                        {Object.entries(variables).map(([key, value]) => (
                          <div key={key} className="flex items-center gap-2 mb-2">
                            <input type="text" value={key} readOnly className="flex-1 text-sm px-3 py-2 border border-gray-200 rounded-lg bg-gray-50" />
                            <input type="text" value={value} readOnly className="flex-1 text-sm px-3 py-2 border border-gray-200 rounded-lg bg-gray-50" />
                            <button onClick={() => removeVariable(key)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                              <Minus className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={newVarKey}
                            onChange={e => setNewVarKey(e.target.value)}
                            placeholder="Nom"
                            className="flex-1 text-sm px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <input
                            type="text"
                            value={newVarValue}
                            onChange={e => setNewVarValue(e.target.value)}
                            placeholder="Valeur"
                            className="flex-1 text-sm px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <button
                            onClick={addVariable}
                            disabled={!newVarKey.trim() || !newVarValue.trim()}
                            className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 disabled:opacity-40 transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <button
                        onClick={handleLaunch}
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 disabled:opacity-50 transition-colors shadow-sm"
                      >
                        {loading ? (
                          <RefreshCw className="w-5 h-5 animate-spin" />
                        ) : (
                          <Play className="w-5 h-5" />
                        )}
                        <span>
                          {loading ? 'Lancement...' : `Lancer ${selectedTests.length} test${selectedTests.length > 1 ? 's' : ''}`}
                        </span>
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Confirm modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <GitBranch className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Confirmer le lancement</h3>
                <p className="text-sm text-gray-500">Pipeline sur {currentEnvironment.toUpperCase()}</p>
              </div>
            </div>
            <p className="text-sm text-gray-700 mb-2">
              {selectedTests.length} test{selectedTests.length > 1 ? 's' : ''} vont être lancés via les tags :
            </p>
            <div className="flex flex-wrap gap-1.5 mb-4">
              {activeTags.map(tag => (
                <span key={tag} className="text-xs px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">{tag}</span>
              ))}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={confirmLaunch}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
