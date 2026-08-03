import React, { useState, useEffect, useRef } from 'react';
import { BarChart3, TrendingUp, Clock, CheckCircle, XCircle, Calendar, AlertCircle, Award, Users, Target, RefreshCw } from 'lucide-react';
import { TestResult } from '../types';
import { createClient } from '@supabase/supabase-js';
import { gitlabApi } from '../services/gitlabApi';

interface StatisticsPageProps {
  tests: TestResult[];
  currentEnvironment: 'ci' | 'sit' | 'prod';
}

interface RootCauseStats {
  rootCause: string;
  count: number;
  percentage: number;
  tests: Array<{ title: string; file: string; }>;
}

interface AnalystStats {
  analyst: string;
  count: number;
  percentage: number;
  recentAnalyses: Array<{ title: string; date: string; }>;
}

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export const StatisticsPage: React.FC<StatisticsPageProps> = ({ tests, currentEnvironment }) => {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [gitlabTests, setGitlabTests] = useState<TestResult[]>([]);
  const [loadingGitlab, setLoadingGitlab] = useState(false);
  const [filteredTests, setFilteredTests] = useState<TestResult[]>([]);
  const [rootCauseStats, setRootCauseStats] = useState<RootCauseStats[]>([]);
  const [loadingRootCauses, setLoadingRootCauses] = useState(false);
  const [analystStats, setAnalystStats] = useState<AnalystStats[]>([]);
  const [loadingAnalysts, setLoadingAnalysts] = useState(false);
  const [perimetreStats, setPerimetreStats] = useState<Record<string, { success: number; failure: number; total: number; tests: Array<{ title: string; passed: boolean }> }>>({});
  const [loadingPerimetreStats, setLoadingPerimetreStats] = useState(false);
  const loadedRangeRef = useRef<string | null>(null);

  // Load GitLab executions for the selected period
  useEffect(() => {
    const daysAgo = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    if (loadedRangeRef.current === timeRange) return;

    const load = async () => {
      setLoadingGitlab(true);
      try {
        const results = await gitlabApi.getTestResultsForPeriod(daysAgo);
        setGitlabTests(results);
        loadedRangeRef.current = timeRange;
      } catch (err) {
        console.error('Error loading GitLab tests for period:', err);
        // Fallback to the tests passed as props
        setGitlabTests(tests);
        loadedRangeRef.current = timeRange;
      } finally {
        setLoadingGitlab(false);
      }
    };
    load();
  }, [timeRange]);

  // Derive filteredTests from gitlabTests (or prop tests as fallback)
  useEffect(() => {
    const source = gitlabTests.length > 0 ? gitlabTests : tests;
    const now = new Date();
    const daysAgo = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    const cutoffDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

    const filtered = source.filter(test =>
      test.environment?.toLowerCase() === currentEnvironment.toLowerCase() &&
      new Date(test.timestamp) >= cutoffDate
    );
    setFilteredTests(filtered);
  }, [gitlabTests, tests, timeRange, currentEnvironment]);

  useEffect(() => {
    const loadRootCauses = async () => {
      setLoadingRootCauses(true);
      try {
        const now = new Date();
        const daysAgo = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
        const cutoffDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

        const { data, error } = await supabase
          .from('test_failure_analyses')
          .select('root_cause, test_title, test_file, created_at')
          .gte('created_at', cutoffDate.toISOString())
          .neq('root_cause', '');

        if (error) {
          console.error('Error loading root causes:', error);
          setRootCauseStats([]);
          return;
        }

        const grouped = data.reduce((acc, item) => {
          const rootCause = item.root_cause || 'Non spécifiée';
          if (!acc[rootCause]) {
            acc[rootCause] = {
              rootCause,
              count: 0,
              tests: [],
            };
          }
          acc[rootCause].count++;
          acc[rootCause].tests.push({
            title: item.test_title,
            file: item.test_file,
          });
          return acc;
        }, {} as Record<string, Omit<RootCauseStats, 'percentage'>>);

        const totalCount = data.length;
        const statsArray = Object.values(grouped)
          .map(stat => ({
            ...stat,
            percentage: totalCount > 0 ? (stat.count / totalCount) * 100 : 0,
            tests: stat.tests.slice(0, 5),
          }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10);

        setRootCauseStats(statsArray);
      } catch (err) {
        console.error('Error loading root causes:', err);
        setRootCauseStats([]);
      } finally {
        setLoadingRootCauses(false);
      }
    };

    loadRootCauses();
  }, [timeRange]);

  useEffect(() => {
    const loadAnalysts = async () => {
      setLoadingAnalysts(true);
      try {
        const now = new Date();
        const daysAgo = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
        const cutoffDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

        const { data, error } = await supabase
          .from('test_failure_analyses')
          .select('created_by, test_title, created_at')
          .gte('created_at', cutoffDate.toISOString())
          .neq('created_by', 'anonymous');

        if (error) {
          console.error('Error loading analysts:', error);
          setAnalystStats([]);
          return;
        }

        const grouped = data.reduce((acc, item) => {
          const analyst = item.created_by || 'Anonyme';
          if (!acc[analyst]) {
            acc[analyst] = {
              analyst,
              count: 0,
              recentAnalyses: [],
            };
          }
          acc[analyst].count++;
          acc[analyst].recentAnalyses.push({
            title: item.test_title,
            date: new Date(item.created_at).toLocaleDateString('fr-FR'),
          });
          return acc;
        }, {} as Record<string, Omit<AnalystStats, 'percentage'>>);

        const totalCount = data.length;
        const statsArray = Object.values(grouped)
          .map(stat => ({
            ...stat,
            percentage: totalCount > 0 ? (stat.count / totalCount) * 100 : 0,
            recentAnalyses: stat.recentAnalyses
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .slice(0, 3),
          }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10);

        setAnalystStats(statsArray);
      } catch (err) {
        console.error('Error loading analysts:', err);
        setAnalystStats([]);
      } finally {
        setLoadingAnalysts(false);
      }
    };

    loadAnalysts();
  }, [timeRange]);

  useEffect(() => {
    const loadPerimetreStats = async () => {
      // Use already-filtered tests (already scoped to env + period)
      const testsWithJobs = filteredTests.filter(test => test.jobId);

      if (testsWithJobs.length === 0) {
        setPerimetreStats({});
        return;
      }

      setLoadingPerimetreStats(true);
      try {
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

        for (const test of testsWithJobs) {
          try {
            const reportContent = await gitlabApi.getJobArtifactFile(test.jobId, 'subscription-essential-e2e/test-results-merged.json');
            const report = JSON.parse(reportContent);
            processTests(report.suites || []);
          } catch (err) {
            console.error(`Error loading report for job ${test.jobId}:`, err);
          }
        }

        setPerimetreStats(stats);
      } catch (err) {
        console.error('Error loading perimetre stats:', err);
        setPerimetreStats({});
      } finally {
        setLoadingPerimetreStats(false);
      }
    };

    loadPerimetreStats();
  }, [filteredTests]);

  const calculateStats = () => {
    if (filteredTests.length === 0) {
      return {
        averageDuration: 0,
        totalTests: 0,
        successRate: 0,
        totalSuccesses: 0,
        totalFailures: 0,
        averageSuccessCount: 0,
        averageFailureCount: 0,
        executionsByDay: [],
        successRateByDay: []
      };
    }

    const totalDuration = filteredTests.reduce((sum, test) => sum + test.duration, 0);
    const averageDuration = totalDuration / filteredTests.length;
    
    const totalSuccesses = filteredTests.reduce((sum, test) => sum + (test.successCount || 0), 0);
    const totalFailures = filteredTests.reduce((sum, test) => sum + (test.failureCount || 0), 0);
    const totalTestCount = totalSuccesses + totalFailures;

    const successRate = totalTestCount > 0 ? (totalSuccesses / totalTestCount) * 100 : 0;
    
    const averageSuccessCount = totalSuccesses / filteredTests.length;
    const averageFailureCount = totalFailures / filteredTests.length;

    // Group by day for charts
    const executionsByDay = groupByDay(filteredTests);
    const successRateByDay = calculateSuccessRateByDay(filteredTests);

    return {
      averageDuration,
      totalTests: filteredTests.length,
      successRate,
      totalSuccesses,
      totalFailures,
      averageSuccessCount,
      averageFailureCount,
      executionsByDay,
      successRateByDay
    };
  };

  const groupByDay = (tests: TestResult[]) => {
    const grouped: { [key: string]: number } = {};
    
    tests.forEach(test => {
      const date = new Date(test.timestamp).toLocaleDateString('fr-FR');
      grouped[date] = (grouped[date] || 0) + 1;
    });

    return Object.entries(grouped)
      .sort(([a], [b]) => new Date(a.split('/').reverse().join('-')).getTime() - new Date(b.split('/').reverse().join('-')).getTime())
      .slice(-7); // Last 7 days
  };

  const calculateSuccessRateByDay = (tests: TestResult[]) => {
    const grouped: { [key: string]: { successes: number; total: number } } = {};
    
    tests.forEach(test => {
      const date = new Date(test.timestamp).toLocaleDateString('fr-FR');
      if (!grouped[date]) {
        grouped[date] = { successes: 0, total: 0 };
      }
      grouped[date].successes += test.successCount || 0;
      grouped[date].total += (test.successCount || 0) + (test.failureCount || 0);
    });

    return Object.entries(grouped)
      .map(([date, data]) => ({
        date,
        rate: data.total > 0 ? (data.successes / data.total) * 100 : 0
      }))
      .sort((a, b) => new Date(a.date.split('/').reverse().join('-')).getTime() - new Date(b.date.split('/').reverse().join('-')).getTime())
      .slice(-7); // Last 7 days
  };

  const formatDuration = (seconds: number) => {
    const roundedSeconds = Math.floor(seconds);
    if (roundedSeconds < 60) return `${roundedSeconds}s`;
    const minutes = Math.floor(roundedSeconds / 60);
    const remainingSeconds = roundedSeconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const stats = calculateStats();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Statistiques</h1>
              <p className="text-gray-600">Analyse des performances des tests</p>
            </div>
            <div className="flex items-center space-x-3">
              {loadingGitlab && (
                <div className="flex items-center space-x-2 text-sm text-blue-600">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Chargement des exécutions...</span>
                </div>
              )}
              <div className="flex space-x-2">
                {(['7d', '30d', '90d'] as const).map((range) => (
                  <button
                    key={range}
                    onClick={() => {
                      loadedRangeRef.current = null;
                      setTimeRange(range);
                    }}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      timeRange === range
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {range === '7d' ? '7 jours' : range === '30d' ? '30 jours' : '90 jours'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Main Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Durée moyenne</p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatDuration(stats.averageDuration)}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Taux de réussite</p>
                <p className="text-2xl font-bold text-green-600">
                  {stats.successRate.toFixed(1)}%
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total exécutions</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalTests}</p>
              </div>
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-gray-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Tests par exécution</p>
                <p className="text-2xl font-bold text-purple-600">
                  {Math.round(stats.averageSuccessCount + stats.averageFailureCount)}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <Calendar className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Résultats des tests</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-gray-700">Tests réussis</span>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold text-green-600">{stats.totalSuccesses}</p>
                  <p className="text-sm text-gray-500">
                    {stats.averageSuccessCount.toFixed(1)} par exécution
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <XCircle className="w-5 h-5 text-red-500" />
                  <span className="text-gray-700">Tests échoués</span>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold text-red-600">{stats.totalFailures}</p>
                  <p className="text-sm text-gray-500">
                    {stats.averageFailureCount.toFixed(1)} par exécution
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Exécutions par jour (7 derniers jours)</h3>
            <div className="space-y-3">
              {stats.executionsByDay.length > 0 ? (
                stats.executionsByDay.map(([date, count]) => (
                  <div key={date} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{date}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{
                            width: `${Math.min((count / Math.max(...stats.executionsByDay.map(([, c]) => c))) * 100, 100)}%`
                          }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-900 w-8 text-right">{count}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">
                  Aucune donnée disponible pour cette période
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Perimetre Statistics Section */}
        <div className="bg-white p-6 rounded-lg shadow-sm border mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Target className="w-5 h-5 text-blue-500" />
              <h3 className="text-lg font-semibold text-gray-900">Statistiques par périmètre</h3>
            </div>
            {loadingPerimetreStats && (
              <span className="text-sm text-gray-500">Chargement...</span>
            )}
          </div>

          {Object.keys(perimetreStats).length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(perimetreStats)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([perimetre, stats]) => {
                  const successRate = stats.total > 0 ? (stats.success / stats.total) * 100 : 0;

                  return (
                    <div
                      key={perimetre}
                      className={`rounded-lg border-2 p-4 ${
                        successRate >= 90
                          ? 'bg-green-50 border-green-300'
                          : successRate >= 70
                          ? 'bg-yellow-50 border-yellow-300'
                          : 'bg-red-50 border-red-300'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-gray-900">{perimetre}</h3>
                        <div
                          className={`w-6 h-6 rounded-full shadow-inner ${
                            successRate >= 90
                              ? 'bg-green-500'
                              : successRate >= 70
                              ? 'bg-orange-500'
                              : 'bg-red-500'
                          }`}
                          style={{
                            boxShadow: successRate >= 90
                              ? 'inset 0 2px 4px rgba(0,0,0,0.2), 0 0 8px rgba(34,197,94,0.6)'
                              : successRate >= 70
                              ? 'inset 0 2px 4px rgba(0,0,0,0.2), 0 0 8px rgba(249,115,22,0.6)'
                              : 'inset 0 2px 4px rgba(0,0,0,0.2), 0 0 8px rgba(239,68,68,0.6)'
                          }}
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Taux de réussite</span>
                          <span className="font-bold text-lg">{Math.round(successRate)}%</span>
                        </div>

                        <div className="flex justify-between text-sm">
                          <span className="text-green-700">✓ Réussis</span>
                          <span className="font-semibold">{stats.success}</span>
                        </div>

                        <div className="flex justify-between text-sm">
                          <span className="text-red-700">✗ Échecs</span>
                          <span className="font-semibold">{stats.failure}</span>
                        </div>

                        <div className="flex justify-between text-sm border-t pt-2">
                          <span className="text-gray-700 font-medium">Total</span>
                          <span className="font-semibold">{stats.total}</span>
                        </div>

                        {stats.tests.length > 0 && (
                          <div className="border-t pt-2 mt-1 space-y-1">
                            {stats.tests.map((t, idx) => (
                              <div key={idx} className="flex items-center justify-between gap-2">
                                <span className="text-xs text-gray-700 truncate flex-1">{t.title}</span>
                                {t.passed ? (
                                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                                ) : (
                                  <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          ) : (
            <div className="text-center py-8">
              <Target className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">
                {loadingPerimetreStats
                  ? 'Chargement des données...'
                  : 'Aucune donnée disponible pour cet environnement'}
              </p>
            </div>
          )}
        </div>

        {/* Root Causes Section */}
        <div className="bg-white p-6 rounded-lg shadow-sm border mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <h3 className="text-lg font-semibold text-gray-900">Principales causes d'échecs</h3>
            </div>
            {loadingRootCauses && (
              <span className="text-sm text-gray-500">Chargement...</span>
            )}
          </div>

          {rootCauseStats.length > 0 ? (
            <div className="space-y-4">
              {rootCauseStats.map((stat, index) => (
                <div key={stat.rootCause} className="border-b border-gray-200 pb-4 last:border-b-0">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-100 text-red-700 text-xs font-semibold">
                          {index + 1}
                        </span>
                        <h4 className="text-sm font-semibold text-gray-900">{stat.rootCause}</h4>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-600 ml-8">
                        <span>{stat.count} occurrence{stat.count > 1 ? 's' : ''}</span>
                        <span className="text-red-600 font-medium">{stat.percentage.toFixed(1)}%</span>
                      </div>
                    </div>
                    <div className="w-32 bg-gray-200 rounded-full h-2 mt-2">
                      <div
                        className="bg-red-500 h-2 rounded-full"
                        style={{ width: `${stat.percentage}%` }}
                      ></div>
                    </div>
                  </div>

                  {stat.tests.length > 0 && (
                    <div className="ml-8 mt-2 space-y-1">
                      <p className="text-xs text-gray-500 mb-1">Tests affectés:</p>
                      {stat.tests.map((test, idx) => (
                        <div key={idx} className="text-xs text-gray-600 truncate">
                          <span className="font-medium">{test.title}</span>
                          <span className="text-gray-400 ml-1">({test.file})</span>
                        </div>
                      ))}
                      {stat.count > stat.tests.length && (
                        <p className="text-xs text-gray-400 italic">
                          ... et {stat.count - stat.tests.length} autre{stat.count - stat.tests.length > 1 ? 's' : ''}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">
                {loadingRootCauses
                  ? 'Chargement des données...'
                  : 'Aucune analyse d\'échec disponible pour cette période'}
              </p>
            </div>
          )}
        </div>

        {/* Top Analysts Section */}
        <div className="bg-white p-6 rounded-lg shadow-sm border mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Award className="w-5 h-5 text-yellow-500" />
              <h3 className="text-lg font-semibold text-gray-900">Top QA</h3>
            </div>
            {loadingAnalysts && (
              <span className="text-sm text-gray-500">Chargement...</span>
            )}
          </div>

          {analystStats.length > 0 ? (
            <div className="space-y-4">
              {analystStats.map((stat, index) => (
                <div key={stat.analyst} className="border-b border-gray-200 pb-4 last:border-b-0">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        {index < 3 ? (
                          <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-bold ${
                            index === 0
                              ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-white shadow-lg'
                              : index === 1
                              ? 'bg-gradient-to-br from-gray-300 to-gray-500 text-white shadow-md'
                              : 'bg-gradient-to-br from-amber-600 to-amber-800 text-white shadow-md'
                          }`}>
                            {index + 1}
                          </span>
                        ) : (
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 text-blue-700 text-sm font-semibold">
                            {index + 1}
                          </span>
                        )}
                        <Users className="w-4 h-4 text-gray-400" />
                        <h4 className="text-sm font-semibold text-gray-900">{stat.analyst}</h4>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-600 ml-9">
                        <span>{stat.count} analyse{stat.count > 1 ? 's' : ''}</span>
                        <span className="text-blue-600 font-medium">{stat.percentage.toFixed(1)}%</span>
                      </div>
                    </div>
                    <div className="w-32 bg-gray-200 rounded-full h-2 mt-2">
                      <div
                        className={`h-2 rounded-full ${
                          index === 0
                            ? 'bg-gradient-to-r from-yellow-400 to-yellow-600'
                            : index === 1
                            ? 'bg-gradient-to-r from-gray-400 to-gray-600'
                            : index === 2
                            ? 'bg-gradient-to-r from-amber-600 to-amber-800'
                            : 'bg-blue-500'
                        }`}
                        style={{ width: `${stat.percentage}%` }}
                      ></div>
                    </div>
                  </div>

                  {stat.recentAnalyses.length > 0 && (
                    <div className="ml-9 mt-2 space-y-1">
                      <p className="text-xs text-gray-500 mb-1">Analyses récentes:</p>
                      {stat.recentAnalyses.map((analysis, idx) => (
                        <div key={idx} className="text-xs text-gray-600 flex items-center space-x-2">
                          <span className="text-gray-400">{analysis.date}</span>
                          <span className="font-medium truncate">{analysis.title}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">
                {loadingAnalysts
                  ? 'Chargement des données...'
                  : 'Aucune analyse disponible pour cette période'}
              </p>
            </div>
          )}
        </div>

        {/* Executions List */}
        <div className="bg-white rounded-lg shadow-sm border mb-8">
          <div className="flex items-center justify-between p-6 border-b">
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-blue-500" />
              <h3 className="text-lg font-semibold text-gray-900">Liste des exécutions</h3>
              <span className="ml-2 px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-700">
                {filteredTests.length}
              </span>
            </div>
          </div>

          {filteredTests.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Branche</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Statut</th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Réussis</th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Échecs</th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Taux</th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Durée</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {[...filteredTests]
                    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                    .map((test) => {
                      const total = (test.successCount || 0) + (test.failureCount || 0);
                      const rate = total > 0 ? ((test.successCount || 0) / total) * 100 : null;
                      return (
                        <tr key={test.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-3 text-gray-700 whitespace-nowrap">
                            {new Date(test.timestamp).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                            <span className="ml-2 text-gray-400 text-xs">
                              {new Date(test.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </td>
                          <td className="px-6 py-3 text-gray-600 font-mono text-xs">{test.branch}</td>
                          <td className="px-6 py-3">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              test.status === 'success'
                                ? 'bg-green-100 text-green-700'
                                : test.status === 'failed'
                                ? 'bg-red-100 text-red-700'
                                : test.status === 'running'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-gray-100 text-gray-600'
                            }`}>
                              {test.status === 'success' ? 'Réussi' : test.status === 'failed' ? 'Échoué' : test.status === 'running' ? 'En cours' : 'En attente'}
                            </span>
                          </td>
                          <td className="px-6 py-3 text-right text-green-600 font-semibold">{test.successCount ?? '—'}</td>
                          <td className="px-6 py-3 text-right text-red-500 font-semibold">{test.failureCount ?? '—'}</td>
                          <td className="px-6 py-3 text-right font-semibold">
                            {rate !== null ? (
                              <span className={rate >= 90 ? 'text-green-600' : rate >= 70 ? 'text-yellow-600' : 'text-red-500'}>
                                {rate.toFixed(0)}%
                              </span>
                            ) : '—'}
                          </td>
                          <td className="px-6 py-3 text-right text-gray-500">{formatDuration(test.duration)}</td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-10">
              <BarChart3 className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">
                {loadingGitlab ? 'Chargement des exécutions...' : 'Aucune exécution pour cette période'}
              </p>
            </div>
          )}
        </div>

        {/* Success Rate Trend */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Évolution du taux de réussite (7 derniers jours)</h3>
          <div className="space-y-3">
            {stats.successRateByDay.length > 0 ? (
              stats.successRateByDay.map(({ date, rate }) => (
                <div key={date} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{date}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          rate >= 80 ? 'bg-green-500' : rate >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${rate}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900 w-12 text-right">
                      {rate.toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">
                Aucune donnée disponible pour cette période
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};