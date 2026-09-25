import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Save, X, RefreshCw, Tag } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

interface TagGroup {
  id: string;
  name: string;
  description: string;
  tags: string[];
  color: string;
  sort_order: number;
  is_active: boolean;
}

const COLORS = ['red', 'green', 'blue', 'orange', 'purple', 'teal', 'yellow', 'gray'];

const COLOR_CLASSES: Record<string, string> = {
  red: 'bg-red-100 text-red-700 border-red-300',
  green: 'bg-green-100 text-green-700 border-green-300',
  blue: 'bg-blue-100 text-blue-700 border-blue-300',
  orange: 'bg-orange-100 text-orange-700 border-orange-300',
  purple: 'bg-purple-100 text-purple-700 border-purple-300',
  teal: 'bg-teal-100 text-teal-700 border-teal-300',
  yellow: 'bg-yellow-100 text-yellow-700 border-yellow-300',
  gray: 'bg-gray-100 text-gray-700 border-gray-300',
};

const COLOR_DOT: Record<string, string> = {
  red: 'bg-red-500',
  green: 'bg-green-500',
  blue: 'bg-blue-500',
  orange: 'bg-orange-500',
  purple: 'bg-purple-500',
  teal: 'bg-teal-500',
  yellow: 'bg-yellow-500',
  gray: 'bg-gray-500',
};

const EMPTY_GROUP: Omit<TagGroup, 'id'> = {
  name: '',
  description: '',
  tags: [],
  color: 'blue',
  sort_order: 0,
  is_active: true,
};

