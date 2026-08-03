import React, { useState, useEffect } from 'react';
import { Play, Link2, Smartphone, QrCode, Copy, Check, X, ChevronDown, ChevronUp } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { QRCodeSVG } from 'qrcode.react';
import { getPartnerLogo, mapPartnerIdToPartner, type Partner } from '../utils/partnerLogos';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

interface Preset {
  name: string;
  partnerId: string;
  sourceId: string;
  scaleId: string;
  amount: string;
  duration: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  email: string;
  mobile: string;
  returnUrl: string;
  exchangeUrl: string;
  businessProviderId?: string;
  orderId: string;
  [key: string]: string | undefined;
}

interface LauncherSectionProps {
  isDarkMode: boolean;
  onAutoLaunch: () => void;
}

const generateOrderId = () => `TestAuto${Math.floor(10000000 + Math.random() * 90000000)}`;

export const LauncherSection: React.FC<LauncherSectionProps> = ({ isDarkMode, onAutoLaunch }) => {
  const [expanded, setExpanded] = useState(true);
  const [presets, setPresets] = useState<Record<string, Preset>>({});
  const [loading, setLoading] = useState(true);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [generatedUrl, setGeneratedUrl] = useState('');
  const [generatingUrl, setGeneratingUrl] = useState(false);
  const [urlCopied, setUrlCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [partnerFilter, setPartnerFilter] = useState('all');

  useEffect(() => {
    loadPresets();
  }, []);

  const loadPresets = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('test_presets')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;

      const map: Record<string, Preset> = {};
      data?.forEach((p) => {
        map[p.key] = {
          name: p.name,
          partnerId: p.partner_id,
          sourceId: p.source_id,
          scaleId: p.scale_id,
          amount: p.amount,
          duration: p.duration,
          firstName: p.first_name,
          lastName: p.last_name,
          birthDate: p.birth_date,
          email: p.email,
          mobile: p.mobile,
          returnUrl: p.return_url,
          exchangeUrl: p.exchange_url,
          ...(p.business_provider_id && { businessProviderId: p.business_provider_id }),
          orderId: generateOrderId(),
        };
      });
      setPresets(map);
      if (Object.keys(map).length > 0) setSelectedKey(Object.keys(map)[0]);
    } catch (e) {
      console.error('LauncherSection: error loading presets', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (key: string) => {
    setSelectedKey(key);
    setGeneratedUrl('');
    setUrlCopied(false);
  };

  const generateUrl = async () => {
    if (!selectedKey) return;
    setGeneratingUrl(true);
    setGeneratedUrl('');
    try {
      const params = presets[selectedKey];
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-test-url`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify(params),
      });
      if (!res.ok) throw new Error('Erreur génération URL');
      const data = await res.json();
      if (data.success && data.url) setGeneratedUrl(data.url);
    } catch (e) {
      console.error(e);
    } finally {
      setGeneratingUrl(false);
    }
  };

  const copyUrl = () => {
    navigator.clipboard.writeText(generatedUrl);
    setUrlCopied(true);
    setTimeout(() => setUrlCopied(false), 2000);
  };

  const openMobile = () => {
    const w = 375, h = 812;
    window.open(generatedUrl, 'Mobile', `width=${w},height=${h},left=${(screen.width - w) / 2},top=${(screen.height - h) / 2},resizable=yes,scrollbars=yes`);
  };

  const partners = Array.from(new Set(Object.values(presets).map(p => p.partnerId)));

  const visiblePresets = Object.entries(presets).filter(([, p]) =>
    partnerFilter === 'all' || p.partnerId === partnerFilter
  );

  const card = isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200';
  const text = isDarkMode ? 'text-white' : 'text-gray-900';
  const subtext = isDarkMode ? 'text-gray-400' : 'text-gray-500';

  return (
    <div className={`rounded-xl shadow-lg border-2 mb-8 overflow-hidden ${card}`}>
      {/* Header - toujours visible */}
      <button
        onClick={() => setExpanded(v => !v)}
        className={`w-full flex items-center justify-between p-6 transition-colors ${isDarkMode ? 'hover:bg-white/5' : 'hover:bg-gray-50'}`}
      >
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center text-xl">
            🚀
          </div>
          <div className="text-left">
            <h2 className={`text-xl font-bold ${text}`}>Lanceur</h2>
            <p className={`text-sm ${subtext}`}>Lancez des tests manuels directement depuis l'accueil</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={(e) => { e.stopPropagation(); onAutoLaunch(); }}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
          >
            <Play className="w-4 h-4" />
            <span>Test automatique</span>
          </button>
          {expanded
            ? <ChevronUp className={`w-5 h-5 ${subtext}`} />
            : <ChevronDown className={`w-5 h-5 ${subtext}`} />
          }
        </div>
      </button>

      {/* Corps expandable */}
      {expanded && (
        <div className={`px-6 pb-6 border-t ${isDarkMode ? 'border-white/10' : 'border-gray-100'}`}>
          <div className="pt-5 space-y-5">
            {/* Filtre partenaire */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-sm font-medium ${subtext}`}>Partenaire :</span>
              <button
                onClick={() => setPartnerFilter('all')}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${partnerFilter === 'all' ? 'bg-orange-500 text-white' : isDarkMode ? 'bg-white/10 text-gray-300 hover:bg-white/20' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                Tous
              </button>
              {partners.map(pid => {
                const partner = mapPartnerIdToPartner(pid);
                const logo = partner ? getPartnerLogo(partner) : null;
                return (
                  <button
                    key={pid}
                    onClick={() => setPartnerFilter(pid)}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-colors ${partnerFilter === pid ? 'bg-orange-500 text-white' : isDarkMode ? 'bg-white/10 text-gray-300 hover:bg-white/20' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                  >
                    {logo && <img src={logo.src} alt={logo.alt} className="w-4 h-4 object-contain" />}
                    {pid.replace('web_', '').toUpperCase()}
                  </button>
                );
              })}
            </div>

            {/* Grille de presets */}
            {loading ? (
              <div className={`text-center py-8 text-sm ${subtext}`}>Chargement...</div>
            ) : visiblePresets.length === 0 ? (
              <div className={`text-center py-8 text-sm ${subtext}`}>Aucun preset disponible</div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {visiblePresets.map(([key, preset]) => {
                  const partner = mapPartnerIdToPartner(preset.partnerId) as Partner | null;
                  const logo = partner ? getPartnerLogo(partner) : null;
                  const selected = selectedKey === key;
                  return (
                    <button
                      key={key}
                      onClick={() => handleSelect(key)}
                      className={`relative flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all text-center ${
                        selected
                          ? 'border-orange-400 bg-orange-50 shadow-md ring-2 ring-orange-200'
                          : isDarkMode
                          ? 'border-white/10 bg-white/5 hover:border-white/30 hover:bg-white/10'
                          : 'border-gray-200 bg-white hover:border-orange-300 hover:shadow-sm'
                      }`}
                    >
                      {selected && (
                        <div className="absolute top-1.5 right-1.5 w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center">
                          <Check className="w-2.5 h-2.5 text-white" />
                        </div>
                      )}
                      <div className="w-10 h-10 rounded-lg bg-white border border-gray-100 flex items-center justify-center overflow-hidden shadow-sm">
                        {logo
                          ? <img src={logo.src} alt={logo.alt} className="w-9 h-9 object-contain" />
                          : <span className="text-xs font-bold text-gray-500">{preset.partnerId.replace('web_', '').substring(0, 2).toUpperCase()}</span>
                        }
                      </div>
                      <div className={`text-xs font-semibold leading-tight ${selected ? 'text-orange-800' : text}`}>{preset.name}</div>
                      <div className={`text-xs px-1.5 py-0.5 rounded ${isDarkMode ? 'bg-white/10 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>{preset.sourceId}</div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Actions */}
            {selectedKey && (
              <div className="space-y-3">
                <button
                  onClick={generateUrl}
                  disabled={generatingUrl}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Link2 className="w-5 h-5" />
                  {generatingUrl ? 'Génération...' : 'Générer l\'URL de test'}
                </button>

                {generatedUrl && (
                  <div className={`p-4 rounded-xl border-2 space-y-3 ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-green-50 border-green-200'}`}>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={generatedUrl}
                        readOnly
                        className={`flex-1 px-3 py-2 rounded-lg border text-sm truncate ${isDarkMode ? 'bg-white/10 border-white/20 text-white' : 'bg-white border-green-300 text-gray-800'}`}
                      />
                      <button
                        onClick={copyUrl}
                        className="flex items-center gap-1.5 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors flex-shrink-0"
                      >
                        {urlCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        {urlCopied ? 'Copié' : 'Copier'}
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={openMobile}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                      >
                        <Smartphone className="w-4 h-4" />
                        Mode mobile
                      </button>
                      <button
                        onClick={() => setShowQr(true)}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
                      >
                        <QrCode className="w-4 h-4" />
                        QR Code
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* QR Code modal */}
      {showQr && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setShowQr(false)}>
          <div className="bg-white rounded-2xl p-6 max-w-xs w-full mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-gray-900">QR Code</h3>
              <button onClick={() => setShowQr(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex flex-col items-center gap-3">
              <p className="text-sm text-gray-500 text-center">Scannez avec votre mobile</p>
              <div className="bg-white p-3 rounded-xl border-2 border-gray-200">
                <QRCodeSVG value={generatedUrl} size={200} level="H" includeMargin />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
