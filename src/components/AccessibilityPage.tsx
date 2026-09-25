import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Eye, Play, Loader2, AlertTriangle, CheckCircle2, XCircle, Info,
  ChevronDown, ChevronRight, ExternalLink, Image as ImageIcon, FileJson,
  RefreshCw, Clock, Globe, ShieldAlert, ShieldCheck, Shield, Upload, Trash2, FileText
} from 'lucide-react';
import { gitlabApi } from '../services/gitlabApi';
import { supabase } from '../services/supabaseClient';
import { downloadHtmlReport } from '../utils/htmlExport';


type WcagStandard = 'wcag2a' | 'wcag2aa' | 'wcag21a' | 'wcag21aa' | 'wcag22aa';

const WCAG_STANDARDS: { value: WcagStandard; label: string; description: string }[] = [
  { value: 'wcag2a', label: 'WCAG 2.0 A', description: 'Niveau minimum de conformité' },
  { value: 'wcag2aa', label: 'WCAG 2.0 AA', description: 'Niveau recommandé (référence légale)' },
  { value: 'wcag21a', label: 'WCAG 2.1 A', description: 'WCAG 2.0 A + critères mobiles' },
  { value: 'wcag21aa', label: 'WCAG 2.1 AA', description: 'Standard européen (EAA / RGAA)' },
  { value: 'wcag22aa', label: 'WCAG 2.2 AA', description: 'Dernière norme, focus cognitif' },
];

interface AxeNode {
  target: string[];
  html: string;
  failureSummary?: string;
  screenshot?: string;
  impact?: string | null;
}

interface AxeRule {
  id: string;
  impact: string | null;
  description: string;
  help: string;
  helpUrl: string;
  tags?: string[];
  nodes: AxeNode[];
}

interface AxeReport {
  url: string;
  timestamp: string;
  pageName?: string;
  fullPageScreenshot?: string;
  violations: AxeRule[];
  passes: AxeRule[];
  incomplete?: AxeRule[];
  inapplicable?: AxeRule[];
}

interface ReportEntry {
  id: string;
  serverId?: string;
  name: string;
  standard: WcagStandard;
  status: 'success' | 'failed' | 'running';
  date: string;
  report: AxeReport;
  imageMap?: Map<string, string>;
}

