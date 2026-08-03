import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Plus, CreditCard as Edit2, Trash2, Save, X, Check } from 'lucide-react';
import { getPartnerLogo, type Partner } from '../utils/partnerLogos';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

interface TestCatalogItem {
  id: string;
  name: string;
  test_type: string;
  partner: string;
  is_active: boolean;
  sort_order: number;
}

export const TestCatalogPage: React.FC = () => {
  const [tests, setTests] = useState<TestCatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState<Partial<TestCatalogItem>>({
    id: '',
    name: '',
    test_type: '',
    partner: '',
    is_active: true,
    sort_order: 0
  });

  useEffect(() => {
    loadTests();
  }, []);

  const loadTests = async () => {
    try {
      console.log('Loading tests from automated_test_catalog...');
      const { data, error } = await supabase
        .from('automated_test_catalog')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Loaded tests:', data);
      setTests(data || []);
    } catch (error) {
      console.error('Error loading tests:', error);
      alert('Erreur lors du chargement des tests: ' + (error instanceof Error ? error.message : 'Erreur inconnue'));
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (test: TestCatalogItem) => {
    setEditingId(test.id);
    setFormData(test);
    setIsAdding(false);
  };

  const handleAdd = () => {
    setIsAdding(true);
    setEditingId(null);
    setFormData({
      id: '',
      name: '',
      test_type: '',
      partner: '',
      is_active: true,
      sort_order: tests.length + 1
    });
  };

  const handleCancel = () => {
    setEditingId(null);
    setIsAdding(false);
    setFormData({
      id: '',
      name: '',
      test_type: '',
      partner: '',
      is_active: true,
      sort_order: 0
    });
  };

  const handleSave = async () => {
    try {
      if (!formData.id || !formData.name || !formData.test_type || !formData.partner) {
        alert('Tous les champs sont requis');
        return;
      }

      if (isAdding) {
        const { error } = await supabase
          .from('automated_test_catalog')
          .insert([formData]);

        if (error) throw error;
      } else if (editingId) {
        const { error } = await supabase
          .from('automated_test_catalog')
          .update(formData)
          .eq('id', editingId);

        if (error) throw error;
      }

      await loadTests();
      handleCancel();
    } catch (error) {
      console.error('Error saving test:', error);
      alert('Erreur lors de la sauvegarde du test');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce test ?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('automated_test_catalog')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await loadTests();
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
      await loadTests();
    } catch (error) {
      console.error('Error updating test status:', error);
      alert('Erreur lors de la mise à jour du statut');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Chargement...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-sm text-gray-500">Gérer la liste des tests disponibles pour l'exécution automatique</p>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Ajouter un test</span>
        </button>
      </div>

      {isAdding && (
        <div className="mb-6 p-6 bg-white border-2 border-green-500 rounded-lg shadow-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Nouveau test</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ID du test</label>
              <input
                type="text"
                value={formData.id}
                onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                placeholder="SOF-123456"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom du test</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="CR < 3000€ prospect"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type de test</label>
              <input
                type="text"
                value={formData.test_type}
                onChange={(e) => setFormData({ ...formData, test_type: e.target.value })}
                placeholder="CC, CL web, CEASY x Essentiel"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Partenaire</label>
              <input
                type="text"
                value={formData.partner}
                onChange={(e) => setFormData({ ...formData, partner: e.target.value })}
                placeholder="sofinco, darty, fnac..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ordre d'affichage</label>
              <input
                type="number"
                value={formData.sort_order}
                onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_active_new"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="h-4 w-4 text-green-600 border-gray-300 rounded"
              />
              <label htmlFor="is_active_new" className="text-sm font-medium text-gray-700">Actif</label>
            </div>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handleSave}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>Sauvegarder</span>
            </button>
            <button
              onClick={handleCancel}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              <X className="w-4 h-4" />
              <span>Annuler</span>
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Partenaire</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ordre</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {tests.map((test) => {
              const isEditing = editingId === test.id;
              const partnerLogo = getPartnerLogo(test.partner as Partner);

              if (isEditing) {
                return (
                  <tr key={test.id} className="bg-blue-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={formData.is_active}
                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                        className="h-4 w-4 text-green-600 border-gray-300 rounded"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="text"
                        value={formData.id}
                        onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                        className="w-full px-2 py-1 border border-gray-300 rounded"
                        disabled
                      />
                    </td>
                    <td className="px-6 py-4">
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-2 py-1 border border-gray-300 rounded"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <input
                        type="text"
                        value={formData.test_type}
                        onChange={(e) => setFormData({ ...formData, test_type: e.target.value })}
                        className="w-full px-2 py-1 border border-gray-300 rounded"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <input
                        type="text"
                        value={formData.partner}
                        onChange={(e) => setFormData({ ...formData, partner: e.target.value })}
                        className="w-full px-2 py-1 border border-gray-300 rounded"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="number"
                        value={formData.sort_order}
                        onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) })}
                        className="w-20 px-2 py-1 border border-gray-300 rounded"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={handleSave}
                        className="text-green-600 hover:text-green-900 mr-3"
                      >
                        <Save className="w-4 h-4" />
                      </button>
                      <button
                        onClick={handleCancel}
                        className="text-gray-600 hover:text-gray-900"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              }

              return (
                <tr key={test.id} className={test.is_active ? '' : 'bg-gray-50 opacity-60'}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => toggleActive(test)}
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        test.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {test.is_active ? (
                        <span className="flex items-center space-x-1">
                          <Check className="w-3 h-3" />
                          <span>Actif</span>
                        </span>
                      ) : (
                        'Inactif'
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {test.id}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {test.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {test.test_type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      {partnerLogo && (
                        <img
                          src={partnerLogo.src}
                          alt={partnerLogo.alt}
                          className="w-6 h-6 object-contain rounded"
                        />
                      )}
                      <span className="text-sm text-gray-900">{test.partner}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {test.sort_order}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleEdit(test)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(test.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {tests.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            Aucun test dans le catalogue. Cliquez sur "Ajouter un test" pour commencer.
          </div>
        )}
      </div>
    </div>
  );
};
