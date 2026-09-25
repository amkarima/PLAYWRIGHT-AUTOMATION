import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  BarChart3, TrendingUp, Clock, CheckCircle, XCircle, Calendar,
  AlertCircle, Award, Users, Target, RefreshCw, Zap, Activity,
  Gauge, Trophy, ChevronRight,
} from 'lucide-react';
import { TestResult } from '../types';
import { createClient } from '@supabase/supabase-js';
import { gitlabApi } from '../services/gitlabApi';
import {
  getPartnerLogo, getPartnerColor, detectPartnerFromText, Partner,
} from '../utils/partnerLogos';

interface StatisticsPageProps {
  tests: TestResult[];
  currentEnvironment: 'ci' | 'sit' | 'prod';
}

interface RootCauseStats {
  rootCause: string;
  count: number;
  percentage: number;
  tests: Array<{ title: string; file: string }>;
}

interface AnalystStats {
  analyst: string;
  count: number;
  percentage: number;
  recentAnalyses: Array<{ title: string; date: string }>;
}

interface PartnerAgg {
  partner: Partner;
  success: number;
  failure: number;
  total: number;
  perimetres: Set<string>;
  tests: Array<{ title: string; passed: boolean }>;
}

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// ─── Helpers ────────────────────────────────────────────────────────────────
const formatDuration = (seconds: number) => {
  const rounded = Math.floor(seconds);
  if (rounded < 60) return `${rounded}s`;
  const m = Math.floor(rounded / 60);
  const s = rounded % 60;
  return `${m}m ${s}s`;
};

const colorForRate = (rate: number) => {
  if (rate >= 90) return { ring: '#22c55e', text: 'text-green-600', glow: 'rgba(34,197,94,0.25)', bg: 'bg-green-50', border: 'border-green-200' };
  if (rate >= 70) return { ring: '#f97316', text: 'text-orange-600', glow: 'rgba(249,115,22,0.25)', bg: 'bg-orange-50', border: 'border-orange-200' };
  return { ring: '#ef4444', text: 'text-red-600', glow: 'rgba(239,68,68,0.25)', bg: 'bg-red-50', border: 'border-red-200' };
};

// ─── Animated count-up hook ─────────────────────────────────────────────────
function useCountUp(target: number, duration = 900) {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number>(0);
  useEffect(() => {
    if (target === 0) { setValue(0); return; }
    const start = performance.now();
    const animate = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      setValue(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration]);
  return value;
}

// ─── Progress ring ──────────────────────────────────────────────────────────
const ProgressRing: React.FC<{ pct: number; size?: number; stroke?: number; color: string; delay?: number }> = ({
  pct, size = 72, stroke = 6, color, delay = 0,
}) => {
  const [animated, setAnimated] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setAnimated(pct), delay + 100);
    return () => clearTimeout(t);
  }, [pct, delay]);
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeLinecap="round" strokeDasharray={c}
          strokeDashoffset={c - (animated / 100) * c}
          style={{ transition: 'stroke-dashoffset 1.1s cubic-bezier(0.22,1,0.36,1)', filter: `drop-shadow(0 0 4px ${color}40)` }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-base font-bold text-gray-900">{Math.round(pct)}%</span>
      </div>
    </div>
  );
};

// ─── Split bar ──────────────────────────────────────────────────────────────
const SplitBar: React.FC<{ success: number; failure: number; delay: number }> = ({ success, failure, delay }) => {
  const total = success + failure;
  const sPct = total > 0 ? (success / total) * 100 : 0;
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), delay + 200);
    return () => clearTimeout(t);
  }, [delay]);
  return (
    <div className="w-full h-2.5 rounded-full bg-gray-200 overflow-hidden flex">
      <div className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-l-full"
        style={{ width: mounted ? `${sPct}%` : '0%', transition: 'width 0.9s cubic-bezier(0.22,1,0.36,1)' }} />
      <div className="h-full bg-gradient-to-r from-red-400 to-red-600 rounded-r-full"
        style={{ width: mounted ? `${100 - sPct}%` : '0%', transition: 'width 0.9s cubic-bezier(0.22,1,0.36,1) 0.1s' }} />
    </div>
  );
};

