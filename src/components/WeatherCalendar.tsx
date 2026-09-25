import React, { useState, useEffect, useRef } from 'react';
import { ChevronRight, Sun, Cloud, CloudRain, CloudLightning, CheckCircle, XCircle } from 'lucide-react';
import { TestResult } from '../types';

interface WeatherCalendarProps {
  tests: TestResult[];
  onDayClick?: (tests: TestResult[]) => void;
  onViewTestDetails?: (test: TestResult) => void;
}

interface DayData {
  date: Date;
  tests: TestResult[];
  weather: 'sunny' | 'cloudy' | 'rainy' | 'stormy';
  successRate: number;
  totalTests: number;
}

// ─── Count-up hook ──────────────────────────────────────────────────────────
function useCountUp(target: number, duration: number = 800, delay: number = 0) {
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

// ─── Animated mini progress ring ────────────────────────────────────────────
const MiniRing: React.FC<{ pct: number; color: string; size?: number; delay?: number }> = ({
  pct, color, size = 48, delay = 0,
}) => {
  const [animatedPct, setAnimatedPct] = useState(0);
  const stroke = 4;
  const radius = (size - stroke) / 2;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (animatedPct / 100) * circ;

  useEffect(() => {
    const t = setTimeout(() => setAnimatedPct(pct), delay + 100);
    return () => clearTimeout(t);
  }, [pct, delay]);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth={stroke} />
        <circle
          cx={size/2} cy={size/2} r={radius} fill="none" stroke={color}
          strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset}
          style={{
            transition: 'stroke-dashoffset 1s cubic-bezier(0.22,1,0.36,1)',
            filter: `drop-shadow(0 0 3px ${color}50)`,
          }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-bold text-gray-900">{Math.round(pct)}%</span>
      </div>
    </div>
  );
};

// ─── Weather config ─────────────────────────────────────────────────────────
const weatherConfig = {
  sunny: {
    color: '#22c55e',
    glow: 'rgba(34,197,94,0.30)',
    bg: 'rgba(34,197,94,0.06)',
    border: 'rgba(34,197,94,0.25)',
    Icon: Sun,
    iconColor: 'text-green-500',
    label: 'Ensoleillé',
    range: '≥90%',
  },
  cloudy: {
    color: '#f59e0b',
    glow: 'rgba(245,158,11,0.30)',
    bg: 'rgba(245,158,11,0.06)',
    border: 'rgba(245,158,11,0.25)',
    Icon: Cloud,
    iconColor: 'text-amber-500',
    label: 'Nuageux',
    range: '70-89%',
  },
  rainy: {
    color: '#f97316',
    glow: 'rgba(249,115,22,0.30)',
    bg: 'rgba(249,115,22,0.06)',
    border: 'rgba(249,115,22,0.25)',
    Icon: CloudRain,
    iconColor: 'text-orange-500',
    label: 'Pluvieux',
    range: '50-69%',
  },
  stormy: {
    color: '#ef4444',
    glow: 'rgba(239,68,68,0.30)',
    bg: 'rgba(239,68,68,0.06)',
    border: 'rgba(239,68,68,0.25)',
    Icon: CloudLightning,
    iconColor: 'text-red-500',
    label: 'Orageux',
    range: '<50%',
  },
};

const getWeather = (rate: number): keyof typeof weatherConfig => {
  if (rate >= 90) return 'sunny';
  if (rate >= 70) return 'cloudy';
  if (rate >= 50) return 'rainy';
  return 'stormy';
};

