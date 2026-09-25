import React, { useState, useEffect, useMemo } from 'react';
import { RefreshCw, Play, Search, Filter, BarChart3, Settings, Eye, CheckCircle, XCircle, RotateCcw, Monitor, Bug, Database, Moon, Sun, BookOpen, Award, Rocket, ChevronDown, ExternalLink, ChevronLeft, Mail, Menu, X, Lock } from 'lucide-react';
import { TestResult } from '../types';
import { TestCard } from './TestCard';
import { TriggerTestModal } from './TriggerTestModal';
import { TestResultModal } from './TestResultModal';
import { StatisticsPage } from './StatisticsPage';
import { WeatherPage } from './WeatherPage';
import { WeatherCalendar } from './WeatherCalendar';
import { ExecutionsPage } from './ExecutionsPage';
import PIDsGeneratorPage from './PIDsGeneratorPage';
import GetMyMFAPage from './GetMyMFAPage';
import { ConfigPage } from './ConfigPage';
import { AccessibilityPage } from './AccessibilityPage';
import JDDPage from './JDDPage';
import { DocumentationPage } from './DocumentationPage';
import ContactPage from './ContactPage';
import { LauncherSection } from './LauncherSection';
import { PartnerTestsModal } from './PartnerTestsModal';
import { PerimetreCard, PartnerCard } from './StatCards';
import { gitlabApi } from '../services/gitlabApi';
import { xrayApi } from '../services/xrayApi';
import { getPartnerLogo, detectPartnerFromText, Partner } from '../utils/partnerLogos';