// ─── Stat card (KPI) ────────────────────────────────────────────────────────
interface KpiProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  gradient: string;
  delay: number;
}
const KpiCard: React.FC<KpiProps> = ({ label, value, icon, gradient, delay }) => {
  const numericValue = typeof value === 'number' ? value : parseFloat(value);
  const isNumeric = !isNaN(numericValue) && typeof value === 'number';
  const animatedVal = useCountUp(isNumeric ? numericValue : 0);
  return (
    <div
      className="relative rounded-2xl p-5 overflow-hidden bg-white shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
      style={{ animation: `card-enter 0.5s cubic-bezier(0.22,1,0.36,1) ${delay}ms both` }}
    >
      <div className={`absolute -top-8 -right-8 w-28 h-28 rounded-full opacity-10 ${gradient}`} />
      <div className="flex items-start justify-between relative">
        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">{label}</p>
          <p className="text-2xl font-bold text-gray-900">
            {isNumeric ? animatedVal : value}
          </p>
        </div>
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${gradient} bg-opacity-15`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

// ─── Partner card ───────────────────────────────────────────────────────────
interface PartnerCardProps {
  agg: PartnerAgg;
  delay: number;
  onClick: () => void;
}
const PartnerStatCard: React.FC<PartnerCardProps> = ({ agg, delay, onClick }) => {
  const rate = agg.total > 0 ? (agg.success / agg.total) * 100 : 0;
  const c = colorForRate(rate);
  const logo = getPartnerLogo(agg.partner);
  const partnerColor = getPartnerColor(agg.partner);
  const sCount = useCountUp(agg.success);
  const fCount = useCountUp(agg.failure);
  const tCount = useCountUp(agg.total);

  return (
    <div
      onClick={onClick}
      className="group relative rounded-2xl p-5 cursor-pointer overflow-hidden transition-all duration-300 hover:scale-[1.03] hover:-translate-y-1 bg-white"
      style={{
        animation: `card-enter 0.5s cubic-bezier(0.22,1,0.36,1) ${delay}ms both`,
        border: `1.5px solid ${c.ring}30`,
        boxShadow: `0 4px 16px ${c.glow}`,
      }}
      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = `0 12px 32px ${c.glow}, 0 0 0 1.5px ${c.ring}50`; }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = `0 4px 16px ${c.glow}`; }}
    >
      <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full opacity-10 transition-opacity group-hover:opacity-20"
        style={{ background: `radial-gradient(circle, ${partnerColor}, transparent 70%)` }} />

      <div className="flex items-start justify-between mb-4 relative">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0 border border-gray-200 bg-white shadow-sm"
            style={logo?.bgColor ? { backgroundColor: logo.bgColor } : undefined}>
            {logo && <img src={logo.src} alt={logo.alt} className="w-full h-full object-contain" style={{ padding: '3px' }} />}
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-sm capitalize">{agg.partner}</h3>
            <p className="text-xs text-gray-500">{agg.perimetres.size} périmètre{agg.perimetres.size > 1 ? 's' : ''}</p>
          </div>
        </div>
        <ProgressRing pct={rate} size={60} stroke={5} color={c.ring} delay={delay} />
      </div>

      <div className="space-y-1.5 mb-3">
        <div className="flex justify-between text-sm items-center">
          <span className="flex items-center gap-1.5 text-green-700 font-medium">
            <CheckCircle className="w-4 h-4" /> Réussis
          </span>
          <span className="font-bold text-gray-900 tabular-nums">{sCount}</span>
        </div>
        <div className="flex justify-between text-sm items-center">
          <span className="flex items-center gap-1.5 text-red-700 font-medium">
            <XCircle className="w-4 h-4" /> Échecs
          </span>
          <span className="font-bold text-gray-900 tabular-nums">{fCount}</span>
        </div>
        <div className="flex justify-between text-sm items-center pt-1.5 border-t border-gray-100">
          <span className="text-gray-700 font-bold">Total</span>
          <span className="font-bold text-gray-900 tabular-nums">{tCount}</span>
        </div>
      </div>

      <SplitBar success={agg.success} failure={agg.failure} delay={delay} />

      <div className="pt-3 border-t border-gray-100 mt-3 flex flex-wrap gap-1">
        {Array.from(agg.perimetres).sort().slice(0, 4).map((p) => (
          <span key={p} className="inline-block text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{p}</span>
        ))}
        {agg.perimetres.size > 4 && (
          <span className="inline-block text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
            +{agg.perimetres.size - 4}
          </span>
        )}
      </div>

      <div className="mt-3 pt-2 flex items-center justify-center gap-1 text-xs text-gray-500 font-medium">
        <span>Voir les détails</span>
        <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
      </div>
    </div>
  );
};

// ─── Perimetre card ─────────────────────────────────────────────────────────
interface PerimCardProps {
  perimetre: string;
  success: number;
  failure: number;
  total: number;
  tests: Array<{ title: string; passed: boolean }>;
  delay: number;
}
const PerimetreStatCard: React.FC<PerimCardProps> = ({ perimetre, success, failure, total, tests, delay }) => {
  const rate = total > 0 ? (success / total) * 100 : 0;
  const c = colorForRate(rate);
  const sCount = useCountUp(success);
  const fCount = useCountUp(failure);
  const tCount = useCountUp(total);

  return (
    <div
      className="group relative rounded-2xl p-5 overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:-translate-y-0.5 bg-white"
      style={{
        animation: `card-enter 0.5s cubic-bezier(0.22,1,0.36,1) ${delay}ms both`,
        border: `1.5px solid ${c.ring}30`,
        boxShadow: `0 4px 16px ${c.glow}`,
      }}
    >
      <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full opacity-10 transition-opacity group-hover:opacity-20"
        style={{ background: `radial-gradient(circle, ${c.ring}, transparent 70%)` }} />

      <div className="flex items-start justify-between mb-4 relative">
        <h3 className="font-bold text-gray-900 text-sm pr-2">{perimetre}</h3>
        <ProgressRing pct={rate} size={60} stroke={5} color={c.ring} delay={delay} />
      </div>

      <div className="space-y-1.5 mb-3">
        <div className="flex justify-between text-sm items-center">
          <span className="flex items-center gap-1.5 text-green-700 font-medium">
            <CheckCircle className="w-4 h-4" /> Réussis
          </span>
          <span className="font-bold text-gray-900 tabular-nums">{sCount}</span>
        </div>
        <div className="flex justify-between text-sm items-center">
          <span className="flex items-center gap-1.5 text-red-700 font-medium">
            <XCircle className="w-4 h-4" /> Échecs
          </span>
          <span className="font-bold text-gray-900 tabular-nums">{fCount}</span>
        </div>
        <div className="flex justify-between text-sm items-center pt-1.5 border-t border-gray-100">
          <span className="text-gray-700 font-bold">Total</span>
          <span className="font-bold text-gray-900 tabular-nums">{tCount}</span>
        </div>
      </div>

      <SplitBar success={success} failure={failure} delay={delay} />

      {tests.length > 0 && (
        <div className="pt-3 border-t border-gray-100 mt-3 flex flex-wrap gap-1.5">
          {tests.slice(0, 8).map((t, idx) => {
            const partner = detectPartnerFromText(t.title);
            const logo = getPartnerLogo(partner);
            return (
              <div key={idx} className="relative cursor-default" title={t.title}
                style={{ animation: `fade-in 0.4s ease both ${delay + 300 + idx * 50}ms` }}>
                <div className="w-7 h-7 rounded-md bg-white border border-gray-200 flex items-center justify-center overflow-hidden shadow-sm">
                  {logo && <img src={logo.src} alt={logo.alt} className="w-6 h-6 object-contain" />}
                </div>
                <div className={`absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full flex items-center justify-center shadow ${t.passed ? 'bg-green-500' : 'bg-red-500'}`}>
                  {t.passed ? <CheckCircle className="w-2.5 h-2.5 text-white" /> : <XCircle className="w-2.5 h-2.5 text-white" />}
                </div>
              </div>
            );
          })}
          {tests.length > 8 && (
            <div className="w-7 h-7 rounded-md bg-gray-100 border border-gray-200 flex items-center justify-center text-xs font-bold text-gray-500">
              +{tests.length - 8}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Section wrapper ────────────────────────────────────────────────────────
const Section: React.FC<{
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  accent: string;
  badge?: string;
  children: React.ReactNode;
  delay?: number;
}> = ({ title, subtitle, icon, accent, badge, children, delay = 0 }) => (
  <div
    className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
    style={{ animation: `card-enter 0.5s cubic-bezier(0.22,1,0.36,1) ${delay}ms both` }}
  >
    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${accent}`}>
          {icon}
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
        </div>
      </div>
      {badge && (
        <span className={`px-3 py-1 text-sm font-semibold rounded-full ${accent} bg-opacity-15`}>
          {badge}
        </span>
      )}
    </div>
    <div className="p-6">{children}</div>
  </div>
);

