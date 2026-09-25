import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Save, AlertCircle, ImageIcon, Upload, Trash2, Video, Loader2 } from 'lucide-react';
import { TestFailureAnalysis } from '../types';
import { supabase } from '../services/supabaseClient';

const ROOT_CAUSE_OPTIONS = [
  'Bug applicatif',
  'Instabilité environnement',
  'JDD obsolètes',
  'Refus financement',
  'Paramétrage TMX',
  'Évolution code(tests auto à mettre à jour)',
  'Bug test auto',
] as const;

const JIRA_REQUIRED_ROOT_CAUSES = [
  'Bug applicatif',
  'Bug test auto',
  'Évolution code(tests auto à mettre à jour)',
] as const;

interface TestArtifactImage {
  name: string;
  url: string;
  type: 'image' | 'video' | 'trace' | 'other';
}

interface UploadedMedia {
  id: string;
  file_name: string;
  file_path: string;
  media_type: 'image' | 'video';
  mime_type: string;
  uploaded_by: string;
  created_at: string;
}

interface TestFailureAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  pipelineId: number;
  jobId: number;
  testKey: string;
  testTitle: string;
  testFile: string;
  existingAnalysis?: TestFailureAnalysis | null;
  selectedTests?: Array<{ testKey: string; testTitle: string; testFile: string }>;
  images?: TestArtifactImage[];
}

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

function getMediaType(mimeType: string): 'image' | 'video' | null {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  return null;
}

function buildStoragePath(jobId: number, testKey: string, fileName: string): string {
  const safeTestKey = testKey.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 80);
  const timestamp = Date.now();
  const random = Math.random().toString(36).slice(2, 8);
  return `${jobId}/${safeTestKey}/${timestamp}-${random}-${fileName}`;
}