// ─── Day card ───────────────────────────────────────────────────────────────
const DayCard: React.FC<{ day: DayData; index: number; isToday: boolean; onClick: () => void }> = ({
  day, index, isToday, onClick,
}) => {
  const hasTests = day.tests.length > 0;
  const wc = hasTests ? weatherConfig[day.weather] : null;
  const execCount = useCountUp(day.tests.length, 600, index * 70);
  const totalTests = useCountUp(day.totalTests, 600, index * 70 + 100);
  const { Icon } = wc ?? weatherConfig.sunny;

  return (
    <div
      onClick={hasTests ? onClick : undefined}
      className={`group relative rounded-2xl p-3.5 min-h-[130px] overflow-hidden transition-all duration-300 ${
        hasTests ? 'cursor-pointer hover:scale-[1.05] hover:-translate-y-1' : ''
      } ${isToday ? 'ring-2 ring-blue-400 ring-offset-1' : ''}`}
      style={{
        animation: `card-enter 0.5s cubic-bezier(0.22,1,0.36,1) ${index * 70}ms both`,
        background: hasTests ? wc!.bg : 'rgba(249,250,251,0.8)',
        border: `1.5px solid ${hasTests ? wc!.border : 'rgba(229,231,235,0.8)'}`,
        boxShadow: hasTests ? `0 4px 14px ${wc!.glow}` : '0 2px 8px rgba(0,0,0,0.04)',
      }}
      onMouseEnter={(e) => {
        if (hasTests) e.currentTarget.style.boxShadow = `0 12px 28px ${wc!.glow}, 0 0 0 1.5px ${wc!.color}40`;
      }}
      onMouseLeave={(e) => {
        if (hasTests) e.currentTarget.style.boxShadow = `0 4px 14px ${wc!.glow}`;
      }}
    >
      {/* Decorative blob */}
      {hasTests && (
        <div
          className="absolute -top-8 -right-8 w-24 h-24 rounded-full opacity-10 transition-opacity duration-300 group-hover:opacity-20"
          style={{ background: `radial-gradient(circle, ${wc!.color}, transparent 70%)` }}
        />
      )}

      {/* Date header */}
      <div className="flex items-start justify-between mb-2 relative">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wide text-gray-500">
            {day.date.toLocaleDateString('fr-FR', { weekday: 'short' })}
          </div>
          <div className="text-xl font-extrabold text-gray-900 leading-tight">
            {day.date.getDate()}
          </div>
          <div className="text-[10px] font-medium text-gray-400 uppercase">
            {day.date.toLocaleDateString('fr-FR', { month: 'short' })}
          </div>
        </div>
        {hasTests ? (
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center ${wc!.iconColor} bg-white/80 shadow-sm`}
          >
            <Icon className="w-4.5 h-4.5" strokeWidth={2} />
          </div>
        ) : (
          <MiniRing pct={0} color="#d1d5db" size={36} delay={index * 70} />
        )}
      </div>

      {/* Stats */}
      {hasTests ? (
        <div className="space-y-1.5 relative">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-700">{execCount} exec</span>
            <span className="text-xs font-bold text-gray-500">{totalTests} tests</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-gray-200 overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{
                width: '0%',
                background: wc!.color,
                animation: `bar-fill 0.8s cubic-bezier(0.22,1,0.36,1) ${index * 70 + 200}ms forwards`,
                '--target-width': `${day.successRate}%`,
              } as React.CSSProperties}
            />
          </div>
          {/* Mini exec icons */}
          <div className="flex items-center gap-1 pt-1">
            {day.tests.slice(0, 4).map((t, ti) => {
              const sc = t.successCount || 0;
              const fc = t.failureCount || 0;
              const tt = sc + fc;
              const rate = tt > 0 ? (sc / tt) * 100 : 0;
              const tw = getWeather(rate);
              const { Icon: TIcon } = weatherConfig[tw];
              return (
                <div
                  key={ti}
                  className={`w-5 h-5 rounded flex items-center justify-center ${weatherConfig[tw].iconColor} bg-white/70`}
                  style={{ animation: `fade-in 0.3s ease both ${index * 70 + 300 + ti * 40}ms` }}
                  title={t.name}
                >
                  <TIcon className="w-3 h-3" strokeWidth={2.5} />
                </div>
              );
            })}
            {day.tests.length > 4 && (
              <span className="text-[10px] font-bold text-gray-400 ml-0.5">
                +{day.tests.length - 4}
              </span>
            )}
          </div>
        </div>
      ) : (
        <div className="text-center mt-3">
          <span className="text-xs text-gray-400">Aucun test</span>
        </div>
      )}
    </div>
  );
};

// ─── Main component ─────────────────────────────────────────────────────────
export const WeatherCalendar: React.FC<WeatherCalendarProps> = ({ tests, onDayClick }) => {
  const [calendarData, setCalendarData] = useState<DayData[]>([]);

  useEffect(() => {
    const data: DayData[] = [];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const dayTests = tests.filter(test => {
        const testDate = new Date(test.timestamp);
        return testDate.toDateString() === date.toDateString();
      });

      let successRate = 0;
      let totalIndividualTests = 0;

      if (dayTests.length > 0) {
        let totalSuccessRate = 0;
        let validExecutions = 0;
        dayTests.forEach(test => {
          const sc = test.successCount || 0;
          const fc = test.failureCount || 0;
          const tt = sc + fc;
          if (tt > 0) {
            totalSuccessRate += (sc / tt) * 100;
            validExecutions++;
          }
          totalIndividualTests += tt;
        });
        successRate = validExecutions > 0 ? totalSuccessRate / validExecutions : 0;
      }

      data.push({
        date,
        tests: dayTests,
        weather: getWeather(successRate),
        successRate,
        totalTests: totalIndividualTests,
      });
    }
    setCalendarData(data);
  }, [tests]);

  const isToday = (date: Date) => date.toDateString() === new Date().toDateString();

  return (
    <div
      className="rounded-2xl shadow-lg p-6 mb-8"
      style={{
        background: 'rgba(255,255,255,0.97)',
        border: '1px solid rgba(229,231,235,0.8)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm"
          style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}
        >
          <Sun className="w-5 h-5 text-white" strokeWidth={2} />
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-900">
            Calendrier des tests — 7 derniers jours
          </h2>
          <p className="text-sm text-gray-500">
            Aperçu de la qualité des tests sur la dernière semaine
          </p>
        </div>
      </div>

      {/* Day cards */}
      <div className="grid grid-cols-7 gap-3">
        {calendarData.map((day, idx) => (
          <DayCard
            key={idx}
            day={day}
            index={idx}
            isToday={isToday(day.date)}
            onClick={() => day.tests.length > 0 && onDayClick?.(day.tests)}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="mt-5 pt-4 border-t border-gray-200">
        <div className="flex flex-wrap items-center gap-4">
          {(Object.keys(weatherConfig) as Array<keyof typeof weatherConfig>).map((key) => {
            const w = weatherConfig[key];
            const { Icon } = w;
            return (
              <div key={key} className="flex items-center gap-1.5">
                <div className={`w-6 h-6 rounded-md flex items-center justify-center ${w.iconColor} bg-white border border-gray-200 shadow-sm`}>
                  <Icon className="w-3.5 h-3.5" strokeWidth={2} />
                </div>
                <span className="text-xs font-medium text-gray-600">{w.label}</span>
                <span className="text-xs text-gray-400">({w.range})</span>
              </div>
            );
          })}
        </div>
      </div>

      <style>{`
        @keyframes bar-fill {
          to { width: var(--target-width); }
        }
      `}</style>
    </div>
  );
};