const IMPACT_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; text: string; icon: React.FC<{ className?: string }> }> = {
  critical: { label: 'Critique', color: 'red', bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', icon: XCircle },
  serious: { label: 'Sérieux', color: 'orange', bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', icon: AlertTriangle },
  moderate: { label: 'Modéré', color: 'amber', bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', icon: AlertTriangle },
  minor: { label: 'Mineur', color: 'blue', bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', icon: Info },
};

const getImpactConfig = (impact: string | null | undefined) =>
  IMPACT_CONFIG[impact || 'minor'] || IMPACT_CONFIG.minor;

const screenshotToUrl = (
  screenshot: string | undefined,
  pageName: string | undefined,
  imageMap?: Map<string, string>
): string | null => {
  if (!screenshot) return null;
  const filename = screenshot.split('/').pop();
  if (!filename) return null;
  if (imageMap) {
    const blobUrl = imageMap.get(filename) || imageMap.get(screenshot);
    if (blobUrl) return blobUrl;
  }
  return `/images/accessibility-tests/${filename}`;
};

const countNodes = (rules: AxeRule[]): number =>
  rules.reduce((sum, r) => sum + (r.nodes?.length || 0), 0);

export const AccessibilityPage: React.FC = () => {
  const [standard, setStandard] = useState<WcagStandard>('wcag21aa');
  const [launching, setLaunching] = useState(false);
  const [launchMessage, setLaunchMessage] = useState<string | null>(null);
  const [reports, setReports] = useState<ReportEntry[]>([]);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'violations' | 'passes' | 'all'>('violations');
  const [expandedRules, setExpandedRules] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);

  const [deleting, setDeleting] = useState<string | null>(null);
  const [loadingReports, setLoadingReports] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingReports(true);
      const { data, error } = await supabase
        .from('accessibility_reports')
        .select('*')
        .not('report_data', 'is', null)
        .order('created_at', { ascending: false });

      if (cancelled) return;
      setLoadingReports(false);
      if (error || !data) return;

      const saved: ReportEntry[] = data.map((row: Record<string, unknown>) => {
        const imagePaths = (row.image_paths as string[]) || [];
        const imgMap = new Map<string, string>();
        for (const p of imagePaths) {
          const filename = p.split('/').pop() || p;
          const { data: url } = supabase.storage.from('accessibility-images').getPublicUrl(p);
          imgMap.set(filename, url.publicUrl);
        }
        return {
          id: `server-${row.id}`,
          serverId: row.id as string,
          name: row.title as string,
          standard: (row.standard as WcagStandard) || 'wcag21aa',
          status: ((row.status as string) === 'failed' ? 'failed' : 'success'),
          date: (row.test_date as string) || (row.created_at as string),
          report: row.report_data as AxeReport,
          imageMap: imgMap.size > 0 ? imgMap : undefined,
        };
      });

      if (saved.length > 0) {
        setReports(prev => {
          const existingIds = new Set(prev.map(r => r.serverId));
          const newOnes = saved.filter(r => !existingIds.has(r.serverId));
          return [...prev, ...newOnes];
        });
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const selectedReport = useMemo(
    () => reports.find(r => r.id === selectedReportId) || null,
    [reports, selectedReportId]
  );

  useEffect(() => {
    if (loadingDetail && selectedReport) setLoadingDetail(false);
  }, [selectedReport, loadingDetail]);

  const handleLaunch = async () => {
    setLaunching(true);
    setLaunchMessage(null);
    try {
      await gitlabApi.triggerPipeline('master', {
        ENV: 'CI',
        ENVIRONMENT: 'CI',
        SELECTED_TESTS: '@accessibility',
        WCAG_STANDARD: standard,
      });
      setLaunchMessage('Tests d\'accessibilité lancés via le tag @accessibility. Le rapport apparaîtra une fois le pipeline terminé.');
    } catch (err) {
      setLaunchMessage(`Erreur lors du lancement : ${err instanceof Error ? err.message : 'erreur inconnue'}`);
    } finally {
      setLaunching(false);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setImporting(true);
    setImportError(null);

    try {
      const fileArray = Array.from(files);
      const jsonFile = fileArray.find(f => f.name.endsWith('.json'));
      if (!jsonFile) {
        setImportError('Aucun fichier JSON trouvé. Sélectionnez un fichier .json et les images associées.');
        return;
      }

      const jsonText = await jsonFile.text();
      let parsed: AxeReport;
      try {
        parsed = JSON.parse(jsonText);
      } catch {
        setImportError('Le fichier JSON est invalide ou corrompu.');
        return;
      }

      if (!parsed.violations && !parsed.passes) {
        setImportError('Le JSON ne contient ni violations ni réussites. Format non reconnu.');
        return;
      }

      const reportName = parsed.pageName
        ? parsed.pageName.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
        : jsonFile.name.replace(/\.json$/, '');

      const imageFiles = fileArray.filter(f =>
        f.type.startsWith('image/') || f.name.endsWith('.png') || f.name.endsWith('.jpg') || f.name.endsWith('.jpeg')
      );

      const reportStatus = (parsed.violations?.length || 0) > 0 ? 'failed' : 'success';

      const { data: insertData, error: insertError } = await supabase
        .from('accessibility_reports')
        .insert({
          title: reportName,
          url: parsed.url || '',
          description: '',
          test_date: parsed.timestamp ? parsed.timestamp.split('T')[0] : new Date().toISOString().split('T')[0],
          report_data: parsed,
          image_paths: [],
          status: reportStatus,
          standard: 'wcag21aa',
        })
        .select('id')
        .single();

      if (insertError || !insertData) {
        setImportError(`Erreur lors de l'enregistrement : ${insertError?.message || 'erreur inconnue'}`);
        return;
      }

      const reportRowId = insertData.id as string;
      const imagePaths: string[] = [];
      const imageMap = new Map<string, string>();

      for (const f of imageFiles) {
        const storagePath = `${reportRowId}/${f.name}`;
        const { error: uploadError } = await supabase.storage
          .from('accessibility-images')
          .upload(storagePath, f, { upsert: true });

        if (uploadError) {
          setImportError(`Erreur lors de l'upload de l'image ${f.name} : ${uploadError.message}`);
          return;
        }
        imagePaths.push(storagePath);
        const { data: urlData } = supabase.storage.from('accessibility-images').getPublicUrl(storagePath);
        imageMap.set(f.name, urlData.publicUrl);
      }

      if (imagePaths.length > 0) {
        await supabase
          .from('accessibility_reports')
          .update({ image_paths: imagePaths })
          .eq('id', reportRowId);
      }

      const entry: ReportEntry = {
        id: `server-${reportRowId}`,
        serverId: reportRowId,
        name: reportName,
        standard: 'wcag21aa',
        status: reportStatus as 'success' | 'failed',
        date: parsed.timestamp || new Date().toISOString(),
        report: parsed,
        imageMap: imageMap.size > 0 ? imageMap : undefined,
      };

      setReports(prev => [entry, ...prev]);
      setSelectedReportId(entry.id);
      setLaunchMessage(`Rapport « ${reportName} » enregistré sur le serveur avec ${imageFiles.length} image(s).`);
    } catch (err) {
      setImportError(`Erreur lors de l'import : ${err instanceof Error ? err.message : 'erreur inconnue'}`);
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (reportId: string, serverId: string | undefined) => {
    if (!serverId) return;
    setDeleting(reportId);
    try {
      const { data: row } = await supabase
        .from('accessibility_reports')
        .select('image_paths')
        .eq('id', serverId)
        .maybeSingle();

      if (row?.image_paths) {
        for (const p of row.image_paths as string[]) {
          await supabase.storage.from('accessibility-images').remove([p]);
        }
      }

      await supabase.from('accessibility_reports').delete().eq('id', serverId);

      setReports(prev => prev.filter(r => r.id !== reportId));
      if (selectedReportId === reportId) setSelectedReportId(null);
    } catch (err) {
      setImportError(`Erreur lors de la suppression : ${err instanceof Error ? err.message : 'erreur inconnue'}`);
    } finally {
      setDeleting(null);
    }
  };

  const handleExportHtml = () => {
    if (!selectedReport) return;
    downloadHtmlReport({
      name: selectedReport.name,
      standard: selectedReport.standard,
      date: selectedReport.date,
      report: selectedReport.report,
      resolveScreenshot: (screenshot, pageName) =>
        screenshotToUrl(screenshot, pageName, selectedReport.imageMap),
    });
  };

  const toggleRule = (id: string) => {
    setExpandedRules(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const stats = useMemo(() => {
    if (!selectedReport) return null;
    const r = selectedReport.report;
    const violations = r.violations || [];
    const passes = r.passes || [];
    const violationNodes = countNodes(violations);
    const passNodes = countNodes(passes);
    const byImpact = { critical: 0, serious: 0, moderate: 0, minor: 0 };
    violations.forEach(v => {
      const key = (v.impact || 'minor') as keyof typeof byImpact;
      if (key in byImpact) byImpact[key]++;
    });
    return { totalRules: violations.length + passes.length, violations: violations.length, passes: passes.length, violationNodes, passNodes, byImpact };
  }, [selectedReport]);

  const filteredViolations = useMemo(() => {
    if (!selectedReport) return [];
    if (filter === 'passes') return [];
    return selectedReport.report.violations || [];
  }, [selectedReport, filter]);

  const filteredPasses = useMemo(() => {
    if (!selectedReport) return [];
    if (filter === 'violations') return [];
    return selectedReport.report.passes || [];
  }, [selectedReport, filter]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-11 h-11 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl flex items-center justify-center shadow-md">
                <Eye className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Accessibilité</h1>
                <p className="text-sm text-gray-500">Tests automatisés axe-core via le tag @accessibility</p>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-gray-400" />
                <label className="text-sm font-medium text-gray-600">Norme</label>
                <select
                  value={standard}
                  onChange={e => setStandard(e.target.value as WcagStandard)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {WCAG_STANDARDS.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".json,image/*,.png,.jpg,.jpeg"
                multiple
                onChange={handleImport}
                className="hidden"
              />

              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={importing}
                className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-60 font-medium text-sm"
              >
                {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                <span>{importing ? 'Import...' : 'Importer un rapport'}</span>
              </button>

              <button
                onClick={handleLaunch}
                disabled={launching}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed font-medium text-sm"
              >
                {launching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                <span>{launching ? 'Lancement...' : 'Lancer les tests'}</span>
              </button>
            </div>
          </div>

          {(launchMessage || importError) && (
            <div className={`mt-3 px-4 py-2.5 rounded-lg text-sm flex items-center space-x-2 ${
              (importError || launchMessage?.includes('Erreur')) ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'
            }`}>
              {(importError || launchMessage?.includes('Erreur')) ? <AlertTriangle className="w-4 h-4 flex-shrink-0" /> : <CheckCircle2 className="w-4 h-4 flex-shrink-0" />}
              <span>{importError || launchMessage}</span>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        <p className="text-xs text-gray-400 mb-4">
          Norme sélectionnée : <span className="font-semibold">{WCAG_STANDARDS.find(s => s.value === standard)?.label}</span> — {WCAG_STANDARDS.find(s => s.value === standard)?.description}
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: report list */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <FileJson className="w-4 h-4" />
                  Rapports ({reports.length})
                  {reports.some(r => r.id.startsWith('import-')) && (
                    <span className="text-xs font-normal text-gray-400">(dont imports)</span>
                  )}
                </h2>
              </div>
              <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
                {loadingReports ? (
                  <div className="flex flex-col items-center justify-center py-16">
                    <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-3" />
                    <p className="text-sm text-gray-500">Chargement des rapports...</p>
                  </div>
                ) : reports.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16">
                    <FileJson className="w-10 h-10 text-gray-300 mb-2" />
                    <p className="text-sm text-gray-400">Aucun rapport disponible</p>
                  </div>
                ) : reports.map(report => {
                  const vCount = report.report.violations?.length || 0;
                  return (
                    <button
                      key={report.id}
                      onClick={() => {
                        setLoadingDetail(true);
                        setSelectedReportId(report.id);
                      }}
                      className={`w-full text-left p-4 transition-colors ${
                        selectedReportId === report.id ? 'bg-blue-50 border-l-4 border-blue-600' : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-gray-900 text-sm truncate">{report.name}</h3>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {new Date(report.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                              {report.serverId && <span className="ml-1 text-blue-500">• serveur</span>}
                            </p>
                            <div className="flex items-center gap-1.5 mt-1.5">
                              <span className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded font-medium">
                                {report.standard.toUpperCase()}
                              </span>
                              {vCount > 0 ? (
                                <span className="text-xs px-1.5 py-0.5 bg-red-100 text-red-700 rounded font-medium flex items-center gap-1">
                                  <XCircle className="w-3 h-3" /> {vCount}
                                </span>
                              ) : (
                                <span className="text-xs px-1.5 py-0.5 bg-green-100 text-green-700 rounded font-medium flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3" /> OK
                                </span>
                              )}
                            </div>
                          </div>
                          {report.serverId && (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDelete(report.id, report.serverId); }}
                              disabled={deleting === report.id}
                              className="text-gray-400 hover:text-red-600 transition-colors p-1 rounded disabled:opacity-50"
                              title="Supprimer du serveur"
                            >
                              {deleting === report.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                            </button>
                          )}
                        </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right: report detail */}
          <div className="lg:col-span-2">
            {loadingDetail ? (
              <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
                <Loader2 className="w-10 h-10 text-blue-500 animate-spin mx-auto mb-3" />
                <p className="text-gray-500">Chargement du rapport...</p>
              </div>
            ) : !selectedReport || !stats ? (
              <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
                <Eye className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-400">Sélectionnez un rapport pour le visualiser</p>
              </div>
            ) : (
              <div className="space-y-5">
                {/* Summary card */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-5 text-white">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <h2 className="text-lg font-bold truncate">{selectedReport.name}</h2>
                        <div className="flex items-center gap-4 mt-1.5 text-sm text-gray-300">
                          <span className="flex items-center gap-1.5"><Globe className="w-3.5 h-3.5" /> <a href={selectedReport.report.url} target="_blank" rel="noopener noreferrer" className="hover:text-white underline truncate max-w-[300px] inline-block">{selectedReport.report.url}</a></span>
                          <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {new Date(selectedReport.report.timestamp).toLocaleString('fr-FR')}</span>
                        </div>
                      </div>
                      <span className="px-3 py-1 bg-white/15 backdrop-blur rounded-full text-xs font-semibold">
                        {selectedReport.standard.toUpperCase()}
                      </span>
                      <button
                        onClick={handleExportHtml}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white/15 hover:bg-white/25 backdrop-blur rounded-lg text-xs font-medium text-white transition-colors"
                        title="Exporter en HTML"
                      >
                        <FileText className="w-3.5 h-3.5" /> Export HTML
                      </button>
                    </div>
                  </div>

                  <div className="p-5">
                    {/* Full-page screenshot */}
                    {(() => {
                      const imgMap = selectedReport.imageMap;
                      const direct = screenshotToUrl(selectedReport.report.fullPageScreenshot, selectedReport.report.pageName, imgMap);
                      const fromMap = imgMap
                        ? Array.from(imgMap.entries()).find(([name]) => name.toLowerCase().includes('full-page'))?.[1]
                        : null;
                      const fullPageUrl = direct || fromMap;
                      if (!fullPageUrl) return null;
                      return (
                        <div className="mb-5">
                          <span className="text-xs font-medium text-gray-500 flex items-center gap-1 mb-2">
                            <ImageIcon className="w-3.5 h-3.5" /> Capture pleine page :
                          </span>
                          <div className="rounded-lg overflow-hidden border border-gray-200 bg-gray-100 max-h-[500px] overflow-y-auto">
                            <img
                              src={fullPageUrl}
                              alt="Capture pleine page"
                              className="w-full object-contain"
                              loading="lazy"
                              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                            />
                          </div>
                        </div>
                      );
                    })()}

                    {/* Stat tiles */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <XCircle className="w-4 h-4 text-red-600" />
                          <span className="text-xs font-medium text-red-700">Violations</span>
                        </div>
                        <p className="text-2xl font-bold text-red-700">{stats.violations}</p>
                        <p className="text-xs text-red-500 mt-0.5">{stats.violationNodes} éléments</p>
                      </div>
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                          <span className="text-xs font-medium text-green-700">Réussis</span>
                        </div>
                        <p className="text-2xl font-bold text-green-700">{stats.passes}</p>
                        <p className="text-xs text-green-500 mt-0.5">{stats.passNodes} éléments</p>
                      </div>
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Shield className="w-4 h-4 text-blue-600" />
                          <span className="text-xs font-medium text-blue-700">Règles</span>
                        </div>
                        <p className="text-2xl font-bold text-blue-700">{stats.totalRules}</p>
                        <p className="text-xs text-blue-500 mt-0.5">évaluées</p>
                      </div>
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <AlertTriangle className="w-4 h-4 text-amber-600" />
                          <span className="text-xs font-medium text-amber-700">Critique/Sérieux</span>
                        </div>
                        <p className="text-2xl font-bold text-amber-700">{stats.byImpact.critical + stats.byImpact.serious}</p>
                        <p className="text-xs text-amber-500 mt-0.5">à corriger</p>
                      </div>
                    </div>

                    {/* Impact breakdown */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-medium text-gray-500">Sévérité :</span>
                      {(['critical', 'serious', 'moderate', 'minor'] as const).map(imp => {
                        const cfg = IMPACT_CONFIG[imp];
                        const count = stats.byImpact[imp];
                        if (count === 0) return null;
                        return (
                          <span key={imp} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text} border ${cfg.border}`}>
                            <cfg.icon className="w-3 h-3" /> {cfg.label} : {count}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Filter tabs */}
                <div className="flex items-center gap-2">
                  {([
                    { key: 'violations', label: 'Violations', count: stats.violations, icon: XCircle, color: 'red' },
                    { key: 'passes', label: 'Réussis', count: stats.passes, icon: CheckCircle2, color: 'green' },
                    { key: 'all', label: 'Tout', count: stats.totalRules, icon: Eye, color: 'gray' },
                  ] as const).map(tab => (
                    <button
                      key={tab.key}
                      onClick={() => setFilter(tab.key)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        filter === tab.key
                          ? tab.color === 'red' ? 'bg-red-600 text-white' : tab.color === 'green' ? 'bg-green-600 text-white' : 'bg-gray-800 text-white'
                          : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <tab.icon className="w-4 h-4" />
                      {tab.label} ({tab.count})
                    </button>
                  ))}
                </div>

                {/* Violations list */}
                {filteredViolations.length > 0 && (
                  <div className="space-y-3">
                    {filteredViolations.map((rule, idx) => (
                      <RuleCard
                        key={`v-${rule.id}-${idx}`}
                        rule={rule}
                        isExpanded={expandedRules.has(`v-${rule.id}-${idx}`)}
                        onToggle={() => toggleRule(`v-${rule.id}-${idx}`)}
                        pageName={selectedReport.report.pageName}
                        imageMap={selectedReport.imageMap}
                        variant="violation"
                      />
                    ))}
                  </div>
                )}

                {/* Passes list */}
                {filteredPasses.length > 0 && (
                  <div className="space-y-3">
                    {filteredPasses.slice(0, 20).map((rule, idx) => (
                      <RuleCard
                        key={`p-${rule.id}-${idx}`}
                        rule={rule}
                        isExpanded={expandedRules.has(`p-${rule.id}-${idx}`)}
                        onToggle={() => toggleRule(`p-${rule.id}-${idx}`)}
                        pageName={selectedReport.report.pageName}
                        imageMap={selectedReport.imageMap}
                        variant="pass"
                      />
                    ))}
                    {filteredPasses.length > 20 && (
                      <p className="text-center text-sm text-gray-400 py-2">
                        + {filteredPasses.length - 20} autres règles réussies
                      </p>
                    )}
                  </div>
                )}

                {filter === 'violations' && filteredViolations.length === 0 && (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
                    <ShieldCheck className="w-12 h-12 text-green-500 mx-auto mb-3" />
                    <p className="text-green-700 font-medium">Aucune violation détectée</p>
                    <p className="text-sm text-green-600 mt-1">Toutes les règles évaluées sont conformes.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

interface RuleCardProps {
  rule: AxeRule;
  isExpanded: boolean;
  onToggle: () => void;
  pageName?: string;
  imageMap?: Map<string, string>;
  variant: 'violation' | 'pass';
}

const RuleCard: React.FC<RuleCardProps> = ({ rule, isExpanded, onToggle, pageName, imageMap, variant }) => {
  const cfg = getImpactConfig(rule.impact);
  const nodeCount = rule.nodes?.length || 0;
  const isViolation = variant === 'violation';

  return (
    <div className={`bg-white rounded-xl border ${isViolation ? cfg.border : 'border-green-200'} overflow-hidden transition-shadow hover:shadow-md`}>
      <button
        onClick={onToggle}
        className={`w-full text-left p-4 flex items-start gap-3 transition-colors ${isViolation ? 'hover:bg-gray-50' : 'hover:bg-green-50/50'}`}
      >
        <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
          isViolation ? `${cfg.bg} ${cfg.text}` : 'bg-green-100 text-green-700'
        }`}>
          {isViolation ? <cfg.icon className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-gray-900 text-sm">{rule.id}</h3>
            {isViolation && rule.impact && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${cfg.bg} ${cfg.text}`}>
                {cfg.label}
              </span>
            )}
            <span className="text-xs text-gray-400">{nodeCount} élément{nodeCount > 1 ? 's' : ''}</span>
          </div>
          <p className="text-sm text-gray-600 mt-0.5">{rule.help}</p>
          {rule.tags && rule.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {rule.tags.filter(t => t.startsWith('wcag')).slice(0, 4).map(tag => (
                <span key={tag} className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded font-mono">{tag}</span>
              ))}
            </div>
          )}
        </div>

        <div className="flex-shrink-0 pt-1">
          {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
        </div>
      </button>

      {isExpanded && (
        <div className="border-t border-gray-100 bg-gray-50/50 p-4 space-y-3">
          <p className="text-xs text-gray-500">{rule.description}</p>
          <a href={rule.helpUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800">
            <ExternalLink className="w-3 h-3" /> Documentation axe-core
          </a>

          {rule.nodes?.map((node, idx) => {
            const screenshotUrl = screenshotToUrl(node.screenshot, pageName, imageMap);
            return (
              <div key={idx} className="bg-white rounded-lg border border-gray-200 p-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold text-gray-400">#{idx + 1}</span>
                  {node.impact && isViolation && (
                    <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${getImpactConfig(node.impact).bg} ${getImpactConfig(node.impact).text}`}>
                      {getImpactConfig(node.impact).label}
                    </span>
                  )}
                </div>

                {/* Target selector */}
                <div className="mb-2">
                  <span className="text-xs font-medium text-gray-500">Sélecteur cible :</span>
                  <code className="block mt-1 text-xs bg-gray-900 text-green-400 p-2 rounded font-mono overflow-x-auto">
                    {node.target.join(' → ')}
                  </code>
                </div>

                {/* HTML */}
                {node.html && (
                  <div className="mb-2">
                    <span className="text-xs font-medium text-gray-500">HTML :</span>
                    <pre className="mt-1 text-xs bg-gray-100 text-gray-700 p-2 rounded overflow-x-auto max-h-32 overflow-y-auto">
                      <code>{node.html}</code>
                    </pre>
                  </div>
                )}

                {/* Failure summary */}
                {node.failureSummary && (
                  <div className="mb-2">
                    <span className="text-xs font-medium text-gray-500 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Détail des échecs :
                    </span>
                    <p className="mt-1 text-xs text-gray-600 whitespace-pre-line bg-amber-50 border border-amber-100 p-2 rounded">
                      {node.failureSummary}
                    </p>
                  </div>
                )}

                {/* Screenshot */}
                {screenshotUrl && (
                  <div className="mt-2">
                    <span className="text-xs font-medium text-gray-500 flex items-center gap-1">
                      <ImageIcon className="w-3 h-3" /> Capture d'écran :
                    </span>
                    <div className="mt-1 rounded-lg overflow-hidden border border-gray-200 bg-gray-100">
                      <img
                        src={screenshotUrl}
                        alt={`Capture ${rule.id} #${idx + 1}`}
                        className="w-full max-h-64 object-contain"
                        loading="lazy"
                        onError={e => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
