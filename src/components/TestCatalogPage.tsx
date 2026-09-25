import React, { useState, useEffect, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Plus, Trash2, Save, X, Check, Upload, FileCode2, Folder, FolderOpen, FolderPlus, ChevronRight, ChevronDown, Home, CreditCard as Edit2, MoreVertical, Move, Copy, Link2, Play, Loader2, Smartphone, QrCode, Sparkles } from 'lucide-react';
import { getPartnerLogo, type Partner } from '../utils/partnerLogos';
import { QRCodeSVG } from 'qrcode.react';
import { ImportSquashModal } from './ImportSquashModal';
import GherkinEditorModal from './GherkinEditorModal';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

interface TestCatalogItem {
  id: string;
  name: string;
  test_type: string;
  partner: string;
  is_active: boolean;
  is_automated: boolean;
  sort_order: number;
  tags: string[];
  gherkin_script?: string;
  folder_id?: string | null;
  preset_id?: string | null;
}

interface PresetOption {
  id: string;
  name: string;
  key: string;
  partner_id: string;
  source_id: string;
  scale_id: string;
  amount: string;
  duration: string;
  first_name: string;
  last_name: string;
  birth_date: string;
  email: string;
  mobile: string;
  return_url: string;
  exchange_url: string;
  business_provider_id?: string | null;
  static_url?: string | null;
}

interface TestFolder {
  id: string;
  name: string;
  parent_id: string | null;
  sort_order: number;
  color?: string | null;
  icon?: string | null;
}

interface FolderNode extends TestFolder {
  children: FolderNode[];
  testCount: number;
  descendantTestCount: number;
}

const FOLDER_COLORS: Record<string, { bg: string; text: string; dot: string; hover: string }> = {
  blue:   { bg: 'bg-blue-50',   text: 'text-blue-700',   dot: 'bg-blue-500',   hover: 'hover:bg-blue-100' },
  red:    { bg: 'bg-red-50',    text: 'text-red-700',    dot: 'bg-red-500',    hover: 'hover:bg-red-100' },
  green:  { bg: 'bg-green-50',  text: 'text-green-700',  dot: 'bg-green-500',  hover: 'hover:bg-green-100' },
  amber:  { bg: 'bg-amber-50',  text: 'text-amber-700',  dot: 'bg-amber-500',  hover: 'hover:bg-amber-100' },
  purple: { bg: 'bg-purple-50', text: 'text-purple-700', dot: 'bg-purple-500', hover: 'hover:bg-purple-100' },
  pink:   { bg: 'bg-pink-50',   text: 'text-pink-700',   dot: 'bg-pink-500',   hover: 'hover:bg-pink-100' },
  slate:  { bg: 'bg-slate-50',  text: 'text-slate-700',  dot: 'bg-slate-500',  hover: 'hover:bg-slate-100' },
};

const getFolderStyle = (color?: string | null) => FOLDER_COLORS[color || 'slate'] || FOLDER_COLORS.slate;

