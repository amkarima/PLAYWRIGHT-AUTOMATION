import React, { useState } from 'react';
import { MessageSquare, RefreshCw, Copy, Phone, Clock, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

interface LimitsData {
  smsLimit: number;
  consumptionRate: number;
  consumptionAmount: number;
  periodStart: number;
  periodEnd: number;
}

interface MFAResponse {
  message?: string;
  mfaCode?: string;
  otp?: string;
  code?: string;
  receivedDate?: string;
  receivedAt?: string;
  date?: string;
  phoneId?: string;
  phoneNumber?: string;
  limitsData?: LimitsData;
  limits?: LimitsData;
  error?: string;
  [key: string]: unknown;
}

interface PhoneNumber {
  phoneId: string;
  phoneNumber: string;
  label: string;
}

const AVAILABLE_PHONES: PhoneNumber[] = [
  {
    phoneId: 'phone_01j51838js2j2zhwbxep4dn67e',
    phoneNumber: '+33757592585',
    label: '+33 7 57 59 25 85'
  },
  {
    phoneId: 'phone_01jzw2mmerjhrbx8sq1tk7r4q1',
    phoneNumber: '+33757597405',
    label: '+33 7 57 59 74 05'
  },
  {
    phoneId: 'phone_01jzw2hpygh1n2qt7v02xs1g3z',
    phoneNumber: '+33757597858',
    label: '+33 7 57 59 78 58'
  }
];

const getResponseType = (data: MFAResponse): 'success' | 'no-sms' | 'limit-reached' | 'unknown' => {
  const msg = data.message?.toLowerCase() || '';
  if (msg.includes('no sms') || msg.includes('not found')) return 'no-sms';
  if (msg.includes('limit')) return 'limit-reached';
  const code = data.mfaCode || data.otp || data.code;
  if (code) return 'success';
  if (data.message) return 'unknown';
  return 'unknown';
};

const extractCode = (data: MFAResponse): string | null => {
  return data.mfaCode || data.otp || data.code || null;
};

const extractDate = (data: MFAResponse): Date | null => {
  const raw = data.receivedDate || data.receivedAt || data.date;
  if (!raw) return null;
  const num = parseInt(String(raw));
  if (!isNaN(num)) return new Date(num * 1000);
  const d = new Date(raw as string);
  if (!isNaN(d.getTime())) return d;
  return null;
};

const extractLimits = (data: MFAResponse): LimitsData | null => {
  return data.limitsData || data.limits || null;
};

const GetMyMFAPage: React.FC = () => {
  const [phoneId, setPhoneId] = useState<string>(AVAILABLE_PHONES[0].phoneId);
  const [mfaData, setMfaData] = useState<MFAResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState<Date | null>(null);

  const fetchLatestMFA = async () => {
    setLoading(true);
    setError(null);
    setMfaData(null);

    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-mymfa`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phoneId })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Erreur HTTP: ${response.status}`);
      }

      setMfaData(data);
      setLastFetchTime(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la récupération du SMS');
      console.error('Error fetching MFA:', err);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const responseType = mfaData ? getResponseType(mfaData) : null;
  const code = mfaData ? extractCode(mfaData) : null;
  const receivedDate = mfaData ? extractDate(mfaData) : null;
  const limits = mfaData ? extractLimits(mfaData) : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Get My MFA</h1>
              <p className="text-gray-600">Récupérez le dernier SMS reçu sur un numéro virtuel</p>
            </div>
            <MessageSquare className="w-12 h-12 text-blue-600" />
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4 flex items-center">
                <Phone className="w-4 h-4 mr-2" />
                Numéros virtuels disponibles
              </label>
              <div className="grid gap-3">
                {AVAILABLE_PHONES.map((phone) => (
                  <button
                    key={phone.phoneId}
                    onClick={() => setPhoneId(phone.phoneId)}
                    className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                      phoneId === phone.phoneId
                        ? 'border-blue-500 bg-blue-50 shadow-md'
                        : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          phoneId === phone.phoneId ? 'bg-blue-500' : 'bg-gray-200'
                        }`}>
                          <Phone className={`w-5 h-5 ${
                            phoneId === phone.phoneId ? 'text-white' : 'text-gray-500'
                          }`} />
                        </div>
                        <div>
                          <p className="text-lg font-semibold text-gray-800">{phone.label}</p>
                          <p className="text-sm text-gray-500 font-mono">{phone.phoneNumber}</p>
                        </div>
                      </div>
                      {phoneId === phone.phoneId && (
                        <CheckCircle className="w-6 h-6 text-blue-500" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={fetchLatestMFA}
              disabled={loading}
              className="w-full flex items-center justify-center space-x-2 px-6 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-lg disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'Récupération en cours...' : 'Récupérer le dernier SMS'}</span>
            </button>

            {lastFetchTime && (
              <div className="flex items-center justify-center text-sm text-gray-500">
                <Clock className="w-4 h-4 mr-2" />
                <span>Dernière mise à jour: {formatTime(lastFetchTime)}</span>
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-6">
            <div className="flex items-start">
              <XCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Erreur</h3>
                <p className="mt-1 text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {mfaData && !error && responseType === 'no-sms' && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-6">
            <div className="flex items-start">
              <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-amber-800">Aucun SMS reçu</h3>
                <p className="mt-1 text-sm text-amber-700">
                  Aucun SMS MFA n'a été reçu sur ce numéro. Assurez-vous que le SMS a bien été envoyé et réessayez.
                </p>
              </div>
            </div>
          </div>
        )}

        {mfaData && !error && responseType === 'limit-reached' && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-6">
            <div className="flex items-start">
              <XCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Limite atteinte</h3>
                <p className="mt-1 text-sm text-red-700">
                  La limite de SMS pour cette période a été atteinte. Veuillez utiliser un autre numéro ou attendre la prochaine période.
                </p>
                {limits && (
                  <p className="mt-2 text-xs text-red-600">
                    {limits.consumptionAmount} / {limits.smsLimit} SMS utilisés ({(limits.consumptionRate * 100).toFixed(1)}%)
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {mfaData && !error && (responseType === 'success' || (responseType === 'unknown' && code)) && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
              <CheckCircle className="w-6 h-6 text-green-600 mr-2" />
              Dernier SMS reçu
            </h2>

            {code && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Code MFA
                </label>
                <div className="flex items-center space-x-3">
                  <div className="flex-1 px-6 py-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
                    <p className="text-3xl font-mono font-bold text-blue-900 text-center tracking-wider">
                      {code}
                    </p>
                  </div>
                  <button
                    onClick={() => copyToClipboard(code)}
                    className="flex items-center space-x-2 px-4 py-4 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    title="Copier le code"
                  >
                    {copied ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <Copy className="w-5 h-5 text-gray-600" />
                    )}
                  </button>
                </div>
              </div>
            )}

            {mfaData.phoneNumber && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Numéro de téléphone
                </label>
                <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <p className="text-gray-800 font-mono text-lg">{mfaData.phoneNumber}</p>
                </div>
              </div>
            )}

            {receivedDate && (
              <div className="flex items-center text-sm text-gray-500 mb-4">
                <Clock className="w-4 h-4 mr-2" />
                <span>Reçu le: {receivedDate.toLocaleString('fr-FR')}</span>
              </div>
            )}

            {mfaData.phoneId && (
              <div className="flex items-center text-sm text-gray-500 mb-4">
                <Phone className="w-4 h-4 mr-2" />
                <span>ID: {mfaData.phoneId}</span>
              </div>
            )}

            {limits && (
              <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Limites de consommation</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Limite SMS:</span>
                    <span className="ml-2 font-semibold text-gray-800">{limits.smsLimit}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Consommés:</span>
                    <span className="ml-2 font-semibold text-gray-800">{limits.consumptionAmount}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-600">Taux d'utilisation:</span>
                    <span className="ml-2 font-semibold text-gray-800">{(limits.consumptionRate * 100).toFixed(1)}%</span>
                    <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${Math.min(limits.consumptionRate * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600">Début période:</span>
                    <span className="ml-2 font-semibold text-gray-800">{new Date(limits.periodStart * 1000).toLocaleDateString('fr-FR')}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Fin période:</span>
                    <span className="ml-2 font-semibold text-gray-800">{new Date(limits.periodEnd * 1000).toLocaleDateString('fr-FR')}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {mfaData && !error && responseType === 'unknown' && !code && (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 mb-6">
            <div className="flex items-start">
              <AlertTriangle className="w-6 h-6 text-gray-500 flex-shrink-0" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-gray-700">Réponse inattendue</h3>
                <p className="mt-1 text-sm text-gray-600">{mfaData.message || 'Réponse non reconnue de l\'API.'}</p>
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">Comment utiliser</h3>
          <ol className="list-decimal list-inside space-y-2 text-blue-800">
            <li>Sélectionnez un numéro virtuel dans la liste ci-dessus</li>
            <li>Utilisez ce numéro pour vos tests nécessitant une vérification SMS</li>
            <li>Cliquez sur "Récupérer le dernier SMS" après avoir déclenché l'envoi du code</li>
            <li>Le code MFA du dernier SMS reçu s'affichera automatiquement</li>
            <li>Cliquez sur le bouton copier pour utiliser le code dans vos tests</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default GetMyMFAPage;