export const TestDashboard: React.FC = () => {
  const [tests, setTests] = useState<TestResult[]>([]);
  const [filteredTests, setFilteredTests] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [triggerModalOpen, setTriggerModalOpen] = useState(false);
  const [testResultModalOpen, setTestResultModalOpen] = useState(false);
  const [selectedTest, setSelectedTest] = useState<TestResult | null>(null);
  const [triggerLoading, setTriggerLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [error, setError] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<'dashboard' | 'statistics' | 'weather' | 'executions' | 'config' | 'pids' | 'mfa' | 'planification' | 'accessibility' | 'jdd' | 'documentation' | 'launcher' | 'contact'>('dashboard');
  const [currentEnvironment, setCurrentEnvironment] = useState<'ci' | 'sit' | 'prod' | 'stg'>('ci');
  const [visibleExecutionsCount, setVisibleExecutionsCount] = useState(10);
  const [perimetreStats, setPerimetreStats] = useState<Record<string, { success: number; failure: number; total: number; tests: Array<{ title: string; passed: boolean }> }>>({});
  const [loadingPerimetreStats, setLoadingPerimetreStats] = useState(false);
  const [selectedExecutionJobId, setSelectedExecutionJobId] = useState<number | null>(null);
  const [partnerModalOpen, setPartnerModalOpen] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [partnerModalTests, setPartnerModalTests] = useState<Array<{ title: string; passed: boolean; perimetre: string }>>([]);
  const [perimetreModalOpen, setPerimetreModalOpen] = useState(false);
  const [selectedPerimetre, setSelectedPerimetre] = useState<string | null>(null);
  const [perimetreModalTests, setPerimetreModalTests] = useState<Array<{ title: string; passed: boolean; perimetre: string }>>([]);
  const [jddMenuOpen, setJddMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [configUnlocked, setConfigUnlocked] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : true;
  });

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(isDarkMode));
  }, [isDarkMode]);

  useEffect(() => {
    fetchTests();

    // Récupérer l'environnement via la variable d'environnement ENV
    const envFromVariable = import.meta.env.VITE_ENV || import.meta.env.ENV || 'ci';
    const validEnv = ['ci', 'sit', 'prod'].includes(envFromVariable?.toLowerCase())
      ? envFromVariable.toLowerCase() as 'ci' | 'sit' | 'prod'
      : 'ci';

    setCurrentEnvironment(validEnv);
    console.log('Environment from ENV variable:', envFromVariable);
    console.log('Resolved environment:', validEnv);
  }, []);

  useEffect(() => {
    // Réinitialiser le nombre d'exécutions visibles quand l'environnement change
    setVisibleExecutionsCount(10);
    // Réinitialiser les statistiques par périmètre
    setPerimetreStats({});
    setSelectedExecutionJobId(null);
  }, [currentEnvironment]);

  useEffect(() => {
    // Réinitialiser les statistiques par périmètre quand les tests changent
    setPerimetreStats({});
  }, [tests]);

  const availableExecutions = useMemo(() => {
    const envTests = tests.filter(t => t.environment?.toLowerCase() === currentEnvironment.toLowerCase());
    return envTests
      .filter(t =>
        (t.branch?.toLowerCase() === 'develop' || t.branch?.toLowerCase() === 'master') &&
        t.status !== 'running' && t.status !== 'pending' &&
        t.jobId
      )
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [tests, currentEnvironment]);

  useEffect(() => {
    if (loadingPerimetreStats || Object.keys(perimetreStats).length > 0) return;
    if (availableExecutions.length === 0) return;
    const latest = availableExecutions[0];
    if (latest?.jobId) {
      setSelectedExecutionJobId(latest.jobId);
      loadPerimetreStats(latest.jobId);
    }
  }, [tests, currentEnvironment, perimetreStats, loadingPerimetreStats, availableExecutions]);

  const handleExecutionChange = (jobId: number) => {
    setSelectedExecutionJobId(jobId);
    setPerimetreStats({});
    loadPerimetreStats(jobId);
  };

  useEffect(() => {
    let filtered = tests;

    // Debug: Log all unique environments in tests
    const uniqueEnvironments = [...new Set(tests.map(test => test.environment))];
    console.log('Available environments in tests:', uniqueEnvironments);
    console.log('Current environment filter:', currentEnvironment);
    console.log('Total tests:', tests.length);

    // Filter by environment first
    filtered = filtered.filter(test => 
      test.environment?.toLowerCase() === currentEnvironment.toLowerCase()
    );
    
    console.log('Tests after environment filter:', filtered.length);

    if (searchTerm) {
      filtered = filtered.filter(test =>
        test.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        test.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
        test.branch.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      if (statusFilter === 'success') {
        // Filter executions where all individual tests passed (100% success rate)
        filtered = filtered.filter(test => {
          const successCount = test.successCount || 0;
          const failureCount = test.failureCount || 0;
          const totalTests = successCount + failureCount;
          return totalTests > 0 && failureCount === 0;
        });
      } else if (statusFilter === 'failed') {
        // Filter executions that have test failures OR failed build status
        filtered = filtered.filter(test => {
          const failureCount = test.failureCount || 0;
          return test.status === 'failed' || failureCount > 0;
        });
      } else {
        // For other statuses (running, pending), use the original logic
        filtered = filtered.filter(test => test.status === statusFilter);
      }
    }

    setFilteredTests(filtered);
  }, [tests, searchTerm, statusFilter, currentEnvironment]);

  const fetchTests = async (forceRefresh: boolean = false) => {
    try {
      setError(null);
      setLoading(true);

      if (forceRefresh) {
        gitlabApi.invalidateCache();
      }

      const testResults = await gitlabApi.getTestResults(!forceRefresh);
      setTests(testResults);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement des tests';
      console.error('Error fetching tests:', err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const loadPerimetreStats = async (jobId: number) => {
    setLoadingPerimetreStats(true);
    try {
      const reportContent = await gitlabApi.getJobArtifactFile(jobId, 'subscription-essential-e2e/test-results-merged.json');
      const report = JSON.parse(reportContent);

      const stats: Record<string, { success: number; failure: number; total: number; tests: Array<{ title: string; passed: boolean }> }> = {};

      const processTests = (suites: any[]) => {
        suites.forEach((suite) => {
          (suite.specs || []).forEach((spec: any) => {
            const filePath = spec.file || suite.file || '';
            const perimetre = filePath.split('/')[0] || 'Autre';

            if (!stats[perimetre]) {
              stats[perimetre] = { success: 0, failure: 0, total: 0, tests: [] };
            }

            (spec.tests || []).forEach((test: any) => {
              stats[perimetre].total++;
              const lastResult = test.results?.[test.results.length - 1];
              const status = lastResult?.status || test.status;
              const passed = status === 'passed';

              if (passed) {
                stats[perimetre].success++;
              } else if (status === 'failed' || status === 'timedOut') {
                stats[perimetre].failure++;
              }

              const title = test.title || spec.title || 'Test sans titre';
              const alreadyExists = stats[perimetre].tests.some(t => t.title === title);
              if (!alreadyExists) {
                stats[perimetre].tests.push({ title, passed });
              }
            });
          });

          if (suite.suites) {
            processTests(suite.suites);
          }
        });
      };

      processTests(report.suites || []);
      setPerimetreStats(stats);
    } catch (err) {
      console.error('Error loading perimetre stats:', err);
    } finally {
      setLoadingPerimetreStats(false);
    }
  };


  const handleTriggerTest = async (selectedTests: string[], variables: Record<string, string>, eSignature: boolean) => {
    try {
      setTriggerLoading(true);

      // Ajouter les variables par défaut
      const pipelineVariables = {
        ...variables,
        ENV: currentEnvironment.toUpperCase(),
        ENVIRONMENT: currentEnvironment.toUpperCase(),
      };

      // Si des tests spécifiques sont sélectionnés, ajouter le filtre
      if (selectedTests.length > 0) {
        // Créer un pattern grep pour les clés sélectionnées
        // Format: "TST-001|TST-002|TST-003" pour grep -E
        pipelineVariables.SELECTED_TESTS = selectedTests.join('|');
      }

      if (eSignature) {
        pipelineVariables.E_SIGNATURE = 'true';
      }

      console.log('Triggering pipeline with variables:', pipelineVariables);

      await gitlabApi.triggerPipeline('master', pipelineVariables);
      setTriggerModalOpen(false);

      // Ouvrir immédiatement la modale d'exécution en cours
      const mockRunningTest: TestResult = {
        id: Date.now(),
        pipelineId: 0,
        name: `Test en cours - ${selectedTests.length} test(s)`,
        status: 'running',
        createdAt: new Date().toISOString(),
        duration: 0,
        author: 'Vous',
        branch: 'master',
        environment: currentEnvironment,
        successCount: 0,
        failureCount: 0,
        testResultsUrl: '',
        reportUrl: ''
      };
      setSelectedTest(mockRunningTest);
      setTestResultModalOpen(true);

      // Refresh tests after a short delay
      setTimeout(() => {
        fetchTests(true);
      }, 2000);
    } catch (err) {
      console.error('Error triggering pipeline:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors du lancement du test');
    } finally {
      setTriggerLoading(false);
    }
  };

  const handleViewTestDetails = (test: TestResult) => {
    setSelectedTest(test);
    setTestResultModalOpen(true);
  };

  const handleConfigAccess = () => {
    if (configUnlocked) {
      setCurrentView('config');
    } else {
      setShowPasswordModal(true);
      setPasswordInput('');
      setPasswordError(false);
    }
  };

  const handlePasswordSubmit = () => {
    if (passwordInput === 'dashboardqa2026') {
      setConfigUnlocked(true);
      setShowPasswordModal(false);
      setPasswordInput('');
      setPasswordError(false);
      setCurrentView('config');
    } else {
      setPasswordError(true);
    }
  };



  const handleDayClick = (dayTests: TestResult[]) => {
    if (dayTests.length > 0) {
      setCurrentView('weather');
      // Set the filtered tests to only show the selected day's tests
      setFilteredTests(dayTests);
    }
  };

  if (currentView === 'contact') {
    return <ContactPage onBack={() => setCurrentView('dashboard')} />;
  }

  if (currentView === 'launcher') {
    return (
      <div className={`min-h-screen ${isDarkMode ? 'bg-slate-900' : 'bg-slate-50'}`}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <button
              onClick={() => setCurrentView('dashboard')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors text-sm font-medium ${isDarkMode ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Retour au dashboard</span>
            </button>
          </div>
          <div className="flex items-center space-x-3 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center shadow-md">
              <Rocket className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Lanceur</h1>
              <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Lancez des tests manuels directement depuis l'accueil</p>
            </div>
          </div>
          <LauncherSection
            isDarkMode={isDarkMode}
            onAutoLaunch={() => setTriggerModalOpen(true)}
          />
        </div>
      </div>
    );
  }

  if (currentView === 'jdd') {
    return (
      <div className="min-h-screen bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <button
              onClick={() => setCurrentView('dashboard')}
              className="flex items-center space-x-2 px-4 py-2 text-blue-400 hover:bg-gray-800 rounded-md transition-colors"
            >
              ← Retour au dashboard
            </button>
          </div>
          <JDDPage />
        </div>
      </div>
    );
  }

  if (currentView === 'accessibility') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="mb-8 pt-8 px-8">
          <button
            onClick={() => setCurrentView('dashboard')}
            className="flex items-center space-x-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
          >
            ← Retour au dashboard
          </button>
        </div>
        <AccessibilityPage />
      </div>
    );
  }

  if (currentView === 'documentation') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <button
              onClick={() => setCurrentView('dashboard')}
              className="flex items-center space-x-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
            >
              ← Retour au dashboard
            </button>
          </div>
          <DocumentationPage />
        </div>
      </div>
    );
  }

  if (currentView === 'mfa') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <button
              onClick={() => setCurrentView('dashboard')}
              className="flex items-center space-x-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
            >
              ← Retour au dashboard
            </button>
          </div>
          <GetMyMFAPage />
        </div>
      </div>
    );
  }

  if (currentView === 'pids') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <button
              onClick={() => setCurrentView('dashboard')}
              className="flex items-center space-x-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
            >
              ← Retour au dashboard
            </button>
          </div>
          <PIDsGeneratorPage />
        </div>
      </div>
    );
  }

  if (currentView === 'config') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="mb-8 pt-8 px-8">
          <button
            onClick={() => setCurrentView('dashboard')}
            className="flex items-center space-x-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
          >
            ← Retour au dashboard
          </button>
        </div>
        <ConfigPage />
      </div>
    );
  }

  if (currentView === 'executions') {
    return (
      <ExecutionsPage
        tests={tests}
        currentEnvironment={currentEnvironment}
        onBack={() => setCurrentView('dashboard')}
        onRefresh={() => fetchTests(true)}
        loading={loading}
      />
    );
  }

  if (currentView === 'weather') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <button
              onClick={() => {
                setCurrentView('dashboard');
                // Reset filtered tests when going back
                setFilteredTests(tests.filter(test => {
                  let filtered = tests;
                  if (searchTerm) {
                    filtered = filtered.filter(test =>
                      test.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      test.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      test.branch.toLowerCase().includes(searchTerm.toLowerCase())
                    );
                  }
                  if (statusFilter !== 'all') {
                    if (statusFilter === 'success') {
                      filtered = filtered.filter(test => 
                        test.status === 'success' && (test.failureCount === 0 || test.failureCount === undefined)
                      );
                    } else if (statusFilter === 'failed') {
                      filtered = filtered.filter(test => 
                        test.status === 'failed' || (test.failureCount && test.failureCount > 0)
                      );
                    } else {
                      filtered = filtered.filter(test => test.status === statusFilter);
                    }
                  }
                  return filtered.includes(test);
                }));
              }}
              className="flex items-center space-x-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
            >
              ← Retour au dashboard
            </button>
          </div>
        </div>
        <WeatherPage 
          tests={filteredTests.length > 0 ? filteredTests : tests}
          currentEnvironment={currentEnvironment}
          onViewTestDetails={handleViewTestDetails}
        />
        
        {/* Modal for test details */}
        {selectedTest && (
          <TestResultModal
            isOpen={testResultModalOpen}
            onClose={() => {
              setTestResultModalOpen(false);
              setSelectedTest(null);
            }}
            test={selectedTest}
          />
        )}
      </div>
    );
  }

  if (currentView === 'statistics') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => setCurrentView('dashboard')}
                className="flex items-center space-x-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
              >
                ← Retour au dashboard
              </button>
            </div>
          </div>
        </div>
        <StatisticsPage tests={tests} currentEnvironment={currentEnvironment} />
      </div>
    );
  }


  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {loading && (
        <div className="fixed inset-0 bg-white/60 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl p-8 flex flex-col items-center space-y-4">
            <div className="w-64 bg-gray-200 rounded-full h-3">
              <div className="bg-blue-600 h-3 rounded-full animate-pulse" style={{ width: '60%' }}></div>
            </div>
            <div className="flex items-center space-x-2">
              <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
              <span className="text-gray-700 font-medium">Chargement des tests...</span>
            </div>
          </div>
        </div>
      )}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4 gap-3 flex-nowrap">
            <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
              <img
                src="/images/logoQA.png"
                alt="Sofinco QA Dashboard"
                className="h-16 sm:h-18 lg:h-20 w-auto object-contain max-w-[140px] sm:max-w-[150px] lg:max-w-[180px] flex-shrink-0"
              />
            </div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center justify-end flex-1 min-w-0">
              <div className={`flex items-center justify-between w-full rounded-lg shadow-sm border ${isDarkMode ? 'bg-white/10 border-white/20' : 'bg-white border-gray-200'}`}>
                <button
                  onClick={() => setCurrentView('launcher')}
                  className={`flex-1 flex items-center justify-center space-x-1.5 px-3 py-2 transition-colors border-r ${isDarkMode ? 'text-white hover:bg-white/10 border-white/20' : 'text-gray-700 hover:bg-gray-50 border-gray-200'}`}
                  title="Lanceur"
                >
                  <Rocket className="w-4 h-4" />
                  <span className="text-sm font-medium">Lanceur</span>
                </button>
                <button
                  onClick={() => setCurrentView('statistics')}
                  className={`flex-1 flex items-center justify-center space-x-1.5 px-3 py-2 transition-colors border-r ${isDarkMode ? 'text-white hover:bg-white/10 border-white/20' : 'text-gray-700 hover:bg-gray-50 border-gray-200'}`}
                  title="Statistiques"
                >
                  <BarChart3 className="w-4 h-4" />
                  <span className="text-sm font-medium">Statistiques</span>
                </button>

                <button
                  onClick={() => setCurrentView('accessibility')}
                  className={`flex-1 flex items-center justify-center space-x-1.5 px-3 py-2 transition-colors border-r ${isDarkMode ? 'text-white hover:bg-white/10 border-white/20' : 'text-gray-700 hover:bg-gray-50 border-gray-200'}`}
                  title="Accessibilité"
                >
                  <Eye className="w-4 h-4" />
                  <span className="text-sm font-medium">Accessibilité</span>
                </button>

                <div
                  className="relative flex-1"
                  onMouseEnter={() => setJddMenuOpen(true)}
                  onMouseLeave={() => setJddMenuOpen(false)}
                >
                  <button
                    className={`flex items-center justify-center space-x-1.5 px-3 py-2 transition-colors border-r w-full ${isDarkMode ? 'text-white hover:bg-white/10 border-white/20' : 'text-gray-700 hover:bg-gray-50 border-gray-200'}`}
                    title="JDD"
                  >
                    <Database className="w-4 h-4" />
                    <span className="text-sm font-medium">JDD</span>
                    <ChevronDown className={`w-3 h-3 transition-transform ${jddMenuOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {jddMenuOpen && (
                    <div className={`absolute top-full left-0 ${isDarkMode ? 'bg-gray-800 border-white/10' : 'bg-white border-gray-200'} border rounded-lg shadow-lg py-1 min-w-[140px] z-50`}>
                      <button
                        onClick={() => { setCurrentView('mfa'); setJddMenuOpen(false); }}
                        className={`flex items-center space-x-2 w-full px-4 py-2 text-sm transition-colors ${isDarkMode ? 'text-white hover:bg-white/10' : 'text-gray-700 hover:bg-gray-50'}`}
                      >
                        <span className="text-lg">📱</span>
                        <span>MFA</span>
                      </button>
                      <button
                        onClick={() => { setCurrentView('pids'); setJddMenuOpen(false); }}
                        className={`flex items-center space-x-2 w-full px-4 py-2 text-sm transition-colors ${isDarkMode ? 'text-white hover:bg-white/10' : 'text-gray-700 hover:bg-gray-50'}`}
                      >
                        <span className="text-lg">🪪</span>
                        <span>PIDs</span>
                      </button>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setCurrentView('documentation')}
                  className={`flex-1 flex items-center justify-center space-x-1.5 px-3 py-2 transition-colors border-r ${isDarkMode ? 'text-white hover:bg-white/10 border-white/20' : 'text-gray-700 hover:bg-gray-50 border-gray-200'}`}
                  title="Documentation"
                >
                  <BookOpen className="w-4 h-4" />
                  <span className="text-sm font-medium">Documentation</span>
                </button>
                <button
                  onClick={handleConfigAccess}
                  className={`flex-1 flex items-center justify-center space-x-1.5 px-3 py-2 transition-colors border-r ${isDarkMode ? 'text-white hover:bg-white/10 border-white/20' : 'text-gray-700 hover:bg-gray-50 border-gray-200'}`}
                  title="Configuration"
                >
                  {configUnlocked ? <Settings className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                  <span className="text-sm font-medium">Configuration</span>
                </button>
                <button
                  onClick={() => setCurrentView('contact')}
                  className={`flex-1 flex items-center justify-center space-x-1.5 px-3 py-2 transition-colors ${isDarkMode ? 'text-white hover:bg-white/10' : 'text-gray-700 hover:bg-gray-50'}`}
                  title="Contacter l'équipe"
                >
                  <Mail className="w-4 h-4" />
                  <span className="text-sm font-medium">Contact</span>
                </button>
              </div>
            </div>

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`lg:hidden flex items-center justify-center p-2.5 rounded-lg transition-colors ${isDarkMode ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-white border border-gray-200 hover:bg-gray-50 text-gray-700'}`}
              title="Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

          {/* Mobile Dropdown Menu */}
          {mobileMenuOpen && (
            <div className={`lg:hidden rounded-xl shadow-lg border mb-6 overflow-hidden ${isDarkMode ? 'bg-gray-800 border-white/10' : 'bg-white border-gray-200'}`}>
              <button
                onClick={() => { setCurrentView('launcher'); setMobileMenuOpen(false); }}
                className={`flex items-center space-x-3 w-full px-5 py-3.5 transition-colors border-b ${isDarkMode ? 'text-white hover:bg-white/10 border-white/10' : 'text-gray-700 hover:bg-gray-50 border-gray-100'}`}
              >
                <Rocket className="w-5 h-5" />
                <span className="text-sm font-medium">Lanceur</span>
              </button>
              <button
                onClick={() => { setCurrentView('statistics'); setMobileMenuOpen(false); }}
                className={`flex items-center space-x-3 w-full px-5 py-3.5 transition-colors border-b ${isDarkMode ? 'text-white hover:bg-white/10 border-white/10' : 'text-gray-700 hover:bg-gray-50 border-gray-100'}`}
              >
                <BarChart3 className="w-5 h-5" />
                <span className="text-sm font-medium">Statistiques</span>
              </button>
              <button
                onClick={() => { setCurrentView('accessibility'); setMobileMenuOpen(false); }}
                className={`flex items-center space-x-3 w-full px-5 py-3.5 transition-colors border-b ${isDarkMode ? 'text-white hover:bg-white/10 border-white/10' : 'text-gray-700 hover:bg-gray-50 border-gray-100'}`}
              >
                <Eye className="w-5 h-5" />
                <span className="text-sm font-medium">Accessibilité</span>
              </button>
              <div className={`border-b ${isDarkMode ? 'border-white/10' : 'border-gray-100'}`}>
                <button
                  onClick={() => setJddMenuOpen(!jddMenuOpen)}
                  className={`flex items-center space-x-3 w-full px-5 py-3.5 transition-colors ${isDarkMode ? 'text-white hover:bg-white/10' : 'text-gray-700 hover:bg-gray-50'}`}
                >
                  <Database className="w-5 h-5" />
                  <span className="text-sm font-medium">JDD</span>
                  <ChevronDown className={`w-4 h-4 ml-auto transition-transform ${jddMenuOpen ? 'rotate-180' : ''}`} />
                </button>
                {jddMenuOpen && (
                  <div className={isDarkMode ? 'bg-black/20' : 'bg-gray-50'}>
                    <button
                      onClick={() => { setCurrentView('mfa'); setMobileMenuOpen(false); setJddMenuOpen(false); }}
                      className={`flex items-center space-x-3 w-full px-8 py-3 text-sm transition-colors ${isDarkMode ? 'text-white hover:bg-white/10' : 'text-gray-700 hover:bg-gray-100'}`}
                    >
                      <span className="text-lg">📱</span>
                      <span>MFA</span>
                    </button>
                    <button
                      onClick={() => { setCurrentView('pids'); setMobileMenuOpen(false); setJddMenuOpen(false); }}
                      className={`flex items-center space-x-3 w-full px-8 py-3 text-sm transition-colors ${isDarkMode ? 'text-white hover:bg-white/10' : 'text-gray-700 hover:bg-gray-100'}`}
                    >
                      <span className="text-lg">🪪</span>
                      <span>PIDs</span>
                    </button>
                  </div>
                )}
              </div>
              <button
                onClick={() => { setCurrentView('documentation'); setMobileMenuOpen(false); }}
                className={`flex items-center space-x-3 w-full px-5 py-3.5 transition-colors border-b ${isDarkMode ? 'text-white hover:bg-white/10 border-white/10' : 'text-gray-700 hover:bg-gray-50 border-gray-100'}`}
              >
                <BookOpen className="w-5 h-5" />
                <span className="text-sm font-medium">Documentation</span>
              </button>
              <button
                onClick={() => { handleConfigAccess(); setMobileMenuOpen(false); }}
                className={`flex items-center space-x-3 w-full px-5 py-3.5 transition-colors border-b ${isDarkMode ? 'text-white hover:bg-white/10 border-white/10' : 'text-gray-700 hover:bg-gray-50 border-gray-100'}`}
              >
                {configUnlocked ? <Settings className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                <span className="text-sm font-medium">Configuration</span>
              </button>
              <button
                onClick={() => { setCurrentView('contact'); setMobileMenuOpen(false); }}
                className={`flex items-center space-x-3 w-full px-5 py-3.5 transition-colors ${isDarkMode ? 'text-white hover:bg-white/10' : 'text-gray-700 hover:bg-gray-50'}`}
              >
                <Mail className="w-5 h-5" />
                <span className="text-sm font-medium">Contact / Bug</span>
              </button>
            </div>
          )}

          {/* Weather Image with Test Banner */}
          {(() => {
            const environmentTests = tests.filter(test =>
              test.environment?.toLowerCase() === currentEnvironment.toLowerCase()
            );

            // Si aucun test pour cet environnement et qu'on n'est pas en train de charger, afficher le bandeau "Aucun test trouvé"
            if (environmentTests.length === 0 && !loading) {
              return (
                <div className="relative bg-gradient-to-r from-blue-50 to-indigo-100 border border-blue-200 rounded-lg p-8 text-center mb-6">
                  <div className="absolute top-4 left-4">
                    <button
                      onClick={() => setIsDarkMode(!isDarkMode)}
                      className="p-2 rounded-lg bg-white/60 hover:bg-white transition-colors"
                      title={isDarkMode ? 'Passer en mode clair' : 'Passer en mode sombre'}
                    >
                      {isDarkMode ? <Sun className="w-4 h-4 text-yellow-500" /> : <Moon className="w-4 h-4 text-gray-700" />}
                    </button>
                  </div>
                  <div className="mb-6">
                    <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-3xl">🔍</span>
                    </div>
                    <h3 className="text-2xl font-bold text-blue-900 mb-2">
                      Aucun test trouvé pour {currentEnvironment.toUpperCase()}
                    </h3>
                    <p className="text-blue-700 text-lg mb-6">
                      Il n'y a actuellement aucune exécution de test disponible pour l'environnement {currentEnvironment.toUpperCase()}.
                    </p>
                  </div>
                  
                  <div className="bg-white bg-opacity-60 rounded-lg p-6 mb-6">
                    <h4 className="font-semibold text-blue-900 mb-3">Que faire ?</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
                      <div className="flex items-start space-x-3">
                        <span className="text-green-600 font-bold">1.</span>
                        <span>Lancez un nouveau test en cliquant sur "Nouveau test"</span>
                      </div>
                      <div className="flex items-start space-x-3">
                        <span className="text-green-600 font-bold">2.</span>
                        <span>Vérifiez que la variable ENV est correctement configurée</span>
                      </div>
                      <div className="flex items-start space-x-3">
                        <span className="text-green-600 font-bold">3.</span>
                        <span>Essayez un autre environnement (SIT ou PROD)</span>
                      </div>
                      <div className="flex items-start space-x-3">
                        <span className="text-green-600 font-bold">4.</span>
                        <span>Actualisez la page pour recharger les données</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-center space-x-4">
                    <button
                      onClick={() => setTriggerModalOpen(true)}
                      className="flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                    >
                      <Play className="w-5 h-5" />
                      <span>Lancer un nouveau test</span>
                    </button>
                    <button
                      onClick={() => fetchTests(true)}
                      className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      <RefreshCw className="w-5 h-5" />
                      <span>Actualiser</span>
                    </button>
                  </div>
                </div>
              );
            }
            
            // Sinon, afficher le bandeau météo normal
            const today = new Date();
            const todayTests = environmentTests.filter(test => {
              const testDate = new Date(test.timestamp);
              return testDate.toDateString() === today.toDateString() &&
                     test.status !== 'running' && test.status !== 'pending';
            });

            // Récupérer uniquement la dernière exécution sur la branche main (en excluant les tests en cours)
            const mainBranchTests = environmentTests.filter(test =>
              (test.branch?.toLowerCase() === 'main' || test.branch?.toLowerCase() === 'master') &&
              test.status !== 'running' && test.status !== 'pending'
            );
            const latestMainTest = mainBranchTests.length > 0
              ? mainBranchTests.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0]
              : null;

            // Fallback : dernière exécution toute branche confondue (pour le rappel sur le bandeau)
            const latestAnyTest = environmentTests.length > 0
              ? [...environmentTests].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0]
              : null;
            const latestTestForReminder = latestMainTest || latestAnyTest;

            // Vérifier s'il y a des tests en cours aujourd'hui
            const runningTestsToday = environmentTests.filter(test => {
              const testDate = new Date(test.timestamp);
              return testDate.toDateString() === today.toDateString() &&
                     (test.status === 'running' || test.status === 'pending');
            });
            const hasRunningTests = runningTestsToday.length > 0;

            // Nouvel état pour indiquer absence d'exécutions aujourd'hui
            let todayWeather: 'sunny' | 'cloudy' | 'rainy' | 'stormy' | 'no-executions' = 'sunny';
            let successRate = 0;

            if (todayTests.length === 0) {
              // Cas spécifique : aucune exécution aujourd'hui
              todayWeather = 'no-executions';
              successRate = 0;
            } else if (latestMainTest) {
              // Calcul basé uniquement sur la dernière exécution main
              const successCount = latestMainTest.successCount || 0;
              const failureCount = latestMainTest.failureCount || 0;
              const totalTestsInExecution = successCount + failureCount;

              if (totalTestsInExecution > 0) {
                successRate = (successCount / totalTestsInExecution) * 100;
              }

              if (successRate >= 90) todayWeather = 'sunny';
              else if (successRate >= 70) todayWeather = 'cloudy';
              else if (successRate >= 50) todayWeather = 'rainy';
              else todayWeather = 'stormy';
            } else {
              // Fallback : si aucune exécution main, utiliser le calcul moyen de toutes les exécutions
              let totalSuccessRate = 0;
              let validExecutions = 0;

              todayTests.forEach(test => {
                const successCount = test.successCount || 0;
                const failureCount = test.failureCount || 0;
                const totalTestsInExecution = successCount + failureCount;

                if (totalTestsInExecution > 0) {
                  const executionSuccessRate = (successCount / totalTestsInExecution) * 100;
                  totalSuccessRate += executionSuccessRate;
                  validExecutions++;
                }
              });

              successRate = validExecutions > 0 ? totalSuccessRate / validExecutions : 0;

              if (successRate >= 90) todayWeather = 'sunny';
              else if (successRate >= 70) todayWeather = 'cloudy';
              else if (successRate >= 50) todayWeather = 'rainy';
              else todayWeather = 'stormy';
            }
            
            const getWeatherImage = (weather: string) => {
              switch (weather) {
                case 'sunny':
                  const sunnyImages = [
                    'https://images.pexels.com/photos/96622/pexels-photo-96622.jpeg?auto=compress&cs=tinysrgb&w=1200&h=400&fit=crop',
                    'https://images.pexels.com/photos/281260/pexels-photo-281260.jpeg?auto=compress&cs=tinysrgb&w=1200&h=400&fit=crop',
                  ];
                  return sunnyImages[Math.floor(Math.random() * sunnyImages.length)];
                case 'cloudy':
                  return 'https://images.pexels.com/photos/209831/pexels-photo-209831.jpeg?auto=compress&cs=tinysrgb&w=1200&h=400&fit=crop';
                case 'rainy':
                  return 'https://images.pexels.com/photos/459451/pexels-photo-459451.jpeg?auto=compress&cs=tinysrgb&w=1200&h=400&fit=crop';
                case 'stormy':
                  return 'https://images.pexels.com/photos/1162251/pexels-photo-1162251.jpeg?auto=compress&cs=tinysrgb&w=1200&h=400&fit=crop';
                case 'no-executions':
                  return 'https://images.pexels.com/photos/158163/clouds-cloudporn-weather-lookup-158163.jpeg?auto=compress&cs=tinysrgb&w=1200&h=400&fit=crop';
                default:
                  return 'https://images.pexels.com/photos/531756/pexels-photo-531756.jpeg?auto=compress&cs=tinysrgb&w=1200&h=400&fit=crop';
              }
            };
            
            const getMemeTitle = (weather: string) => {
              switch (weather) {
                case 'sunny':
                  return 'Tout fonctionne parfaitement ! 🎉';
                case 'cloudy':
                  return 'Quelques petits bugs... 🤔';
                case 'rainy':
                  return 'Houston, nous avons un problème 😅';
                case 'stormy':
                  return 'Tout est cassé ! 🔥💻🔥';
                case 'no-executions':
                  return `Aucune exécution aujourd'hui`;
                default:
                  return 'Journée tranquille';
              }
            };
            
            const getMemeEmoji = (weather: string) => {
              switch (weather) {
                case 'sunny':
                  return '☀️🌞✨';
                case 'cloudy':
                  return '🤷‍♂️';
                case 'rainy':
                  return '🐛';
                case 'stormy':
                  return '💥';
                case 'no-executions':
                  return '⏳';
                default:
                  return '😴';
              }
            };
            
            return (
              <div className="relative mb-8 rounded-xl overflow-hidden shadow-lg">
                <div 
                  className="h-64 bg-cover bg-center relative"
                  style={{ backgroundImage: `url(${getWeatherImage(todayWeather)})` }}
                >
                  {/* Overlay gradient */}
                  <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-black/60"></div>

                  {/* Weather content */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center text-white">
                      <div className="text-6xl mb-4">{getMemeEmoji(todayWeather)}</div>
                      <h2 className="text-3xl font-bold mb-2">{getMemeTitle(todayWeather)}</h2>
                      {todayWeather === 'no-executions' ? (
                        <p className="text-xl opacity-90">
                          Il n'y a aucune exécution de test pour {currentEnvironment.toUpperCase()} aujourd'hui. Lancez une exécution ou actualisez après un nouveau run.
                        </p>
                      ) : (
                        <p className="text-xl opacity-90">
                          {todayTests.length > 0 
                            ? `${todayTests.length} exécution${todayTests.length > 1 ? 's' : ''} aujourd'hui`
                            : 'Aucune exécution aujourd\'hui'
                          }
                        </p>
                      )}
                      {todayWeather === 'no-executions' ? (
                        <div className="mt-4 flex items-center justify-center space-x-6">
                          <button
                            onClick={() => setTriggerModalOpen(true)}
                            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                          >
                            <Play className="w-5 h-5 inline-block mr-2" />
                            Lancer un test
                          </button>
                          <button
                            onClick={() => fetchTests(true)}
                            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                          >
                            <RefreshCw className="w-5 h-5 inline-block mr-2" />
                            Actualiser
                          </button>
                        </div>
                      ) : todayTests.length > 0 && (
                        <div className="mt-4">
                          <div className="flex items-center justify-center space-x-6">
                            <div className="text-center">
                              <div className="text-2xl font-bold">{Math.round(successRate)}%</div>
                              <div className="text-sm opacity-75">Taux de réussite</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-green-300">
                                {latestMainTest ? latestMainTest.successCount || 0 : todayTests.reduce((sum, test) => sum + (test.successCount || 0), 0)}
                              </div>
                              <div className="text-sm opacity-75">Réussis</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-red-300">
                                {latestMainTest ? latestMainTest.failureCount || 0 : todayTests.reduce((sum, test) => sum + (test.failureCount || 0), 0)}
                              </div>
                              <div className="text-sm opacity-75">Échecs</div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Dark mode toggle - top left */}
                  <div className="absolute top-4 left-4 z-10">
                    <button
                      onClick={() => setIsDarkMode(!isDarkMode)}
                      className="p-2.5 rounded-lg bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-colors"
                      title={isDarkMode ? 'Passer en mode clair' : 'Passer en mode sombre'}
                    >
                      {isDarkMode ? <Sun className="w-5 h-5 text-yellow-300" /> : <Moon className="w-5 h-5 text-white" />}
                    </button>
                  </div>

                  {/* Date indicator and running tests info */}
                  <div className="absolute top-4 right-4 flex flex-col gap-2 items-end">
                    <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2">
                      <div className="text-white font-medium">
                        {today.toLocaleDateString('fr-FR', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long'
                        })}
                      </div>
                    </div>
                    {hasRunningTests && (
                      <div className="bg-blue-600/90 backdrop-blur-sm rounded-lg px-4 py-2 border-2 border-blue-300 shadow-lg animate-pulse">
                        <div className="flex items-center space-x-2">
                          <RefreshCw className="w-4 h-4 text-white animate-spin" />
                          <span className="text-white font-semibold">
                            {runningTestsToday.length} exécution{runningTestsToday.length > 1 ? 's' : ''} en cours
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action button */}
                  <div className="absolute bottom-4 left-4">
                    <button
                      onClick={() => setTriggerModalOpen(true)}
                      className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all flex items-center space-x-2 shadow-xl font-semibold border-2 border-green-700 hover:border-green-800"
                    >
                      <Play className="w-5 h-5" />
                      <span>Nouveau test</span>
                    </button>
                  </div>

                  {/* Rappel dernière exécution */}
                  {latestTestForReminder && (
                    <button
                      onClick={() => handleViewTestDetails(latestTestForReminder)}
                      className="absolute bottom-4 right-4 inline-flex items-center gap-2 px-4 py-2.5 bg-white text-blue-800 rounded-lg hover:bg-blue-50 transition-all border-2 border-blue-300 shadow-xl font-semibold"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <div className="text-left">
                        <div className="text-xs text-blue-500 font-medium">Dernière exécution</div>
                        <div className="text-sm font-bold text-blue-900">
                          {new Date(latestTestForReminder.timestamp).toLocaleString('fr-FR', {
                            hour: '2-digit',
                            minute: '2-digit',
                            day: 'numeric',
                            month: 'short'
                          })}
                          {' · '}
                          <span className="text-green-600">{latestTestForReminder.successCount || 0} ✓</span>
                          {' / '}
                          <span className="text-red-600">{latestTestForReminder.failureCount || 0} ✗</span>
                        </div>
                      </div>
                    </button>
                  )}
                </div>
              </div>
            );
          })()}


          {/* Statistiques par périmètre */}
          {(() => {
            const environmentTests = tests.filter(test =>
              test.environment?.toLowerCase() === currentEnvironment.toLowerCase()
            );
            const mainBranchTests = environmentTests.filter(test =>
              (test.branch?.toLowerCase() === 'main' || test.branch?.toLowerCase() === 'master') &&
              test.status !== 'running' && test.status !== 'pending'
            );
            const latestMainTest = mainBranchTests.length > 0
              ? mainBranchTests.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0]
              : null;

            return (
              <div className={`rounded-xl shadow-lg border-2 mb-8 overflow-hidden ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'}`}>
                {/* Illustration bannière */}
          

                <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                      <BarChart3 className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        Statistiques par périmètre
                      </h2>
                      <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {availableExecutions.find(t => t.jobId === selectedExecutionJobId)?.branch || '—'} · {availableExecutions.find(t => t.jobId === selectedExecutionJobId) ? new Date(availableExecutions.find(t => t.jobId === selectedExecutionJobId)!.timestamp).toLocaleString('fr-FR') : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {availableExecutions.length > 0 && (
                      <select
                        value={selectedExecutionJobId ?? ''}
                        onChange={(e) => handleExecutionChange(Number(e.target.value))}
                        disabled={loadingPerimetreStats}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${isDarkMode ? 'bg-slate-800 border-slate-600 text-white' : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400'} disabled:opacity-50`}
                      >
                        {availableExecutions.map((t) => (
                          <option key={t.jobId} value={t.jobId}>
                            {new Date(t.timestamp).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })} {new Date(t.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} — {t.branch}
                          </option>
                        ))}
                      </select>
                    )}
                    <div className={`px-3 py-1 text-sm font-semibold rounded-full ${isDarkMode ? 'bg-blue-900/50 text-blue-300' : 'bg-blue-100 text-blue-700'}`}>
                      {Object.keys(perimetreStats).length} périmètres
                    </div>
                  </div>
                </div>

                {loadingPerimetreStats ? (
                  <div className="text-center py-8">
                    <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Chargement des données...</p>
                  </div>
                ) : Object.keys(perimetreStats).length === 0 ? (
                  <div className="text-center py-8">
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Aucune donnée disponible</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(perimetreStats)
                      .sort(([a], [b]) => a.localeCompare(b))
                      .map(([perimetre, pStats], index) => (
                        <PerimetreCard
                          key={perimetre}
                          perimetre={perimetre}
                          data={pStats}
                          delay={index * 80}
                          onClick={() => {
                            setSelectedPerimetre(perimetre);
                            setPerimetreModalTests(pStats.tests.map(t => ({ title: t.title, passed: t.passed, perimetre })));
                            setPerimetreModalOpen(true);
                          }}
                        />
                      ))}
                  </div>
                )}
                </div>{/* end p-6 */}
              </div>
            );
          })()}

          {/* Statistiques par partenaire */}
          {(() => {
            const partnerAgg: Record<string, { success: number; failure: number; total: number; perimetres: Set<string> }> = {};
            Object.entries(perimetreStats).forEach(([perimetre, s]) => {
              s.tests.forEach((t) => {
                const partner = detectPartnerFromText(t.title);
                if (!partnerAgg[partner]) {
                  partnerAgg[partner] = { success: 0, failure: 0, total: 0, perimetres: new Set() };
                }
                partnerAgg[partner].total++;
                if (t.passed) {
                  partnerAgg[partner].success++;
                } else {
                  partnerAgg[partner].failure++;
                }
                partnerAgg[partner].perimetres.add(perimetre);
              });
            });

            return (
              <div className={`rounded-xl shadow-lg border-2 mb-8 overflow-hidden ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'}`}>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                        <Award className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          Statistiques par partenaire
                        </h2>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          Vue agrégée par partenaire
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {availableExecutions.length > 0 && (
                        <select
                          value={selectedExecutionJobId ?? ''}
                          onChange={(e) => handleExecutionChange(Number(e.target.value))}
                          disabled={loadingPerimetreStats}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${isDarkMode ? 'bg-slate-800 border-slate-600 text-white' : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400'} disabled:opacity-50`}
                        >
                          {availableExecutions.map((t) => (
                            <option key={t.jobId} value={t.jobId}>
                              {new Date(t.timestamp).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })} {new Date(t.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} — {t.branch}
                            </option>
                          ))}
                        </select>
                      )}
                      <div className={`px-3 py-1 text-sm font-semibold rounded-full ${isDarkMode ? 'bg-blue-900/50 text-blue-300' : 'bg-blue-100 text-blue-700'}`}>
                        {Object.keys(partnerAgg).length} partenaires
                      </div>
                    </div>
                  </div>

                {loadingPerimetreStats ? (
                  <div className="text-center py-8">
                    <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Chargement des données...</p>
                  </div>
                ) : Object.keys(partnerAgg).length === 0 ? (
                  <div className="text-center py-8">
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Aucune donnée disponible</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(partnerAgg)
                      .sort((a, b) => b[1].total - a[1].total)
                      .map(([partner, s], index) => (
                        <PartnerCard
                          key={partner}
                          partner={partner}
                          success={s.success}
                          failure={s.failure}
                          total={s.total}
                          perimetres={s.perimetres}
                          delay={index * 80}
                          onClick={() => {
                            const partnerTests: Array<{ title: string; passed: boolean; perimetre: string }> = [];
                            Object.entries(perimetreStats).forEach(([perimetre, ps]) => {
                              ps.tests.forEach((t) => {
                                if (detectPartnerFromText(t.title) === partner) {
                                  partnerTests.push({ title: t.title, passed: t.passed, perimetre });
                                }
                              });
                            });
                            setSelectedPartner(partner as Partner);
                            setPartnerModalTests(partnerTests);
                            setPartnerModalOpen(true);
                          }}
                        />
                      ))}
                  </div>
                )}
                </div>
              </div>
            );
          })()}

          <WeatherCalendar
            tests={tests.filter(test => test.environment?.toLowerCase() === currentEnvironment.toLowerCase())}
            onDayClick={handleDayClick}
            onViewTestDetails={handleViewTestDetails}
          />

          {/* Latest Execution Banner */}
          {tests.filter(test => test.environment?.toLowerCase() === currentEnvironment.toLowerCase()).length > 0 && (
            <div
              className="rounded-2xl shadow-lg p-6 mb-6 mt-8"
              style={{
                background: 'rgba(255,255,255,0.97)',
                border: '1px solid rgba(229,231,235,0.8)',
                boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
              }}
            >
              <div className="flex items-center gap-3 mb-5">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm"
                  style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}
                >
                  <Rocket className="w-5 h-5 text-white" strokeWidth={2} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Dernières exécutions</h2>
                  <p className="text-sm text-gray-500">Historique récent des pipelines de test</p>
                </div>
              </div>
              {(() => {
                const allFilteredTests = tests
                  .filter(test => test.environment?.toLowerCase() === currentEnvironment.toLowerCase())
                  .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

                const latestTests = allFilteredTests.slice(0, visibleExecutionsCount);

                return (
                  <div className="space-y-3">
                    {latestTests.map((test, index) => {
                      const successCount = test.successCount || 0;
                      const failureCount = test.failureCount || 0;
                      const totalTests = successCount + failureCount;
                      const successRate = totalTests > 0 ? (successCount / totalTests) * 100 : 0;
                      const isRunning = test.status === 'running' || test.status === 'pending';

                      let execColor = '#22c55e';
                      let execGlow = 'rgba(34,197,94,0.25)';
                      if (isRunning) {
                        execColor = '#3b82f6';
                        execGlow = 'rgba(59,130,246,0.25)';
                      } else if (successRate < 50) {
                        execColor = '#ef4444';
                        execGlow = 'rgba(239,68,68,0.25)';
                      } else if (successRate < 70) {
                        execColor = '#f97316';
                        execGlow = 'rgba(249,115,22,0.25)';
                      } else if (successRate < 90) {
                        execColor = '#f59e0b';
                        execGlow = 'rgba(245,158,11,0.25)';
                      }

                      return (
                        <div
                          key={test.id}
                          className="group relative flex items-center justify-between p-4 rounded-xl overflow-hidden transition-all duration-300 hover:scale-[1.01] hover:translate-x-1"
                          style={{
                            animation: `card-enter 0.4s cubic-bezier(0.22,1,0.36,1) ${index * 60}ms both`,
                            background: 'rgba(255,255,255,0.95)',
                            border: `1.5px solid ${execColor}25`,
                            boxShadow: `0 3px 12px ${execGlow}`,
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.boxShadow = `0 8px 24px ${execGlow}, 0 0 0 1.5px ${execColor}40`;
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.boxShadow = `0 3px 12px ${execGlow}`;
                          }}
                        >
                          {/* Decorative blob */}
                          <div
                            className="absolute -top-8 -right-8 w-24 h-24 rounded-full opacity-10 transition-opacity duration-300 group-hover:opacity-20"
                            style={{ background: `radial-gradient(circle, ${execColor}, transparent 70%)` }}
                          />

                          <div className="flex items-center space-x-4 relative">
                            {isRunning ? (
                              <div
                                className="relative w-10 h-10 rounded-xl flex items-center justify-center"
                                style={{ background: `${execColor}15` }}
                              >
                                <RefreshCw className="w-5 h-5 animate-spin" style={{ color: execColor }} />
                              </div>
                            ) : (
                              <div
                                className="relative w-10 h-10 rounded-xl flex items-center justify-center"
                                style={{ background: `${execColor}15` }}
                              >
                                {successRate >= 90 ? (
                                  <Sun className="w-5 h-5" style={{ color: execColor }} strokeWidth={2} />
                                ) : successRate >= 70 ? (
                                  <BarChart3 className="w-5 h-5" style={{ color: execColor }} strokeWidth={2} />
                                ) : successRate >= 50 ? (
                                  <XCircle className="w-5 h-5" style={{ color: execColor }} strokeWidth={2} />
                                ) : (
                                  <XCircle className="w-5 h-5" style={{ color: execColor }} strokeWidth={2} />
                                )}
                              </div>
                            )}
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-bold text-gray-900 text-sm">
                                  {test.name}
                                </h3>
                                {isRunning && (
                                  <span
                                    className="px-2 py-0.5 text-xs font-bold rounded-full"
                                    style={{ background: `${execColor}20`, color: execColor }}
                                  >
                                    En cours
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-gray-500 mt-0.5">
                                {test.branch} • {new Date(test.timestamp).toLocaleString('fr-FR')}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center space-x-5 relative">
                            {isRunning ? (
                              <div className="text-center">
                                <div className="flex items-center space-x-1.5">
                                  {[0, 0.2, 0.4].map((d, i) => (
                                    <div
                                      key={i}
                                      className="w-2 h-2 rounded-full animate-pulse"
                                      style={{ background: execColor, animationDelay: `${d}s` }}
                                    />
                                  ))}
                                </div>
                                <p className="text-xs text-gray-500 mt-1">En cours</p>
                              </div>
                            ) : totalTests > 0 ? (
                              <div className="text-center min-w-[60px]">
                                <p className="text-xl font-extrabold" style={{ color: execColor }}>
                                  {Math.round(successRate)}%
                                </p>
                                <p className="text-[10px] text-gray-500">Réussite</p>
                              </div>
                            ) : null}

                            {!isRunning && (
                              <div className="flex items-center space-x-3">
                                <div className="text-center">
                                  <div className="flex items-center space-x-1">
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                    <span className="text-base font-bold text-green-600 tabular-nums">{successCount}</span>
                                  </div>
                                  <p className="text-[10px] text-gray-500">Réussis</p>
                                </div>
                                <div className="text-center">
                                  <div className="flex items-center space-x-1">
                                    <XCircle className="w-4 h-4 text-red-500" />
                                    <span className="text-base font-bold text-red-600 tabular-nums">{failureCount}</span>
                                  </div>
                                  <p className="text-[10px] text-gray-500">Échecs</p>
                                </div>
                                <div className="text-center">
                                  <p className="text-base font-bold text-gray-900 tabular-nums">{totalTests}</p>
                                  <p className="text-[10px] text-gray-500">Total</p>
                                </div>
                              </div>
                            )}

                            <button
                              onClick={() => handleViewTestDetails(test)}
                              className="px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105"
                              style={{
                                background: execColor,
                                color: 'white',
                                boxShadow: `0 2px 8px ${execGlow}`,
                              }}
                            >
                              Voir détails
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}

              {/* Button to load more executions */}
              {(() => {
                const allFilteredTests = tests
                  .filter(test => test.environment?.toLowerCase() === currentEnvironment.toLowerCase())
                  .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

                const hasMoreExecutions = allFilteredTests.length > visibleExecutionsCount;

                return hasMoreExecutions && (
                  <div className="flex justify-center mt-5">
                    <button
                      onClick={() => setVisibleExecutionsCount(prev => prev + 10)}
                      className="px-5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 hover:scale-105"
                      style={{
                        background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
                        color: 'white',
                        boxShadow: '0 4px 14px rgba(59,130,246,0.3)',
                      }}
                    >
                      Voir plus d'exécutions ({allFilteredTests.length - visibleExecutionsCount} restantes)
                    </button>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Running Tests Banner */}
          {(() => {
            const runningTests = tests.filter(test => 
              test.environment?.toLowerCase() === currentEnvironment.toLowerCase() && 
              (test.status === 'running' || test.status === 'pending')
            );
            
            if (runningTests.length === 0) return null;
            
            return (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-100 border border-blue-200 rounded-lg p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="relative w-16 h-16">
                      <style>{`
                        @keyframes search-bugs {
                          0%, 100% { transform: translate(0, 0) rotate(0deg); }
                          25% { transform: translate(8px, -4px) rotate(5deg); }
                          50% { transform: translate(4px, 8px) rotate(-5deg); }
                          75% { transform: translate(-4px, 4px) rotate(3deg); }
                        }
                        @keyframes bug-appear {
                          0%, 40% { opacity: 0; transform: scale(0.5) rotate(0deg); }
                          50%, 90% { opacity: 1; transform: scale(1) rotate(15deg); }
                          100% { opacity: 0; transform: scale(0.5) rotate(30deg); }
                        }
                        @keyframes screen-glow {
                          0%, 100% { opacity: 0.6; }
                          50% { opacity: 1; }
                        }
                      `}</style>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Monitor className="w-14 h-14 text-gray-700" strokeWidth={1.5} />
                        <div className="absolute overflow-hidden" style={{ top: '20%', left: '20%', width: '60%', height: '46%' }}>
                          <div className="w-full h-full bg-gradient-to-b from-blue-50 to-blue-100 rounded-sm overflow-hidden" style={{ animation: 'screen-glow 2s ease-in-out infinite' }}>
                            <div className="w-full h-1 bg-blue-600"></div>
                            <div className="flex gap-0.5 px-0.5 py-0.5">
                              <div className="w-1 h-1 bg-blue-400"></div>
                              <div className="w-1.5 h-1 bg-blue-300"></div>
                            </div>
                            <div className="px-0.5 space-y-0.5">
                              <div className="w-full h-0.5 bg-gray-300"></div>
                              <div className="w-3/4 h-0.5 bg-gray-300"></div>
                              <div className="w-full h-2 bg-blue-200 mt-0.5"></div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center" style={{ top: '-2px' }}>
                        <div style={{ animation: 'search-bugs 3s ease-in-out infinite' }}>
                          <Search className="w-5 h-5 text-blue-600" strokeWidth={2.5} />
                        </div>
                      </div>
                      <div className="absolute top-0 right-0">
                        <Bug className="w-4 h-4 text-red-500" style={{ animation: 'bug-appear 3s ease-in-out infinite' }} />
                      </div>
                      <div className="absolute bottom-2 left-0">
                        <Bug className="w-3 h-3 text-orange-500" style={{ animation: 'bug-appear 3s ease-in-out infinite 1s' }} />
                      </div>
                    </div>
                    <h2 className="text-lg font-semibold text-blue-900">
                      Tests en cours d'exécution ({runningTests.length})
                    </h2>
                  </div>
                  <button
                    onClick={() => fetchTests(true)}
                    className="flex items-center space-x-2 px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Actualiser</span>
                  </button>
                </div>
                
                <div className="space-y-3">
                  {runningTests.map((test) => {
                    const startTime = new Date(test.timestamp);
                    const now = new Date();
                    const elapsedMinutes = Math.floor((now.getTime() - startTime.getTime()) / (1000 * 60));
                    
                    return (
                      <div key={test.id} className="bg-white bg-opacity-60 rounded-lg p-4 border border-blue-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className={`w-2 h-2 rounded-full animate-pulse ${
                              test.status === 'running' ? 'bg-blue-500' : 'bg-yellow-500'
                            }`}></div>
                            <div>
                              <h3 className="font-medium text-blue-900">{test.name}</h3>
                              <p className="text-sm text-blue-700">
                                {test.branch} • Démarré il y a {elapsedMinutes} minute{elapsedMinutes > 1 ? 's' : ''}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-4">
                            <div className="text-center">
                              <p className="text-sm font-medium text-blue-900 capitalize">
                                {test.status === 'running' ? 'En cours' : 'En attente'}
                              </p>
                              <p className="text-xs text-blue-600">
                                {startTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                            
                            <button
                              onClick={() => handleViewTestDetails(test)}
                              className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                            >
                              Voir détails
                            </button>
                          </div>
                        </div>
                        
                        {/* Progress bar animation */}
                        <div className="mt-3">
                          <div className="w-full bg-blue-200 rounded-full h-2">
                            <div className="bg-blue-500 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                <div className="mt-4 text-center">
                  <p className="text-sm text-blue-700">
                    💡 Les tests se rafraîchissent automatiquement. Cliquez sur "Actualiser" pour voir les derniers statuts.
                  </p>
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* Modals */}
      <TriggerTestModal
        isOpen={triggerModalOpen}
        onClose={() => setTriggerModalOpen(false)}
        onTrigger={handleTriggerTest}
        loading={triggerLoading}
        xrayConfig={xrayApi.config}
      />

      {selectedTest && (
        <TestResultModal
          isOpen={testResultModalOpen}
          onClose={() => {
            setTestResultModalOpen(false);
            setSelectedTest(null);
          }}
          test={selectedTest}
        />
      )}

      <PartnerTestsModal
        isOpen={partnerModalOpen}
        onClose={() => setPartnerModalOpen(false)}
        partner={selectedPartner}
        tests={partnerModalTests}
        onTrigger={(selectedTests, variables, eSignature) => {
          handleTriggerTest(selectedTests, variables, eSignature);
          setPartnerModalOpen(false);
        }}
        loading={triggerLoading}
      />

      <PartnerTestsModal
        isOpen={perimetreModalOpen}
        onClose={() => setPerimetreModalOpen(false)}
        partner={null}
        title={selectedPerimetre || undefined}
        tests={perimetreModalTests}
        onTrigger={(selectedTests, variables, eSignature) => {
          handleTriggerTest(selectedTests, variables, eSignature);
          setPerimetreModalOpen(false);
        }}
        loading={triggerLoading}
      />

      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Lock className="w-5 h-5 text-blue-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Accès à la configuration</h2>
              </div>
              <button
                onClick={() => { setShowPasswordModal(false); setPasswordInput(''); setPasswordError(false); }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="p-6">
              <p className="text-gray-600 mb-4">
                Cette section est protégée. Veuillez saisir le mot de passe pour continuer.
              </p>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => { setPasswordInput(e.target.value); setPasswordError(false); }}
                onKeyDown={(e) => { if (e.key === 'Enter') handlePasswordSubmit(); }}
                placeholder="Mot de passe"
                autoFocus
                className={`w-full px-4 py-3 border rounded-md focus:outline-none focus:ring-2 transition-colors ${
                  passwordError
                    ? 'border-red-300 focus:ring-red-400'
                    : 'border-gray-300 focus:ring-blue-500'
                }`}
              />
              {passwordError && (
                <p className="mt-2 text-sm text-red-600">Mot de passe incorrect. Veuillez réessayer.</p>
              )}
              <div className="flex items-center justify-end space-x-3 mt-6">
                <button
                  onClick={() => { setShowPasswordModal(false); setPasswordInput(''); setPasswordError(false); }}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handlePasswordSubmit}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Déverrouiller
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};