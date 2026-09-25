import React, { useState, useEffect } from 'react';
import { Play, Link2, Smartphone, QrCode, Copy, Check, X, Rocket, Zap, Loader2, Sparkles, FileText, ChevronRight } from 'lucide-react';
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
  staticUrl?: string | null;
  orderId: string;
  [key: string]: string | undefined | null;
}

interface LauncherSectionProps {
  isDarkMode: boolean;
  onAutoLaunch: () => void;
}

const generateOrderId = () => `TestAuto${Math.floor(10000000 + Math.random() * 90000000)}`;

export const LauncherSection: React.FC<LauncherSectionProps> = ({ isDarkMode, onAutoLaunch }) => {
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
          ...(p.static_url && { staticUrl: p.static_url }),
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

  const launchTest = async () => {
    if (!selectedKey) return;
    const preset = presets[selectedKey];
    if (!preset) return;

    if (preset.staticUrl) {
      setGeneratedUrl(preset.staticUrl);
      setUrlCopied(false);
      return;
    }

    await generateUrl();
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

  // Theme tokens
  const surface = isDarkMode ? 'bg-slate-800/60 border-slate-700' : 'bg-white border-slate-200';
  const headerBg = isDarkMode ? 'bg-slate-800/80' : 'bg-gradient-to-r from-slate-50 to-white';
  const textPrimary = isDarkMode ? 'text-white' : 'text-slate-900';
  const textSecondary = isDarkMode ? 'text-slate-400' : 'text-slate-500';
  const textTertiary = isDarkMode ? 'text-slate-500' : 'text-slate-400';
  const divider = isDarkMode ? 'border-slate-700' : 'border-slate-100';
  const chipBase = isDarkMode ? 'bg-slate-700/60 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200';
  const chipActive = 'bg-orange-500 text-white shadow-sm';

  return (
    <div className={`rounded-2xl shadow-xl border overflow-hidden ${surface}`}>
      {/* ── Header ── */}
      <div className={`flex items-center justify-between px-6 py-4 border-b ${divider} ${headerBg}`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-sm">
            <Rocket className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className={`text-base font-bold ${textPrimary}`}>Lanceur de tests</h2>
            <p className={`text-xs ${textSecondary}`}>Générez et ouvrez des URLs de test manuel</p>
          </div>
        </div>
        <button
          onClick={onAutoLaunch}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all text-sm font-semibold shadow-sm hover:shadow-md"
        >
          <Zap className="w-4 h-4" />
          <span>Test automatique</span>
        </button>
      </div>

      <div className="px-6 py-5 space-y-5">
        {/* ── Partner filter bar ── */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-xs font-semibold uppercase tracking-wide ${textTertiary}`}>Partenaire</span>
          <button
            onClick={() => setPartnerFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${partnerFilter === 'all' ? chipActive : chipBase}`}
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
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${partnerFilter === pid ? chipActive : chipBase}`}
              >
                {logo && <img src={logo.src} alt={logo.alt} className="w-4 h-4 object-contain" />}
                {pid.replace('web_', '').toUpperCase()}
              </button>
            );
          })}
        </div>

        {/* ── Preset grid ── */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className={`w-7 h-7 animate-spin mb-3 ${textTertiary}`} />
            <p className={`text-sm ${textSecondary}`}>Chargement des presets…</p>
          </div>
        ) : visiblePresets.length === 0 ? (
          <div className={`flex flex-col items-center justify-center py-16 ${textSecondary}`}>
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-3 ${isDarkMode ? 'bg-slate-700/50' : 'bg-slate-100'}`}>
              <FileText className={`w-7 h-7 ${textTertiary}`} />
            </div>
            <p className="text-sm font-medium">Aucun preset disponible</p>
          </div>
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
                  className={`group relative flex flex-col items-center gap-2.5 p-4 rounded-xl border transition-all text-center ${
                    selected
                      ? isDarkMode
                        ? 'border-orange-500 bg-orange-500/10 ring-2 ring-orange-500/30 shadow-md'
                        : 'border-orange-500 bg-orange-50 ring-2 ring-orange-200 shadow-md'
                      : isDarkMode
                        ? 'border-slate-700 bg-slate-700/30 hover:border-slate-600 hover:bg-slate-700/50'
                        : 'border-slate-200 bg-white hover:border-orange-300 hover:shadow-md'
                  }`}
                >
                  {selected && (
                    <div className="absolute top-2 right-2 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center shadow-sm">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                  <div className={`w-12 h-12 rounded-xl border flex items-center justify-center overflow-hidden shadow-sm transition-colors ${
                    isDarkMode ? 'border-slate-600 bg-white' : 'border-slate-100 bg-white'
                  }`}>
                    {logo
                      ? <img src={logo.src} alt={logo.alt} className="w-10 h-10 object-contain" />
                      : <span className={`text-sm font-bold ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{preset.partnerId.replace('web_', '').substring(0, 2).toUpperCase()}</span>
                    }
                  </div>
                  <div className={`text-xs font-semibold leading-snug line-clamp-2 ${selected ? (isDarkMode ? 'text-orange-300' : 'text-orange-800') : textPrimary}`}>{preset.name}</div>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${isDarkMode ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-500'}`}>{preset.sourceId}</span>
                    {preset.staticUrl && (
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium flex items-center gap-0.5 ${isDarkMode ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-100 text-blue-700'}`}>
                        <Link2 className="w-2.5 h-2.5" />
                        Statique
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* ── Action & URL section ── */}
        {selectedKey && (
          <div className={`pt-4 border-t ${divider} space-y-4`}>
            {/* Selected preset info */}
            {presets[selectedKey] && (
              <div className={`flex items-center gap-3 p-3 rounded-xl ${isDarkMode ? 'bg-slate-700/40' : 'bg-slate-50'}`}>
                {(() => {
                  const preset = presets[selectedKey];
                  const partner = mapPartnerIdToPartner(preset.partnerId) as Partner | null;
                  const logo = partner ? getPartnerLogo(partner) : null;
                  return (
                    <>
                      <div className={`w-9 h-9 rounded-lg border flex items-center justify-center overflow-hidden flex-shrink-0 ${isDarkMode ? 'border-slate-600 bg-white' : 'border-slate-100 bg-white'}`}>
                        {logo
                          ? <img src={logo.src} alt={logo.alt} className="w-7 h-7 object-contain" />
                          : <span className={`text-xs font-bold ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{preset.partnerId.replace('web_', '').substring(0, 2).toUpperCase()}</span>
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={`text-sm font-semibold truncate ${textPrimary}`}>{preset.name}</div>
                        <div className={`text-xs ${textSecondary}`}>
                          {preset.partnerId.replace('web_', '').toUpperCase()} · {preset.sourceId} · {preset.amount}€ / {preset.duration}mois
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}

            {/* Generate button */}
            <button
              onClick={launchTest}
              disabled={generatingUrl}
              className="w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl font-semibold transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generatingUrl ? <Loader2 className="w-5 h-5 animate-spin" /> : presets[selectedKey]?.staticUrl ? <Link2 className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
              <span>{generatingUrl ? 'Génération…' : presets[selectedKey]?.staticUrl ? 'Ouvrir l\'URL statique' : 'Générer l\'URL de test'}</span>
            </button>

            {/* Generated URL */}
            {generatedUrl && (
              <div className={`p-4 rounded-xl border space-y-3 transition-all ${
                isDarkMode
                  ? 'bg-emerald-500/10 border-emerald-500/30'
                  : 'bg-emerald-50 border-emerald-200'
              }`}>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500" />
                  <label className={`text-sm font-semibold ${isDarkMode ? 'text-emerald-300' : 'text-emerald-800'}`}>URL générée</label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={generatedUrl}
                    readOnly
                    className={`flex-1 px-3 py-2 rounded-lg border text-sm font-mono truncate ${
                      isDarkMode ? 'bg-slate-800 border-slate-600 text-slate-200' : 'bg-white border-emerald-200 text-slate-800'
                    }`}
                  />
                  <button
                    onClick={copyUrl}
                    className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors flex-shrink-0"
                  >
                    {urlCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>{urlCopied ? 'Copié' : 'Copier'}</span>
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    onClick={openMobile}
                    className="flex items-center justify-center gap-2 px-3 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    <Smartphone className="w-4 h-4" />
                    Mode mobile
                  </button>
                  <button
                    onClick={() => setShowQr(true)}
                    className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isDarkMode ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-slate-800 hover:bg-slate-900 text-white'
                    }`}
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

      {/* ── QR Code modal ── */}
      {showQr && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowQr(false)}>
          <div className="bg-white rounded-2xl p-6 max-w-xs w-full mx-4 shadow-2xl animate-[fadeIn_0.2s_ease-out]" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-900">QR Code</h3>
              <button onClick={() => setShowQr(false)} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex flex-col items-center gap-3">
              <p className="text-sm text-slate-500 text-center">Scannez avec votre mobile</p>
              <div className="bg-white p-4 rounded-xl border-2 border-slate-100">
                <QRCodeSVG value={generatedUrl} size={200} level="H" includeMargin />
              </div>
              <p className="text-xs text-slate-400 text-center">Le QR code redirige vers l'URL de test générée</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