// ─── Main component ─────────────────────────────────────────────────────────
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
  const [automationStats, setAutomationStats] = useState<{ total: number; automated: number; rate: number }>({ total: 0, automated: 0, rate: 0 });
  const [automationByType, setAutomationByType] = useState<Array<{ type: string; total: number; automated: number; rate: number }>>([]);
  const [automationByPartner, setAutomationByPartner] = useState<Array<{ partner: string; total: number; automated: number; rate: number }>>([]);
  const [loadingAutomation, setLoadingAutomation] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<PartnerAgg | null>(null);
  const loadedRangeRef = useRef<string | null>(null);

  // Load GitLab executions
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
        console.error('Error loading GitLab tests:', err);
        setGitlabTests(tests);
        loadedRangeRef.current = timeRange;
      } finally {
        setLoadingGitlab(false);
      }
    };
    load();
  }, [timeRange]);

  // Filter tests
  useEffect(() => {
    const source = gitlabTests.length > 0 ? gitlabTests : tests;
    const now = new Date();
    const daysAgo = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    const cutoff = new Date(now.getTime() - daysAgo * 86400000);
    setFilteredTests(source.filter(t =>
      t.environment?.toLowerCase() === currentEnvironment.toLowerCase() &&
      new Date(t.timestamp) >= cutoff
    ));
  }, [gitlabTests, tests, timeRange, currentEnvironment]);

  // Root causes
  useEffect(() => {
    const load = async () => {
      setLoadingRootCauses(true);
      try {
        const daysAgo = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
        const cutoff = new Date(Date.now() - daysAgo * 86400000);
        const { data, error } = await supabase
          .from('test_failure_analyses')
          .select('root_cause, test_title, test_file, created_at')
          .gte('created_at', cutoff.toISOString())
          .neq('root_cause', '');
        if (error) { setRootCauseStats([]); return; }
        const grouped = (data || []).reduce((acc, item) => {
          const rc = item.root_cause || 'Non spécifiée';
          if (!acc[rc]) acc[rc] = { rootCause: rc, count: 0, tests: [] };
          acc[rc].count++;
          acc[rc].tests.push({ title: item.test_title, file: item.test_file });
          return acc;
        }, {} as Record<string, Omit<RootCauseStats, 'percentage'>>);
        const total = (data || []).length;
        setRootCauseStats(Object.values(grouped)
          .map(s => ({ ...s, percentage: total > 0 ? (s.count / total) * 100 : 0, tests: s.tests.slice(0, 5) }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10));
      } catch { setRootCauseStats([]); }
      finally { setLoadingRootCauses(false); }
    };
    load();
  }, [timeRange]);

  // Analysts
  useEffect(() => {
    const load = async () => {
      setLoadingAnalysts(true);
      try {
        const daysAgo = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
        const cutoff = new Date(Date.now() - daysAgo * 86400000);
        const { data, error } = await supabase
          .from('test_failure_analyses')
          .select('created_by, test_title, created_at')
          .gte('created_at', cutoff.toISOString())
          .neq('created_by', 'anonymous');
        if (error) { setAnalystStats([]); return; }
        const grouped = (data || []).reduce((acc, item) => {
          const a = item.created_by || 'Anonyme';
          if (!acc[a]) acc[a] = { analyst: a, count: 0, recentAnalyses: [] };
          acc[a].count++;
          acc[a].recentAnalyses.push({ title: item.test_title, date: new Date(item.created_at).toLocaleDateString('fr-FR') });
          return acc;
        }, {} as Record<string, Omit<AnalystStats, 'percentage'>>);
        const total = (data || []).length;
        setAnalystStats(Object.values(grouped)
          .map(s => ({ ...s, percentage: total > 0 ? (s.count / total) * 100 : 0,
            recentAnalyses: s.recentAnalyses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 3) }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10));
      } catch { setAnalystStats([]); }
      finally { setLoadingAnalysts(false); }
    };
    load();
  }, [timeRange]);

  // Perimetre stats
  useEffect(() => {
    const load = async () => {
      const withJobs = filteredTests.filter(t => t.jobId);
      if (withJobs.length === 0) { setPerimetreStats({}); return; }
      setLoadingPerimetreStats(true);
      try {
        const stats: Record<string, { success: number; failure: number; total: number; tests: Array<{ title: string; passed: boolean }> }> = {};
        const process = (suites: any[]) => {
          suites.forEach((suite) => {
            (suite.specs || []).forEach((spec: any) => {
              const filePath = spec.file || suite.file || '';
              const perimetre = filePath.split('/')[0] || 'Autre';
              if (!stats[perimetre]) stats[perimetre] = { success: 0, failure: 0, total: 0, tests: [] };
              (spec.tests || []).forEach((test: any) => {
                stats[perimetre].total++;
                const lastResult = test.results?.[test.results.length - 1];
                const status = lastResult?.status || test.status;
                const passed = status === 'passed';
                if (passed) stats[perimetre].success++;
                else if (status === 'failed' || status === 'timedOut') stats[perimetre].failure++;
                const title = test.title || spec.title || 'Test sans titre';
                if (!stats[perimetre].tests.some(t => t.title === title))
                  stats[perimetre].tests.push({ title, passed });
              });
            });
            if (suite.suites) process(suite.suites);
          });
        };
        for (const test of withJobs) {
          try {
            const content = await gitlabApi.getJobArtifactFile(test.jobId, 'subscription-essential-e2e/test-results-merged.json');
            process(JSON.parse(content).suites || []);
          } catch (err) { console.error(`Error loading report for job ${test.jobId}:`, err); }
        }
        setPerimetreStats(stats);
      } catch { setPerimetreStats({}); }
      finally { setLoadingPerimetreStats(false); }
    };
    load();
  }, [filteredTests]);

  // Automation
  useEffect(() => {
    const load = async () => {
      setLoadingAutomation(true);
      try {
        const { data, error } = await supabase.from('automated_test_catalog').select('is_automated, is_active, test_type, partner');
        if (error) return;
        const active = (data || []).filter((t: { is_active: boolean }) => t.is_active);
        const total = active.length;
        const automated = active.filter((t: { is_automated: boolean }) => t.is_automated).length;
        setAutomationStats({ total, automated, rate: total > 0 ? (automated / total) * 100 : 0 });

        // Breakdown by test_type
        const byType: Record<string, { total: number; automated: number }> = {};
        active.forEach((t: { is_automated: boolean; test_type: string | null }) => {
          const type = t.test_type || 'Non spécifié';
          if (!byType[type]) byType[type] = { total: 0, automated: 0 };
          byType[type].total++;
          if (t.is_automated) byType[type].automated++;
        });
        setAutomationByType(
          Object.entries(byType)
            .map(([type, v]) => ({ type, ...v, rate: v.total > 0 ? (v.automated / v.total) * 100 : 0 }))
            .sort((a, b) => b.total - a.total)
        );

        // Breakdown by partner
        const byPartner: Record<string, { total: number; automated: number }> = {};
        active.forEach((t: { is_automated: boolean; partner: string | null }) => {
          const partner = t.partner || 'Non spécifié';
          if (!byPartner[partner]) byPartner[partner] = { total: 0, automated: 0 };
          byPartner[partner].total++;
          if (t.is_automated) byPartner[partner].automated++;
        });
        setAutomationByPartner(
          Object.entries(byPartner)
            .map(([partner, v]) => ({ partner, ...v, rate: v.total > 0 ? (v.automated / v.total) * 100 : 0 }))
            .sort((a, b) => b.total - a.total)
        );
      } catch {}
      finally { setLoadingAutomation(false); }
    };
    load();
  }, []);

  // ─── Derived stats ────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    if (filteredTests.length === 0) return { averageDuration: 0, totalTests: 0, successRate: 0, totalSuccesses: 0, totalFailures: 0, averageSuccessCount: 0, averageFailureCount: 0, executionsByDay: [] as [string, number][], successRateByDay: [] as { date: string; rate: number }[] };
    const totalDuration = filteredTests.reduce((s, t) => s + t.duration, 0);
    const totalSuccesses = filteredTests.reduce((s, t) => s + (t.successCount || 0), 0);
    const totalFailures = filteredTests.reduce((s, t) => s + (t.failureCount || 0), 0);
    const totalTestCount = totalSuccesses + totalFailures;
    const byDay: { [k: string]: number } = {};
    filteredTests.forEach(t => { const d = new Date(t.timestamp).toLocaleDateString('fr-FR'); byDay[d] = (byDay[d] || 0) + 1; });
    const rateByDay: { [k: string]: { s: number; t: number } } = {};
    filteredTests.forEach(t => {
      const d = new Date(t.timestamp).toLocaleDateString('fr-FR');
      if (!rateByDay[d]) rateByDay[d] = { s: 0, t: 0 };
      rateByDay[d].s += t.successCount || 0;
      rateByDay[d].t += (t.successCount || 0) + (t.failureCount || 0);
    });
    return {
      averageDuration: totalDuration / filteredTests.length,
      totalTests: filteredTests.length,
      successRate: totalTestCount > 0 ? (totalSuccesses / totalTestCount) * 100 : 0,
      totalSuccesses, totalFailures,
      averageSuccessCount: totalSuccesses / filteredTests.length,
      averageFailureCount: totalFailures / filteredTests.length,
      executionsByDay: Object.entries(byDay)
        .sort(([a], [b]) => new Date(a.split('/').reverse().join('-')).getTime() - new Date(b.split('/').reverse().join('-')).getTime())
        .slice(-7) as [string, number][],
      successRateByDay: Object.entries(rateByDay)
        .map(([date, d]) => ({ date, rate: d.t > 0 ? (d.s / d.t) * 100 : 0 }))
        .sort((a, b) => new Date(a.date.split('/').reverse().join('-')).getTime() - new Date(b.date.split('/').reverse().join('-')).getTime())
        .slice(-7),
    };
  }, [filteredTests]);

  // ─── Partner aggregation ──────────────────────────────────────────────────
  const partnerAgg = useMemo(() => {
    const map: Record<string, PartnerAgg> = {};
    Object.entries(perimetreStats).forEach(([perimetre, s]) => {
      s.tests.forEach((t) => {
        const partner = detectPartnerFromText(t.title) || detectPartnerFromText(perimetre);
        if (!map[partner]) map[partner] = { partner, success: 0, failure: 0, total: 0, perimetres: new Set(), tests: [] };
        map[partner].total++;
        if (t.passed) map[partner].success++; else map[partner].failure++;
        map[partner].perimetres.add(perimetre);
        if (!map[partner].tests.some(x => x.title === t.title)) map[partner].tests.push(t);
      });
    });
    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [perimetreStats]);

  const maxExecutions = Math.max(...stats.executionsByDay.map(([, c]) => c), 1);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-50 to-blue-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8" style={{ animation: 'fade-in 0.5s ease both' }}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-500/30">
                <BarChart3 className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Statistiques</h1>
                <p className="text-gray-500">Analyse des performances des tests</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {loadingGitlab && (
                <div className="flex items-center gap-2 text-sm text-blue-600">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Chargement...</span>
                </div>
              )}
              <div className="flex gap-1 bg-white p-1 rounded-xl shadow-sm border border-gray-200">
                {(['7d', '30d', '90d'] as const).map((range) => (
                  <button key={range} onClick={() => { loadedRangeRef.current = null; setTimeRange(range); }}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      timeRange === range ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'
                    }`}>
                    {range === '7d' ? '7 jours' : range === '30d' ? '30 jours' : '90 jours'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <KpiCard label="Durée moyenne" value={formatDuration(stats.averageDuration)} icon={<Clock className="w-5 h-5 text-blue-600" />} gradient="bg-blue-500" delay={0} />
          <KpiCard label="Taux de réussite" value={`${stats.successRate.toFixed(1)}%`} icon={<TrendingUp className="w-5 h-5 text-green-600" />} gradient="bg-green-500" delay={80} />
          <KpiCard label="Total exécutions" value={stats.totalTests} icon={<Activity className="w-5 h-5 text-gray-600" />} gradient="bg-gray-500" delay={160} />
          <KpiCard label="Tests / exécution" value={Math.round(stats.averageSuccessCount + stats.averageFailureCount)} icon={<Gauge className="w-5 h-5 text-orange-600" />} gradient="bg-orange-500" delay={240} />
        </div>

        {/* Automation coverage — standalone block */}
        <div className="mb-8">
          <Section
            title="Couverture des tests automatisés"
            subtitle="Vue d'ensemble et répartition par type et partenaire"
            icon={<Zap className="w-5 h-5 text-orange-600" />}
            accent="bg-orange-100"
            badge={automationStats.total > 0 ? `${automationStats.automated}/${automationStats.total} automatisés` : undefined}
            delay={320}
          >
            {loadingAutomation ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="w-8 h-8 text-orange-500 animate-spin" />
              </div>
            ) : automationStats.total > 0 ? (
              <div className="space-y-6">
                {/* Overall coverage banner */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 rounded-2xl bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-100">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center flex-shrink-0">
                      <Zap className="w-7 h-7 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Taux global d'automatisation</p>
                      <div className="flex items-baseline gap-3">
                        <span className="text-4xl font-bold text-gray-900">{automationStats.rate.toFixed(1)}%</span>
                        <span className="text-sm text-gray-500">{automationStats.automated} sur {automationStats.total} tests actifs</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-start sm:items-end gap-2 flex-1 sm:max-w-xs">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      automationStats.rate >= 80 ? 'bg-green-100 text-green-700' :
                      automationStats.rate >= 50 ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {automationStats.rate >= 80 ? 'Excellente' : automationStats.rate >= 50 ? 'Moyenne' : 'Faible'}
                    </span>
                    <div className="w-full">
                      <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                        <div className={`h-4 rounded-full transition-all duration-700 ${
                          automationStats.rate >= 80 ? 'bg-gradient-to-r from-green-400 to-green-600' :
                          automationStats.rate >= 50 ? 'bg-gradient-to-r from-orange-400 to-orange-600' : 'bg-gradient-to-r from-red-400 to-red-600'
                        }`} style={{ width: `${Math.max(automationStats.rate, 2)}%` }} />
                      </div>
                      <div className="flex justify-between mt-2 text-xs text-gray-500">
                        <span>{automationStats.automated} automatisés</span>
                        <span>{automationStats.total - automationStats.automated} manuels</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Breakdown by type + partner */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* By type */}
                  <div className="rounded-2xl border border-gray-100 p-5">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-9 h-9 rounded-lg bg-indigo-100 flex items-center justify-center">
                        <Target className="w-4.5 h-4.5 text-indigo-600" />
                      </div>
                      <h4 className="text-sm font-bold text-gray-900">Par type de test</h4>
                    </div>
                    {automationByType.length > 0 ? (
                      <div className="space-y-3">
                        {automationByType.map((item) => (
                          <div key={item.type}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium text-gray-700">{item.type}</span>
                              <span className="text-sm text-gray-500">
                                {item.automated}/{item.total} · <span className="font-bold text-gray-900">{item.rate.toFixed(0)}%</span>
                              </span>
                            </div>
                            <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
                              <div
                                className={`h-3 rounded-full transition-all duration-700 ${
                                  item.rate >= 80 ? 'bg-gradient-to-r from-green-400 to-green-600' :
                                  item.rate >= 50 ? 'bg-gradient-to-r from-orange-400 to-orange-600' :
                                  'bg-gradient-to-r from-red-400 to-red-600'
                                }`}
                                style={{ width: `${Math.max(item.rate, 2)}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 text-center py-4">Aucune donnée disponible</p>
                    )}
                  </div>

                  {/* By partner */}
                  <div className="rounded-2xl border border-gray-100 p-5">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-9 h-9 rounded-lg bg-teal-100 flex items-center justify-center">
                        <Award className="w-4.5 h-4.5 text-teal-600" />
                      </div>
                      <h4 className="text-sm font-bold text-gray-900">Par partenaire</h4>
                    </div>
                    {automationByPartner.length > 0 ? (
                      <div className="space-y-3">
                        {automationByPartner.map((item) => (
                          <div key={item.partner}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium text-gray-700 capitalize">{item.partner}</span>
                              <span className="text-sm text-gray-500">
                                {item.automated}/{item.total} · <span className="font-bold text-gray-900">{item.rate.toFixed(0)}%</span>
                              </span>
                            </div>
                            <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
                              <div
                                className={`h-3 rounded-full transition-all duration-700 ${
                                  item.rate >= 80 ? 'bg-gradient-to-r from-green-400 to-green-600' :
                                  item.rate >= 50 ? 'bg-gradient-to-r from-orange-400 to-orange-600' :
                                  'bg-gradient-to-r from-red-400 to-red-600'
                                }`}
                                style={{ width: `${Math.max(item.rate, 2)}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 text-center py-4">Aucune donnée disponible</p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-10">
                <Zap className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500">Aucun test dans le catalogue</p>
              </div>
            )}
          </Section>
        </div>

        {/* Results overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Section
            title="Résultats"
            subtitle="Vue globale des exécutions"
            icon={<BarChart3 className="w-5 h-5 text-blue-600" />}
            accent="bg-blue-100"
            delay={400}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl bg-green-50 border border-green-100">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-gray-700 font-medium">Réussis</span>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-green-600">{stats.totalSuccesses}</p>
                  <p className="text-xs text-gray-500">{stats.averageSuccessCount.toFixed(1)} / exéc.</p>
                </div>
              </div>
              <div className="flex items-center justify-between p-4 rounded-xl bg-red-50 border border-red-100">
                <div className="flex items-center gap-2">
                  <XCircle className="w-5 h-5 text-red-500" />
                  <span className="text-gray-700 font-medium">Échoués</span>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-red-600">{stats.totalFailures}</p>
                  <p className="text-xs text-gray-500">{stats.averageFailureCount.toFixed(1)} / exéc.</p>
                </div>
              </div>
            </div>
          </Section>

          <Section
            title="Durée moyenne"
            subtitle="Temps d'exécution moyen"
            icon={<Clock className="w-5 h-5 text-purple-600" />}
            accent="bg-purple-100"
            delay={440}
          >
            <div className="flex items-center justify-between p-4 rounded-xl bg-purple-50 border border-purple-100">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-purple-600" />
                <span className="text-gray-700 font-medium">Durée moyenne</span>
              </div>
              <p className="text-xl font-bold text-purple-600">{formatDuration(stats.averageDuration)}</p>
            </div>
          </Section>
        </div>

        {/* Partner statistics with logos */}
        <div className="mb-8">
          <Section
            title="Statistiques par partenaire"
            subtitle="Vue agrégée par enseigne"
            icon={<Award className="w-5 h-5 text-blue-600" />}
            accent="bg-blue-100"
            badge={`${partnerAgg.length} partenaires`}
            delay={480}
          >
            {loadingPerimetreStats ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
              </div>
            ) : partnerAgg.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {partnerAgg.map((agg, i) => (
                  <PartnerStatCard key={agg.partner} agg={agg} delay={i * 80}
                    onClick={() => setSelectedPartner(agg)} />
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
                <Award className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500">Aucune donnée disponible pour cette période</p>
              </div>
            )}
          </Section>
        </div>

        {/* Perimetre statistics */}
        <div className="mb-8">
          <Section
            title="Statistiques par périmètre"
            subtitle="Détail par dossier fonctionnel"
            icon={<Target className="w-5 h-5 text-green-600" />}
            accent="bg-green-100"
            badge={`${Object.keys(perimetreStats).length} périmètres`}
            delay={560}
          >
            {loadingPerimetreStats ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="w-8 h-8 text-green-500 animate-spin" />
              </div>
            ) : Object.keys(perimetreStats).length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(perimetreStats)
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([perimetre, s], i) => (
                    <PerimetreStatCard key={perimetre} perimetre={perimetre}
                      success={s.success} failure={s.failure} total={s.total} tests={s.tests}
                      delay={i * 80} />
                  ))}
              </div>
            ) : (
              <div className="text-center py-10">
                <Target className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500">Aucune donnée disponible pour cet environnement</p>
              </div>
            )}
          </Section>
        </div>

        {/* Executions by day + Success rate trend */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Section title="Exécutions par jour" subtitle="7 derniers jours" icon={<BarChart3 className="w-5 h-5 text-blue-600" />} accent="bg-blue-100" delay={640}>
            <div className="space-y-3">
              {stats.executionsByDay.length > 0 ? (
                stats.executionsByDay.map(([date, count]) => (
                  <div key={date} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 w-24">{date}</span>
                    <div className="flex items-center gap-2 flex-1 ml-3">
                      <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
                        <div className="bg-gradient-to-r from-blue-400 to-blue-600 h-3 rounded-full transition-all duration-700"
                          style={{ width: `${Math.min((count / maxExecutions) * 100, 100)}%` }} />
                      </div>
                      <span className="text-sm font-bold text-gray-900 w-8 text-right">{count}</span>
                    </div>
                  </div>
                ))
              ) : <p className="text-sm text-gray-500 text-center py-4">Aucune donnée</p>}
            </div>
          </Section>

          <Section title="Évolution du taux de réussite" subtitle="7 derniers jours" icon={<TrendingUp className="w-5 h-5 text-green-600" />} accent="bg-green-100" delay={720}>
            <div className="space-y-3">
              {stats.successRateByDay.length > 0 ? (
                stats.successRateByDay.map(({ date, rate }) => (
                  <div key={date} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 w-24">{date}</span>
                    <div className="flex items-center gap-2 flex-1 ml-3">
                      <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
                        <div className={`h-3 rounded-full transition-all duration-700 ${rate >= 80 ? 'bg-gradient-to-r from-green-400 to-green-600' : rate >= 60 ? 'bg-gradient-to-r from-orange-400 to-orange-600' : 'bg-gradient-to-r from-red-400 to-red-600'}`}
                          style={{ width: `${rate}%` }} />
                      </div>
                      <span className="text-sm font-bold text-gray-900 w-12 text-right">{rate.toFixed(0)}%</span>
                    </div>
                  </div>
                ))
              ) : <p className="text-sm text-gray-500 text-center py-4">Aucune donnée</p>}
            </div>
          </Section>
        </div>

        {/* Root causes + Top QA */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Section title="Principales causes d'échecs" icon={<AlertCircle className="w-5 h-5 text-red-600" />} accent="bg-red-100" delay={800}>
            {loadingRootCauses ? (
              <div className="flex items-center justify-center py-8"><RefreshCw className="w-6 h-6 text-red-500 animate-spin" /></div>
            ) : rootCauseStats.length > 0 ? (
              <div className="space-y-4">
                {rootCauseStats.map((stat, i) => (
                  <div key={stat.rootCause} className="border-b border-gray-100 pb-4 last:border-0">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-100 text-red-700 text-xs font-bold">{i + 1}</span>
                          <h4 className="text-sm font-semibold text-gray-900">{stat.rootCause}</h4>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-500 ml-8">
                          <span>{stat.count} occurrence{stat.count > 1 ? 's' : ''}</span>
                          <span className="text-red-600 font-medium">{stat.percentage.toFixed(1)}%</span>
                        </div>
                      </div>
                      <div className="w-28 bg-gray-100 rounded-full h-2 mt-2">
                        <div className="bg-gradient-to-r from-red-400 to-red-600 h-2 rounded-full transition-all duration-700" style={{ width: `${stat.percentage}%` }} />
                      </div>
                    </div>
                    {stat.tests.length > 0 && (
                      <div className="ml-8 mt-2 space-y-1">
                        {stat.tests.map((t, idx) => (
                          <div key={idx} className="text-xs text-gray-500 truncate">
                            <span className="font-medium text-gray-700">{t.title}</span>
                          </div>
                        ))}
                        {stat.count > stat.tests.length && (
                          <p className="text-xs text-gray-400 italic">... et {stat.count - stat.tests.length} autre{stat.count - stat.tests.length > 1 ? 's' : ''}</p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500">Aucune analyse disponible</p>
              </div>
            )}
          </Section>

          <Section title="Top QA" subtitle="Analystes les plus actifs" icon={<Trophy className="w-5 h-5 text-yellow-600" />} accent="bg-yellow-100" delay={880}>
            {loadingAnalysts ? (
              <div className="flex items-center justify-center py-8"><RefreshCw className="w-6 h-6 text-yellow-500 animate-spin" /></div>
            ) : analystStats.length > 0 ? (
              <div className="space-y-4">
                {analystStats.map((stat, i) => (
                  <div key={stat.analyst} className="border-b border-gray-100 pb-4 last:border-0">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {i < 3 ? (
                            <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-bold text-white shadow ${
                              i === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' :
                              i === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-500' :
                              'bg-gradient-to-br from-amber-600 to-amber-800'
                            }`}>{i + 1}</span>
                          ) : (
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 text-blue-700 text-sm font-bold">{i + 1}</span>
                          )}
                          <Users className="w-4 h-4 text-gray-400" />
                          <h4 className="text-sm font-semibold text-gray-900">{stat.analyst}</h4>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-500 ml-9">
                          <span>{stat.count} analyse{stat.count > 1 ? 's' : ''}</span>
                          <span className="text-blue-600 font-medium">{stat.percentage.toFixed(1)}%</span>
                        </div>
                      </div>
                      <div className="w-28 bg-gray-100 rounded-full h-2 mt-2">
                        <div className={`h-2 rounded-full transition-all duration-700 ${
                          i === 0 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' :
                          i === 1 ? 'bg-gradient-to-r from-gray-400 to-gray-600' :
                          i === 2 ? 'bg-gradient-to-r from-amber-600 to-amber-800' : 'bg-blue-500'
                        }`} style={{ width: `${stat.percentage}%` }} />
                      </div>
                    </div>
                    {stat.recentAnalyses.length > 0 && (
                      <div className="ml-9 mt-2 space-y-1">
                        {stat.recentAnalyses.map((a, idx) => (
                          <div key={idx} className="text-xs text-gray-500 flex items-center gap-2">
                            <span className="text-gray-400">{a.date}</span>
                            <span className="font-medium text-gray-700 truncate">{a.title}</span>
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
                <p className="text-sm text-gray-500">Aucune analyse disponible</p>
              </div>
            )}
          </Section>
        </div>

        {/* Executions table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8"
          style={{ animation: 'card-enter 0.5s cubic-bezier(0.22,1,0.36,1) 960ms both' }}>
          <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Liste des exécutions</h3>
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-700">{filteredTests.length}</span>
          </div>
          {filteredTests.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Branche</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Statut</th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Réussis</th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Échecs</th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Taux</th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Durée</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {[...filteredTests].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map((test) => {
                    const total = (test.successCount || 0) + (test.failureCount || 0);
                    const rate = total > 0 ? ((test.successCount || 0) / total) * 100 : null;
                    return (
                      <tr key={test.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-3 text-gray-700 whitespace-nowrap">
                          {new Date(test.timestamp).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                          <span className="ml-2 text-gray-400 text-xs">{new Date(test.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                        </td>
                        <td className="px-6 py-3 text-gray-600 font-mono text-xs">{test.branch}</td>
                        <td className="px-6 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            test.status === 'success' ? 'bg-green-100 text-green-700' :
                            test.status === 'failed' ? 'bg-red-100 text-red-700' :
                            test.status === 'running' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {test.status === 'success' ? 'Réussi' : test.status === 'failed' ? 'Échoué' : test.status === 'running' ? 'En cours' : 'En attente'}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-right text-green-600 font-semibold">{test.successCount ?? '—'}</td>
                        <td className="px-6 py-3 text-right text-red-500 font-semibold">{test.failureCount ?? '—'}</td>
                        <td className="px-6 py-3 text-right font-semibold">
                          {rate !== null ? (
                            <span className={rate >= 90 ? 'text-green-600' : rate >= 70 ? 'text-orange-600' : 'text-red-500'}>{rate.toFixed(0)}%</span>
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
              <p className="text-sm text-gray-500">{loadingGitlab ? 'Chargement...' : 'Aucune exécution pour cette période'}</p>
            </div>
          )}
        </div>
      </div>

      {/* Partner detail modal */}
      {selectedPartner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          onClick={() => setSelectedPartner(null)}
          style={{ animation: 'fade-in 0.2s ease both' }}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
            style={{ animation: 'card-enter 0.3s cubic-bezier(0.22,1,0.36,1) both' }}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden border border-gray-200 bg-white shadow-sm"
                  style={getPartnerLogo(selectedPartner.partner)?.bgColor ? { backgroundColor: getPartnerLogo(selectedPartner.partner)!.bgColor } : undefined}>
                  {getPartnerLogo(selectedPartner.partner) && (
                    <img src={getPartnerLogo(selectedPartner.partner)!.src} alt={getPartnerLogo(selectedPartner.partner)!.alt}
                      className="w-full h-full object-contain" style={{ padding: '3px' }} />
                  )}
                </div>
                <h3 className="text-lg font-bold text-gray-900 capitalize">{selectedPartner.partner}</h3>
              </div>
              <button onClick={() => setSelectedPartner(null)}
                className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto">
              <div className="grid grid-cols-3 gap-3 mb-5">
                <div className="rounded-xl bg-green-50 border border-green-100 p-3 text-center">
                  <p className="text-2xl font-bold text-green-600">{selectedPartner.success}</p>
                  <p className="text-xs text-gray-500">Réussis</p>
                </div>
                <div className="rounded-xl bg-red-50 border border-red-100 p-3 text-center">
                  <p className="text-2xl font-bold text-red-600">{selectedPartner.failure}</p>
                  <p className="text-xs text-gray-500">Échecs</p>
                </div>
                <div className="rounded-xl bg-blue-50 border border-blue-100 p-3 text-center">
                  <p className="text-2xl font-bold text-blue-600">{selectedPartner.total}</p>
                  <p className="text-xs text-gray-500">Total</p>
                </div>
              </div>
              <div className="mb-4">
                <p className="text-xs font-medium text-gray-500 mb-2">Périmètres</p>
                <div className="flex flex-wrap gap-1.5">
                  {Array.from(selectedPartner.perimetres).sort().map(p => (
                    <span key={p} className="text-xs bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full">{p}</span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 mb-2">Tests</p>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {selectedPartner.tests.map((t, i) => (
                    <div key={i} className="flex items-center justify-between gap-2 text-sm py-1.5 px-2 rounded-lg hover:bg-gray-50">
                      <span className="text-gray-700 truncate flex-1">{t.title}</span>
                      {t.passed ? <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" /> : <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
