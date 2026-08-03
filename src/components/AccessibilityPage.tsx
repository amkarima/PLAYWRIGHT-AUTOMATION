import React, { useState, useEffect } from 'react';
import { Eye, Plus, Trash2, CreditCard as Edit2, X, Save, ExternalLink } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

interface AccessibilityReport {
  id: string;
  title: string;
  url: string;
  description: string;
  test_date: string;
  created_at: string;
}

interface ReportFormData {
  title: string;
  url: string;
  description: string;
  test_date: string;
}

export const AccessibilityPage: React.FC = () => {
  const [reports, setReports] = useState<AccessibilityReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<AccessibilityReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingReport, setEditingReport] = useState<AccessibilityReport | null>(null);
  const [formData, setFormData] = useState<ReportFormData>({
    title: '',
    url: '',
    description: '',
    test_date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      const { data, error } = await supabase
        .from('accessibility_reports')
        .select('*')
        .order('test_date', { ascending: false });

      if (error) throw error;
      setReports(data || []);

      if (data && data.length > 0 && !selectedReport) {
        setSelectedReport(data[0]);
      }
    } catch (error) {
      console.error('Error loading reports:', error);
      alert('Erreur lors du chargement des rapports');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveReport = async () => {
    if (!formData.title || !formData.url) {
      alert('Veuillez remplir le titre et l\'URL du rapport');
      return;
    }

    try {
      if (editingReport) {
        const { error } = await supabase
          .from('accessibility_reports')
          .update({
            title: formData.title,
            url: formData.url,
            description: formData.description,
            test_date: formData.test_date,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingReport.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('accessibility_reports')
          .insert([formData]);

        if (error) throw error;
      }

      setShowAddModal(false);
      setEditingReport(null);
      setFormData({
        title: '',
        url: '',
        description: '',
        test_date: new Date().toISOString().split('T')[0]
      });
      loadReports();
    } catch (error) {
      console.error('Error saving report:', error);
      alert('Erreur lors de l\'enregistrement du rapport');
    }
  };

  const handleDeleteReport = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce rapport ?')) return;

    try {
      const { error } = await supabase
        .from('accessibility_reports')
        .delete()
        .eq('id', id);

      if (error) throw error;

      if (selectedReport?.id === id) {
        setSelectedReport(null);
      }
      loadReports();
    } catch (error) {
      console.error('Error deleting report:', error);
      alert('Erreur lors de la suppression du rapport');
    }
  };

  const handleEditReport = (report: AccessibilityReport) => {
    setEditingReport(report);
    setFormData({
      title: report.title,
      url: report.url,
      description: report.description,
      test_date: report.test_date
    });
    setShowAddModal(true);
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setEditingReport(null);
    setFormData({
      title: '',
      url: '',
      description: '',
      test_date: new Date().toISOString().split('T')[0]
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Rapports d'accessibilité</h1>
            <p className="text-sm text-gray-500 mt-1">Tests WCAG 2.1 AA - 35 règles d'accessibilité</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Ajouter un rapport</span>
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto">
          {reports.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <p>Aucun rapport disponible</p>
              <p className="text-sm mt-2">Cliquez sur "Ajouter un rapport" pour commencer</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {reports.map((report) => (
                <div
                  key={report.id}
                  className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                    selectedReport?.id === report.id ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                  }`}
                  onClick={() => setSelectedReport(report)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 truncate">{report.title}</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {new Date(report.test_date).toLocaleDateString('fr-FR')}
                      </p>
                      {report.description && (
                        <p className="text-sm text-gray-600 mt-2 line-clamp-2">{report.description}</p>
                      )}
                    </div>
                    <div className="flex space-x-1 ml-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditReport(report);
                        }}
                        className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="Modifier"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteReport(report.id);
                        }}
                        className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1 bg-gray-50">
          {selectedReport ? (
            <div className="h-full flex flex-col">
              <div className="bg-white border-b border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">{selectedReport.title}</h2>
                    <p className="text-sm text-gray-500">
                      Test du {new Date(selectedReport.test_date).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <a
                    href={selectedReport.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Ouvrir dans un nouvel onglet</span>
                  </a>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto bg-gradient-to-br from-gray-50 via-blue-50/30 to-gray-50">
                <div className="max-w-6xl mx-auto p-8">
                  <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden mb-8">
                    <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-8 text-white">
                      <div className="flex items-start space-x-6">
                        <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                          <ExternalLink className="w-10 h-10 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="inline-block px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-medium mb-3">
                            WCAG 2.1 Niveau AA
                          </div>
                          <h3 className="text-2xl font-bold mb-2">
                            Rapport d'accessibilité BrowserStack
                          </h3>
                          <p className="text-blue-100 mb-6 leading-relaxed">
                            Analyse automatisée complète selon les normes WCAG 2.1 niveau AA avec 35 règles d'accessibilité testées sur votre application mobile.
                          </p>
                          <a
                            href={selectedReport.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center space-x-2 px-5 py-3 bg-white text-blue-700 font-semibold rounded-lg hover:bg-blue-50 transition-all shadow-md hover:shadow-lg"
                          >
                            <ExternalLink className="w-5 h-5" />
                            <span>Consulter le rapport complet</span>
                          </a>
                        </div>
                      </div>
                    </div>

                    {selectedReport.description && (
                      <div className="border-b border-gray-200 bg-amber-50/50 p-6">
                        <div className="flex items-start space-x-3">
                          <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center flex-shrink-0">
                            <span className="text-white text-sm font-bold">ℹ</span>
                          </div>
                          <div className="flex-1">
                            <h4 className="text-sm font-semibold text-gray-900 mb-1">Description du test</h4>
                            <p className="text-gray-700 text-sm leading-relaxed">{selectedReport.description}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="p-8">
                      <div className="flex items-center justify-between mb-6">
                        <h4 className="text-lg font-bold text-gray-900">35 Règles d'accessibilité testées</h4>
                        <div className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-semibold rounded-full">
                          9 catégories
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-6 border border-blue-200 shadow-sm hover:shadow-md transition-shadow">
                          <div className="flex items-center space-x-3 mb-4">
                            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                              <span className="text-white text-lg font-bold">14</span>
                            </div>
                            <h5 className="font-bold text-gray-900 text-base">Libellés d'accessibilité</h5>
                          </div>
                          <ul className="space-y-2.5 text-sm text-gray-700">
                            <li className="flex items-start"><div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></div><span>Libellé dans le nom</span></li>
                            <li className="flex items-start"><div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></div><span>Libellé d'accessibilité au début</span></li>
                            <li className="flex items-start"><div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></div><span>Objectif du texte du lien</span></li>
                            <li className="flex items-start"><div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></div><span>Informations d'état en double dans la sortie vocale</span></li>
                            <li className="flex items-start"><div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></div><span>Informations de type en double dans la sortie vocale</span></li>
                            <li className="flex items-start"><div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></div><span>Libellé d'accessibilité pour les éléments Switch</span></li>
                            <li className="flex items-start"><div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></div><span>Libellé d'accessibilité pour les cases à cocher</span></li>
                            <li className="flex items-start"><div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></div><span>Libellé d'accessibilité pour les éléments éditables</span></li>
                            <li className="flex items-start"><div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></div><span>Libellé d'accessibilité en double à l'écran</span></li>
                            <li className="flex items-start"><div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></div><span>Libellé d'accessibilité significatif pour les images</span></li>
                            <li className="flex items-start"><div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></div><span>Libellé d'accessibilité pour les éléments interactifs</span></li>
                            <li className="flex items-start"><div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></div><span>Description du contenu dans les éléments éditables</span></li>
                            <li className="flex items-start"><div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></div><span>Libellé d'accessibilité pour les éléments à caractères spéciaux</span></li>
                            <li className="flex items-start"><div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></div><span>Type de vue manquant dans la sortie vocale</span></li>
                          </ul>
                        </div>

                        <div className="bg-gradient-to-br from-green-50 to-green-100/50 rounded-xl p-6 border border-green-200 shadow-sm hover:shadow-md transition-shadow">
                          <div className="flex items-center space-x-3 mb-4">
                            <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                              <span className="text-white text-lg font-bold">7</span>
                            </div>
                            <h5 className="font-bold text-gray-900 text-base">Focus et navigation</h5>
                          </div>
                          <ul className="space-y-2.5 text-sm text-gray-700">
                            <li className="flex items-start"><div className="w-1.5 h-1.5 bg-green-600 rounded-full mt-2 mr-3 flex-shrink-0"></div><span>Cycle d'ordre de parcours</span></li>
                            <li className="flex items-start"><div className="w-1.5 h-1.5 bg-green-600 rounded-full mt-2 mr-3 flex-shrink-0"></div><span>Ordre visuel significatif</span></li>
                            <li className="flex items-start"><div className="w-1.5 h-1.5 bg-green-600 rounded-full mt-2 mr-3 flex-shrink-0"></div><span>Ordre de lecture significatif</span></li>
                            <li className="flex items-start"><div className="w-1.5 h-1.5 bg-green-600 rounded-full mt-2 mr-3 flex-shrink-0"></div><span>Chevauchement d'éléments interactifs</span></li>
                            <li className="flex items-start"><div className="w-1.5 h-1.5 bg-green-600 rounded-full mt-2 mr-3 flex-shrink-0"></div><span>Focus du lecteur d'écran pour les éléments interactifs</span></li>
                            <li className="flex items-start"><div className="w-1.5 h-1.5 bg-green-600 rounded-full mt-2 mr-3 flex-shrink-0"></div><span>Description vocale non significative</span></li>
                            <li className="flex items-start"><div className="w-1.5 h-1.5 bg-green-600 rounded-full mt-2 mr-3 flex-shrink-0"></div><span>Focus du clavier pour les éléments interactifs</span></li>
                          </ul>
                        </div>

                        <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-xl p-6 border border-purple-200 shadow-sm hover:shadow-md transition-shadow">
                          <div className="flex items-center space-x-3 mb-4">
                            <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                              <span className="text-white text-lg font-bold">3</span>
                            </div>
                            <h5 className="font-bold text-gray-900 text-base">Redimensionnement du texte</h5>
                          </div>
                          <ul className="space-y-2.5 text-sm text-gray-700">
                            <li className="flex items-start"><div className="w-1.5 h-1.5 bg-purple-600 rounded-full mt-2 mr-3 flex-shrink-0"></div><span>Troncature du texte</span></li>
                            <li className="flex items-start"><div className="w-1.5 h-1.5 bg-purple-600 rounded-full mt-2 mr-3 flex-shrink-0"></div><span>Taille de police lisible</span></li>
                            <li className="flex items-start"><div className="w-1.5 h-1.5 bg-purple-600 rounded-full mt-2 mr-3 flex-shrink-0"></div><span>Prise en charge de l'agrandissement de police</span></li>
                          </ul>
                        </div>

                        <div className="bg-gradient-to-br from-orange-50 to-orange-100/50 rounded-xl p-6 border border-orange-200 shadow-sm hover:shadow-md transition-shadow">
                          <div className="flex items-center space-x-3 mb-4">
                            <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center">
                              <span className="text-white text-lg font-bold">3</span>
                            </div>
                            <h5 className="font-bold text-gray-900 text-base">Texte et mise en page lisibles</h5>
                          </div>
                          <ul className="space-y-2.5 text-sm text-gray-700">
                            <li className="flex items-start"><div className="w-1.5 h-1.5 bg-orange-600 rounded-full mt-2 mr-3 flex-shrink-0"></div><span>Espacement du texte lisible</span></li>
                            <li className="flex items-start"><div className="w-1.5 h-1.5 bg-orange-600 rounded-full mt-2 mr-3 flex-shrink-0"></div><span>Conteneurs responsifs</span></li>
                            <li className="flex items-start"><div className="w-1.5 h-1.5 bg-orange-600 rounded-full mt-2 mr-3 flex-shrink-0"></div><span>Défilement bidimensionnel</span></li>
                          </ul>
                        </div>

                        <div className="bg-gradient-to-br from-red-50 to-red-100/50 rounded-xl p-6 border border-red-200 shadow-sm hover:shadow-md transition-shadow">
                          <div className="flex items-center space-x-3 mb-4">
                            <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
                              <span className="text-white text-lg font-bold">2</span>
                            </div>
                            <h5 className="font-bold text-gray-900 text-base">Contraste des couleurs</h5>
                          </div>
                          <ul className="space-y-2.5 text-sm text-gray-700">
                            <li className="flex items-start"><div className="w-1.5 h-1.5 bg-red-600 rounded-full mt-2 mr-3 flex-shrink-0"></div><span>Contraste des couleurs pour les éléments de texte (minimum)</span></li>
                            <li className="flex items-start"><div className="w-1.5 h-1.5 bg-red-600 rounded-full mt-2 mr-3 flex-shrink-0"></div><span>Contraste des couleurs pour les éléments non textuels</span></li>
                          </ul>
                        </div>

                        <div className="bg-gradient-to-br from-teal-50 to-teal-100/50 rounded-xl p-6 border border-teal-200 shadow-sm hover:shadow-md transition-shadow">
                          <div className="flex items-center space-x-3 mb-4">
                            <div className="w-10 h-10 bg-teal-600 rounded-lg flex items-center justify-center">
                              <span className="text-white text-lg font-bold">2</span>
                            </div>
                            <h5 className="font-bold text-gray-900 text-base">Orientation de l'affichage</h5>
                          </div>
                          <ul className="space-y-2.5 text-sm text-gray-700">
                            <li className="flex items-start"><div className="w-1.5 h-1.5 bg-teal-600 rounded-full mt-2 mr-3 flex-shrink-0"></div><span>Orientations d'écran prises en charge</span></li>
                            <li className="flex items-start"><div className="w-1.5 h-1.5 bg-teal-600 rounded-full mt-2 mr-3 flex-shrink-0"></div><span>Verrouillage de l'orientation de l'application</span></li>
                          </ul>
                        </div>

                        <div className="bg-gradient-to-br from-cyan-50 to-cyan-100/50 rounded-xl p-6 border border-cyan-200 shadow-sm hover:shadow-md transition-shadow">
                          <div className="flex items-center space-x-3 mb-4">
                            <div className="w-10 h-10 bg-cyan-600 rounded-lg flex items-center justify-center">
                              <span className="text-white text-lg font-bold">2</span>
                            </div>
                            <h5 className="font-bold text-gray-900 text-base">Objectif de la saisie</h5>
                          </div>
                          <ul className="space-y-2.5 text-sm text-gray-700">
                            <li className="flex items-start"><div className="w-1.5 h-1.5 bg-cyan-600 rounded-full mt-2 mr-3 flex-shrink-0"></div><span>Type de saisie pour les champs de saisie</span></li>
                            <li className="flex items-start"><div className="w-1.5 h-1.5 bg-cyan-600 rounded-full mt-2 mr-3 flex-shrink-0"></div><span>Libellés accessibles pour les champs de saisie</span></li>
                          </ul>
                        </div>

                        <div className="bg-gradient-to-br from-pink-50 to-pink-100/50 rounded-xl p-6 border border-pink-200 shadow-sm hover:shadow-md transition-shadow">
                          <div className="flex items-center space-x-3 mb-4">
                            <div className="w-10 h-10 bg-pink-600 rounded-lg flex items-center justify-center">
                              <span className="text-white text-lg font-bold">1</span>
                            </div>
                            <h5 className="font-bold text-gray-900 text-base">Images accessibles</h5>
                          </div>
                          <ul className="space-y-2.5 text-sm text-gray-700">
                            <li className="flex items-start"><div className="w-1.5 h-1.5 bg-pink-600 rounded-full mt-2 mr-3 flex-shrink-0"></div><span>Images avec texte</span></li>
                          </ul>
                        </div>

                        <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 rounded-xl p-6 border border-amber-200 shadow-sm hover:shadow-md transition-shadow">
                          <div className="flex items-center space-x-3 mb-4">
                            <div className="w-10 h-10 bg-amber-600 rounded-lg flex items-center justify-center">
                              <span className="text-white text-lg font-bold">1</span>
                            </div>
                            <h5 className="font-bold text-gray-900 text-base">Éléments accessibles</h5>
                          </div>
                          <ul className="space-y-2.5 text-sm text-gray-700">
                            <li className="flex items-start"><div className="w-1.5 h-1.5 bg-amber-600 rounded-full mt-2 mr-3 flex-shrink-0"></div><span>Éléments interactifs avec type non pris en charge</span></li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                    <div className="flex items-start space-x-4">
                      <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-lg">ℹ</span>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-2">À propos des tests WCAG 2.1 AA</h4>
                        <p className="text-sm text-gray-700 leading-relaxed">
                          Les Web Content Accessibility Guidelines (WCAG) 2.1 niveau AA sont une norme internationale pour l'accessibilité numérique.
                          Ces 35 règles automatisées testent les aspects techniques de l'accessibilité mobile, incluant la navigation au clavier,
                          les lecteurs d'écran, le contraste des couleurs, et la compatibilité avec les technologies d'assistance.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center text-gray-500">
                <Eye className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg">Sélectionnez un rapport pour le visualiser</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingReport ? 'Modifier le rapport' : 'Ajouter un rapport'}
              </h3>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Titre du rapport <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: Test d'accessibilité - Page d'accueil"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL du rapport BrowserStack <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://app-accessibility.browserstack.com/public_report?token=..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date du test
                </label>
                <input
                  type="date"
                  value={formData.test_date}
                  onChange={(e) => setFormData({ ...formData, test_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Description du test, pages testées, navigateurs, etc."
                />
              </div>
            </div>

            <div className="sticky bottom-0 bg-gray-50 px-6 py-4 flex items-center justify-end space-x-3 border-t border-gray-200">
              <button
                onClick={handleCloseModal}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleSaveReport}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>{editingReport ? 'Mettre à jour' : 'Enregistrer'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