export const TestFailureAnalysisModal: React.FC<TestFailureAnalysisModalProps> = ({
  isOpen,
  onClose,
  pipelineId,
  jobId,
  testKey,
  testTitle,
  testFile,
  existingAnalysis,
  selectedTests = [],
  images = [],
}) => {
  const [rootCause, setRootCause] = useState('');
  const [analysis, setAnalysis] = useState('');
  const [createdBy, setCreatedBy] = useState('');
  const [jiraTicketUrl, setJiraTicketUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [uploadedMedia, setUploadedMedia] = useState<UploadedMedia[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isGroupAnalysis = selectedTests.length > 0;
  const requiresJiraTicket = JIRA_REQUIRED_ROOT_CAUSES.includes(rootCause as any);

  useEffect(() => {
    if (isOpen) {
      if (existingAnalysis) {
        setRootCause(existingAnalysis.root_cause);
        setAnalysis(existingAnalysis.analysis);
        setCreatedBy(existingAnalysis.created_by);
        setJiraTicketUrl(existingAnalysis.jira_ticket_url || '');
      } else {
        setRootCause('');
        setAnalysis('');
        setCreatedBy('');
        setJiraTicketUrl('');
      }
      setError(null);
    }
  }, [isOpen, existingAnalysis]);

  const loadUploadedMedia = useCallback(async () => {
    if (isGroupAnalysis || !testKey) return;
    try {
      const { data, error: queryError } = await supabase
        .from('test_media_uploads')
        .select('id, file_name, file_path, media_type, mime_type, uploaded_by, created_at')
        .eq('job_id', jobId)
        .eq('test_key', testKey)
        .order('created_at', { ascending: false });

      if (queryError) throw queryError;
      setUploadedMedia((data || []) as UploadedMedia[]);
    } catch (err) {
      console.error('Error loading uploaded media:', err);
      setUploadedMedia([]);
    }
  }, [isGroupAnalysis, testKey, jobId]);

  useEffect(() => {
    if (isOpen) {
      loadUploadedMedia();
    }
  }, [isOpen, loadUploadedMedia]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (const file of Array.from(files)) {
      const mediaType = getMediaType(file.type);
      if (!mediaType) {
        setError(`Le fichier "${file.name}" n'est pas une image ou une vidéo (type: ${file.type || 'inconnu'})`);
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        setError(`Le fichier "${file.name}" dépasse la taille maximale de 50 Mo`);
        continue;
      }

      setUploading(true);
      setUploadProgress(`Upload de ${file.name}...`);
      setError(null);

      try {
        const filePath = buildStoragePath(jobId, testKey, file.name);

        const { error: uploadError } = await supabase.storage
          .from('test-media-uploads')
          .upload(filePath, file, {
            contentType: file.type,
            upsert: false,
          });

        if (uploadError) throw uploadError;

        const { error: dbError } = await supabase
          .from('test_media_uploads')
          .insert({
            analysis_id: existingAnalysis?.id || null,
            pipeline_id: pipelineId,
            job_id: jobId,
            test_key: testKey,
            file_name: file.name,
            file_path: filePath,
            media_type: mediaType,
            mime_type: file.type,
            file_size: file.size,
            uploaded_by: createdBy.trim() || 'anonymous',
          });

        if (dbError) throw dbError;

        await loadUploadedMedia();
      } catch (err) {
        console.error('Upload error:', err);
        setError(`Erreur lors de l'upload de "${file.name}": ${err instanceof Error ? err.message : 'erreur inconnue'}`);
      } finally {
        setUploading(false);
        setUploadProgress('');
      }
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDeleteMedia = async (mediaId: string, filePath: string) => {
    try {
      const { error: storageError } = await supabase.storage
        .from('test-media-uploads')
        .remove([filePath]);

      if (storageError) throw storageError;

      const { error: dbError } = await supabase
        .from('test_media_uploads')
        .delete()
        .eq('id', mediaId);

      if (dbError) throw dbError;

      setUploadedMedia(prev => prev.filter(m => m.id !== mediaId));
    } catch (err) {
      console.error('Delete media error:', err);
      setError(`Erreur lors de la suppression: ${err instanceof Error ? err.message : 'erreur inconnue'}`);
    }
  };

  const getPublicUrl = (filePath: string): string => {
    const { data } = supabase.storage
      .from('test-media-uploads')
      .getPublicUrl(filePath);
    return data.publicUrl;
  };

  const handleSave = async () => {
    if (!rootCause.trim()) {
      setError('Veuillez sélectionner une root cause');
      return;
    }

    if (!createdBy.trim()) {
      setError('Veuillez renseigner votre nom');
      return;
    }

    if (requiresJiraTicket && !jiraTicketUrl.trim()) {
      setError('Un lien Jira est obligatoire pour cette root cause');
      return;
    }

    if (!analysis.trim()) {
      setError('Veuillez fournir une analyse détaillée');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      if (isGroupAnalysis) {
        const analyses = selectedTests.map(test => ({
          pipeline_id: pipelineId,
          job_id: jobId,
          test_key: test.testKey,
          test_title: test.testTitle,
          test_file: test.testFile,
          root_cause: rootCause.trim(),
          analysis: analysis.trim(),
          created_by: createdBy.trim(),
          jira_ticket_url: jiraTicketUrl.trim() || null,
        }));

        const { error: insertError } = await supabase
          .from('test_failure_analyses')
          .insert(analyses);

        if (insertError) throw insertError;
      } else {
        const data = {
          pipeline_id: pipelineId,
          job_id: jobId,
          test_key: testKey,
          test_title: testTitle,
          test_file: testFile,
          root_cause: rootCause.trim(),
          analysis: analysis.trim(),
          created_by: createdBy.trim(),
          jira_ticket_url: jiraTicketUrl.trim() || null,
        };

        if (existingAnalysis) {
          const { error: updateError } = await supabase
            .from('test_failure_analyses')
            .update(data)
            .eq('id', existingAnalysis.id);

          if (updateError) throw updateError;
        } else {
          const { data: inserted, error: insertError } = await supabase
            .from('test_failure_analyses')
            .insert([data])
            .select('id')
            .maybeSingle();

          if (insertError) throw insertError;

          if (inserted && uploadedMedia.length > 0) {
            const { error: linkError } = await supabase
              .from('test_media_uploads')
              .update({ analysis_id: inserted.id })
              .eq('job_id', jobId)
              .eq('test_key', testKey)
              .is('analysis_id', null);

            if (linkError) {
              console.warn('Could not link media to new analysis:', linkError);
            }
          }
        }
      }

      onClose();
    } catch (err) {
      console.error('Error saving analysis:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const imageMedia = uploadedMedia.filter(m => m.media_type === 'image');
  const videoMedia = uploadedMedia.filter(m => m.media_type === 'video');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <AlertCircle className="w-6 h-6 text-red-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {isGroupAnalysis ? `Analyse groupée (${selectedTests.length} tests)` : 'Analyse du test en échec'}
              </h2>
              {!isGroupAnalysis && <p className="text-sm text-gray-600">{testTitle}</p>}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            {/* Auto-attached images from test artifacts */}
            {images.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-gray-500" />
                  Captures d'écran du test ({images.length})
                </label>
                <div className="grid grid-cols-2 gap-3 max-h-48 overflow-y-auto p-1">
                  {images.map((img, idx) => (
                    <a
                      key={idx}
                      href={img.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group relative block rounded-lg overflow-hidden border border-gray-200 hover:border-blue-400 transition-colors"
                    >
                      <img
                        src={img.url}
                        alt={img.name}
                        className="w-full h-28 object-contain bg-gray-50"
                        loading="lazy"
                      />
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-2 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <p className="text-xs text-white truncate" title={img.name}>{img.name}</p>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Upload section */}
            {!isGroupAnalysis && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Images et vidéos ajoutées
                </label>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="w-full border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-400 hover:bg-blue-50/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? (
                    <div className="flex items-center justify-center gap-2 text-blue-600">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span className="text-sm">{uploadProgress || 'Upload en cours...'}</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1.5 text-gray-500">
                      <Upload className="w-6 h-6" />
                      <span className="text-sm font-medium">Cliquez pour ajouter des images ou vidéos</span>
                      <span className="text-xs text-gray-400">Jusqu'à 50 Mo par fichier</span>
                    </div>
                  )}
                </button>

                {/* Uploaded images */}
                {imageMedia.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs font-medium text-gray-600 mb-2 flex items-center gap-1">
                      <ImageIcon className="w-3.5 h-3.5" /> Images ({imageMedia.length})
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      {imageMedia.map((media) => (
                        <div
                          key={media.id}
                          className="group relative rounded-lg overflow-hidden border border-gray-200"
                        >
                          <img
                            src={getPublicUrl(media.file_path)}
                            alt={media.file_name}
                            className="w-full h-28 object-contain bg-gray-50"
                            loading="lazy"
                          />
                          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-2 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-between">
                            <p className="text-xs text-white truncate" title={media.file_name}>{media.file_name}</p>
                            <button
                              type="button"
                              onClick={() => handleDeleteMedia(media.id, media.file_path)}
                              className="text-white hover:text-red-300 transition-colors flex-shrink-0 ml-2"
                              title="Supprimer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Uploaded videos */}
                {videoMedia.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs font-medium text-gray-600 mb-2 flex items-center gap-1">
                      <Video className="w-3.5 h-3.5" /> Vidéos ({videoMedia.length})
                    </p>
                    <div className="space-y-3">
                      {videoMedia.map((media) => (
                        <div
                          key={media.id}
                          className="group relative rounded-lg overflow-hidden border border-gray-200 bg-gray-50"
                        >
                          <video
                            src={getPublicUrl(media.file_path)}
                            controls
                            className="w-full max-h-60 object-contain bg-black"
                            preload="metadata"
                          />
                          <div className="flex items-center justify-between px-3 py-1.5 bg-white border-t">
                            <p className="text-xs text-gray-600 truncate" title={media.file_name}>{media.file_name}</p>
                            <button
                              type="button"
                              onClick={() => handleDeleteMedia(media.id, media.file_path)}
                              className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0 ml-2"
                              title="Supprimer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {uploadedMedia.length === 0 && !uploading && (
                  <p className="mt-2 text-xs text-gray-400">Aucun fichier ajouté pour ce test.</p>
                )}
              </div>
            )}

            {isGroupAnalysis ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tests sélectionnés
                </label>
                <div className="bg-gray-50 p-3 rounded-md max-h-32 overflow-y-auto">
                  <ul className="text-sm text-gray-600 space-y-1">
                    {selectedTests.map((test, idx) => (
                      <li key={idx} className="truncate">• {test.testTitle}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fichier de test
                </label>
                <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">{testFile}</p>
              </div>
            )}

            <div>
              <label htmlFor="createdBy" className="block text-sm font-medium text-gray-700 mb-2">
                Votre nom *
              </label>
              <input
                id="createdBy"
                type="text"
                value={createdBy}
                onChange={(e) => setCreatedBy(e.target.value)}
                placeholder="Entrez votre nom"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label htmlFor="rootCause" className="block text-sm font-medium text-gray-700 mb-2">
                Root Cause *
              </label>
              <select
                id="rootCause"
                value={rootCause}
                onChange={(e) => setRootCause(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Sélectionnez une root cause</option>
                {ROOT_CAUSE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            {requiresJiraTicket && (
              <div>
                <label htmlFor="jiraTicketUrl" className="block text-sm font-medium text-gray-700 mb-2">
                  Lien Jira * <span className="text-red-600">(obligatoire)</span>
                </label>
                <input
                  id="jiraTicketUrl"
                  type="url"
                  value={jiraTicketUrl}
                  onChange={(e) => setJiraTicketUrl(e.target.value)}
                  placeholder="https://jira.example.com/browse/TICKET-123"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required={requiresJiraTicket}
                />
              </div>
            )}

            <div>
              <label htmlFor="analysis" className="block text-sm font-medium text-gray-700 mb-2">
                Analyse détaillée *
              </label>
              <textarea
                id="analysis"
                value={analysis}
                onChange={(e) => setAnalysis(e.target.value)}
                placeholder="Fournissez une analyse détaillée de l'erreur, les étapes de reproduction, la solution proposée, etc."
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                required
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end space-x-3 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Sauvegarde...' : existingAnalysis ? 'Mettre à jour' : 'Sauvegarder'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