const TagGroupsConfig: React.FC = () => {
  const [groups, setGroups] = useState<TagGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState<Omit<TagGroup, 'id'>>(EMPTY_GROUP);
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('tag_groups')
        .select('*')
        .order('sort_order');
      if (error) throw error;
      setGroups(data || []);
    } catch (err) {
      console.error('Error loading tag groups:', err);
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (group: TagGroup) => {
    setEditingId(group.id);
    setFormData({
      name: group.name,
      description: group.description || '',
      tags: [...group.tags],
      color: group.color,
      sort_order: group.sort_order,
      is_active: group.is_active,
    });
    setTagInput('');
    setShowAddForm(false);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData(EMPTY_GROUP);
    setTagInput('');
  };

  const startAdd = () => {
    setShowAddForm(true);
    setEditingId(null);
    setFormData({ ...EMPTY_GROUP, sort_order: groups.length + 1 });
    setTagInput('');
  };

  const addTagToForm = () => {
    const t = tagInput.trim();
    if (!t || formData.tags.includes(t)) return;
    setFormData(prev => ({ ...prev, tags: [...prev.tags, t] }));
    setTagInput('');
  };

  const removeTagFromForm = (tag: string) => {
    setFormData(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }));
  };

  const saveGroup = async () => {
    if (!formData.name.trim()) return;
    setSaving(true);
    try {
      if (editingId) {
        const { error } = await supabase
          .from('tag_groups')
          .update({ ...formData, updated_at: new Date().toISOString() })
          .eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('tag_groups')
          .insert([formData]);
        if (error) throw error;
      }
      await loadGroups();
      cancelEdit();
      setShowAddForm(false);
    } catch (err) {
      console.error('Error saving tag group:', err);
      alert('Erreur lors de la sauvegarde.');
    } finally {
      setSaving(false);
    }
  };

  const deleteGroup = async (id: string) => {
    if (!confirm('Supprimer ce groupe de tags ?')) return;
    try {
      const { error } = await supabase.from('tag_groups').delete().eq('id', id);
      if (error) throw error;
      setGroups(prev => prev.filter(g => g.id !== id));
    } catch (err) {
      console.error('Error deleting tag group:', err);
    }
  };

  const toggleActive = async (group: TagGroup) => {
    try {
      const { error } = await supabase
        .from('tag_groups')
        .update({ is_active: !group.is_active, updated_at: new Date().toISOString() })
        .eq('id', group.id);
      if (error) throw error;
      setGroups(prev => prev.map(g => g.id === group.id ? { ...g, is_active: !g.is_active } : g));
    } catch (err) {
      console.error('Error toggling group:', err);
    }
  };

  const FormSection = ({ isNew }: { isNew: boolean }) => (
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 space-y-4">
      <h3 className="font-semibold text-blue-900 text-sm">{isNew ? 'Nouveau groupe de tags' : 'Modifier le groupe'}</h3>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Nom *</label>
          <input
            type="text"
            value={formData.name}
            onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Ex: Smoke tests"
            className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Couleur</label>
          <div className="flex gap-2 flex-wrap">
            {COLORS.map(color => (
              <button
                key={color}
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, color }))}
                className={`w-6 h-6 rounded-full transition-all ${COLOR_DOT[color]} ${
                  formData.color === color ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : 'opacity-60 hover:opacity-100'
                }`}
                title={color}
              />
            ))}
          </div>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
        <input
          type="text"
          value={formData.description}
          onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Description courte du groupe..."
          className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Tags du groupe</label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={tagInput}
            onChange={e => setTagInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addTagToForm()}
            placeholder="Ajouter un tag..."
            className="flex-1 text-sm px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="button"
            onClick={addTagToForm}
            disabled={!tagInput.trim()}
            className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40 transition-colors text-sm"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        {formData.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {formData.tags.map(tag => (
              <span
                key={tag}
                className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border font-medium ${COLOR_CLASSES[formData.color] || COLOR_CLASSES.gray}`}
              >
                {tag}
                <button onClick={() => removeTagFromForm(tag)} className="hover:opacity-75">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Ordre d'affichage</label>
          <input
            type="number"
            value={formData.sort_order}
            onChange={e => setFormData(prev => ({ ...prev, sort_order: Number(e.target.value) }))}
            className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-end">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.is_active}
              onChange={e => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded"
            />
            <span className="text-sm text-gray-700">Actif</span>
          </label>
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          onClick={() => { isNew ? setShowAddForm(false) : cancelEdit(); setTagInput(''); }}
          className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
        >
          Annuler
        </button>
        <button
          onClick={saveGroup}
          disabled={saving || !formData.name.trim()}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors text-sm flex items-center justify-center gap-2"
        >
          {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Enregistrer
        </button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-6 h-6 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Tag className="w-5 h-5 text-blue-600" />
            Groupes de tags
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Configurez les suggestions de tags affichées dans l'onglet "Exécution par tag".
          </p>
        </div>
        <button
          onClick={startAdd}
          disabled={showAddForm}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Nouveau groupe
        </button>
      </div>

      {showAddForm && <FormSection isNew />}

      <div className="space-y-3">
        {groups.length === 0 && !showAddForm && (
          <div className="text-center py-12 text-gray-400">
            <Tag className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Aucun groupe configuré. Créez votre premier groupe.</p>
          </div>
        )}
        {groups.map(group => {
          const colors = COLOR_CLASSES[group.color] || COLOR_CLASSES.gray;
          const isEditing = editingId === group.id;

          return (
            <div key={group.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              {isEditing ? (
                <div className="p-5">
                  <FormSection isNew={false} />
                </div>
              ) : (
                <div className="px-5 py-4 flex items-start gap-4">
                  <div className={`w-3 h-3 rounded-full mt-1.5 flex-shrink-0 ${COLOR_DOT[group.color] || COLOR_DOT.gray}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-gray-900 text-sm">{group.name}</span>
                      {!group.is_active && (
                        <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full">inactif</span>
                      )}
                    </div>
                    {group.description && (
                      <p className="text-xs text-gray-500 mb-2">{group.description}</p>
                    )}
                    <div className="flex flex-wrap gap-1.5">
                      {group.tags.length === 0 ? (
                        <span className="text-xs text-gray-400">Aucun tag</span>
                      ) : group.tags.map(tag => (
                        <span key={tag} className={`text-xs px-2.5 py-0.5 rounded-full border font-medium ${colors}`}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => toggleActive(group)}
                      className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                        group.is_active
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {group.is_active ? 'Actif' : 'Inactif'}
                    </button>
                    <button
                      onClick={() => startEdit(group)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Modifier"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteGroup(group.id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TagGroupsConfig;
