import React, { useState, useEffect } from 'react';
import { Settings, Plus, Save, Trash2, X } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

interface TestPreset {
  id?: string;
  key: string;
  name: string;
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
  business_provider_id?: string;
}

const emptyPreset: TestPreset = {
  key: '',
  name: '',
  partner_id: '',
  source_id: '',
  scale_id: '',
  amount: '0',
  duration: '24',
  first_name: 'MO',
  last_name: 'ZAR',
  birth_date: '1993-06-28',
  email: 'mo@zar.fr',
  mobile: '0662662255',
  return_url: 'https://www.darty.com',
  exchange_url: 'https://sofinco.exchange/demo',
  business_provider_id: ''
};

export default function TestPresetsConfig() {
  const [presets, setPresets] = useState<TestPreset[]>([]);
  const [editingPreset, setEditingPreset] = useState<TestPreset | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPresets();
  }, []);

  const loadPresets = async () => {
    try {
      const { data, error } = await supabase
        .from('test_presets')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      setPresets(data || []);
    } catch (error) {
      console.error('Error loading presets:', error);
      alert('Erreur lors du chargement des presets');
    } finally {
      setLoading(false);
    }
  };

  const handleSavePreset = async () => {
    if (!editingPreset) return;

    if (!editingPreset.key || !editingPreset.name || !editingPreset.partner_id || !editingPreset.source_id || !editingPreset.scale_id) {
      alert('Veuillez remplir tous les champs obligatoires (Key, Name, Partner ID, Source ID, Scale ID)');
      return;
    }

    setSaving(true);
    try {
      if (editingPreset.id) {
        const { id, ...presetData } = editingPreset;
        const { error } = await supabase
          .from('test_presets')
          .update({
            key: presetData.key,
            name: presetData.name,
            partner_id: presetData.partner_id,
            source_id: presetData.source_id,
            scale_id: presetData.scale_id,
            amount: presetData.amount,
            duration: presetData.duration,
            first_name: presetData.first_name,
            last_name: presetData.last_name,
            birth_date: presetData.birth_date,
            email: presetData.email,
            mobile: presetData.mobile,
            return_url: presetData.return_url,
            exchange_url: presetData.exchange_url,
            business_provider_id: presetData.business_provider_id || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', id);

        if (error) {
          console.error('Update error:', error);
          throw error;
        }
      } else {
        const { id, ...presetData } = editingPreset;
        const { error } = await supabase
          .from('test_presets')
          .insert({
            key: presetData.key,
            name: presetData.name,
            partner_id: presetData.partner_id,
            source_id: presetData.source_id,
            scale_id: presetData.scale_id,
            amount: presetData.amount,
            duration: presetData.duration,
            first_name: presetData.first_name,
            last_name: presetData.last_name,
            birth_date: presetData.birth_date,
            email: presetData.email,
            mobile: presetData.mobile,
            return_url: presetData.return_url,
            exchange_url: presetData.exchange_url,
            business_provider_id: presetData.business_provider_id || null
          });

        if (error) {
          console.error('Insert error:', error);
          throw error;
        }
      }

      await loadPresets();
      setIsModalOpen(false);
      setEditingPreset(null);
    } catch (error) {
      console.error('Error saving preset:', error);
      alert(`Erreur lors de la sauvegarde du preset: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePreset = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce preset ?')) return;

    try {
      const { error } = await supabase
        .from('test_presets')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await loadPresets();
    } catch (error) {
      console.error('Error deleting preset:', error);
      alert('Erreur lors de la suppression du preset');
    }
  };

  const openEditModal = (preset: TestPreset) => {
    setEditingPreset({ ...preset });
    setIsModalOpen(true);
  };

  const openNewModal = () => {
    setEditingPreset({ ...emptyPreset });
    setIsModalOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">Configurer les presets pour les tests manuels (génération d'URL)</p>
        </div>
        <button
          onClick={openNewModal}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Nouveau Preset</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {presets.map((preset) => (
          <div key={preset.id} className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-lg text-gray-800">{preset.name}</h3>
                <p className="text-sm text-gray-500">Key: {preset.key}</p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => openEditModal(preset)}
                  className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                >
                  <Settings className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeletePreset(preset.id!)}
                  className="p-1 text-red-600 hover:bg-red-50 rounded"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="space-y-1 text-sm text-gray-600">
              <p><span className="font-medium">Partner:</span> {preset.partner_id}</p>
              <p><span className="font-medium">Source:</span> {preset.source_id}</p>
              <p><span className="font-medium">Scale:</span> {preset.scale_id}</p>
              <p><span className="font-medium">Amount:</span> {preset.amount}</p>
              <p><span className="font-medium">Duration:</span> {preset.duration}</p>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && editingPreset && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-800">
                {editingPreset.id ? 'Modifier le Preset' : 'Nouveau Preset'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Key <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editingPreset.key}
                    onChange={(e) => setEditingPreset({ ...editingPreset, key: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="cra_darty"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editingPreset.name}
                    onChange={(e) => setEditingPreset({ ...editingPreset, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="CRA Darty"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Partner ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editingPreset.partner_id}
                    onChange={(e) => setEditingPreset({ ...editingPreset, partner_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="web_darty"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Source ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editingPreset.source_id}
                    onChange={(e) => setEditingPreset({ ...editingPreset, source_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="cra"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Scale ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editingPreset.scale_id}
                    onChange={(e) => setEditingPreset({ ...editingPreset, scale_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="DLIBR"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                  <input
                    type="text"
                    value={editingPreset.amount}
                    onChange={(e) => setEditingPreset({ ...editingPreset, amount: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="70000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                  <input
                    type="text"
                    value={editingPreset.duration}
                    onChange={(e) => setEditingPreset({ ...editingPreset, duration: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="24"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                  <input
                    type="text"
                    value={editingPreset.first_name}
                    onChange={(e) => setEditingPreset({ ...editingPreset, first_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="MO"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    value={editingPreset.last_name}
                    onChange={(e) => setEditingPreset({ ...editingPreset, last_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="ZAR"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Birth Date</label>
                  <input
                    type="text"
                    value={editingPreset.birth_date}
                    onChange={(e) => setEditingPreset({ ...editingPreset, birth_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="1993-06-28"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={editingPreset.email}
                    onChange={(e) => setEditingPreset({ ...editingPreset, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="mo@zar.fr"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mobile</label>
                  <input
                    type="tel"
                    value={editingPreset.mobile}
                    onChange={(e) => setEditingPreset({ ...editingPreset, mobile: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0662662255"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Return URL</label>
                  <input
                    type="url"
                    value={editingPreset.return_url}
                    onChange={(e) => setEditingPreset({ ...editingPreset, return_url: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://www.darty.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Exchange URL</label>
                  <input
                    type="url"
                    value={editingPreset.exchange_url}
                    onChange={(e) => setEditingPreset({ ...editingPreset, exchange_url: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://sofinco.exchange/demo"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Business Provider ID <span className="text-gray-500 text-xs">(optionnel)</span>
                  </label>
                  <input
                    type="text"
                    value={editingPreset.business_provider_id || ''}
                    onChange={(e) => setEditingPreset({ ...editingPreset, business_provider_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="99102572271"
                  />
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end space-x-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleSavePreset}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Sauvegarde...' : 'Sauvegarder'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
