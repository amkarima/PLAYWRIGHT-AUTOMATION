import React, { useState, useEffect, useRef } from 'react';
import JSZip from 'jszip';
import { X, FileText, CheckCircle, XCircle, Clock, AlertTriangle, Search, Bug, Monitor, File as FileEdit, Play, Video, Image as ImageIcon, Rocket, Clock as ClockIcon, Upload, Loader2, Mail, Send } from 'lucide-react';
import { TestResult, PlaywrightReport, TestFailureAnalysis } from '../types';
import { gitlabApi } from '../services/gitlabApi';
import { TestFailureAnalysisModal } from './TestFailureAnalysisModal';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ─── Count-up hook ──────────────────────────────────────────────────────────
function useCountUp(target: number, duration: number = 900, delay: number = 0) {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (target === 0) { setValue(0); return; }
    const startTimer = setTimeout(() => {
      const start = performance.now();
      const animate = (now: number) => {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setValue(Math.round(target * eased));
        if (progress < 1) rafRef.current = requestAnimationFrame(animate);
      };
      rafRef.current = requestAnimationFrame(animate);
    }, delay);
    return () => { clearTimeout(startTimer); cancelAnimationFrame(rafRef.current); };
  }, [target, duration, delay]);

  return value;
}

// ─── Animated progress ring ──────────────────────────────────────────────────
const ProgressRing: React.FC<{ pct: number; color: string; size?: number; stroke?: number; delay?: number; label?: string }> = ({
  pct, color, size = 120, stroke = 10, delay = 200, label,
}) => {
  const [animatedPct, setAnimatedPct] = useState(0);
  const radius = (size - stroke) / 2;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (animatedPct / 100) * circ;
  const countedPct = useCountUp(pct, 1000, delay);

  useEffect(() => {
    const t = setTimeout(() => setAnimatedPct(pct), delay + 50);
    return () => clearTimeout(t);
  }, [pct, delay]);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="rgba(0,0,0,0.07)" strokeWidth={stroke} />
        <circle
          cx={size/2} cy={size/2} r={radius} fill="none" stroke={color}
          strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset}
          style={{
            transition: 'stroke-dashoffset 1.2s cubic-bezier(0.22,1,0.36,1)',
            filter: `drop-shadow(0 0 6px ${color}50)`,
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-extrabold" style={{ color }}>{countedPct}%</span>
        {label && <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wide mt-0.5">{label}</span>}
      </div>
    </div>
  );
};

// ─── Stats section (hooks must be at component level) ───────────────────────
const StatsSection: React.FC<{
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  duration: number;
  formatDuration: (ms: number) => string;
}> = ({ total, passed, failed, skipped, duration, formatDuration }) => {
  const rate = total > 0 ? (passed / total) * 100 : 0;
  const animatedTotal = useCountUp(total, 900, 100);
  const animatedPassed = useCountUp(passed, 900, 200);
  const animatedFailed = useCountUp(failed, 900, 300);
  const animatedSkipped = useCountUp(skipped, 900, 400);

  let ringColor = '#22c55e';
  if (rate < 50) ringColor = '#ef4444';
  else if (rate < 70) ringColor = '#f97316';
  else if (rate < 90) ringColor = '#f59e0b';

  const stats = [
    { label: 'Total', value: animatedTotal, color: '#6b7280', bg: 'rgba(107,114,128,0.06)', icon: FileText, iconColor: 'text-gray-500' },
    { label: 'Réussis', value: animatedPassed, color: '#22c55e', bg: 'rgba(34,197,94,0.06)', icon: CheckCircle, iconColor: 'text-green-500' },
    { label: 'Échecs', value: animatedFailed, color: '#ef4444', bg: 'rgba(239,68,68,0.06)', icon: XCircle, iconColor: 'text-red-500' },
    { label: 'Ignorés', value: animatedSkipped, color: '#f59e0b', bg: 'rgba(245,158,11,0.06)', icon: Clock, iconColor: 'text-amber-500' },
  ];

  return (
    <div
      className="rounded-2xl p-5"
      style={{ background: 'rgba(255,255,255,0.95)', border: '1px solid rgba(229,231,235,0.6)', boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}
    >
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex-shrink-0">
          <ProgressRing pct={rate} color={ringColor} size={110} stroke={9} delay={200} label="Réussite" />
        </div>
        <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-3">
          {stats.map((s, i) => {
            const Icon = s.icon;
            return (
              <div
                key={i}
                className="rounded-xl p-3 relative overflow-hidden"
                style={{
                  animation: `card-enter 0.4s cubic-bezier(0.22,1,0.36,1) ${i * 80}ms both`,
                  background: s.bg,
                  border: `1px solid ${s.color}25`,
                }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-gray-500">{s.label}</span>
                  <div className={`w-6 h-6 rounded-md flex items-center justify-center ${s.iconColor} bg-white/80`}>
                    <Icon className="w-3.5 h-3.5" strokeWidth={2} />
                  </div>
                </div>
                <p className="text-2xl font-extrabold tabular-nums" style={{ color: s.color }}>{s.value}</p>
              </div>
            );
          })}
        </div>
      </div>
      <div
        className="mt-4 rounded-xl p-3 flex items-center gap-3"
        style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)' }}
      >
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(59,130,246,0.12)' }}>
          <ClockIcon className="w-4 h-4 text-blue-600" strokeWidth={2} />
        </div>
        <span className="text-sm font-medium text-gray-600">Durée totale</span>
        <span className="text-sm font-extrabold text-blue-600 ml-auto">
          {formatDuration(duration)}
        </span>
      </div>
    </div>
  );
};

interface TestResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  test: TestResult;
}

export const TestResultModal: React.FC<TestResultModalProps> = ({
  isOpen,
  onClose,
  test,
}) => {
  const [playwrightReport, setPlaywrightReport] = useState<PlaywrightReport | null>(null);
  const [htmlReportUrl, setHtmlReportUrl] = useState<string | null>(null);
  const [playwrightJobId, setPlaywrightJobId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // New: artifacts extracted from playwright-report/data
  const [artifacts, setArtifacts] = useState<Array<{ name: string; url: string; type: 'image'|'video'|'trace'|'other' }>>([]);
  const [loadingArtifacts, setLoadingArtifacts] = useState(false);

  // map artifacts to tests using suite/spec/test indices from test-results-merged.json
  const [artifactsByTest, setArtifactsByTest] = useState<Record<string, Array<{ name: string; url: string; type: 'image'|'video'|'trace'|'other' }>>>({});
  // state pour modal interne affichant un test sélectionné et ses fichiers associés
  const [selectedTestForModal, setSelectedTestForModal] = useState<{
    key: string;
    suite?: any;
    spec?: any;
    test?: any;
  } | null>(null);

  // Correction du type pour pipelineArtifacts
  interface PipelineArtifactFile {
    name: string;
    url: string;
    type: string;
  }
  interface PipelineArtifactJob {
    jobName: string;
    files: PipelineArtifactFile[];
  }
  const [pipelineArtifacts, setPipelineArtifacts] = useState<PipelineArtifactJob[]>([]);
  const [loadingPipelineArtifacts, setLoadingPipelineArtifacts] = useState(false);
  const [errorPipelineArtifacts, setErrorPipelineArtifacts] = useState<string | null>(null);

  const [testAnalyses, setTestAnalyses] = useState<Record<string, TestFailureAnalysis>>({});
  const [testMedia, setTestMedia] = useState<Record<string, Array<{ id: string; file_name: string; file_path: string; media_type: string; mime_type: string; uploaded_by: string; created_at: string }>>>({});
  const [analysisModalOpen, setAnalysisModalOpen] = useState(false);
  const [mediaUploadKey, setMediaUploadKey] = useState<string | null>(null);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [uploadProgressMsg, setUploadProgressMsg] = useState('');
  const mediaFileInputRef = useRef<HTMLInputElement>(null);
  const [selectedTestForAnalysis, setSelectedTestForAnalysis] = useState<{
    key: string;
    title: string;
    file: string;
  } | null>(null);
  const [selectedTestsForGroupAnalysis, setSelectedTestsForGroupAnalysis] = useState<Array<{
    key: string;
    testKey: string;
    testTitle: string;
    testFile: string;
  }>>([]);

  const [dossiersContent, setDossiersContent] = useState<string | null>(null);
  const [dossiersFiles, setDossiersFiles] = useState<Array<{ name: string; content: string }>>([]);
  const [loadingDossiers, setLoadingDossiers] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailStatus, setEmailStatus] = useState<{ type: 'success' | 'error' | null; msg: string }>({ type: null, msg: '' });
  useEffect(() => {
    if (isOpen) {
      // Reset states when modal opens
      setPlaywrightReport(null);
      setHtmlReportUrl(null);
      setPlaywrightJobId(null);
      setSelectedTestForModal(null);
      setArtifacts([]);
      setArtifactsByTest({});
      setError(null);
      setTestAnalyses({});
      setTestMedia({});
      setDossiersContent(null);
      setDossiersFiles([]);

      // Only load if test has jobId
      if (test.jobId) {
        loadTestDetails();
        loadTestAnalyses();
        loadTestMedia();
        loadDossiersFile();
      }
    }
  }, [isOpen, test.id]);

  const loadTestAnalyses = async () => {
    if (!test.jobId) return;

    try {
      const { data, error } = await supabase
        .from('test_failure_analyses')
        .select('*')
        .eq('job_id', test.jobId);

      if (error) throw error;

      if (data) {
        const analysesMap: Record<string, TestFailureAnalysis> = {};
        data.forEach((analysis: any) => {
          analysesMap[analysis.test_key] = analysis;
        });
        setTestAnalyses(analysesMap);
      }
    } catch (err) {
      console.error('Error loading test analyses:', err);
    }
  };

  const loadTestMedia = async () => {
    if (!test.jobId) return;

    try {
      const { data, error } = await supabase
        .from('test_media_uploads')
        .select('id, file_name, file_path, media_type, mime_type, uploaded_by, created_at, test_key')
        .eq('job_id', test.jobId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (data) {
        const mediaMap: Record<string, typeof data> = {};
        data.forEach((m: any) => {
          if (!mediaMap[m.test_key]) mediaMap[m.test_key] = [];
          mediaMap[m.test_key].push(m);
        });
        setTestMedia(mediaMap);
      }
    } catch (err) {
      console.error('Error loading test media:', err);
    }
  };

  const getMediaPublicUrl = (filePath: string): string => {
    const { data } = supabase.storage
      .from('test-media-uploads')
      .getPublicUrl(filePath);
    return data.publicUrl;
  };

  const handleStandaloneMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !mediaUploadKey || !test.jobId || !test.pipelineId) return;

    const MAX_FILE_SIZE = 50 * 1024 * 1024;
    const getMediaType = (mt: string): 'image' | 'video' | null => {
      if (mt.startsWith('image/')) return 'image';
      if (mt.startsWith('video/')) return 'video';
      return null;
    };
    const buildPath = (jk: number, tk: string, fn: string) => {
      const safe = tk.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 80);
      return `${jk}/${safe}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${fn}`;
    };

    for (const file of Array.from(files)) {
      const mediaType = getMediaType(file.type);
      if (!mediaType) continue;
      if (file.size > MAX_FILE_SIZE) continue;

      setUploadingMedia(true);
      setUploadProgressMsg(`Upload de ${file.name}...`);
      try {
        const filePath = buildPath(test.jobId, mediaUploadKey, file.name);
        const { error: upErr } = await supabase.storage
          .from('test-media-uploads')
          .upload(filePath, file, { contentType: file.type, upsert: false });
        if (upErr) throw upErr;

        const { error: dbErr } = await supabase
          .from('test_media_uploads')
          .insert({
            analysis_id: null,
            pipeline_id: test.pipelineId,
            job_id: test.jobId,
            test_key: mediaUploadKey,
            file_name: file.name,
            file_path: filePath,
            media_type: mediaType,
            mime_type: file.type,
            file_size: file.size,
            uploaded_by: 'anonymous',
          });
        if (dbErr) throw dbErr;
      } catch (err) {
        console.error('Standalone upload error:', err);
      } finally {
        setUploadingMedia(false);
        setUploadProgressMsg('');
      }
    }

    await loadTestMedia();
    if (mediaFileInputRef.current) mediaFileInputRef.current.value = '';
  };

  const loadDossiersFile = async () => {
    if (!test.jobId) return;

    setLoadingDossiers(true);
    try {
      const fileNames = [
        'CR-PROSPECT+3000.txt',
        'CR-PROSPECT-3000.txt',
        'PB-PROSPECT+3000.txt',
        'WEB-DARTY-CRS.txt',
        'WEB-FNAC-CRS.txt',
        'WEB-IKEA-CRS.txt',
        'WEB-PRINTEMPS.txt',
        'WEB-REDOUTE.txt'
      ];

      const loadedFiles: Array<{ name: string; content: string }> = [];

      for (const fileName of fileNames) {
        try {
          const content = await gitlabApi.getJobArtifactFile(test.jobId, `subscription-essential-e2e/dossiers/${fileName}`);
          loadedFiles.push({ name: fileName, content });
        } catch (err) {
          console.warn(`Could not load ${fileName}:`, err);
        }
      }

      setDossiersFiles(loadedFiles);
      setDossiersContent(null);
    } catch (err) {
      console.error('Failed to load dossiers files:', err);
      setDossiersFiles([]);
      setDossiersContent(null);
    } finally {
      setLoadingDossiers(false);
    }
  };

  const loadTestDetails = async () => {
    if (!test.jobId) return;
    
    setLoading(true);
    try {
      loadPlaywrightReport();
      loadHtmlReport();
      findPlaywrightJobId();
    } catch (err) {
      console.error('Error loading test details:', err);
      setError('Erreur lors du chargement des détails du test');
    } finally {
      setLoading(false);
    }
  };

  const findPlaywrightJobId = async () => {
    if (!test.pipelineId) return;
    
    try {
      const jobs = await gitlabApi.getPipelineJobs(test.pipelineId);
      // Chercher le job qui contient les tests Playwright (généralement nommé "test" ou contenant "playwright")
      const playwrightJob = jobs.find(job => 
        job.name.toLowerCase().includes('test') || 
        job.name.toLowerCase().includes('playwright') ||
        job.name === 'ui-testing-playwright'
      );
      
      if (playwrightJob) {
        setPlaywrightJobId(playwrightJob.id);
      }
    } catch (err) {
      // Silently handle the error - this is not critical for the modal to function
      console.warn('Could not fetch pipeline jobs:', err instanceof Error ? err.message : 'Unknown error');
    }
  };
  const loadPlaywrightReport = async () => {
    if (!test.jobId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Utiliser le chemin correct du rapport Playwright
      const reportContent = await gitlabApi.getJobArtifactFile(test.jobId, 'subscription-essential-e2e/test-results-merged.json');
      const report = JSON.parse(reportContent);
      setPlaywrightReport(report);
    } catch (err) {
      console.error('Failed to load Playwright report:', err);
      setError('Impossible de charger le rapport Playwright');
    } finally {
      setLoading(false);
    }
  };

  const loadHtmlReport = async () => {
    if (!test.jobId) return;
    
    const config = gitlabApi.config;
    // Utiliser directement le serveur GitLab Pages
    const pageUrl = `https://cacf.pages.saas.cagip.group.gca/-/middleware/quality-automation/playwright-automation/-/jobs/${test.jobId}/artifacts/subscription-essential-e2e/playwright-report/index.html`
    setHtmlReportUrl(pageUrl);
  };

  // Load artifacts only for a specific test
  const loadArtifactsForTest = async (testKey: string) => {
    console.log('Loading artifacts for test:', testKey);
    if (!test.jobId) return;
    if (!gitlabApi.config) {
      setError('Configuration GitLab manquante');
      return;
    }

    setLoadingArtifacts(true);
    setError(null);
    try {
      // First, load the test results to get attachment references
      const reportContent = await gitlabApi.getJobArtifactFile(test.jobId, 'subscription-essential-e2e/test-results-merged.json');
      const report = JSON.parse(reportContent);
      console.log('Loaded test results for artifact mapping');
      
      // Find the specific test and its attachments
      let testAttachments: string[] = [];
      const findTestAttachments = (suites: any[], targetKey: string) => {
        suites.forEach((suite: any, suiteIndex: number) => {
          (suite.specs || []).forEach((spec: any, specIndex: number) => {
            (spec.tests || []).forEach((t: any, testIndex: number) => {
              const key = `${suiteIndex}-${specIndex}-${testIndex}`;
              if (key === targetKey) {
                console.log('Found matching test for key:', targetKey, 'Test:', t);
                (t.results || []).forEach((r: any) => {
                  (r.attachments || []).forEach((att: any) => {
                    const attachmentPath = att.path || att.name || '';
                    if (attachmentPath) {
                      testAttachments.push(attachmentPath);
                      console.log('Found attachment:', attachmentPath);
                    }
                  });
                });
              }
            });
          });

          // nested suites
          (suite.suites || []).forEach((subSuite: any, subIndex: number) => {
            (subSuite.specs || []).forEach((spec: any, specIndex: number) => {
              (spec.tests || []).forEach((t: any, testIndex: number) => {
                const key = `${suiteIndex}-${subIndex}-${specIndex}-${testIndex}`;
                if (key === targetKey) {
                  console.log('Found matching nested test for key:', targetKey, 'Test:', t);
                  (t.results || []).forEach((r: any) => {
                    (r.attachments || []).forEach((att: any) => {
                      const attachmentPath = att.path || att.name || '';
                      if (attachmentPath) {
                        testAttachments.push(attachmentPath);
                        console.log('Found nested attachment:', attachmentPath);
                      }
                    });
                  });
                }
              });
            });
          });
        });
      };
      
      findTestAttachments(report.suites || [], testKey);
      console.log('Total attachments found for test:', testAttachments.length);
      
      if (testAttachments.length === 0) {
        console.log('No attachments found for this test');
        setArtifactsByTest(prev => ({
          ...prev,
          [testKey]: []
        }));
        return;
      }

      // Now load the artifacts archive and extract only the files we need
      const archiveUrl = `${gitlabApi.config.baseUrl}/api/v4/projects/${encodeURIComponent(gitlabApi.config.projectId)}/jobs/${test.jobId}/artifacts`;
      console.log('Fetching artifacts from:', archiveUrl);
      const resp = await fetch(archiveUrl, {
        headers: { Authorization: `Bearer ${gitlabApi.config.token}` },
      });
      if (!resp.ok) throw new Error(`Impossible de récupérer les artifacts: ${resp.status}`);

      const archiveBlob = await resp.blob();
      const zip = await JSZip.loadAsync(archiveBlob);

      const result: Array<{ name: string; url: string; type: 'image'|'video'|'trace'|'other' }> = [];

      // Extract only the files referenced in the test attachments
      for (const attachmentPath of testAttachments) {
        console.log('Looking for attachment file:', attachmentPath);
        
        // Try different possible paths in the zip
        const possiblePaths = [
          attachmentPath,
          `${attachmentPath}`,
          `playwright-report/${attachmentPath}`,
          `playwright-report/data/${attachmentPath}`,
          `test-results/${attachmentPath}`
        ];
        
        let foundFile = null;
        let foundPath = '';
        
        for (const possiblePath of possiblePaths) {
          const file = zip.file(possiblePath);
          if (file) {
            foundFile = file;
            foundPath = possiblePath;
            console.log('Found file at path:', possiblePath);
            break;
          }
        }
        
        if (foundFile) {
          const ext = (attachmentPath.split('.').pop() || '').toLowerCase();
          const blob = await foundFile.async('blob');
          
          // guess mime
          let mime: string | undefined;
          if (['png','jpg','jpeg','gif','svg','webp'].includes(ext)) mime = ext === 'svg' ? 'image/svg+xml' : `image/${ext === 'jpg' ? 'jpeg' : ext}`;
          else if (['webm','mp4','mov','ogg'].includes(ext)) mime = `video/${ext === 'mp4' ? 'mp4' : ext}`;
          else if (['zip','trace'].includes(ext)) mime = 'application/octet-stream';
          else if (ext === 'json') mime = 'application/json';
          else mime = undefined;

          const typedBlob = mime ? new Blob([blob], { type: mime }) : blob;
          const url = URL.createObjectURL(typedBlob);

          const type: 'image'|'video'|'trace'|'other' =
            ['png','jpg','jpeg','gif','svg','webp'].includes(ext) ? 'image' :
            ['webm','mp4','mov','ogg'].includes(ext) ? 'video' :
            ['zip','trace'].includes(ext) ? 'trace' : 'other';

          result.push({ name: attachmentPath, url, type });
        } else {
          console.warn('Could not find attachment file:', attachmentPath);
        }
      }

      // Filter to keep only videos
      const videoOnlyResult = result.filter(a => a.type === 'video');

      console.log('Processed artifacts:', videoOnlyResult.length, '(videos only)');

      // Update the specific test's artifacts
      setArtifactsByTest(prev => ({
        ...prev,
        [testKey]: videoOnlyResult
      }));

    } catch (err) {
      console.error('Erreur lors du chargement des assets:', err);
      setError('Impossible de charger les fichiers d\'artifacts (data)');
    } finally {
      setLoadingArtifacts(false);
    }
  };

  const loadPipelineArtifacts = async () => {
    if (!test.pipelineId || !gitlabApi.config) return;
    setLoadingPipelineArtifacts(true);
    setErrorPipelineArtifacts(null);
    try {
      const jobs = await gitlabApi.getPipelineJobs(test.pipelineId);
      const allArtifacts: Array<{ jobName: string; files: Array<{ name: string; url: string; type: string }> }> = [];
      for (const job of jobs) {
        // Récupérer l'archive d'artifacts du job
        const archiveUrl = `${gitlabApi.config.baseUrl}/api/v4/projects/${encodeURIComponent(gitlabApi.config.projectId)}/jobs/${job.id}/artifacts`;
        const resp = await fetch(archiveUrl, {
          headers: { Authorization: `Bearer ${gitlabApi.config.token}` },
        });
        if (!resp.ok) continue;
        const archiveBlob = await resp.blob();
        const zip = await JSZip.loadAsync(archiveBlob);
        const files: Array<{ name: string; url: string; type: string }> = [];
        zip.forEach(async (relativePath, file) => {
          if (!file.dir) {
            const ext = (relativePath.split('.').pop() || '').toLowerCase();
            // Only process video files
            if (["webm","mp4","mov","ogg"].includes(ext)) {
              const mime = `video/${ext === "mp4" ? "mp4" : ext}`;
              const blob = await file.async('blob');
              const typedBlob = new Blob([blob], { type: mime });
              const url = URL.createObjectURL(typedBlob);
              files.push({ name: relativePath, url, type: mime });
            }
          }
        });
        allArtifacts.push({ jobName: job.name, files });
      }
      setPipelineArtifacts(allArtifacts);
    } catch (err) {
      setErrorPipelineArtifacts('Erreur lors du chargement des artifacts de la pipeline');
    } finally {
      setLoadingPipelineArtifacts(false);
    }
  };

  const getTestStatusIcon = (status: string) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'skipped':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  // Fonction utilitaire pour compter les tests récursivement
  const countTests = (suites: any[]): number => {
    let total = 0;
    suites.forEach(suite => {
      // Compte les tests dans les specs
      suite.specs?.forEach(spec => {
        total += spec.tests?.length || 0;
      });
      // Compte récursivement les tests dans les sous-suites
      if (suite.suites) {
        total += countTests(suite.suites);
      }
    });
    return total;
  };

  // Fonction utilitaire pour obtenir le statut réel d'un test
  const getTestStatus = (test: any): string => {
    if (!test.results || test.results.length === 0) {
      return test.status || 'unknown';
    }

    // Le statut final est celui du dernier résultat
    const lastResult = test.results[test.results.length - 1];
    const lastStatus = lastResult.status;

    // Un test est flaky s'il a plusieurs résultats et que le dernier est passed
    // mais qu'il y a eu des échecs avant
    if (test.results.length > 1 && lastStatus === 'passed') {
      const hasFailures = test.results.slice(0, -1).some(
        r => r.status === 'failed' || r.status === 'timedOut'
      );
      if (hasFailures) {
        return 'flaky';
      }
    }

    return lastStatus;
  };

  // Fonction utilitaire pour compter les tests par statut
  const countTestsByStatus = (suites: any[], status: string): number => {
    let count = 0;
    suites.forEach(suite => {
      // Compte les tests dans les specs
      suite.specs?.forEach(spec => {
        spec.tests?.forEach(test => {
          const testStatus = getTestStatus(test);
          if (status === 'passed') {
            // Pour les réussites, on compte aussi les flaky
            if (testStatus === 'passed' || testStatus === 'flaky') {
              count++;
            }
          } else if (status === 'failed') {
            // Pour les échecs, on compte aussi les timedOut
            if (testStatus === 'failed' || testStatus === 'timedOut') {
              count++;
            }
          } else if (testStatus === status) {
            count++;
          }
        });
      });
      // Compte récursivement dans les sous-suites
      if (suite.suites) {
        count += countTestsByStatus(suite.suites, status);
      }
    });
    return count;
  };

  // Fonction pour compter les tests en échec non analysés
  const countUnanalyzedFailedTests = (): number => {
    if (!playwrightReport) return 0;

    let unanalyzedCount = 0;
    const countRecursive = (suites: any[], prefix: string = '') => {
      suites.forEach((suite, suiteIndex) => {
        suite.specs?.forEach((spec, specIndex) => {
          spec.tests?.forEach((test, testIndex) => {
            const key = prefix ? `${prefix}-${specIndex}-${testIndex}` : `${suiteIndex}-${specIndex}-${testIndex}`;
            const testStatus = getTestStatus(test);
            if ((testStatus === 'failed' || testStatus === 'timedOut') && !testAnalyses[key]) {
              unanalyzedCount++;
            }
          });
        });

        suite.suites?.forEach((subSuite, subSuiteIndex) => {
          subSuite.specs?.forEach((spec, specIndex) => {
            spec.tests?.forEach((test, testIndex) => {
              const key = `${suiteIndex}-${subSuiteIndex}-${specIndex}-${testIndex}`;
              const testStatus = getTestStatus(test);
              if ((testStatus === 'failed' || testStatus === 'timedOut') && !testAnalyses[key]) {
                unanalyzedCount++;
              }
            });
          });
        });
      });
    };

    countRecursive(playwrightReport.suites);
    return unanalyzedCount;
  };

  // Fonction pour gérer la fermeture avec vérification
  const handleClose = () => {
    const unanalyzedCount = countUnanalyzedFailedTests();

    if (unanalyzedCount > 0) {
      const message = unanalyzedCount === 1
        ? `Il reste 1 test en échec non analysé. Êtes-vous sûr de vouloir fermer ?`
        : `Il reste ${unanalyzedCount} tests en échec non analysés. Êtes-vous sûr de vouloir fermer ?`;

      if (!window.confirm(message)) {
        return;
      }
    }

    onClose();
  };

  const collectFailedTests = (): Array<{ title: string; file: string }> => {
    if (!playwrightReport) return [];
    const failed: Array<{ title: string; file: string }> = [];
    const traverse = (suites: any[], prefix: string = '') => {
      suites.forEach((suite, si) => {
        suite.specs?.forEach((spec: any, spi: number) => {
          spec.tests?.forEach((t: any, ti: number) => {
            const status = getTestStatus(t);
            if (status === 'failed' || status === 'timedOut') {
              failed.push({ title: spec.title, file: suite.file || spec.file || '' });
            }
          });
        });
        if (suite.suites) traverse(suite.suites);
      });
    };
    traverse(playwrightReport.suites);
    return failed;
  };

  const handleSendReportEmail = async () => {
    if (!recipientEmail.trim()) {
      setEmailStatus({ type: 'error', msg: 'Veuillez saisir une adresse email' });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail.trim())) {
      setEmailStatus({ type: 'error', msg: 'Adresse email invalide' });
      return;
    }

    setSendingEmail(true);
    setEmailStatus({ type: null, msg: '' });
    try {
      const total = playwrightReport ? countTests(playwrightReport.suites) : 0;
      const passed = playwrightReport ? countTestsByStatus(playwrightReport.suites, 'passed') : 0;
      const failed = playwrightReport ? countTestsByStatus(playwrightReport.suites, 'failed') : 0;
      const skipped = playwrightReport ? countTestsByStatus(playwrightReport.suites, 'skipped') : 0;

      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-contact-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          mode: 'test-report',
          recipientEmail: recipientEmail.trim(),
          testName: test.name,
          branch: test.branch,
          commit: test.commit,
          environment: test.environment,
          stats: { total, passed, failed, skipped, duration: playwrightReport ? formatDuration(playwrightReport.stats.duration || 0) : 'N/A' },
          htmlReportUrl: htmlReportUrl || null,
          failedTests: collectFailedTests(),
        }),
      });

      if (!res.ok) {
 const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Échec de l\'envoi');
      }

      setEmailStatus({ type: 'success', msg: 'Rapport envoyé avec succès!' });
      setTimeout(() => { setShowEmailForm(false); setRecipientEmail(''); setEmailStatus({ type: null, msg: '' }); }, 2500);
    } catch (err) {
      setEmailStatus({ type: 'error', msg: err instanceof Error ? err.message : 'Erreur lors de l\'envoi' });
    } finally {
      setSendingEmail(false);
    }
  };

  if (!isOpen) return null;
  return (
    <>
      {/* Animated keyframes */}
      <style>{`
        @keyframes card-enter { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes bar-fill { to { width: var(--target-width); } }
        @keyframes search-bugs-modal {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          25% { transform: translate(12px, -6px) rotate(5deg); }
          50% { transform: translate(6px, 12px) rotate(-5deg); }
          75% { transform: translate(-6px, 6px) rotate(3deg); }
        }
        @keyframes bug-appear-modal {
          0%, 40% { opacity: 0; transform: scale(0.5) rotate(0deg); }
          50%, 90% { opacity: 1; transform: scale(1) rotate(15deg); }
          100% { opacity: 0; transform: scale(0.5) rotate(30deg); }
        }
        @keyframes screen-glow-modal { 0%, 100% { opacity: 0.6; } 50% { opacity: 1; } }
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scale-in { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
      `}</style>

      <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ background: 'rgba(0,0,0,0.45)', animation: 'fade-in 0.2s ease' }}>
        <div
          className="rounded-2xl w-full max-w-5xl max-h-[92vh] overflow-hidden flex flex-col"
          style={{
            background: 'rgba(255,255,255,0.98)',
            border: '1px solid rgba(229,231,235,0.8)',
            boxShadow: '0 24px 64px rgba(0,0,0,0.18)',
            animation: 'scale-in 0.3s cubic-bezier(0.22,1,0.36,1)',
          }}
        >
          {/* ─── Header ─────────────────────────────────────────── */}
          <div
            className="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.04), rgba(99,102,241,0.04))' }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center shadow-sm flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}
              >
                <FileText className="w-5.5 h-5.5 text-white" strokeWidth={2} />
              </div>
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-gray-900 truncate">{test.name}</h2>
                <p className="text-sm text-gray-500 truncate">
                  {test.branch} • {test.commit}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0 relative">
              {htmlReportUrl && (
                <a
                  href={htmlReportUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105"
                  style={{ background: '#22c55e', color: 'white', boxShadow: '0 3px 10px rgba(34,197,94,0.3)' }}
                >
                  <FileText className="w-4 h-4" />
                  <span className="hidden sm:inline">Rapport HTML</span>
                </a>
              )}
              {playwrightReport && (
                <button
                  onClick={() => { setShowEmailForm(!showEmailForm); setEmailStatus({ type: null, msg: '' }); }}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105"
                  style={{ background: '#3b82f6', color: 'white', boxShadow: '0 3px 10px rgba(59,130,246,0.3)' }}
                >
                  <Mail className="w-4 h-4" />
                  <span className="hidden sm:inline">Envoyer par email</span>
                </button>
              )}
              {showEmailForm && (
                <div
                  className="absolute top-full right-0 mt-2 p-4 rounded-xl z-20"
                  style={{
                    background: 'white',
                    border: '1px solid rgba(229,231,235,0.8)',
                    boxShadow: '0 12px 32px rgba(0,0,0,0.15)',
                    minWidth: '320px',
                    animation: 'scale-in 0.2s ease',
                  }}
                >
                  <label className="block text-xs font-bold text-gray-700 mb-2">Email du destinataire</label>
                  <input
                    type="email"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    placeholder="exemple@email.com"
                    className="w-full px-3 py-2 rounded-lg text-sm border border-gray-200 focus:border-blue-500 focus:outline-none transition-colors"
                    autoFocus
                    onKeyDown={(e) => { if (e.key === 'Enter' && !sendingEmail) handleSendReportEmail(); }}
                  />
                  {emailStatus.type && (
                    <div
                      className="mt-2 text-xs font-medium px-3 py-2 rounded-lg"
                      style={{
                        background: emailStatus.type === 'success' ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
                        color: emailStatus.type === 'success' ? '#166534' : '#dc2626',
                      }}
                    >
                      {emailStatus.msg}
                    </div>
                  )}
                  <div className="flex items-center gap-2 mt-3">
                    <button
                      onClick={handleSendReportEmail}
                      disabled={sendingEmail}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
                      style={{ background: '#3b82f6', color: 'white', boxShadow: '0 2px 8px rgba(59,130,246,0.3)' }}
                    >
                      {sendingEmail ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      {sendingEmail ? 'Envoi...' : 'Envoyer'}
                    </button>
                    <button
                      onClick={() => { setShowEmailForm(false); setRecipientEmail(''); setEmailStatus({ type: null, msg: '' }); }}
                      className="px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-all duration-200"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              )}
              <button
                onClick={handleClose}
                className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all duration-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* ─── Body ───────────────────────────────────────────── */}
          <div className="flex-1 overflow-y-auto px-6 py-5">

            {/* Section artifacts pipeline */}
            <div
              className="rounded-2xl p-5 mb-5"
              style={{ background: 'rgba(249,250,251,0.8)', border: '1px solid rgba(229,231,235,0.6)' }}
            >
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(59,130,246,0.12)' }}>
                  <Rocket className="w-4 h-4 text-blue-600" strokeWidth={2} />
                </div>
                <h3 className="text-sm font-bold text-gray-900">Artifacts de toute la pipeline</h3>
              </div>
              <button
                onClick={loadPipelineArtifacts}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105"
                style={{ background: '#3b82f6', color: 'white', boxShadow: '0 2px 8px rgba(59,130,246,0.25)' }}
                disabled={loadingPipelineArtifacts}
              >
                {loadingPipelineArtifacts ? 'Chargement...' : 'Afficher les artifacts pipeline'}
              </button>
              {errorPipelineArtifacts && (
                <div className="mt-3 p-3 rounded-lg text-sm" style={{ background: 'rgba(239,68,68,0.08)', color: '#dc2626', border: '1px solid rgba(239,68,68,0.2)' }}>
                  {errorPipelineArtifacts}
                </div>
              )}
              {pipelineArtifacts.length > 0 && (
                <div className="space-y-3 mt-4">
                  {pipelineArtifacts.map((job: PipelineArtifactJob, ji: number) => (
                    <div
                      key={ji}
                      className="rounded-xl p-3"
                      style={{
                        animation: `card-enter 0.4s cubic-bezier(0.22,1,0.36,1) ${ji * 80}ms both`,
                        background: 'rgba(255,255,255,0.95)',
                        border: '1px solid rgba(229,231,235,0.6)',
                      }}
                    >
                      <div className="font-bold text-sm text-blue-700 mb-2">{job.jobName}</div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {job.files.map((file: PipelineArtifactFile, fi: number) => (
                          <div
                            key={fi}
                            className="rounded-lg overflow-hidden group cursor-pointer transition-all duration-200 hover:scale-105"
                            style={{ border: '1px solid rgba(229,231,235,0.6)' }}
                          >
                            {file.type.startsWith('image') ? (
                              <img src={file.url} alt={file.name} className="w-full h-20 object-cover" />
                            ) : file.type.startsWith('video') ? (
                              <div className="relative w-full h-20 bg-gray-900 flex items-center justify-center">
                                <video src={file.url} controls className="w-full h-20 object-cover" />
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                  <div className="w-8 h-8 rounded-full bg-white/80 flex items-center justify-center">
                                    <Play className="w-4 h-4 text-gray-900 ml-0.5" />
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="w-full h-20 bg-gray-50 flex items-center justify-center text-xs text-gray-500 p-2 truncate">{file.name}</div>
                            )}
                            <div className="p-1.5 text-xs text-gray-500 truncate">{file.name}</div>
                          </div>
                        ))}
                        {job.files.length === 0 && (
                          <div className="text-sm text-gray-400 col-span-full py-2">Aucun artifact pour ce job</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {error && (
              <div
                className="mb-5 p-4 rounded-xl text-sm"
                style={{ background: 'rgba(239,68,68,0.08)', color: '#dc2626', border: '1px solid rgba(239,68,68,0.2)' }}
              >
                {error}
              </div>
            )}

            {loading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div
                  className="w-12 h-12 rounded-full border-4 border-gray-200"
                  style={{ borderTopColor: '#3b82f6', animation: 'spin 0.8s linear infinite' }}
                />
                <span className="mt-4 text-sm text-gray-500 font-medium">Chargement du rapport...</span>
              </div>
            ) : playwrightReport ? (
              <div className="space-y-5">
                {/* ─── Statistiques avec progress ring ─────────────── */}
                {(() => {
                  const total = countTests(playwrightReport.suites);
                  const passed = countTestsByStatus(playwrightReport.suites, 'passed');
                  const failed = countTestsByStatus(playwrightReport.suites, 'failed');
                  const skipped = countTestsByStatus(playwrightReport.suites, 'skipped');

                  return (
                    <StatsSection
                      total={total}
                      passed={passed}
                      failed={failed}
                      skipped={skipped}
                      duration={playwrightReport.stats.duration || 0}
                      formatDuration={formatDuration}
                    />
                  );
                })()}

                {/* Numéros de dossiers créés */}
                {loadingDossiers ? (
                  <div
                    className="rounded-xl p-4 flex items-center gap-3"
                    style={{ background: 'rgba(249,250,251,0.8)', border: '1px solid rgba(229,231,235,0.6)' }}
                  >
                    <div
                      className="w-5 h-5 rounded-full border-2 border-gray-200"
                      style={{ borderTopColor: '#3b82f6', animation: 'spin 0.8s linear infinite' }}
                    />
                    <span className="text-sm text-gray-500">Chargement des numéros de dossiers...</span>
                  </div>
                ) : dossiersFiles.length > 0 ? (
                  <div
                    className="rounded-2xl p-5"
                    style={{ background: 'rgba(34,197,94,0.04)', border: '1px solid rgba(34,197,94,0.2)' }}
                  >
                    <div className="flex items-center gap-2.5 mb-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(34,197,94,0.12)' }}>
                        <CheckCircle className="w-4 h-4 text-green-600" strokeWidth={2} />
                      </div>
                      <h4 className="text-sm font-bold text-green-900">Dossiers créés durant les tests</h4>
                    </div>
                    <div className="space-y-3">
                      {dossiersFiles.map((file, idx) => (
                        <div
                          key={idx}
                          className="rounded-xl p-3"
                          style={{
                            animation: `card-enter 0.3s ease ${idx * 60}ms both`,
                            background: 'rgba(255,255,255,0.95)',
                            border: '1px solid rgba(34,197,94,0.15)',
                          }}
                        >
                          <div className="text-xs font-bold text-green-800 mb-2">{file.name}</div>
                          <div className="rounded-lg p-2 max-h-32 overflow-y-auto" style={{ background: 'rgba(249,250,251,0.9)', border: '1px solid rgba(229,231,235,0.5)' }}>
                            <pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono">{file.content}</pre>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                {/* ─── Liste des tests ─────────────────────────────── */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(59,130,246,0.12)' }}>
                        <Monitor className="w-4 h-4 text-blue-600" strokeWidth={2} />
                      </div>
                      <h3 className="text-sm font-bold text-gray-900">Résultats détaillés</h3>
                    </div>
                    {selectedTestsForGroupAnalysis.length > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500 font-medium">
                          {selectedTestsForGroupAnalysis.length} test{selectedTestsForGroupAnalysis.length > 1 ? 's' : ''} sélectionné{selectedTestsForGroupAnalysis.length > 1 ? 's' : ''}
                        </span>
                        <button
                          onClick={() => setAnalysisModalOpen(true)}
                          className="px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 hover:scale-105"
                          style={{ background: '#3b82f6', color: 'white', boxShadow: '0 2px 8px rgba(59,130,246,0.3)' }}
                        >
                          Analyser en groupe
                        </button>
                        <button
                          onClick={() => setSelectedTestsForGroupAnalysis([])}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 hover:scale-105"
                          style={{ background: '#f3f4f6', color: '#6b7280' }}
                        >
                          Annuler
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="space-y-4">
                    {playwrightReport.suites.map((suite, suiteIndex) => (
                      <div key={suiteIndex} className="space-y-2">
                        <h4 className="text-sm font-bold text-gray-700 border-b border-gray-200 pb-2">{suite.title}</h4>
                        {suite.specs.map((spec, specIndex) =>
                          spec.tests.map((test, testIndex) => {
                            const cardKey = `${suiteIndex}-${specIndex}-${testIndex}`;
                            const testStatus = getTestStatus(test);
                            const isPassed = testStatus === 'passed' || testStatus === 'flaky';
                            const isFailed = testStatus === 'failed' || testStatus === 'timedOut';
                            const cardColor = isPassed ? '#22c55e' : isFailed ? '#ef4444' : '#f59e0b';
                            const cardGlow = isPassed ? 'rgba(34,197,94,0.20)' : isFailed ? 'rgba(239,68,68,0.20)' : 'rgba(245,158,11,0.20)';
                            const isSelected = selectedTestsForGroupAnalysis.some(t => t.key === cardKey);

                            return (
                              <div
                                key={cardKey}
                                onClick={() => {
                                  setSelectedTestForModal({ key: cardKey, suite, spec, test });
                                  if (!artifactsByTest[cardKey]) loadArtifactsForTest(cardKey);
                                }}
                                className="group relative cursor-pointer rounded-xl p-4 overflow-hidden transition-all duration-300 hover:scale-[1.01] hover:translate-x-1"
                                style={{
                                  animation: `card-enter 0.4s cubic-bezier(0.22,1,0.36,1) ${(suiteIndex * 3 + specIndex) * 40}ms both`,
                                  background: isSelected ? 'rgba(59,130,246,0.06)' : 'rgba(255,255,255,0.95)',
                                  border: `1.5px solid ${isSelected ? '#3b82f6' : cardColor + '40'}`,
                                  boxShadow: `0 3px 12px ${cardGlow}`,
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.boxShadow = `0 8px 24px ${cardGlow}, 0 0 0 1.5px ${isSelected ? '#3b82f6' : cardColor}50`; }}
                                onMouseLeave={(e) => { e.currentTarget.style.boxShadow = `0 3px 12px ${cardGlow}`; }}
                              >
                                <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full opacity-10 transition-opacity duration-300 group-hover:opacity-20" style={{ background: `radial-gradient(circle, ${cardColor}, transparent 70%)` }} />
                                <div className="flex items-start justify-between relative">
                                  <div className="flex items-start gap-3 flex-1">
                                    {(isFailed) && (
                                      <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={(e) => {
                                          e.stopPropagation();
                                          if (e.target.checked) {
                                            setSelectedTestsForGroupAnalysis([...selectedTestsForGroupAnalysis, { key: cardKey, testKey: cardKey, testTitle: spec.title, testFile: suite.file || spec.file }]);
                                          } else {
                                            setSelectedTestsForGroupAnalysis(selectedTestsForGroupAnalysis.filter(t => t.key !== cardKey));
                                          }
                                        }}
                                        className="mt-1 w-4 h-4 text-blue-600 cursor-pointer rounded"
                                        onClick={(e) => e.stopPropagation()}
                                      />
                                    )}
                                    {getTestStatusIcon(isPassed ? 'passed' : isFailed ? 'failed' : 'skipped')}
                                    <div className="flex-1 min-w-0">
                                      <h4 className="font-bold text-sm truncate" style={{ color: isPassed ? '#166534' : isFailed ? '#991b1b' : '#92400e' }}>{spec.title}</h4>
                                      <p className="text-xs text-gray-500 truncate">{spec.file}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 flex-shrink-0">
                                    {isFailed && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setSelectedTestForAnalysis({ key: cardKey, title: spec.title, file: suite.file || spec.file });
                                          setAnalysisModalOpen(true);
                                        }}
                                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 hover:scale-105"
                                        style={{
                                          background: testAnalyses[cardKey] ? '#3b82f6' : '#ef4444',
                                          color: 'white',
                                          boxShadow: `0 2px 8px ${testAnalyses[cardKey] ? 'rgba(59,130,246,0.3)' : 'rgba(239,68,68,0.3)'}`,
                                          animation: testAnalyses[cardKey] ? undefined : 'pulse 2s ease-in-out infinite',
                                        }}
                                        title={testAnalyses[cardKey] ? 'Modifier l\'analyse' : 'Ajouter une analyse'}
                                      >
                                        <FileEdit className="w-3 h-3" />
                                        <span>{testAnalyses[cardKey] ? 'Modifier' : 'Analyser'}</span>
                                      </button>
                                    )}
                                    <div className="text-right">
                                      <span className="text-xs font-bold px-2 py-1 rounded-md tabular-nums" style={{ background: cardColor + '20', color: cardColor }}>
                                        {test.results?.[0] ? formatDuration(test.results[0].duration) : 'N/A'}
                                      </span>
                                      <p className="text-[10px] font-bold uppercase mt-1" style={{ color: cardColor }}>{testStatus}</p>
                                    </div>
                                  </div>
                                </div>

                                {testAnalyses[cardKey] && (
                                  <div className="mt-3 p-3 rounded-lg" style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)' }}>
                                    <div className="flex items-start gap-2">
                                      <FileEdit className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                      <div className="flex-1 text-sm">
                                        <p className="font-bold text-blue-900 mb-1">Analyse disponible</p>
                                        {testAnalyses[cardKey].root_cause && (
                                          <p className="text-blue-800 mb-1">
                                            <span className="font-bold">Root cause:</span> {testAnalyses[cardKey].root_cause}
                                          </p>
                                        )}
                                        {testAnalyses[cardKey].analysis && (
                                          <p className="text-blue-700 text-xs">
                                            {testAnalyses[cardKey].analysis.substring(0, 100)}
                                            {testAnalyses[cardKey].analysis.length > 100 && '...'}
                                          </p>
                                        )}
                                        <p className="text-xs text-blue-500 mt-1">
                                          Par {testAnalyses[cardKey].created_by} • {new Date(testAnalyses[cardKey].created_at).toLocaleString('fr-FR')}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {artifactsByTest[cardKey] ? (
                                  <div className="mt-3 text-xs text-gray-600 flex items-center gap-1.5">
                                    <Video className="w-3.5 h-3.5 text-gray-400" />
                                    Fichiers associés : <span className="font-bold text-gray-700">{artifactsByTest[cardKey].length}</span>
                                  </div>
                                ) : (
                                  <div className="mt-3 text-xs text-gray-400">Cliquez pour charger les fichiers associés</div>
                                )}

                                {testMedia[cardKey] && testMedia[cardKey].length > 0 && (
                                  <div className="mt-2 flex items-center gap-2 flex-wrap">
                                    {testMedia[cardKey].filter(m => m.media_type === 'image').length > 0 && (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: 'rgba(16,185,129,0.12)', color: '#059669' }}>
                                        <ImageIcon className="w-3 h-3" />
                                        {testMedia[cardKey].filter(m => m.media_type === 'image').length} image(s)
                                      </span>
                                    )}
                                    {testMedia[cardKey].filter(m => m.media_type === 'video').length > 0 && (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: 'rgba(99,102,241,0.12)', color: '#4f46e5' }}>
                                        <Video className="w-3 h-3" />
                                        {testMedia[cardKey].filter(m => m.media_type === 'video').length} vidéo(s)
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })
                        )}
                        {suite.suites && suite.suites.map((subSuite, subSuiteIndex) => (
                          <div key={`sub-${suiteIndex}-${subSuiteIndex}`} className="ml-4 space-y-2">
                            <h5 className="text-xs font-bold text-gray-600 border-b border-gray-100 pb-1">{subSuite.title}</h5>
                            {subSuite.specs.map((spec, specIndex) =>
                              spec.tests.map((test, testIndex) => {
                                const cardKey = `${suiteIndex}-${subSuiteIndex}-${specIndex}-${testIndex}`;
                                const testStatus = getTestStatus(test);
                                const isPassed = testStatus === 'passed' || testStatus === 'flaky';
                                const isFailed = testStatus === 'failed' || testStatus === 'timedOut';
                                const cardColor = isPassed ? '#22c55e' : isFailed ? '#ef4444' : '#f59e0b';
                                const cardGlow = isPassed ? 'rgba(34,197,94,0.20)' : isFailed ? 'rgba(239,68,68,0.20)' : 'rgba(245,158,11,0.20)';
                                const isSelected = selectedTestsForGroupAnalysis.some(t => t.key === cardKey);

                                return (
                                  <div
                                    key={cardKey}
                                    onClick={() => {
                                      setSelectedTestForModal({ key: cardKey, suite: subSuite, spec, test });
                                      if (!artifactsByTest[cardKey]) loadArtifactsForTest(cardKey);
                                    }}
                                    className="group relative cursor-pointer rounded-xl p-4 overflow-hidden transition-all duration-300 hover:scale-[1.01] hover:translate-x-1"
                                    style={{
                                      animation: `card-enter 0.4s cubic-bezier(0.22,1,0.36,1) ${(suiteIndex * 3 + subSuiteIndex * 2 + specIndex) * 40}ms both`,
                                      background: isSelected ? 'rgba(59,130,246,0.06)' : 'rgba(255,255,255,0.95)',
                                      border: `1.5px solid ${isSelected ? '#3b82f6' : cardColor + '40'}`,
                                      boxShadow: `0 3px 12px ${cardGlow}`,
                                    }}
                                    onMouseEnter={(e) => { e.currentTarget.style.boxShadow = `0 8px 24px ${cardGlow}, 0 0 0 1.5px ${isSelected ? '#3b82f6' : cardColor}50`; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.boxShadow = `0 3px 12px ${cardGlow}`; }}
                                  >
                                    <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full opacity-10 transition-opacity duration-300 group-hover:opacity-20" style={{ background: `radial-gradient(circle, ${cardColor}, transparent 70%)` }} />
                                    <div className="flex items-start justify-between relative">
                                      <div className="flex items-start gap-3 flex-1">
                                        {isFailed && (
                                          <input
                                            type="checkbox"
                                            checked={isSelected}
                                            onChange={(e) => {
                                              e.stopPropagation();
                                              if (e.target.checked) {
                                                setSelectedTestsForGroupAnalysis([...selectedTestsForGroupAnalysis, { key: cardKey, testKey: cardKey, testTitle: spec.title, testFile: subSuite.file || spec.file }]);
                                              } else {
                                                setSelectedTestsForGroupAnalysis(selectedTestsForGroupAnalysis.filter(t => t.key !== cardKey));
                                              }
                                            }}
                                            className="mt-1 w-4 h-4 text-blue-600 cursor-pointer rounded"
                                            onClick={(e) => e.stopPropagation()}
                                          />
                                        )}
                                        {getTestStatusIcon(isPassed ? 'passed' : isFailed ? 'failed' : 'skipped')}
                                        <div className="flex-1 min-w-0">
                                          <h4 className="font-bold text-sm truncate" style={{ color: isPassed ? '#166534' : isFailed ? '#991b1b' : '#92400e' }}>{spec.title}</h4>
                                          <p className="text-xs text-gray-500 truncate">{subSuite.file || spec.file}</p>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2 flex-shrink-0">
                                        {isFailed && (
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setSelectedTestForAnalysis({ key: cardKey, title: spec.title, file: subSuite.file || spec.file });
                                              setAnalysisModalOpen(true);
                                            }}
                                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 hover:scale-105"
                                            style={{
                                              background: testAnalyses[cardKey] ? '#3b82f6' : '#ef4444',
                                              color: 'white',
                                              boxShadow: `0 2px 8px ${testAnalyses[cardKey] ? 'rgba(59,130,246,0.3)' : 'rgba(239,68,68,0.3)'}`,
                                              animation: testAnalyses[cardKey] ? undefined : 'pulse 2s ease-in-out infinite',
                                            }}
                                            title={testAnalyses[cardKey] ? 'Modifier l\'analyse' : 'Ajouter une analyse'}
                                          >
                                            <FileEdit className="w-3 h-3" />
                                            <span>{testAnalyses[cardKey] ? 'Modifier' : 'Analyser'}</span>
                                          </button>
                                        )}
                                        <div className="text-right">
                                          <span className="text-xs font-bold px-2 py-1 rounded-md tabular-nums" style={{ background: cardColor + '20', color: cardColor }}>
                                            {test.results?.[0] ? formatDuration(test.results[0].duration) : 'N/A'}
                                          </span>
                                          <p className="text-[10px] font-bold uppercase mt-1" style={{ color: cardColor }}>{testStatus}</p>
                                        </div>
                                      </div>
                                    </div>

                                    {testAnalyses[cardKey] && (
                                      <div className="mt-3 p-3 rounded-lg" style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)' }}>
                                        <div className="flex items-start gap-2">
                                          <FileEdit className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                          <div className="flex-1 text-sm">
                                            <p className="font-bold text-blue-900 mb-1">Analyse disponible</p>
                                            {testAnalyses[cardKey].root_cause && (
                                              <p className="text-blue-800 mb-1">
                                                <span className="font-bold">Root cause:</span> {testAnalyses[cardKey].root_cause}
                                              </p>
                                            )}
                                            {testAnalyses[cardKey].analysis && (
                                              <p className="text-blue-700 text-xs">
                                                {testAnalyses[cardKey].analysis.substring(0, 100)}
                                                {testAnalyses[cardKey].analysis.length > 100 && '...'}
                                              </p>
                                            )}
                                            <p className="text-xs text-blue-500 mt-1">
                                              Par {testAnalyses[cardKey].created_by} • {new Date(testAnalyses[cardKey].created_at).toLocaleString('fr-FR')}
                                            </p>
                                          </div>
                                        </div>
                                      </div>
                                    )}

                                    {artifactsByTest[cardKey] ? (
                                      <div className="mt-3 text-xs text-gray-600 flex items-center gap-1.5">
                                        <Video className="w-3.5 h-3.5 text-gray-400" />
                                        Fichiers associés : <span className="font-bold text-gray-700">{artifactsByTest[cardKey].length}</span>
                                      </div>
                                    ) : (
                                      <div className="mt-3 text-xs text-gray-400">Cliquez pour charger les fichiers associés</div>
                                    )}

                                    {testMedia[cardKey] && testMedia[cardKey].length > 0 && (
                                      <div className="mt-2 flex items-center gap-2 flex-wrap">
                                        {testMedia[cardKey].filter(m => m.media_type === 'image').length > 0 && (
                                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: 'rgba(16,185,129,0.12)', color: '#059669' }}>
                                            <ImageIcon className="w-3 h-3" />
                                            {testMedia[cardKey].filter(m => m.media_type === 'image').length} image(s)
                                          </span>
                                        )}
                                        {testMedia[cardKey].filter(m => m.media_type === 'video').length > 0 && (
                                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: 'rgba(99,102,241,0.12)', color: '#4f46e5' }}>
                                            <Video className="w-3 h-3" />
                                            {testMedia[cardKey].filter(m => m.media_type === 'video').length} vidéo(s)
                                          </span>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                );
                              })
                            )}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : test.status === 'running' || test.status === 'pending' ? (
              <div className="text-center py-16">
                <div className="relative w-32 h-32 mx-auto mb-6">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Monitor className="w-28 h-28 text-gray-700" strokeWidth={1.5} />
                    <div className="absolute overflow-hidden" style={{ top: '20%', left: '20%', width: '60%', height: '46%' }}>
                      <div className="w-full h-full rounded-sm overflow-hidden" style={{ background: 'linear-gradient(to bottom, #eff6ff, #dbeafe)', animation: 'screen-glow-modal 2s ease-in-out infinite' }}>
                        <div className="w-full h-1.5 bg-blue-600"></div>
                        <div className="flex gap-0.5 px-0.5 py-0.5">
                          <div className="w-1.5 h-1.5 bg-blue-400"></div>
                          <div className="w-2 h-1.5 bg-blue-300"></div>
                        </div>
                        <div className="px-0.5 space-y-0.5">
                          <div className="w-full h-1 bg-gray-300"></div>
                          <div className="w-3/4 h-1 bg-gray-300"></div>
                          <div className="w-full h-3 bg-blue-200 mt-0.5"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center" style={{ top: '-4px' }}>
                    <div style={{ animation: 'search-bugs-modal 3s ease-in-out infinite' }}>
                      <Search className="w-10 h-10 text-blue-600" strokeWidth={2.5} />
                    </div>
                  </div>
                  <div className="absolute top-1 right-1">
                    <Bug className="w-6 h-6 text-red-500" style={{ animation: 'bug-appear-modal 3s ease-in-out infinite' }} />
                  </div>
                  <div className="absolute bottom-3 left-1">
                    <Bug className="w-5 h-5 text-orange-500" style={{ animation: 'bug-appear-modal 3s ease-in-out infinite 1s' }} />
                  </div>
                  <div className="absolute top-10 left-0">
                    <Bug className="w-4 h-4 text-yellow-600" style={{ animation: 'bug-appear-modal 3s ease-in-out infinite 1.5s' }} />
                  </div>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Test en cours d'exécution</h3>
                <p className="text-sm text-gray-500">Veuillez attendre la fin de l'exécution pour consulter le rapport</p>
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: 'rgba(229,231,235,0.5)' }}>
                  <FileText className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Aucun rapport Playwright trouvé</h3>
                <p className="text-sm text-gray-500">Les artifacts ne contiennent pas de rapport Playwright ou le format n'est pas reconnu.</p>
              </div>
            )}
          </div>

          {/* ─── Modal interne pour un test sélectionné ──────────── */}
          {selectedTestForModal && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.45)', animation: 'fade-in 0.2s ease' }}>
              <div
                className="rounded-2xl w-full max-w-3xl max-h-[85vh] overflow-y-auto p-6"
                style={{
                  background: 'rgba(255,255,255,0.98)',
                  border: '1px solid rgba(229,231,235,0.8)',
                  boxShadow: '0 24px 64px rgba(0,0,0,0.18)',
                  animation: 'scale-in 0.3s cubic-bezier(0.22,1,0.36,1)',
                }}
              >
                <div className="flex items-start justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}>
                      <Monitor className="w-5 h-5 text-white" strokeWidth={2} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{selectedTestForModal.spec?.title || selectedTestForModal.test?.title || 'Détails du test'}</h3>
                      <p className="text-sm text-gray-500">{selectedTestForModal.suite?.file || selectedTestForModal.spec?.file || ''}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedTestForModal(null)}
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all duration-200"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between rounded-xl p-3" style={{ background: 'rgba(249,250,251,0.8)', border: '1px solid rgba(229,231,235,0.5)' }}>
                    <div className="text-sm text-gray-600">
                      Statut: <span className="font-bold text-gray-900">{selectedTestForModal.test?.status || 'N/A'}</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      Durée: <span className="font-bold text-gray-900">{selectedTestForModal.test?.results?.[0] ? formatDuration(selectedTestForModal.test.results[0].duration) : 'N/A'}</span>
                    </div>
                  </div>

                  {selectedTestForModal.test?.results?.[0]?.errors?.length > 0 && (
                    <div className="p-4 rounded-xl text-sm" style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', color: '#dc2626' }}>
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="w-4 h-4" strokeWidth={2} />
                        <span className="font-bold">Erreur</span>
                      </div>
                      <pre className="whitespace-pre-wrap text-xs font-mono">{selectedTestForModal.test.results[0].errors[0].message}</pre>
                    </div>
                  )}

                  {/* Médias uploadés (images et vidéos) */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.12)' }}>
                          <ImageIcon className="w-4 h-4 text-emerald-600" strokeWidth={2} />
                        </div>
                        <h4 className="text-sm font-bold text-gray-900">
                          Médias ajoutés{testMedia[selectedTestForModal.key] ? ` (${testMedia[selectedTestForModal.key].length})` : ''}
                        </h4>
                      </div>
                      <input
                        ref={mediaFileInputRef}
                        type="file"
                        accept="image/*,video/*"
                        multiple
                        onChange={handleStandaloneMediaUpload}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setMediaUploadKey(selectedTestForModal.key);
                          setTimeout(() => mediaFileInputRef.current?.click(), 0);
                        }}
                        disabled={uploadingMedia}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 hover:scale-105 disabled:opacity-50"
                        style={{ background: '#10b981', color: 'white', boxShadow: '0 2px 8px rgba(16,185,129,0.3)' }}
                      >
                        {uploadingMedia ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                        <span>{uploadingMedia ? (uploadProgressMsg || 'Upload...') : 'Ajouter des médias'}</span>
                      </button>
                    </div>

                      {/* Images uploadées */}
                      {testMedia[selectedTestForModal.key]?.some(m => m.media_type === 'image') && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                          {testMedia[selectedTestForModal.key].filter(m => m.media_type === 'image').map((m, mi) => (
                            <div
                              key={m.id}
                              className="rounded-xl overflow-hidden group cursor-pointer transition-all duration-200 hover:scale-105"
                              style={{ animation: `card-enter 0.3s ease ${mi * 60}ms both`, border: '1px solid rgba(229,231,235,0.6)' }}
                              onClick={(e) => { e.stopPropagation(); const w = window.open(); if (w) w.document.write(`<img src="${getMediaPublicUrl(m.file_path)}" style="max-width:100%;height:auto"/>`); }}
                            >
                              <img src={getMediaPublicUrl(m.file_path)} alt={m.file_name} className="w-full h-32 object-cover" loading="lazy" />
                              <div className="p-2 text-xs text-gray-500 truncate">{m.file_name}</div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Vidéos uploadées */}
                      {testMedia[selectedTestForModal.key]?.some(m => m.media_type === 'video') && (
                        <div className="space-y-3">
                          {testMedia[selectedTestForModal.key].filter(m => m.media_type === 'video').map((m) => (
                            <div
                              key={m.id}
                              className="rounded-xl overflow-hidden"
                              style={{ border: '1px solid rgba(229,231,235,0.6)' }}
                            >
                              <video
                                src={getMediaPublicUrl(m.file_path)}
                                controls
                                className="w-full max-h-72 object-contain bg-black"
                                preload="metadata"
                              />
                              <div className="px-3 py-2 text-xs text-gray-500 truncate flex items-center gap-1.5">
                                <Video className="w-3.5 h-3.5 flex-shrink-0" />
                                {m.file_name}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      {(!testMedia[selectedTestForModal.key] || testMedia[selectedTestForModal.key].length === 0) && !uploadingMedia && (
                        <p className="text-xs text-gray-400">Aucun média ajouté pour ce test. Cliquez sur "Ajouter des médias" pour uploader des images ou vidéos.</p>
                      )}
                    </div>
                </div>
              </div>
            </div>
          )}

          {/* Modal for test failure analysis */}
          {test.pipelineId && test.jobId && (
            <TestFailureAnalysisModal
              isOpen={analysisModalOpen}
              onClose={() => {
                setAnalysisModalOpen(false);
                setSelectedTestForAnalysis(null);
                setSelectedTestsForGroupAnalysis([]);
                loadTestAnalyses();
                loadTestMedia();
              }}
              pipelineId={test.pipelineId}
              jobId={test.jobId}
              testKey={selectedTestForAnalysis?.key || ''}
              testTitle={selectedTestForAnalysis?.title || ''}
              testFile={selectedTestForAnalysis?.file || ''}
              existingAnalysis={selectedTestForAnalysis ? (testAnalyses[selectedTestForAnalysis.key] || null) : null}
              selectedTests={selectedTestsForGroupAnalysis.length > 0 ? selectedTestsForGroupAnalysis : undefined}
              images={(artifactsByTest[selectedTestForAnalysis?.key || ''] || []).filter(a => a.type === 'image')}
            />
          )}
        </div>
      </div>
    </>
  );
};
