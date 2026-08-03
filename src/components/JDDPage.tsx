import React, { useState, useEffect } from 'react';
import { Database, Plus, Search, Tag, CreditCard as Edit2, Trash2, X, Copy, Check, Upload, File, Download } from 'lucide-react';
import { supabase } from '../services/supabaseClient';

interface FileInfo {
  path: string;
  name: string;
  size: number;
  type: string;
}

interface TestDataEntry {
  id: string;
  category: string;
  title: string;
  description?: string;
  data_content: Record<string, any>;
  tags?: string[];
  created_by?: string;
  created_at: string;
  updated_at: string;
  file_info?: FileInfo;
}

const CATEGORIES = [
  { value: 'pids', label: 'PIDs', icon: '🪪' },
  { value: 'identifiants', label: 'Identifiants', icon: '🔑' },
  { value: 'linxo', label: 'Linxo', icon: '🏦' },
  { value: 'mitrust', label: 'Mitrust', icon: '🔐' },
  { value: 'autre', label: 'Autre', icon: '📦' }
];

export default function JDDPage() {
  const [entries, setEntries] = useState<TestDataEntry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<TestDataEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TestDataEntry | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    category: 'pids',
    title: '',
    description: '',
    data_content: {} as Record<string, string>,
    tags: '',
    created_by: ''
  });

  const [dataFields, setDataFields] = useState<Array<{ key: string; value: string }>>([
    { key: '', value: '' }
  ]);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);

  useEffect(() => {
    fetchEntries();
  }, []);

  useEffect(() => {
    filterEntries();
  }, [entries, searchTerm, selectedCategory]);

  const fetchEntries = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('test_data')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEntries(data || []);
    } catch (error) {
      console.error('Error fetching test data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterEntries = () => {
    let filtered = entries;

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(entry => entry.category === selectedCategory);
    }

    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      filtered = filtered.filter(entry =>
        entry.title.toLowerCase().includes(lowerSearch) ||
        entry.description?.toLowerCase().includes(lowerSearch) ||
        entry.tags?.some(tag => tag.toLowerCase().includes(lowerSearch))
      );
    }

    setFilteredEntries(filtered);
  };

  const handleOpenModal = (entry?: TestDataEntry) => {
    if (entry) {
      setEditingEntry(entry);
      setFormData({
        category: entry.category,
        title: entry.title,
        description: entry.description || '',
        data_content: entry.data_content,
        tags: entry.tags?.join(', ') || '',
        created_by: entry.created_by || ''
      });
      setDataFields(
        Object.entries(entry.data_content).map(([key, value]) => ({
          key,
          value: String(value)
        }))
      );
    } else {
      setEditingEntry(null);
      setFormData({
        category: 'pids',
        title: '',
        description: '',
        data_content: {},
        tags: '',
        created_by: ''
      });
      setDataFields([{ key: '', value: '' }]);
    }
    setSelectedFile(null);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingEntry(null);
    setSelectedFile(null);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleDownloadFile = async (fileInfo: FileInfo) => {
    try {
      const { data, error } = await supabase.storage
        .from('jdd-files')
        .download(fileInfo.path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileInfo.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('Erreur lors du téléchargement du fichier');
    }
  };

  const handleRemoveFile = async (entryId: string, fileInfo: FileInfo) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce fichier ?')) return;

    try {
      const { error: storageError } = await supabase.storage
        .from('jdd-files')
        .remove([fileInfo.path]);

      if (storageError) throw storageError;

      const { error: dbError } = await supabase
        .from('test_data')
        .update({ file_info: null })
        .eq('id', entryId);

      if (dbError) throw dbError;

      await fetchEntries();
    } catch (error) {
      console.error('Error removing file:', error);
      alert('Erreur lors de la suppression du fichier');
    }
  };

  const handleAddField = () => {
    setDataFields([...dataFields, { key: '', value: '' }]);
  };

  const handleRemoveField = (index: number) => {
    setDataFields(dataFields.filter((_, i) => i !== index));
  };

  const handleFieldChange = (index: number, field: 'key' | 'value', value: string) => {
    const newFields = [...dataFields];
    newFields[index][field] = value;
    setDataFields(newFields);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const dataContent = dataFields.reduce((acc, field) => {
      if (field.key && field.value) {
        acc[field.key] = field.value;
      }
      return acc;
    }, {} as Record<string, string>);

    const tags = formData.tags
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag);

    try {
      setUploadingFile(true);
      let fileInfo: FileInfo | null = null;

      if (selectedFile) {
        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('jdd-files')
          .upload(filePath, selectedFile);

        if (uploadError) throw uploadError;

        fileInfo = {
          path: filePath,
          name: selectedFile.name,
          size: selectedFile.size,
          type: selectedFile.type
        };
      }

      const payload = {
        category: formData.category,
        title: formData.title,
        description: formData.description || null,
        data_content: dataContent,
        tags: tags.length > 0 ? tags : null,
        created_by: formData.created_by || null,
        updated_at: new Date().toISOString(),
        ...(fileInfo && { file_info: fileInfo })
      };

      if (editingEntry) {
        const { error } = await supabase
          .from('test_data')
          .update(payload)
          .eq('id', editingEntry.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('test_data')
          .insert(payload);

        if (error) throw error;
      }

      await fetchEntries();
      handleCloseModal();
    } catch (error) {
      console.error('Error saving test data:', error);
      alert('Erreur lors de la sauvegarde des données');
    } finally {
      setUploadingFile(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette entrée ?')) return;

    try {
      const entry = entries.find(e => e.id === id);

      if (entry?.file_info) {
        const { error: storageError } = await supabase.storage
          .from('jdd-files')
          .remove([entry.file_info.path]);

        if (storageError) console.error('Error deleting file:', storageError);
      }

      const { error } = await supabase
        .from('test_data')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchEntries();
    } catch (error) {
      console.error('Error deleting test data:', error);
      alert('Erreur lors de la suppression');
    }
  };

  const handleCopy = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const getCategoryIcon = (category: string) => {
    return CATEGORIES.find(cat => cat.value === category)?.icon || '📦';
  };

  const getCategoryLabel = (category: string) => {
    return CATEGORIES.find(cat => cat.value === category)?.label || category;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Database className="w-8 h-8 text-blue-400" />
          <div>
            <h1 className="text-2xl font-bold text-white">Jeux De Données (JDD)</h1>
            <p className="text-sm text-gray-400">Données de test partagées pour l'équipe QA</p>
          </div>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Nouvelle donnée</span>
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Rechercher par titre, description ou tags..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">Toutes les catégories</option>
          {CATEGORIES.map(cat => (
            <option key={cat.value} value={cat.value}>
              {cat.icon} {cat.label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredEntries.length === 0 ? (
          <div className="text-center py-12 bg-gray-800 rounded-lg">
            <Database className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">Aucune donnée trouvée</p>
          </div>
        ) : (
          filteredEntries.map(entry => (
            <div
              key={entry.id}
              className="bg-gray-800 rounded-lg p-6 hover:bg-gray-750 transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start space-x-3 flex-1">
                  <span className="text-3xl">{getCategoryIcon(entry.category)}</span>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="text-lg font-semibold text-white">{entry.title}</h3>
                      <span className="text-xs px-2 py-1 bg-gray-700 text-gray-300 rounded">
                        {getCategoryLabel(entry.category)}
                      </span>
                    </div>
                    {entry.description && (
                      <p className="text-sm text-gray-400 mb-2">{entry.description}</p>
                    )}
                    {entry.tags && entry.tags.length > 0 && (
                      <div className="flex items-center gap-2 flex-wrap">
                        {entry.tags.map((tag, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center text-xs px-2 py-1 bg-blue-900/30 text-blue-300 rounded"
                          >
                            <Tag className="w-3 h-3 mr-1" />
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleOpenModal(entry)}
                    className="p-2 text-gray-400 hover:text-blue-400 hover:bg-gray-700 rounded transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(entry.id)}
                    className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="bg-gray-900 rounded-lg p-4 space-y-2">
                {Object.entries(entry.data_content).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between group">
                    <div className="flex-1">
                      <span className="text-sm text-gray-400 font-medium">{key}:</span>
                      <span className="ml-2 text-sm text-white">{String(value)}</span>
                    </div>
                    <button
                      onClick={() => handleCopy(String(value), `${entry.id}-${key}`)}
                      className="p-1.5 text-gray-500 hover:text-blue-400 hover:bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-all"
                      title="Copier"
                    >
                      {copiedField === `${entry.id}-${key}` ? (
                        <Check className="w-4 h-4 text-green-400" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                ))}
              </div>

              {entry.file_info && (
                <div className="mt-4 bg-gray-900 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <File className="w-5 h-5 text-blue-400" />
                      <div>
                        <p className="text-sm text-white font-medium">{entry.file_info.name}</p>
                        <p className="text-xs text-gray-500">
                          {(entry.file_info.size / 1024).toFixed(2)} KB
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleDownloadFile(entry.file_info!)}
                        className="p-2 text-blue-400 hover:bg-gray-800 rounded transition-colors"
                        title="Télécharger"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleRemoveFile(entry.id, entry.file_info!)}
                        className="p-2 text-red-400 hover:bg-gray-800 rounded transition-colors"
                        title="Supprimer le fichier"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                <span>
                  {entry.created_by && `Créé par ${entry.created_by} • `}
                  {new Date(entry.created_at).toLocaleDateString('fr-FR')}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gray-800 border-b border-gray-700 p-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">
                {editingEntry ? 'Modifier la donnée' : 'Nouvelle donnée'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Catégorie *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat.value} value={cat.value}>
                      {cat.icon} {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Titre *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: Compte utilisateur test principal"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Description détaillée de cette donnée de test"
                  rows={3}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-300">
                    Données *
                  </label>
                  <button
                    type="button"
                    onClick={handleAddField}
                    className="text-xs text-blue-400 hover:text-blue-300 flex items-center space-x-1"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Ajouter un champ</span>
                  </button>
                </div>
                <div className="space-y-2">
                  {dataFields.map((field, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={field.key}
                        onChange={(e) => handleFieldChange(index, 'key', e.target.value)}
                        className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Clé (ex: email, username)"
                        required
                      />
                      <input
                        type="text"
                        value={field.value}
                        onChange={(e) => handleFieldChange(index, 'value', e.target.value)}
                        className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Valeur"
                        required
                      />
                      {dataFields.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveField(index)}
                          className="p-2 text-red-400 hover:bg-gray-700 rounded transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Tags (séparés par des virgules)
                </label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: production, valide, visa"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Créé par
                </label>
                <input
                  type="text"
                  value={formData.created_by}
                  onChange={(e) => setFormData({ ...formData, created_by: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Votre nom"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Fichier joint
                </label>
                {editingEntry?.file_info && !selectedFile && (
                  <div className="mb-3 p-3 bg-gray-700 rounded-lg flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <File className="w-4 h-4 text-blue-400" />
                      <span className="text-sm text-white">{editingEntry.file_info.name}</span>
                      <span className="text-xs text-gray-400">
                        ({(editingEntry.file_info.size / 1024).toFixed(2)} KB)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(editingEntry.id, editingEntry.file_info!)}
                      className="text-red-400 hover:text-red-300 text-xs"
                    >
                      Supprimer
                    </button>
                  </div>
                )}
                <div className="relative">
                  <input
                    type="file"
                    id="file-upload"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <label
                    htmlFor="file-upload"
                    className="flex items-center justify-center space-x-2 w-full px-4 py-3 bg-gray-700 border-2 border-dashed border-gray-600 rounded-lg text-gray-300 hover:bg-gray-650 hover:border-gray-500 cursor-pointer transition-colors"
                  >
                    <Upload className="w-5 h-5" />
                    <span className="text-sm">
                      {selectedFile ? selectedFile.name : 'Cliquez pour joindre un fichier'}
                    </span>
                  </label>
                </div>
                {selectedFile && (
                  <div className="mt-2 flex items-center justify-between text-sm text-gray-400">
                    <span>{(selectedFile.size / 1024).toFixed(2)} KB</span>
                    <button
                      type="button"
                      onClick={() => setSelectedFile(null)}
                      className="text-red-400 hover:text-red-300"
                    >
                      Annuler
                    </button>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={uploadingFile}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {uploadingFile && (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  )}
                  <span>{uploadingFile ? 'Enregistrement...' : (editingEntry ? 'Mettre à jour' : 'Créer')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
