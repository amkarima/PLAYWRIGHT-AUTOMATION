import React, { useState, useEffect } from 'react';
import JSZip from 'jszip';
import { X, Download, FileText, CheckCircle, XCircle, Clock, AlertTriangle, Search, Bug, Monitor, File as FileEdit, RotateCcw } from 'lucide-react';
import { TestResult, PlaywrightReport, TestFailureAnalysis } from '../types';
import { gitlabApi } from '../services/gitlabApi';
import { TestFailureAnalysisModal } from './TestFailureAnalysisModal';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
  const [analysisModalOpen, setAnalysisModalOpen] = useState(false);
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
  const [retriggeringTests, setRetriggeringTests] = useState(false);

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
      setDossiersContent(null);
      setDossiersFiles([]);

      // Only load if test has jobId
      if (test.jobId) {
        loadTestDetails();
        loadTestAnalyses();
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

  const retriggerFailedTests = async () => {
    if (!playwrightReport) return;

    const failedTestIds: string[] = [];

    const collectFailedTests = (suites: any[]) => {
      suites.forEach((suite) => {
        suite.specs?.forEach((spec: any) => {
          spec.tests?.forEach((test: any) => {
            const testStatus = getTestStatus(test);
            if (testStatus === 'failed' || testStatus === 'timedOut') {
              console.log('Failed test found:', {
                title: test.title,
                specTitle: spec.title,
                specFile: spec.file,
                suiteTitle: suite.title,
                fullTest: test
              });

              // Chercher l'ID dans le titre du test, du spec ou de la suite
              const testTitle = test.title || '';
              const specTitle = spec.title || '';
              const suiteTitle = suite.title || '';
              const specFile = spec.file || '';

              const searchText = `${testTitle} ${specTitle} ${suiteTitle} ${specFile}`;
              const titleMatch = searchText.match(/(?:SOF|TST)-\d+/);

              if (titleMatch && !failedTestIds.includes(titleMatch[0])) {
                failedTestIds.push(titleMatch[0]);
                console.log('Test ID extracted:', titleMatch[0]);
              }
            }
          });
        });

        suite.suites?.forEach((subSuite: any) => {
          subSuite.specs?.forEach((spec: any) => {
            spec.tests?.forEach((test: any) => {
              const testStatus = getTestStatus(test);
              if (testStatus === 'failed' || testStatus === 'timedOut') {
                console.log('Failed nested test found:', {
                  title: test.title,
                  specTitle: spec.title,
                  specFile: spec.file,
                  subSuiteTitle: subSuite.title,
                  fullTest: test
                });

                const testTitle = test.title || '';
                const specTitle = spec.title || '';
                const subSuiteTitle = subSuite.title || '';
                const specFile = spec.file || '';

                const searchText = `${testTitle} ${specTitle} ${subSuiteTitle} ${specFile}`;
                const titleMatch = searchText.match(/(?:SOF|TST)-\d+/);

                if (titleMatch && !failedTestIds.includes(titleMatch[0])) {
                  failedTestIds.push(titleMatch[0]);
                  console.log('Test ID extracted from nested:', titleMatch[0]);
                }
              }
            });
          });
        });
      });
    };

    collectFailedTests(playwrightReport.suites);

    console.log('All failed test IDs collected:', failedTestIds);

    if (failedTestIds.length === 0) {
      alert('Aucun test en échec à relancer');
      return;
    }

    const confirmed = window.confirm(
      `Voulez-vous relancer ${failedTestIds.length} test(s) en échec ?\n\n${failedTestIds.join('\n')}`
    );

    if (!confirmed) return;

    setRetriggeringTests(true);
    try {
      const variables: Record<string, string> = {
        ENV: 'CI',
        ENVIRONMENT: 'CI',
        SELECTED_TESTS: failedTestIds.join('|')
      };

      await gitlabApi.triggerPipeline('develop', variables);
      alert('Pipeline déclenchée avec succès pour relancer les tests en échec');
    } catch (err) {
      console.error('Error retriggering failed tests:', err);
      alert('Erreur lors du déclenchement de la pipeline');
    } finally {
      setRetriggeringTests(false);
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

  const handleDownloadArtifacts = async () => {
    if (!test.jobId) return;
    
    try {
      await gitlabApi.downloadJobArtifacts(test.jobId);
    } catch (err) {
      setError('Erreur lors du téléchargement des artifacts');
    }
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <FileText className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{test.name}</h2>
              <p className="text-sm text-gray-600">
                {test.branch} • {test.commit}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {playwrightReport && countTestsByStatus(playwrightReport.suites, 'failed') > 0 && (
              <button
                onClick={retriggerFailedTests}
                disabled={retriggeringTests}
                className="flex items-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RotateCcw className={`w-4 h-4 ${retriggeringTests ? 'animate-spin' : ''}`} />
                <span>{retriggeringTests ? 'Déclenchement...' : 'Relancer les échecs'}</span>
              </button>
            )}
            <button
              onClick={handleDownloadArtifacts}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Télécharger artifacts</span>
            </button>
            {htmlReportUrl && (
              <a
                href={htmlReportUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                <FileText className="w-4 h-4" />
                <span>Voir rapport HTML</span>
              </a>
            )}
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Section artifacts pipeline */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Artifacts de toute la pipeline</h3>
            <button
              onClick={loadPipelineArtifacts}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 mb-2"
              disabled={loadingPipelineArtifacts}
            >
              {loadingPipelineArtifacts ? 'Chargement...' : 'Afficher les artifacts pipeline'}
            </button>
            {errorPipelineArtifacts && (
              <div className="text-red-600 text-sm mb-2">{errorPipelineArtifacts}</div>
            )}
            {pipelineArtifacts.length > 0 && (
              <div className="space-y-4">
                {pipelineArtifacts.map((job: PipelineArtifactJob, ji: number) => (
                  <div key={ji} className="border rounded p-2">
                    <div className="font-medium text-blue-700 mb-1">{job.jobName}</div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {job.files.map((file: PipelineArtifactFile, fi: number) => (
                        <div key={fi} className="border rounded overflow-hidden">
                          {file.type.startsWith('image') ? (
                            <img src={file.url} alt={file.name} className="w-full h-20 object-cover" />
                          ) : file.type.startsWith('video') ? (
                            <video src={file.url} controls className="w-full h-20 object-cover" />
                          ) : (
                            <div className="w-full h-20 bg-gray-50 flex items-center justify-center text-xs text-gray-600 p-2 truncate">{file.name}</div>
                          )}
                          <div className="p-1 text-xs text-gray-600 truncate">{file.name}</div>
                        </div>
                      ))}
                      {job.files.length === 0 && (
                        <div className="text-sm text-gray-500 col-span-full">Aucun artifact pour ce job</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Chargement du rapport...</span>
            </div>
          ) : playwrightReport ? (
            <div className="space-y-6">
              {/* Statistiques */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Total</span>
                    <span className="text-2xl font-bold text-gray-900">
                      {countTests(playwrightReport.suites)}
                    </span>
                  </div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Réussis</span>
                    <span className="text-2xl font-bold text-green-600">
                      {countTestsByStatus(playwrightReport.suites, 'passed')}
                    </span>
                  </div>
                </div>
                <div className="bg-red-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Échecs</span>
                    <span className="text-2xl font-bold text-red-600">
                      {countTestsByStatus(playwrightReport.suites, 'failed')}
                    </span>
                  </div>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Ignorés</span>
                    <span className="text-2xl font-bold text-yellow-600">
                      {countTestsByStatus(playwrightReport.suites, 'skipped')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Durée totale */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Durée totale</span>
                  <span className="text-lg font-semibold text-blue-600">
                    {formatDuration(playwrightReport.stats.duration || 0)}
                  </span>
                </div>
              </div>

              {/* Numéros de dossiers créés */}
              {loadingDossiers ? (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span className="text-sm text-gray-600">Chargement des numéros de dossiers...</span>
                  </div>
                </div>
              ) : dossiersFiles.length > 0 ? (
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <h4 className="text-sm font-semibold text-green-900 mb-2">Dossiers créés durant les tests</h4>
                  <div className="space-y-3">
                    {dossiersFiles.map((file, idx) => (
                      <div key={idx} className="bg-white p-3 rounded border border-green-100">
                        <div className="text-xs font-semibold text-green-900 mb-2">{file.name}</div>
                        <div className="bg-gray-50 p-2 rounded border border-gray-200 max-h-32 overflow-y-auto">
                          <pre className="text-xs text-gray-800 whitespace-pre-wrap font-mono">{file.content}</pre>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {/* Liste des tests */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Résultats détaillés</h3>
                  {selectedTestsForGroupAnalysis.length > 0 && (
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">
                        {selectedTestsForGroupAnalysis.length} test{selectedTestsForGroupAnalysis.length > 1 ? 's' : ''} sélectionné{selectedTestsForGroupAnalysis.length > 1 ? 's' : ''}
                      </span>
                      <button
                        onClick={() => {
                          setAnalysisModalOpen(true);
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-semibold"
                      >
                        Analyser en groupe
                      </button>
                      <button
                        onClick={() => setSelectedTestsForGroupAnalysis([])}
                        className="px-3 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors text-sm"
                      >
                        Annuler
                      </button>
                    </div>
                  )}
                </div>
                <div className="space-y-3">
                  {playwrightReport.suites.map((suite, suiteIndex) => (
                    <div key={suiteIndex} className="space-y-2">
                      <h4 className="font-semibold text-gray-800 border-b pb-2">{suite.title}</h4>
                      {suite.specs.map((spec, specIndex) =>
                        spec.tests.map((test, testIndex) => {
                          const cardKey = `${suiteIndex}-${specIndex}-${testIndex}`;
                          const testStatus = getTestStatus(test);
                          return (
                            <div
                              key={cardKey}
                              onClick={() => {
                                setSelectedTestForModal({ key: cardKey, suite, spec, test });
                                if (!artifactsByTest[cardKey]) {
                                  loadArtifactsForTest(cardKey);
                                }
                              }}
                              className={`cursor-pointer border-2 rounded-lg p-4 hover:shadow-md transition-shadow ${
                                selectedTestsForGroupAnalysis.some(t => t.key === cardKey)
                                  ? 'bg-blue-100 border-blue-600'
                                  : testStatus === 'passed' || testStatus === 'flaky'
                                  ? 'bg-green-50 border-green-400'
                                  : testStatus === 'failed' || testStatus === 'timedOut'
                                  ? 'bg-red-50 border-red-400'
                                  : 'bg-yellow-50 border-yellow-400'
                              }`}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex items-start space-x-3 flex-1">
                                  {(testStatus === 'failed' || testStatus === 'timedOut') && (
                                    <input
                                      type="checkbox"
                                      checked={selectedTestsForGroupAnalysis.some(t => t.key === cardKey)}
                                      onChange={(e) => {
                                        e.stopPropagation();
                                        if (e.target.checked) {
                                          setSelectedTestsForGroupAnalysis([...selectedTestsForGroupAnalysis, {
                                            key: cardKey,
                                            testKey: cardKey,
                                            testTitle: spec.title,
                                            testFile: suite.file || spec.file,
                                          }]);
                                        } else {
                                          setSelectedTestsForGroupAnalysis(selectedTestsForGroupAnalysis.filter(t => t.key !== cardKey));
                                        }
                                      }}
                                      className="mt-1 w-4 h-4 text-blue-600 cursor-pointer"
                                      onClick={(e) => e.stopPropagation()}
                                    />
                                  )}
                                  {getTestStatusIcon((testStatus === 'passed' || testStatus === 'flaky') ? 'passed' : (testStatus === 'failed' || testStatus === 'timedOut') ? 'failed' : 'skipped')}
                                  <div className="flex-1">
                                    <h4 className={`font-medium ${
                                      testStatus === 'passed' || testStatus === 'flaky'
                                        ? 'text-green-900'
                                        : (testStatus === 'failed' || testStatus === 'timedOut')
                                        ? 'text-red-900'
                                        : 'text-gray-900'
                                    }`}>{spec.title}</h4>
                                    <p className="text-sm text-gray-600">{spec.file}</p>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                  {(testStatus === 'failed' || testStatus === 'timedOut') && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedTestForAnalysis({
                                          key: cardKey,
                                          title: spec.title,
                                          file: suite.file || spec.file,
                                        });
                                        setAnalysisModalOpen(true);
                                      }}
                                      className={`flex items-center space-x-1 px-3 py-1.5 rounded-md text-xs font-semibold transition-all shadow-md border-2 ${
                                        testAnalyses[cardKey]
                                          ? 'bg-blue-500 text-white border-blue-600 hover:bg-blue-600 hover:shadow-lg'
                                          : 'bg-red-500 text-white border-red-600 hover:bg-red-600 hover:shadow-lg animate-pulse'
                                      }`}
                                      title={testAnalyses[cardKey] ? 'Modifier l\'analyse' : 'Ajouter une analyse'}
                                    >
                                      <FileEdit className="w-3 h-3" />
                                      <span>{testAnalyses[cardKey] ? 'Modifier' : 'Analyser'}</span>
                                    </button>
                                  )}
                                  <div className="text-right">
                                    <span className={`text-sm font-medium px-2 py-1 rounded ${
                                      testStatus === 'passed' || testStatus === 'flaky'
                                        ? 'bg-green-200 text-green-800'
                                        : (testStatus === 'failed' || testStatus === 'timedOut')
                                        ? 'bg-red-200 text-red-800'
                                        : 'bg-yellow-200 text-yellow-800'
                                    }`}>
                                      {test.results?.[0] ? formatDuration(test.results[0].duration) : 'N/A'}
                                    </span>
                                    <p className={`text-xs font-semibold mt-1 uppercase ${
                                      testStatus === 'passed' || testStatus === 'flaky'
                                        ? 'text-green-700'
                                        : (testStatus === 'failed' || testStatus === 'timedOut')
                                        ? 'text-red-700'
                                        : 'text-yellow-700'
                                    }`}>
                                      {testStatus}
                                    </p>
                                  </div>
                                </div>
                              </div>

                              {testAnalyses[cardKey] && (
                                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
                                  <div className="flex items-start space-x-2">
                                    <FileEdit className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                    <div className="flex-1 text-sm">
                                      <p className="font-medium text-blue-900 mb-1">Analyse disponible</p>
                                      {testAnalyses[cardKey].root_cause && (
                                        <p className="text-blue-800 mb-1">
                                          <span className="font-medium">Root cause:</span> {testAnalyses[cardKey].root_cause}
                                        </p>
                                      )}
                                      {testAnalyses[cardKey].analysis && (
                                        <p className="text-blue-700 text-xs">
                                          {testAnalyses[cardKey].analysis.substring(0, 100)}
                                          {testAnalyses[cardKey].analysis.length > 100 && '...'}
                                        </p>
                                      )}
                                      <p className="text-xs text-blue-600 mt-1">
                                        Par {testAnalyses[cardKey].created_by} • {new Date(testAnalyses[cardKey].created_at).toLocaleString('fr-FR')}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {artifactsByTest[cardKey] ? (
                                <div className="mt-3 text-sm text-gray-700">
                                  Fichiers associés : <span className="font-medium">{artifactsByTest[cardKey].length}</span>
                                </div>
                              ) : (
                                <div className="mt-3 text-sm text-gray-500">
                                  Cliquez pour charger les fichiers associés
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                       {suite.suites && suite.suites.map((subSuite, subSuiteIndex) => (
                         <div key={`sub-${suiteIndex}-${subSuiteIndex}`} className="ml-4 space-y-2">
                           <h5 className="font-medium text-gray-700 border-b pb-1">{subSuite.title}</h5>
                           {subSuite.specs.map((spec, specIndex) =>
                             spec.tests.map((test, testIndex) => {
                               const cardKey = `${suiteIndex}-${subSuiteIndex}-${specIndex}-${testIndex}`;
                               const testStatus = getTestStatus(test);
                               return (
                                 <div
                                   key={cardKey}
                                   onClick={() => {
                                     setSelectedTestForModal({ key: cardKey, suite: subSuite, spec, test });
                                     if (!artifactsByTest[cardKey]) {
                                       loadArtifactsForTest(cardKey);
                                     }
                                   }}
                                   className={`cursor-pointer border-2 rounded-lg p-4 hover:shadow-md transition-shadow ${
                                     selectedTestsForGroupAnalysis.some(t => t.key === cardKey)
                                       ? 'bg-blue-100 border-blue-600'
                                       : testStatus === 'passed' || testStatus === 'flaky'
                                       ? 'bg-green-50 border-green-400'
                                       : testStatus === 'failed' || testStatus === 'timedOut'
                                       ? 'bg-red-50 border-red-400'
                                       : 'bg-yellow-50 border-yellow-400'
                                   }`}
                                 >
                                   <div className="flex items-start justify-between">
                                     <div className="flex items-start space-x-3 flex-1">
                                       {(testStatus === 'failed' || testStatus === 'timedOut') && (
                                         <input
                                           type="checkbox"
                                           checked={selectedTestsForGroupAnalysis.some(t => t.key === cardKey)}
                                           onChange={(e) => {
                                             e.stopPropagation();
                                             if (e.target.checked) {
                                               setSelectedTestsForGroupAnalysis([...selectedTestsForGroupAnalysis, {
                                                 key: cardKey,
                                                 testKey: cardKey,
                                                 testTitle: spec.title,
                                                 testFile: subSuite.file || spec.file,
                                               }]);
                                             } else {
                                               setSelectedTestsForGroupAnalysis(selectedTestsForGroupAnalysis.filter(t => t.key !== cardKey));
                                             }
                                           }}
                                           className="mt-1 w-4 h-4 text-blue-600 cursor-pointer"
                                           onClick={(e) => e.stopPropagation()}
                                         />
                                       )}
                                       {getTestStatusIcon((testStatus === 'passed' || testStatus === 'flaky') ? 'passed' : (testStatus === 'failed' || testStatus === 'timedOut') ? 'failed' : 'skipped')}
                                       <div className="flex-1">
                                         <h4 className={`font-medium ${
                                           testStatus === 'passed' || testStatus === 'flaky'
                                             ? 'text-green-900'
                                             : (testStatus === 'failed' || testStatus === 'timedOut')
                                             ? 'text-red-900'
                                             : 'text-gray-900'
                                         }`}>{spec.title}</h4>
                                         <p className="text-sm text-gray-600">{subSuite.file || spec.file}</p>
                                       </div>
                                     </div>
                                     <div className="flex items-center space-x-2">
                                       {(testStatus === 'failed' || testStatus === 'timedOut') && (
                                         <button
                                           onClick={(e) => {
                                             e.stopPropagation();
                                             setSelectedTestForAnalysis({
                                               key: cardKey,
                                               title: spec.title,
                                               file: subSuite.file || spec.file,
                                             });
                                             setAnalysisModalOpen(true);
                                           }}
                                           className={`flex items-center space-x-1 px-3 py-1.5 rounded-md text-xs font-semibold transition-all shadow-md border-2 ${
                                             testAnalyses[cardKey]
                                               ? 'bg-blue-500 text-white border-blue-600 hover:bg-blue-600 hover:shadow-lg'
                                               : 'bg-red-500 text-white border-red-600 hover:bg-red-600 hover:shadow-lg animate-pulse'
                                           }`}
                                           title={testAnalyses[cardKey] ? 'Modifier l\'analyse' : 'Ajouter une analyse'}
                                         >
                                           <FileEdit className="w-3 h-3" />
                                           <span>{testAnalyses[cardKey] ? 'Modifier' : 'Analyser'}</span>
                                         </button>
                                       )}
                                       <div className="text-right">
                                         <span className={`text-sm font-medium px-2 py-1 rounded ${
                                           testStatus === 'passed' || testStatus === 'flaky'
                                             ? 'bg-green-200 text-green-800'
                                             : (testStatus === 'failed' || testStatus === 'timedOut')
                                             ? 'bg-red-200 text-red-800'
                                             : 'bg-yellow-200 text-yellow-800'
                                         }`}>
                                           {test.results?.[0] ? formatDuration(test.results[0].duration) : 'N/A'}
                                         </span>
                                         <p className={`text-xs font-semibold mt-1 uppercase ${
                                           testStatus === 'passed' || testStatus === 'flaky'
                                             ? 'text-green-700'
                                             : (testStatus === 'failed' || testStatus === 'timedOut')
                                             ? 'text-red-700'
                                             : 'text-yellow-700'
                                         }`}>
                                           {testStatus}
                                         </p>
                                       </div>
                                     </div>
                                   </div>

                                   {testAnalyses[cardKey] && (
                                     <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
                                       <div className="flex items-start space-x-2">
                                         <FileEdit className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                         <div className="flex-1 text-sm">
                                           <p className="font-medium text-blue-900 mb-1">Analyse disponible</p>
                                           {testAnalyses[cardKey].root_cause && (
                                             <p className="text-blue-800 mb-1">
                                               <span className="font-medium">Root cause:</span> {testAnalyses[cardKey].root_cause}
                                             </p>
                                           )}
                                           {testAnalyses[cardKey].analysis && (
                                             <p className="text-blue-700 text-xs">
                                               {testAnalyses[cardKey].analysis.substring(0, 100)}
                                               {testAnalyses[cardKey].analysis.length > 100 && '...'}
                                             </p>
                                           )}
                                           <p className="text-xs text-blue-600 mt-1">
                                             Par {testAnalyses[cardKey].created_by} • {new Date(testAnalyses[cardKey].created_at).toLocaleString('fr-FR')}
                                           </p>
                                         </div>
                                       </div>
                                     </div>
                                   )}

                                   {artifactsByTest[cardKey] ? (
                                     <div className="mt-3 text-sm text-gray-700">
                                       Fichiers associés : <span className="font-medium">{artifactsByTest[cardKey].length}</span>
                                     </div>
                                   ) : (
                                     <div className="mt-3 text-sm text-gray-500">
                                       Cliquez pour charger les fichiers associés
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
            <div className="text-center py-12">
              <style>{`
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
                @keyframes screen-glow-modal {
                  0%, 100% { opacity: 0.6; }
                  50% { opacity: 1; }
                }
              `}</style>
              <div className="relative w-32 h-32 mx-auto mb-4">
                <div className="absolute inset-0 flex items-center justify-center">
                  <Monitor className="w-28 h-28 text-gray-700" strokeWidth={1.5} />
                  <div className="absolute overflow-hidden" style={{ top: '20%', left: '20%', width: '60%', height: '46%' }}>
                    <div className="w-full h-full bg-gradient-to-b from-blue-50 to-blue-100 rounded-sm overflow-hidden" style={{ animation: 'screen-glow-modal 2s ease-in-out infinite' }}>
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
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Test en cours d'exécution
              </h3>
              <p className="text-gray-600">
                Veuillez attendre la fin de l'exécution pour consulter le rapport
              </p>
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Aucun rapport Playwright trouvé
              </h3>
              <p className="text-gray-600">
                Les artifacts ne contiennent pas de rapport Playwright ou le format n'est pas reconnu.
              </p>
            </div>
          )}
        </div>

        {/* Modal interne pour un test sélectionné */}
        {selectedTestForModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl mx-4 max-h-[85vh] overflow-y-auto p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{selectedTestForModal.spec?.title || selectedTestForModal.test?.title || 'Détails du test'}</h3>
                  <p className="text-sm text-gray-600">{selectedTestForModal.suite?.file || selectedTestForModal.spec?.file || ''}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <button onClick={() => setSelectedTestForModal(null)} className="px-3 py-1 bg-gray-100 rounded">Fermer</button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Statut: <span className="font-medium">{selectedTestForModal.test?.status || 'N/A'}</span>
                  </div>
                  <div className="text-sm text-gray-700">
                    Durée: <span className="font-medium">{selectedTestForModal.test?.results?.[0] ? formatDuration(selectedTestForModal.test.results[0].duration) : 'N/A'}</span>
                  </div>
                </div>

                {selectedTestForModal.test?.results?.[0]?.errors?.length > 0 && (
                  <div className="p-3 bg-red-50 border border-red-100 rounded text-sm text-red-700">
                    <pre className="whitespace-pre-wrap">{selectedTestForModal.test.results[0].errors[0].message}</pre>
                  </div>
                )}

                {/* Fichiers associés - chargés à la demande */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-gray-700">Fichiers associés</h4>
                    {loadingArtifacts && (
                      <div className="text-xs text-blue-600">Chargement...</div>
                    )}
                  </div>

                  {loadingArtifacts ? (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                    </div>
                  ) : artifactsByTest[selectedTestForModal.key] ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {artifactsByTest[selectedTestForModal.key].map((a, ai) => (
                        <div key={ai} className="border rounded-md overflow-hidden">
                          {a.type === 'image' ? (
                            <img src={a.url} alt={a.name} className="w-full h-32 object-cover cursor-pointer" onClick={(e) => { e.stopPropagation(); const w = window.open(); if (w) w.document.write(`<img src="${a.url}" style="max-width:100%;height:auto"/>`); }} />
                          ) : a.type === 'video' ? (
                            <video src={a.url} controls className="w-full h-32 object-cover" />
                          ) : (
                            <div className="w-full h-32 bg-gray-50 flex items-center justify-center text-xs text-gray-600 p-2 truncate">{a.name}</div>
                          )}
                          <div className="p-2 text-xs text-gray-600 truncate">{a.name}</div>
                        </div>
                      ))}
                      {artifactsByTest[selectedTestForModal.key].length === 0 && (
                        <div className="text-sm text-gray-500 col-span-full">Aucun fichier associé trouvé</div>
                      )}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500">Les fichiers seront chargés automatiquement</div>
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
            }}
            pipelineId={test.pipelineId}
            jobId={test.jobId}
            testKey={selectedTestForAnalysis?.key || ''}
            testTitle={selectedTestForAnalysis?.title || ''}
            testFile={selectedTestForAnalysis?.file || ''}
            existingAnalysis={selectedTestForAnalysis ? (testAnalyses[selectedTestForAnalysis.key] || null) : null}
            selectedTests={selectedTestsForGroupAnalysis.length > 0 ? selectedTestsForGroupAnalysis : undefined}
          />
        )}
      </div>
    </div>
  );
};