import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';
import { TestFailureAnalysis } from '../types';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
}) => {
  const [rootCause, setRootCause] = useState('');
  const [analysis, setAnalysis] = useState('');
  const [createdBy, setCreatedBy] = useState('');
  const [jiraTicketUrl, setJiraTicketUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
          const { error: insertError } = await supabase
            .from('test_failure_analyses')
            .insert([data]);

          if (insertError) throw insertError;
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
