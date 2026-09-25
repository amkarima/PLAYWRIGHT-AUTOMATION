import React, { useState, useEffect } from 'react';
import { Settings, Plus, Save, Trash2, X, Link2, User, CreditCard, Globe, Tag, Copy, Check } from 'lucide-react';
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
  static_url?: string | null;
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
  business_provider_id: '',
  static_url: ''
};

const inputClass = (disabled: boolean) =>
  `w-full px-3.5 py-2.5 rounded-lg border transition-all duration-200 ${
    disabled
      ? 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed'
      : 'bg-white border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 hover:border-gray-400'
  }`;

const labelClass = "block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide";

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className={labelClass}>
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
        {hint && <span className="font-normal text-gray-400 normal-case tracking-normal ml-1">— {hint}</span>}
      </label>
      {children}
    </div>
  );
}

function SectionHeader({ icon: Icon, title, subtitle }: { icon: React.ElementType; title: string; subtitle: string }) {
  return (
    <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-100">
      <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
        <Icon className="w-5 h-5 text-blue-600" />
      </div>
      <div>
        <h4 className="text-sm font-bold text-gray-800">{title}</h4>
        <p className="text-xs text-gray-500">{subtitle}</p>
      </div>
    </div>
  );
}

export default function TestPresetsConfig() {
  const [presets, setPresets] = useState<TestPreset[]>([]);
  const [editingPreset, setEditingPreset] = useState<TestPreset | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

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

    const isStatic = editingPreset.static_url && editingPreset.static_url.trim().length > 0;

    if (!isStatic && (!editingPreset.key || !editingPreset.name || !editingPreset.partner_id || !editingPreset.source_id || !editingPreset.scale_id)) {
      alert('Veuillez remplir tous les champs obligatoires (Key, Name, Partner ID, Source ID, Scale ID)');
      return;
    }

    if (isStatic && !editingPreset.name) {
      alert('Veuillez au moins renseigner le nom du preset');
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
            static_url: presetData.static_url?.trim() || null,
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
            business_provider_id: presetData.business_provider_id || null,
            static_url: presetData.static_url?.trim() || null,
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

  const handleCopyStaticUrl = async (preset: TestPreset) => {
    if (!preset.static_url) return;
    try {
      await navigator.clipboard.writeText(preset.static_url);
      setCopiedId(preset.id!);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // ignore
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
      <div className="flex flex-col items-center justify-center h-64 space-y-3">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <div className="text-sm text-gray-500">Chargement des presets...</div>
      </div>
    );
  }

  const isStaticMode = editingPreset ? !!(editingPreset.static_url && editingPreset.static_url.trim().length > 0) : false;

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex items-center justify-between bg-white rounded-xl border border-gray-200 px-5 py-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm">
            <Settings className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-800">Presets de tests manuels</h3>
            <p className="text-sm text-gray-500">Configurer les presets pour la génération d'URL de test</p>
          </div>
        </div>
        <button
          onClick={openNewModal}
          className="px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:scale-[0.98] transition-all flex items-center space-x-2 shadow-sm font-medium text-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Nouveau Preset</span>
        </button>
      </div>

      {/* Presets grid */}
      {presets.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <Settings className="w-8 h-8 text-gray-300" />
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Aucun preset configuré</h3>
          <p className="text-sm text-gray-500 mb-6">Créez votre premier preset pour générer des URL de test.</p>
          <button
            onClick={openNewModal}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center space-x-2 text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            <span>Créer un preset</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {presets.map((preset) => {
            const hasStatic = !!(preset.static_url && preset.static_url.trim());
            return (
              <div
                key={preset.id}
                className="group bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-gray-300 transition-all duration-200 overflow-hidden"
              >
                {/* Card header */}
                <div className="px-5 pt-5 pb-3 flex items-start justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0 ${hasStatic ? 'bg-amber-50' : 'bg-blue-50'}`}>
                      {hasStatic ? <Link2 className="w-5 h-5 text-amber-600" /> : <Tag className="w-5 h-5 text-blue-600" />}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-gray-800 truncate">{preset.name}</h3>
                      <p className="text-xs text-gray-400 font-mono truncate">{preset.key || '—'}</p>
                    </div>
                  </div>
                  <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openEditModal(preset)}
                      className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                      title="Modifier"
                    >
                      <Settings className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeletePreset(preset.id!)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Card body */}
                <div className="px-5 pb-4">
                  {hasStatic ? (
                    <div className="space-y-3">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-medium">
                        <Link2 className="w-3 h-3" />
                        URL statique
                      </div>
                      <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                        <span className="text-xs text-gray-500 truncate flex-1 font-mono">{preset.static_url}</span>
                        <button
                          onClick={() => handleCopyStaticUrl(preset)}
                          className="p-1 text-gray-400 hover:text-blue-600 transition-colors flex-shrink-0"
                          title="Copier l'URL"
                        >
                          {copiedId === preset.id ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                      <div>
                        <span className="text-gray-400">Partner</span>
                        <p className="text-gray-700 font-medium truncate">{preset.partner_id}</p>
                      </div>
                      <div>
                        <span className="text-gray-400">Source</span>
                        <p className="text-gray-700 font-medium truncate">{preset.source_id}</p>
                      </div>
                      <div>
                        <span className="text-gray-400">Scale</span>
                        <p className="text-gray-700 font-medium truncate">{preset.scale_id}</p>
                      </div>
                      <div>
                        <span className="text-gray-400">Montant</span>
                        <p className="text-gray-700 font-medium truncate">{preset.amount}€</p>
                      </div>
                      <div>
                        <span className="text-gray-400">Durée</span>
                        <p className="text-gray-700 font-medium truncate">{preset.duration} mois</p>
                      </div>
                      <div>
                        <span className="text-gray-400">Mobile</span>
                        <p className="text-gray-700 font-medium truncate">{preset.mobile}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Card footer */}
                {!hasStatic && (
                  <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs">
                    <span className="text-gray-400 truncate">{preset.email}</span>
                    <span className="text-gray-400 flex-shrink-0 ml-2">{preset.return_url?.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && editingPreset && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] overflow-hidden flex flex-col">
            {/* Modal header */}
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center shadow-sm">
                  <Settings className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800">
                    {editingPreset.id ? 'Modifier le preset' : 'Nouveau preset'}
                  </h3>
                  <p className="text-xs text-gray-500">Configuration du preset de test manuel</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal body */}
            <div className="px-6 py-6 overflow-y-auto flex-1 space-y-8">
              {/* Static URL section — at top, controls the rest */}
              <div className={`rounded-xl border-2 p-5 transition-all duration-200 ${isStaticMode ? 'border-amber-300 bg-amber-50/40' : 'border-gray-200 bg-gray-50/50'}`}>
                <SectionHeader
                  icon={Link2}
                  title="URL statique"
                  subtitle="Si renseignée, cette URL est utilisée directement et tous les autres champs sont désactivés"
                />
                <Field label="URL statique" hint="optionnel">
                  <input
                    type="url"
                    value={editingPreset.static_url || ''}
                    onChange={(e) => setEditingPreset({ ...editingPreset, static_url: e.target.value })}
                    className={inputClass(false)}
                    placeholder="https://rct-app.sofinco.fr/..."
                  />
                </Field>
                {isStaticMode && (
                  <div className="mt-3 flex items-start gap-2 px-3 py-2.5 bg-amber-100/60 rounded-lg">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
                    <p className="text-xs text-amber-800">
                      Mode URL statique activé — tous les champs ci-dessous sont désactivés car l'URL sera utilisée telle quelle.
                    </p>
                  </div>
                )}
              </div>

              {/* General section */}
              <div className={`rounded-xl border border-gray-200 p-5 transition-all duration-200 ${isStaticMode ? 'opacity-40' : 'opacity-100'}`}>
                <SectionHeader icon={Tag} title="Informations générales" subtitle="Identifiant et nom du preset" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Key" required>
                    <input
                      type="text"
                      value={editingPreset.key}
                      onChange={(e) => setEditingPreset({ ...editingPreset, key: e.target.value })}
                      className={inputClass(isStaticMode)}
                      disabled={isStaticMode}
                      placeholder="cra_darty"
                    />
                  </Field>
                  <Field label="Name" required>
                    <input
                      type="text"
                      value={editingPreset.name}
                      onChange={(e) => setEditingPreset({ ...editingPreset, name: e.target.value })}
                      className={inputClass(false)}
                      placeholder="CRA Darty"
                    />
                  </Field>
                </div>
              </div>

              {/* Partner config section */}
              <div className={`rounded-xl border border-gray-200 p-5 transition-all duration-200 ${isStaticMode ? 'opacity-40' : 'opacity-100'}`}>
                <SectionHeader icon={CreditCard} title="Configuration partenaire" subtitle="Identifiants et paramètres financiers" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Field label="Partner ID" required>
                    <input
                      type="text"
                      value={editingPreset.partner_id}
                      onChange={(e) => setEditingPreset({ ...editingPreset, partner_id: e.target.value })}
                      className={inputClass(isStaticMode)}
                      disabled={isStaticMode}
                      placeholder="web_darty"
                    />
                  </Field>
                  <Field label="Source ID" required>
                    <input
                      type="text"
                      value={editingPreset.source_id}
                      onChange={(e) => setEditingPreset({ ...editingPreset, source_id: e.target.value })}
                      className={inputClass(isStaticMode)}
                      disabled={isStaticMode}
                      placeholder="cra"
                    />
                  </Field>
                  <Field label="Scale ID" required>
                    <input
                      type="text"
                      value={editingPreset.scale_id}
                      onChange={(e) => setEditingPreset({ ...editingPreset, scale_id: e.target.value })}
                      className={inputClass(isStaticMode)}
                      disabled={isStaticMode}
                      placeholder="DLIBR"
                    />
                  </Field>
                  <Field label="Montant">
                    <input
                      type="text"
                      value={editingPreset.amount}
                      onChange={(e) => setEditingPreset({ ...editingPreset, amount: e.target.value })}
                      className={inputClass(isStaticMode)}
                      disabled={isStaticMode}
                      placeholder="70000"
                    />
                  </Field>
                  <Field label="Durée (mois)">
                    <input
                      type="text"
                      value={editingPreset.duration}
                      onChange={(e) => setEditingPreset({ ...editingPreset, duration: e.target.value })}
                      className={inputClass(isStaticMode)}
                      disabled={isStaticMode}
                      placeholder="24"
                    />
                  </Field>
                  <Field label="Business Provider ID" hint="optionnel">
                    <input
                      type="text"
                      value={editingPreset.business_provider_id || ''}
                      onChange={(e) => setEditingPreset({ ...editingPreset, business_provider_id: e.target.value })}
                      className={inputClass(isStaticMode)}
                      disabled={isStaticMode}
                      placeholder="99102572271"
                    />
                  </Field>
                </div>
              </div>

              {/* Client info section */}
              <div className={`rounded-xl border border-gray-200 p-5 transition-all duration-200 ${isStaticMode ? 'opacity-40' : 'opacity-100'}`}>
                <SectionHeader icon={User} title="Informations client" subtitle="Données du client fictif" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Prénom">
                    <input
                      type="text"
                      value={editingPreset.first_name}
                      onChange={(e) => setEditingPreset({ ...editingPreset, first_name: e.target.value })}
                      className={inputClass(isStaticMode)}
                      disabled={isStaticMode}
                      placeholder="MO"
                    />
                  </Field>
                  <Field label="Nom">
                    <input
                      type="text"
                      value={editingPreset.last_name}
                      onChange={(e) => setEditingPreset({ ...editingPreset, last_name: e.target.value })}
                      className={inputClass(isStaticMode)}
                      disabled={isStaticMode}
                      placeholder="ZAR"
                    />
                  </Field>
                  <Field label="Date de naissance">
                    <input
                      type="text"
                      value={editingPreset.birth_date}
                      onChange={(e) => setEditingPreset({ ...editingPreset, birth_date: e.target.value })}
                      className={inputClass(isStaticMode)}
                      disabled={isStaticMode}
                      placeholder="1993-06-28"
                    />
                  </Field>
                  <Field label="Mobile">
                    <input
                      type="tel"
                      value={editingPreset.mobile}
                      onChange={(e) => setEditingPreset({ ...editingPreset, mobile: e.target.value })}
                      className={inputClass(isStaticMode)}
                      disabled={isStaticMode}
                      placeholder="0662662255"
                    />
                  </Field>
                  <Field label="Email">
                    <input
                      type="email"
                      value={editingPreset.email}
                      onChange={(e) => setEditingPreset({ ...editingPreset, email: e.target.value })}
                      className={inputClass(isStaticMode)}
                      disabled={isStaticMode}
                      placeholder="mo@zar.fr"
                    />
                  </Field>
                </div>
              </div>

              {/* URLs section */}
              <div className={`rounded-xl border border-gray-200 p-5 transition-all duration-200 ${isStaticMode ? 'opacity-40' : 'opacity-100'}`}>
                <SectionHeader icon={Globe} title="URLs" subtitle="Redirection et échange" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Return URL">
                    <input
                      type="url"
                      value={editingPreset.return_url}
                      onChange={(e) => setEditingPreset({ ...editingPreset, return_url: e.target.value })}
                      className={inputClass(isStaticMode)}
                      disabled={isStaticMode}
                      placeholder="https://www.darty.com"
                    />
                  </Field>
                  <Field label="Exchange URL">
                    <input
                      type="url"
                      value={editingPreset.exchange_url}
                      onChange={(e) => setEditingPreset({ ...editingPreset, exchange_url: e.target.value })}
                      className={inputClass(isStaticMode)}
                      disabled={isStaticMode}
                      placeholder="https://sofinco.exchange/demo"
                    />
                  </Field>
                </div>
              </div>
            </div>

            {/* Modal footer */}
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex justify-end space-x-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-white hover:border-gray-400 transition-colors text-sm font-medium"
              >
                Annuler
              </button>
              <button
                onClick={handleSavePreset}
                disabled={saving}
                className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:scale-[0.98] transition-all flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium shadow-sm"
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