export const TestCatalogPage: React.FC = () => {
  const [tests, setTests] = useState<TestCatalogItem[]>([]);
  const [folders, setFolders] = useState<TestFolder[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [presets, setPresets] = useState<PresetOption[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState<Partial<TestCatalogItem>>({
    id: '', name: '', test_type: '', partner: '',
    is_active: true, is_automated: false, sort_order: 0, tags: [], folder_id: null, preset_id: null,
  });
  const [tagInput, setTagInput] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);
  const [gherkinEditing, setGherkinEditing] = useState<{ testId: string | null; testName: string; script: string } | null>(null);

  // Folder management state
  const [folderModal, setFolderModal] = useState<
    | { mode: 'create'; parentId: string | null }
    | { mode: 'edit'; folder: TestFolder }
    | null
  >(null);
  const [folderForm, setFolderForm] = useState({ name: '', color: 'blue', parentId: '' });
  const [moveModal, setMoveModal] = useState<TestCatalogItem | null>(null);
  const [contextMenu, setContextMenu] = useState<{ folderId: string; x: number; y: number } | null>(null);
  const [launchModal, setLaunchModal] = useState<{ testName: string; url: string } | null>(null);
  const [launchingTestId, setLaunchingTestId] = useState<string | null>(null);

  const uniquePartners = useMemo(
    () => Array.from(new Set(tests.map(t => t.partner).filter(Boolean))).sort(),
    [tests]
  );
  const uniqueTestTypes = useMemo(
    () => Array.from(new Set(tests.map(t => t.test_type).filter(Boolean))).sort(),
    [tests]
  );

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const handler = () => setContextMenu(null);
    if (contextMenu) {
      window.addEventListener('click', handler);
      return () => window.removeEventListener('click', handler);
    }
  }, [contextMenu]);

  const loadData = async () => {
    try {
      const [testsRes, foldersRes, presetsRes] = await Promise.all([
        supabase.from('automated_test_catalog').select('*').order('sort_order', { ascending: true }),
        supabase.from('test_folders').select('*').order('sort_order', { ascending: true }),
        supabase.from('test_presets').select('*').order('name', { ascending: true }),
      ]);

      if (testsRes.error) throw testsRes.error;
      if (foldersRes.error) throw foldersRes.error;

      setTests(testsRes.data || []);
      setFolders(foldersRes.data || []);
      setPresets(presetsRes.data || []);

      // Expand all root folders by default
      const rootIds = (foldersRes.data || []).filter(f => !f.parent_id).map(f => f.id);
      setExpandedFolders(new Set(rootIds));
    } catch (error) {
      console.error('Error loading data:', error);
      alert('Erreur lors du chargement: ' + (error instanceof Error ? error.message : 'Erreur inconnue'));
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableTags = async () => {
    try {
      const { data, error } = await supabase.from('tag_groups').select('tags');
      if (error) throw error;
      const tagSet = new Set<string>();
      (data || []).forEach((g: { tags: string[] }) => {
        (g.tags || []).forEach((t: string) => tagSet.add(t));
      });
      setAvailableTags(Array.from(tagSet).sort());
    } catch (err) {
      console.error('Error loading available tags:', err);
    }
  };

  // Build folder tree
  const folderTree = useMemo((): FolderNode[] => {
    const buildNode = (folder: TestFolder): FolderNode => {
      const children = folders
        .filter(f => f.parent_id === folder.id)
        .sort((a, b) => a.sort_order - b.sort_order)
        .map(buildNode);

      const directTests = tests.filter(t => t.folder_id === folder.id).length;
      const descendantTests = directTests + children.reduce((sum, c) => sum + c.descendantTestCount, 0);

      return { ...folder, children, testCount: directTests, descendantTestCount: descendantTests };
    };

    return folders
      .filter(f => !f.parent_id)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(buildNode);
  }, [folders, tests]);

  // Get all descendant folder IDs for a given folder
  const getDescendantFolderIds = (folderId: string): string[] => {
    const result: string[] = [folderId];
    const children = folders.filter(f => f.parent_id === folderId);
    children.forEach(c => result.push(...getDescendantFolderIds(c.id)));
    return result;
  };

  // Filtered tests for the selected folder/search
  const filteredTests = useMemo(() => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return tests.filter(t =>
        t.name.toLowerCase().includes(q) ||
        t.id.toLowerCase().includes(q) ||
        t.test_type.toLowerCase().includes(q) ||
        t.partner.toLowerCase().includes(q) ||
        (t.tags || []).some(tag => tag.toLowerCase().includes(q))
      );
    }
    if (selectedFolderId === null) return tests;
    const folderIds = getDescendantFolderIds(selectedFolderId);
    return tests.filter(t => t.folder_id && folderIds.includes(t.folder_id));
  }, [tests, selectedFolderId, searchQuery, folders]);

  const unfiledTestsCount = useMemo(
    () => tests.filter(t => !t.folder_id).length,
    [tests]
  );

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(folderId)) next.delete(folderId);
      else next.add(folderId);
      return next;
    });
  };

  // === Test CRUD ===
  const handleEdit = (test: TestCatalogItem) => {
    setEditingId(test.id);
    setFormData({ ...test, tags: test.tags || [], folder_id: test.folder_id || selectedFolderId });
    setTagInput('');
    setIsAdding(false);
  };

  const handleAdd = () => {
    setIsAdding(true);
    setEditingId(null);
    setFormData({
      id: '', name: '', test_type: '', partner: '',
      is_active: true, is_automated: false,
      sort_order: filteredTests.length + 1,
      tags: [], gherkin_script: '',
      folder_id: selectedFolderId,
      preset_id: null,
    });
    setTagInput('');
  };

  const handleCancel = () => {
    setEditingId(null);
    setIsAdding(false);
    setTagInput('');
    setFormData({
      id: '', name: '', test_type: '', partner: '',
      is_active: true, is_automated: false, sort_order: 0,
      tags: [], gherkin_script: '', folder_id: null, preset_id: null,
    });
  };

  const addTagToForm = () => {
    const t = tagInput.trim();
    if (!t || (formData.tags || []).includes(t)) return;
    setFormData(prev => ({ ...prev, tags: [...(prev.tags || []), t] }));
    setTagInput('');
  };

  const addSuggestion = (tag: string) => {
    if ((formData.tags || []).includes(tag)) return;
    setFormData(prev => ({ ...prev, tags: [...(prev.tags || []), tag] }));
    setTagInput('');
  };

  const removeTagFromForm = (tag: string) => {
    setFormData(prev => ({ ...prev, tags: (prev.tags || []).filter(t => t !== tag) }));
  };

  const getFilteredSuggestions = () => {
    const selected = new Set(formData.tags || []);
    const q = tagInput.trim().toLowerCase();
    return availableTags
      .filter(t => !selected.has(t))
      .filter(t => !q || t.toLowerCase().includes(q))
      .slice(0, 10);
  };

  const handleSave = async () => {
    try {
      if (!formData.id || !formData.name || !formData.test_type || !formData.partner) {
        alert('Tous les champs sont requis');
        return;
      }

      if (isAdding) {
        const { error } = await supabase.from('automated_test_catalog').insert([formData]);
        if (error) throw error;
      } else if (editingId) {
        const { error } = await supabase
          .from('automated_test_catalog')
          .update(formData)
          .eq('id', editingId);
        if (error) throw error;
      }

      await loadData();
      handleCancel();
    } catch (error) {
      console.error('Error saving test:', error);
      alert('Erreur lors de la sauvegarde du test');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce test ?')) return;
    try {
      const { error } = await supabase.from('automated_test_catalog').delete().eq('id', id);
      if (error) throw error;
      await loadData();
    } catch (error) {
      console.error('Error deleting test:', error);
      alert('Erreur lors de la suppression du test');
    }
  };

  const toggleActive = async (test: TestCatalogItem) => {
    try {
      const { error } = await supabase
        .from('automated_test_catalog')
        .update({ is_active: !test.is_active })
        .eq('id', test.id);
      if (error) throw error;
      await loadData();
    } catch (error) {
      console.error('Error updating test status:', error);
      alert('Erreur lors de la mise à jour du statut');
    }
  };

  const handleLaunchPreset = async (test: TestCatalogItem) => {
    const preset = presets.find(p => p.id === test.preset_id);
    if (!preset) {
      alert('Preset introuvable');
      return;
    }
    setLaunchingTestId(test.id);
    try {
      let url = preset.static_url || '';
      if (!url) {
        const params = {
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
          orderId: `TestAuto${Math.floor(10000000 + Math.random() * 90000000)}`,
        };
        const res = await fetch(`${supabaseUrl}/functions/v1/generate-test-url`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${supabaseKey}` },
          body: JSON.stringify(params),
        });
        if (!res.ok) throw new Error('Erreur génération URL');
        const data = await res.json();
        if (data.success && data.url) url = data.url;
      }
      setLaunchModal({ testName: test.name, url });
    } catch (e) {
      console.error('Launch preset error:', e);
      alert('Erreur lors de la génération de l\'URL de test');
    } finally {
      setLaunchingTestId(null);
    }
  };

  const handleMoveTest = async (testId: string, targetFolderId: string | null) => {
    try {
      const { error } = await supabase
        .from('automated_test_catalog')
        .update({ folder_id: targetFolderId })
        .eq('id', testId);
      if (error) throw error;
      await loadData();
      setMoveModal(null);
    } catch (error) {
      console.error('Error moving test:', error);
      alert('Erreur lors du déplacement du test');
    }
  };

  // === Folder CRUD ===
  const handleCreateFolder = async () => {
    if (!folderForm.name.trim()) return;
    try {
      const parentId = folderForm.parentId || null;
      const siblingCount = folders.filter(f => f.parent_id === parentId).length;
      const { error } = await supabase.from('test_folders').insert([{
        name: folderForm.name.trim(),
        parent_id: parentId,
        sort_order: siblingCount + 1,
        color: folderForm.color,
      }]);
      if (error) throw error;
      await loadData();
      if (parentId) setExpandedFolders(prev => new Set([...prev, parentId]));
      setFolderModal(null);
      setFolderForm({ name: '', color: 'blue', parentId: '' });
    } catch (error) {
      console.error('Error creating folder:', error);
      alert('Erreur lors de la création du dossier');
    }
  };

  const handleUpdateFolder = async () => {
    if (!folderModal || folderModal.mode !== 'edit' || !folderForm.name.trim()) return;
    try {
      const { error } = await supabase
        .from('test_folders')
        .update({
          name: folderForm.name.trim(),
          color: folderForm.color,
          parent_id: folderForm.parentId || null,
        })
        .eq('id', folderModal.folder.id);
      if (error) throw error;
      await loadData();
      setFolderModal(null);
      setFolderForm({ name: '', color: 'blue', parentId: '' });
    } catch (error) {
      console.error('Error updating folder:', error);
      alert('Erreur lors de la modification du dossier');
    }
  };

  const handleDeleteFolder = async (folderId: string) => {
    const folder = folders.find(f => f.id === folderId);
    if (!folder) return;
    const descendantIds = getDescendantFolderIds(folderId);
    const testsInTree = tests.filter(t => t.folder_id && descendantIds.includes(t.folder_id)).length;
    const subFolderCount = descendantIds.length - 1;

    const msg = testsInTree > 0 || subFolderCount > 0
      ? `Supprimer le dossier "${folder.name}" ?\n${testsInTree} test(s) seront déplacés à la racine.\n${subFolderCount} sous-dossier(s) seront détachés.`
      : `Supprimer le dossier "${folder.name}" ?`;

    if (!confirm(msg)) return;
    try {
      const { error } = await supabase.from('test_folders').delete().eq('id', folderId);
      if (error) throw error;
      if (selectedFolderId === folderId) setSelectedFolderId(null);
      await loadData();
    } catch (error) {
      console.error('Error deleting folder:', error);
      alert('Erreur lors de la suppression du dossier');
    }
  };

  const openCreateFolder = (parentId: string | null) => {
    setFolderForm({ name: '', color: 'blue', parentId: parentId || '' });
    setFolderModal({ mode: 'create', parentId });
  };

  const openEditFolder = (folder: TestFolder) => {
    setFolderForm({ name: folder.name, color: folder.color || 'blue', parentId: folder.parent_id || '' });
    setFolderModal({ mode: 'edit', folder });
    setContextMenu(null);
  };

  const allFlatFolders = useMemo(() => {
    const result: { id: string; name: string; depth: number }[] = [];
    const walk = (nodes: FolderNode[], depth: number) => {
      nodes.forEach(n => {
        result.push({ id: n.id, name: n.name, depth });
        walk(n.children, depth + 1);
      });
    };
    walk(folderTree, 0);
    return result;
  }, [folderTree]);

  // === Render ===
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Chargement...</div>
      </div>
    );
  }

  const selectedFolder = folders.find(f => f.id === selectedFolderId);
  const selectedFolderName = selectedFolderId === null
    ? 'Tous les tests'
    : selectedFolderId === 'unfiled'
    ? 'Non classés'
    : selectedFolder?.name || 'Dossier';

  const renderFolderNode = (node: FolderNode, depth: number): React.ReactNode => {
    const isExpanded = expandedFolders.has(node.id);
    const isSelected = selectedFolderId === node.id;
    const style = getFolderStyle(node.color);

    return (
      <div key={node.id}>
        <div
          className={`group flex items-center gap-1.5 px-2 py-1.5 rounded-md cursor-pointer transition-colors ${
            isSelected ? `${style.bg} ${style.text} font-medium` : 'text-slate-700 hover:bg-slate-100'
          }`}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
          onClick={() => setSelectedFolderId(node.id)}
          onContextMenu={(e) => {
            e.preventDefault();
            setContextMenu({ folderId: node.id, x: e.clientX, y: e.clientY });
          }}
        >
          <button
            onClick={(e) => { e.stopPropagation(); toggleFolder(node.id); }}
            className="flex-shrink-0 p-0.5 rounded hover:bg-slate-200"
          >
            {node.children.length > 0 ? (
              isExpanded
                ? <ChevronDown className="w-3.5 h-3.5" />
                : <ChevronRight className="w-3.5 h-3.5" />
            ) : (
              <span className="w-3.5 h-3.5 inline-block" />
            )}
          </button>
          {isExpanded && node.children.length > 0 ? (
            <FolderOpen className={`w-4 h-4 flex-shrink-0 ${style.text}`} />
          ) : (
            <Folder className={`w-4 h-4 flex-shrink-0 ${style.text}`} />
          )}
          <span className="flex-1 truncate text-sm">{node.name}</span>
          <span className={`text-xs px-1.5 py-0.5 rounded-full ${isSelected ? 'bg-white/60' : 'bg-slate-100 text-slate-500'} flex-shrink-0`}>
            {node.descendantTestCount}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setContextMenu({ folderId: node.id, x: e.clientX, y: e.clientY });
            }}
            className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-slate-200 flex-shrink-0 transition-opacity"
          >
            <MoreVertical className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>
        {isExpanded && node.children.length > 0 && (
          <div>
            {node.children.map(child => renderFolderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const contextFolder = contextMenu ? folders.find(f => f.id === contextMenu.folderId) : null;

  return (
    <div className="flex gap-4 h-[calc(100vh-200px)]">
      {/* === Sidebar: Folder Tree === */}
      <div className="w-72 flex-shrink-0 flex flex-col bg-white rounded-lg shadow-sm border border-slate-200">
        <div className="flex items-center justify-between p-3 border-b border-slate-200">
          <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <Folder className="w-4 h-4 text-slate-400" />
            Dossiers
          </h3>
          <button
            onClick={() => openCreateFolder(null)}
            className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
            title="Nouveau dossier racine"
          >
            <FolderPlus className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {/* Root / All tests */}
          <div
            className={`group flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors ${
              selectedFolderId === null ? 'bg-slate-100 text-slate-900 font-medium' : 'text-slate-700 hover:bg-slate-100'
            }`}
            onClick={() => setSelectedFolderId(null)}
          >
            <Home className="w-4 h-4 flex-shrink-0 text-slate-400" />
            <span className="flex-1 text-sm">Tous les tests</span>
            <span className="text-xs px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500 flex-shrink-0">
              {tests.length}
            </span>
          </div>

          {/* Unfiled tests */}
          {unfiledTestsCount > 0 && (
            <div
              className={`group flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors ${
                selectedFolderId === 'unfiled' ? 'bg-amber-50 text-amber-700 font-medium' : 'text-slate-500 hover:bg-amber-50 hover:text-amber-700'
              }`}
              onClick={() => setSelectedFolderId('unfiled')}
            >
              <span className="w-4 h-4 flex-shrink-0 inline-flex items-center justify-center">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
              </span>
              <span className="flex-1 text-sm italic">Non classés</span>
              <span className="text-xs px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-600 flex-shrink-0">
                {unfiledTestsCount}
              </span>
            </div>
          )}

          {/* Folder tree */}
          {folderTree.map(node => renderFolderNode(node, 0))}

          {folderTree.length === 0 && unfiledTestsCount === 0 && (
            <div className="text-center py-8 px-4">
              <Folder className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              <p className="text-xs text-slate-400">Aucun dossier. Cliquez sur + pour en créer un.</p>
            </div>
          )}
        </div>

        {/* Add sub-folder button at bottom */}
        {selectedFolderId && selectedFolderId !== 'unfiled' && (
          <div className="p-2 border-t border-slate-200">
            <button
              onClick={() => openCreateFolder(selectedFolderId)}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Sous-dossier dans "{selectedFolderName}"</span>
            </button>
          </div>
        )}
      </div>

      {/* === Main: Test List === */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Toolbar */}
        <div className="flex items-center justify-between mb-4 gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <h2 className="text-lg font-semibold text-slate-800 truncate">{selectedFolderName}</h2>
            <span className="text-sm text-slate-400 flex-shrink-0">({filteredTests.length} test{filteredTests.length > 1 ? 's' : ''})</span>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Rechercher..."
              className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-300 focus:border-sky-500 w-48"
            />
            <button
              onClick={() => setShowImportModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              <Upload className="w-4 h-4" />
              <span>Importer Squash</span>
            </button>
            <button
              onClick={handleAdd}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Ajouter un test</span>
            </button>
          </div>
        </div>

        {/* Test list / table */}
        <div className="flex-1 bg-white rounded-lg shadow-sm border border-slate-200 overflow-auto">
          {isAdding && (
            <div className="m-4 p-6 bg-green-50 border-2 border-green-500 rounded-lg shadow-lg">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Nouveau test</h3>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">ID du test</label>
                  <input type="text" value={formData.id}
                    onChange={e => setFormData({ ...formData, id: e.target.value })}
                    placeholder="SOF-123456"
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nom du test</label>
                  <input type="text" value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="CR < 3000€ prospect"
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Type de test</label>
                  <input type="text" value={formData.test_type}
                    onChange={e => setFormData({ ...formData, test_type: e.target.value })}
                    placeholder="CC, CL web, CEASY x Essentiel"
                    list="test-type-options"
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Partenaire</label>
                  <input type="text" value={formData.partner}
                    onChange={e => setFormData({ ...formData, partner: e.target.value })}
                    placeholder="sofinco, darty, fnac..."
                    list="partner-options"
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Dossier</label>
                  <select
                    value={formData.folder_id || ''}
                    onChange={e => setFormData({ ...formData, folder_id: e.target.value || null })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                  >
                    <option value="">— Non classé —</option>
                    {allFlatFolders.map(f => (
                      <option key={f.id} value={f.id}>
                        {'\u00A0\u00A0'.repeat(f.depth)}{f.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Ordre d'affichage</label>
                  <input type="number" value={formData.sort_order}
                    onChange={e => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="is_active_new" checked={formData.is_active}
                    onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                    className="h-4 w-4 text-green-600 border-slate-300 rounded" />
                  <label htmlFor="is_active_new" className="text-sm font-medium text-slate-700">Actif</label>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="is_automated_new" checked={formData.is_automated ?? false}
                    onChange={e => setFormData({ ...formData, is_automated: e.target.checked })}
                    className="h-4 w-4 text-green-600 border-slate-300 rounded" />
                  <label htmlFor="is_automated_new" className="text-sm font-medium text-slate-700">Automatisé</label>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tags</label>
                  <div className="flex gap-2 mb-2">
                    <input type="text" value={tagInput}
                      onChange={e => setTagInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTagToForm())}
                      placeholder="Ajouter un tag (ex: smoke, CC, regression...)"
                      className="flex-1 px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500" />
                    <button type="button" onClick={addTagToForm} disabled={!tagInput.trim()}
                      className="px-3 py-2 bg-green-100 text-green-700 rounded-md hover:bg-green-200 disabled:opacity-40">+</button>
                  </div>
                  {getFilteredSuggestions().length > 0 && (
                    <div className="mb-2 flex flex-wrap gap-1.5">
                      {getFilteredSuggestions().map(tag => (
                        <button key={tag} type="button" onClick={() => addSuggestion(tag)}
                          className="text-xs px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full hover:bg-blue-100 hover:text-blue-700 border border-slate-200 transition-colors">
                          + {tag}
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="flex flex-wrap gap-1.5">
                    {(formData.tags || []).map(tag => (
                      <span key={tag} className="inline-flex items-center gap-1 text-xs px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full">
                        {tag}
                        <button onClick={() => removeTagFromForm(tag)} className="hover:text-red-600 font-bold">×</button>
                      </span>
                    ))}
                  </div>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Preset lié</label>
                  <select
                    value={formData.preset_id || ''}
                    onChange={e => setFormData({ ...formData, preset_id: e.target.value || null })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                  >
                    <option value="">— Aucun preset —</option>
                    {presets.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.key})</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Script de test Gherkin</label>
                  <button type="button"
                    onClick={() => setGherkinEditing({ testId: null, testName: formData.name || 'Nouveau test', script: formData.gherkin_script || '' })}
                    className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${formData.gherkin_script ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                    <FileCode2 className="w-4 h-4" />
                    <span>{formData.gherkin_script ? 'Modifier le script Gherkin' : 'Ajouter un script Gherkin'}</span>
                  </button>
                  {formData.gherkin_script && (
                    <p className="mt-1 text-xs text-slate-400">Script défini ({formData.gherkin_script.split('\n').length} lignes)</p>
                  )}
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={handleSave}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors">
                  <Save className="w-4 h-4" /><span>Sauvegarder</span>
                </button>
                <button onClick={handleCancel}
                  className="flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50 transition-colors">
                  <X className="w-4 h-4" /><span>Annuler</span>
                </button>
              </div>
            </div>
          )}

          {filteredTests.length === 0 && !isAdding ? (
            <div className="text-center py-16 text-slate-400">
              <Folder className="w-10 h-10 mx-auto mb-3 text-slate-300" />
              <p className="text-sm">
                {searchQuery ? 'Aucun test trouvé pour cette recherche.' : 'Aucun test dans ce dossier. Cliquez sur "Ajouter un test" pour commencer.'}
              </p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50 sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Statut</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Nom</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Partenaire</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Auto</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Tags</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Preset</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Gherkin</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {filteredTests.map((test) => {
                  const isEditing = editingId === test.id;
                  const partnerLogo = getPartnerLogo(test.partner as Partner);
                  const testFolder = folders.find(f => f.id === test.folder_id);
                  const folderStyle = getFolderStyle(testFolder?.color);

                  if (isEditing) {
                    return (
                      <tr key={test.id} className="bg-blue-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input type="checkbox" checked={formData.is_active}
                            onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                            className="h-4 w-4 text-green-600 border-slate-300 rounded" />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input type="text" value={formData.id} disabled
                            className="w-full px-2 py-1 border border-slate-300 rounded bg-slate-100" />
                        </td>
                        <td className="px-6 py-4">
                          <input type="text" value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-2 py-1 border border-slate-300 rounded" />
                        </td>
                        <td className="px-6 py-4">
                          <input type="text" value={formData.test_type}
                            onChange={e => setFormData({ ...formData, test_type: e.target.value })}
                            list="test-type-options"
                            className="w-full px-2 py-1 border border-slate-300 rounded" />
                        </td>
                        <td className="px-6 py-4">
                          <input type="text" value={formData.partner}
                            onChange={e => setFormData({ ...formData, partner: e.target.value })}
                            list="partner-options"
                            className="w-full px-2 py-1 border border-slate-300 rounded" />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input type="checkbox" checked={formData.is_automated ?? false}
                            onChange={e => setFormData({ ...formData, is_automated: e.target.checked })}
                            className="h-4 w-4 text-green-600 border-slate-300 rounded" />
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <div className="flex gap-1">
                              <input type="text" value={tagInput}
                                onChange={e => setTagInput(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTagToForm())}
                                placeholder="Ajouter un tag"
                                className="w-28 px-2 py-1 border border-slate-300 rounded text-xs" />
                              <button type="button" onClick={addTagToForm}
                                className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200">+</button>
                            </div>
                            {getFilteredSuggestions().length > 0 && (
                              <div className="flex flex-wrap gap-1 mb-1">
                                {getFilteredSuggestions().slice(0, 6).map(tag => (
                                  <button key={tag} type="button" onClick={() => addSuggestion(tag)}
                                    className="text-xs px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded hover:bg-blue-100 hover:text-blue-700 border border-slate-200 transition-colors">
                                    + {tag}
                                  </button>
                                ))}
                              </div>
                            )}
                            <div className="flex flex-wrap gap-1">
                              {(formData.tags || []).map(tag => (
                                <span key={tag} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                                  {tag}
                                  <button onClick={() => removeTagFromForm(tag)} className="hover:text-red-600">×</button>
                                </span>
                              ))}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <select
                            value={formData.preset_id || ''}
                            onChange={e => setFormData({ ...formData, preset_id: e.target.value || null })}
                            className="w-full px-2 py-1 border border-slate-300 rounded text-xs bg-white"
                          >
                            <option value="">—</option>
                            {presets.map(p => (
                              <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button type="button"
                            onClick={() => setGherkinEditing({ testId: editingId, testName: formData.name || 'Test', script: formData.gherkin_script || '' })}
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-colors ${formData.gherkin_script ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                            <FileCode2 className="w-3.5 h-3.5" />
                            <span>{formData.gherkin_script ? 'Voir' : 'Éditer'}</span>
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button onClick={handleSave} className="text-green-600 hover:text-green-900 mr-3">
                            <Save className="w-4 h-4" />
                          </button>
                          <button onClick={handleCancel} className="text-slate-600 hover:text-slate-900">
                            <X className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  }

                  return (
                    <tr key={test.id} className={`group ${test.is_active ? 'hover:bg-slate-50' : 'bg-slate-50 opacity-60'}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button onClick={() => toggleActive(test)}
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            test.is_active ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-600'
                          }`}>
                          {test.is_active ? (
                            <span className="flex items-center gap-1"><Check className="w-3 h-3" /><span>Actif</span></span>
                          ) : 'Inactif'}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{test.id}</td>
                      <td className="px-6 py-4 text-sm text-slate-900">
                        <div className="flex items-center gap-2">
                          {testFolder && (
                            <span className={`inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded ${folderStyle.bg} ${folderStyle.text} flex-shrink-0`}>
                              <Folder className="w-3 h-3" />
                            </span>
                          )}
                          <span>{test.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">{test.test_type}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {partnerLogo && (
                            <img src={partnerLogo.src} alt={partnerLogo.alt} className="w-6 h-6 object-contain rounded" />
                          )}
                          <span className="text-sm text-slate-900">{test.partner}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {test.is_automated ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Oui</span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">Non</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {(test.tags || []).length === 0 ? (
                            <span className="text-xs text-slate-400">—</span>
                          ) : (test.tags || []).map(tag => (
                            <span key={tag} className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">{tag}</span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {test.preset_id ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-teal-100 text-teal-700">
                            <Link2 className="w-3 h-3" />
                            {presets.find(p => p.id === test.preset_id)?.name || 'Preset supprimé'}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => setGherkinEditing({ testId: test.id, testName: test.name, script: test.gherkin_script || '' })}
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-colors ${test.gherkin_script ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                          <FileCode2 className="w-3.5 h-3.5" />
                          <span>{test.gherkin_script ? 'Voir' : 'Éditer'}</span>
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-1.5">
                          {test.preset_id && (
                            <button
                              onClick={() => handleLaunchPreset(test)}
                              disabled={launchingTestId === test.id}
                              className="p-1.5 text-orange-600 hover:text-orange-900 hover:bg-orange-50 rounded transition-colors disabled:opacity-50"
                              title="Lancer le test via le preset"
                            >
                              {launchingTestId === test.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                            </button>
                          )}
                          <button
                            onClick={() => setMoveModal(test)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors opacity-0 group-hover:opacity-100"
                            title="Déplacer vers un dossier"
                          >
                            <Move className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleEdit(test)}
                            className="p-1.5 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded transition-colors">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(test.id)}
                            className="p-1.5 text-red-600 hover:text-red-900 hover:bg-red-50 rounded transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* === Folder Create/Edit Modal === */}
      {folderModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setFolderModal(null)}>
          <div className="bg-white rounded-xl shadow-2xl p-6 w-96" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              {folderModal.mode === 'create' ? 'Nouveau dossier' : 'Modifier le dossier'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nom du dossier</label>
                <input
                  type="text"
                  value={folderForm.name}
                  onChange={e => setFolderForm({ ...folderForm, name: e.target.value })}
                  onKeyDown={e => e.key === 'Enter' && (folderModal.mode === 'create' ? handleCreateFolder() : handleUpdateFolder())}
                  placeholder="Nom du dossier"
                  autoFocus
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Dossier parent</label>
                <select
                  value={folderForm.parentId}
                  onChange={e => setFolderForm({ ...folderForm, parentId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-400 bg-white"
                >
                  <option value="">— Racine —</option>
                  {allFlatFolders
                    .filter(f => folderModal.mode !== 'edit' || f.id !== folderModal.folder.id)
                    .map(f => (
                      <option key={f.id} value={f.id}>
                        {'\u00A0\u00A0'.repeat(f.depth)}{f.name}
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Couleur</label>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(FOLDER_COLORS).map(([key, style]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setFolderForm({ ...folderForm, color: key })}
                      className={`w-8 h-8 rounded-lg ${style.dot} transition-all ${
                        folderForm.color === key ? 'ring-2 ring-offset-2 ring-slate-400 scale-110' : 'hover:scale-105'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={folderModal.mode === 'create' ? handleCreateFolder : handleUpdateFolder}
                disabled={!folderForm.name.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 disabled:opacity-40 transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>{folderModal.mode === 'create' ? 'Créer' : 'Enregistrer'}</span>
              </button>
              <button
                onClick={() => setFolderModal(null)}
                className="flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <X className="w-4 h-4" /><span>Annuler</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* === Move Test Modal === */}
      {moveModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setMoveModal(null)}>
          <div className="bg-white rounded-xl shadow-2xl p-6 w-96" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-slate-900 mb-1">Déplacer le test</h3>
            <p className="text-sm text-slate-500 mb-4">« {moveModal.name} »</p>
            <select
              value={moveModal.folder_id || ''}
              onChange={e => handleMoveTest(moveModal.id, e.target.value || null)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-400 bg-white mb-4"
            >
              <option value="">— Non classé —</option>
              {allFlatFolders.map(f => (
                <option key={f.id} value={f.id}>
                  {'\u00A0\u00A0'.repeat(f.depth)}{f.name}
                </option>
              ))}
            </select>
            <button
              onClick={() => setMoveModal(null)}
              className="flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <X className="w-4 h-4" /><span>Fermer</span>
            </button>
          </div>
        </div>
      )}

      {/* === Context Menu === */}
      {contextMenu && contextFolder && (
        <div
          className="fixed z-50 bg-white rounded-lg shadow-xl border border-slate-200 py-1 min-w-[180px]"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={e => e.stopPropagation()}
        >
          <button
            onClick={() => openCreateFolder(contextFolder.id)}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <FolderPlus className="w-4 h-4 text-slate-400" />
            <span>Nouveau sous-dossier</span>
          </button>
          <button
            onClick={() => openEditFolder(contextFolder)}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <Edit2 className="w-4 h-4 text-slate-400" />
            <span>Renommer / Modifier</span>
          </button>
          <div className="border-t border-slate-100 my-1" />
          <button
            onClick={() => { handleDeleteFolder(contextFolder.id); setContextMenu(null); }}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>Supprimer le dossier</span>
          </button>
        </div>
      )}

      {/* === Launch URL Modal === */}
      {launchModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setLaunchModal(null)}>
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-lg mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-orange-100 flex items-center justify-center">
                  <Play className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">URL de test générée</h3>
                  <p className="text-xs text-slate-500">{launchModal.testName}</p>
                </div>
              </div>
              <button onClick={() => setLaunchModal(null)} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex items-center gap-2 mb-4">
              <input type="text" value={launchModal.url} readOnly className="flex-1 px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-sm font-mono truncate" />
              <button
                onClick={() => { navigator.clipboard.writeText(launchModal.url); }}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors flex-shrink-0"
              >
                <Copy className="w-4 h-4" />
                <span>Copier</span>
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <button
                onClick={() => { const w = 375, h = 812; window.open(launchModal.url, 'Mobile', `width=${w},height=${h},left=${(screen.width - w) / 2},top=${(screen.height - h) / 2},resizable=yes,scrollbars=yes`); }}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                <Smartphone className="w-4 h-4" />
                <span>Mode mobile</span>
              </button>
              <a
                href={launchModal.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-sm font-medium transition-colors"
              >
                <Play className="w-4 h-4" />
                <span>Ouvrir</span>
              </a>
            </div>
            <div className="flex flex-col items-center pt-3 border-t border-slate-100">
              <div className="bg-white p-3 rounded-lg border-2 border-slate-100">
                <QRCodeSVG value={launchModal.url} size={140} level="M" />
              </div>
              <p className="text-xs text-slate-400 mt-2">Scannez avec votre mobile</p>
            </div>
          </div>
        </div>
      )}

      {/* === Gherkin Editor === */}
      {gherkinEditing && (
        <GherkinEditorModal
          initialScript={gherkinEditing.script}
          testName={gherkinEditing.testName}
          onClose={() => setGherkinEditing(null)}
          onSave={async (script) => {
            if (gherkinEditing.testId) {
              try {
                const { error } = await supabase
                  .from('automated_test_catalog')
                  .update({ gherkin_script: script })
                  .eq('id', gherkinEditing.testId);
                if (error) throw error;
                await loadData();
              } catch (err) {
                console.error('Error saving Gherkin script:', err);
                alert('Erreur lors de la sauvegarde du script Gherkin');
              }
            } else {
              setFormData(prev => ({ ...prev, gherkin_script: script }));
            }
            setGherkinEditing(null);
          }}
        />
      )}

      {/* === Import Squash === */}
      {showImportModal && (
        <ImportSquashModal
          onClose={() => setShowImportModal(false)}
          existingIds={tests.map(t => t.id)}
          nextSortOrder={tests.length > 0 ? Math.max(...tests.map(t => t.sort_order || 0)) + 1 : 1}
          onImport={async (rows) => {
            const baseFolderId = selectedFolderId && selectedFolderId !== 'unfiled' ? selectedFolderId : null;

            const rowsWithPath = rows as (Record<string, unknown> & { tc_path?: string })[];
            const pathSegmentsMap = new Map<string, string[]>();
            for (const r of rowsWithPath) {
              const tcPath = (r.tc_path || '').trim();
              if (!tcPath) continue;
              const segs = tcPath.split('/').map((s: string) => s.trim()).filter(Boolean);
              if (segs.length > 0) pathSegmentsMap.set(r.id as string, segs);
            }

            const localFolders: TestFolder[] = [...folders];
            const folderIdByPath = new Map<string, string>();
            const getOrCreateFolder = async (segments: string[], parentId: string | null): Promise<string | null> => {
              if (segments.length === 0) return parentId;
              const key = segments.join('/');
              if (folderIdByPath.has(key)) return folderIdByPath.get(key)!;

              let query = supabase
                .from('test_folders')
                .select('id')
                .eq('name', segments[0]);
              if (parentId === null) {
                query = query.is('parent_id', null);
              } else {
                query = query.eq('parent_id', parentId);
              }
              const { data: existing } = await query.order('created_at', { ascending: true }).limit(50);

              let folderId: string;
              if (existing && existing.length > 0) {
                folderId = existing[0].id;
                if (existing.length > 1) {
                  const dupIds = existing.slice(1).map((d: { id: string }) => d.id);
                  await supabase.from('automated_test_catalog').update({ folder_id: folderId }).in('folder_id', dupIds);
                  const { data: childFolders } = await supabase.from('test_folders').select('id').in('parent_id', dupIds);
                  if (childFolders && childFolders.length > 0) {
                    await supabase.from('test_folders').update({ parent_id: folderId }).in('id', childFolders.map((c: { id: string }) => c.id));
                  }
                  await supabase.from('test_folders').delete().in('id', dupIds);
                  for (let i = localFolders.length - 1; i >= 0; i--) {
                    if (dupIds.includes(localFolders[i].id)) localFolders.splice(i, 1);
                  }
                }
              } else {
                const siblingCount = localFolders.filter(f => f.parent_id === parentId).length;
                const { data: created, error } = await supabase.from('test_folders').insert([{
                  name: segments[0],
                  parent_id: parentId,
                  sort_order: siblingCount + 1,
                  color: 'slate',
                }]).select('id').single();
                if (error) throw error;
                folderId = created.id;
                localFolders.push({ id: folderId, name: segments[0], parent_id: parentId, sort_order: siblingCount + 1, color: 'slate', icon: null });
              }

              folderIdByPath.set(key, folderId);
              return getOrCreateFolder(segments.slice(1), folderId);
            };

            const finalRows: Record<string, unknown>[] = [];
            for (const r of rowsWithPath) {
              const segs = pathSegmentsMap.get(r.id as string);
              let folderId = baseFolderId;
              if (segs && segs.length > 0) {
                folderId = await getOrCreateFolder(segs, baseFolderId);
              }
              const { tc_path: _tcPath, ...rest } = r;
              finalRows.push({ ...rest, folder_id: folderId });
            }

            const { error } = await supabase.from('automated_test_catalog').insert(finalRows);
            if (error) throw error;
            await loadData();
          }}
        />
      )}

      <datalist id="partner-options">
        {uniquePartners.map(p => <option key={p} value={p} />)}
      </datalist>
      <datalist id="test-type-options">
        {uniqueTestTypes.map(t => <option key={t} value={t} />)}
      </datalist>
    </div>
  );
};
