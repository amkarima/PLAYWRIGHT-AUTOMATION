import React, { useState } from 'react';
import { ChevronLeft, Send, Bug, Mail, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { supabase } from '../services/supabaseClient';

type ReportType = 'bug' | 'contact';

const ContactPage: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [reportType, setReportType] = useState<ReportType>('bug');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [reporterName, setReporterName] = useState('');
  const [reporterEmail, setReporterEmail] = useState('');
  const [includePageUrl, setIncludePageUrl] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) return;

    setSubmitting(true);
    setError(null);

    try {
      const { error: dbError } = await supabase.from('bug_reports').insert({
        report_type: reportType,
        subject: subject.trim(),
        description: description.trim(),
        reporter_name: reporterName.trim() || null,
        reporter_email: reporterEmail.trim() || null,
        page_url: includePageUrl ? window.location.href : null,
        browser_info: navigator.userAgent,
      });

      if (dbError) throw dbError;

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-contact-email`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          reportType,
          subject: subject.trim(),
          description: description.trim(),
          reporterName: reporterName.trim() || 'Non renseigné',
          reporterEmail: reporterEmail.trim() || 'Non renseigné',
          pageUrl: includePageUrl ? window.location.href : 'Non inclus',
        }),
      });

      if (!response.ok) {
        console.warn('Email send returned non-OK status, but report was saved');
      }

      setSuccess(true);
      setSubject('');
      setDescription('');
      setReporterName('');
      setReporterEmail('');
    } catch (err) {
      console.error('Error submitting report:', err);
      setError(err instanceof Error ? err.message : 'Une erreur est survenue lors de l\'envoi du rapport.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setSuccess(false);
    setReportType('bug');
    setSubject('');
    setDescription('');
    setReporterName('');
    setReporterEmail('');
    setIncludePageUrl(true);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors mb-8"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Retour au dashboard</span>
        </button>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="px-8 py-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <Mail className="w-7 h-7" />
              Contacter l'équipe de développement
            </h1>
            <p className="mt-2 text-blue-100 text-sm">
              Signalez un bug ou posez une question. Votre message sera envoyé à <strong>mzarouri-prestataire@ca-cf.fr</strong>.
            </p>
          </div>

          {success ? (
            <div className="px-8 py-16 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Message envoyé !</h2>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                Votre {reportType === 'bug' ? 'rapport de bug' : 'message'} a bien été enregistré et envoyé à l'équipe de développement. Vous recevrez une réponse si vous avez laissé votre email.
              </p>
              <button
                onClick={handleReset}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Envoyer un nouveau message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="px-8 py-6 space-y-6">
              {/* Type selector */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Type de message</label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setReportType('bug')}
                    className={`flex items-center gap-3 px-4 py-4 rounded-xl border-2 transition-all duration-200 ${
                      reportType === 'bug'
                        ? 'border-red-500 bg-red-50 text-red-700'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <Bug className="w-6 h-6 flex-shrink-0" />
                    <div className="text-left">
                      <div className="font-bold text-sm">Reporter un bug</div>
                      <div className="text-xs opacity-80">Un comportement inattendu ou une erreur</div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setReportType('contact')}
                    className={`flex items-center gap-3 px-4 py-4 rounded-xl border-2 transition-all duration-200 ${
                      reportType === 'contact'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <Mail className="w-6 h-6 flex-shrink-0" />
                    <div className="text-left">
                      <div className="font-bold text-sm">Contacter l'équipe</div>
                      <div className="text-xs opacity-80">Une question ou demande</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Subject */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {reportType === 'bug' ? 'Titre du bug' : 'Sujet'} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                  maxLength={200}
                  placeholder={reportType === 'bug' ? 'Ex: Le bouton de lancement ne fonctionne pas' : 'Ex: Question sur les statistiques'}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {reportType === 'bug' ? 'Description du bug' : 'Votre message'} <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  rows={6}
                  maxLength={5000}
                  placeholder={
                    reportType === 'bug'
                      ? 'Décrivez le problème rencontré:\n\n• Que s\'est-il passé ?\n• Quelles étapes avez-vous suivies ?\n• Quel était le comportement attendu ?'
                      : 'Écrivez votre message ou votre question ici...'
                  }
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none resize-y"
                />
                <p className="text-xs text-gray-400 mt-1">{description.length} / 5000 caractères</p>
              </div>

              {/* Name & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Votre nom (optionnel)</label>
                  <input
                    type="text"
                    value={reporterName}
                    onChange={(e) => setReporterName(e.target.value)}
                    maxLength={100}
                    placeholder="Jean Dupont"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Votre email (optionnel)</label>
                  <input
                    type="email"
                    value={reporterEmail}
                    onChange={(e) => setReporterEmail(e.target.value)}
                    maxLength={200}
                    placeholder="jean.dupont@sofinco.fr"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                  />
                </div>
              </div>

              {/* Include page URL checkbox */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="includeUrl"
                  checked={includePageUrl}
                  onChange={(e) => setIncludePageUrl(e.target.checked)}
                  className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <label htmlFor="includeUrl" className="text-sm text-gray-600 cursor-pointer">
                  Inclure l'URL de la page actuelle et les informations du navigateur (recommandé pour les bugs)
                </label>
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-800">Erreur lors de l'envoi</p>
                    <p className="text-sm text-red-600 mt-1">{error}</p>
                  </div>
                </div>
              )}

              {/* Submit */}
              <div className="flex items-center justify-end gap-4 pt-2">
                <p className="text-xs text-gray-400">
                  Votre message sera envoyé à <strong className="text-gray-600">mzarouri-prestataire@ca-cf.fr</strong>
                </p>
                <button
                  type="submit"
                  disabled={submitting || !subject.trim() || !description.trim()}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Envoi en cours...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      <span>Envoyer</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContactPage;