import React, { useEffect, useRef, useState } from 'react';
import { CheckCircle, XCircle, ChevronRight } from 'lucide-react';
import { getPartnerLogo, Partner } from '../utils/partnerLogos';

// ─── Count-up animation hook ───────────────────────────────────────────────
function useCountUp(target: number, duration: number = 900) {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (target === 0) {
      setValue(0);
      return;
    }
    const start = performance.now();
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration]);

  return value;
}

// ─── Animated circular progress ring ───────────────────────────────────────
interface ProgressRingProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  color: string;
  trackColor?: string;
  delay?: number;
}

const ProgressRing: React.FC<ProgressRingProps> = ({
  percentage,
  size = 80,
  strokeWidth = 6,
  color,
  trackColor = 'rgba(0,0,0,0.08)',
  delay = 0,
}) => {
  const [animatedPct, setAnimatedPct] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedPct(percentage), delay + 100);
    return () => clearTimeout(timer);
  }, [percentage, delay]);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (animatedPct / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{
            transition: 'stroke-dashoffset 1.1s cubic-bezier(0.22, 1, 0.36, 1)',
            filter: `drop-shadow(0 0 4px ${color}40)`,
          }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-lg font-bold text-gray-900">
          {Math.round(percentage)}%
        </span>
      </div>
    </div>
  );
};

// ─── Shared animated bar for success/failure split ─────────────────────────
const SplitBar: React.FC<{ success: number; failure: number; delay: number }> = ({
  success,
  failure,
  delay,
}) => {
  const total = success + failure;
  const successPct = total > 0 ? (success / total) * 100 : 0;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), delay + 200);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div>
      <div className="w-full h-2.5 rounded-full bg-gray-200 overflow-hidden flex">
        <div
          className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-l-full"
          style={{
            width: mounted ? `${successPct}%` : '0%',
            transition: 'width 0.9s cubic-bezier(0.22, 1, 0.36, 1)',
          }}
        />
        <div
          className="h-full bg-gradient-to-r from-red-400 to-red-600 rounded-r-full"
          style={{
            width: mounted ? `${100 - successPct}%` : '0%',
            transition: 'width 0.9s cubic-bezier(0.22, 1, 0.36, 1) 0.1s',
          }}
        />
      </div>
    </div>
  );
};

// ─── Color helpers ─────────────────────────────────────────────────────────
const getColorForRate = (rate: number) => {
  if (rate >= 90) return { ring: '#22c55e', text: 'text-green-600', glow: 'rgba(34,197,94,0.35)' };
  if (rate >= 60) return { ring: '#f97316', text: 'text-orange-600', glow: 'rgba(249,115,22,0.35)' };
  return { ring: '#ef4444', text: 'text-red-600', glow: 'rgba(239,68,68,0.35)' };
};

// ─── Périmetre card ────────────────────────────────────────────────────────
export interface PerimetreData {
  success: number;
  failure: number;
  total: number;
  tests: Array<{ title: string; passed: boolean }>;
}

interface PerimetreCardProps {
  perimetre: string;
  data: PerimetreData;
  delay: number;
  onClick: () => void;
}

export const PerimetreCard: React.FC<PerimetreCardProps> = ({ perimetre, data, delay, onClick }) => {
  const successRate = data.total > 0 ? (data.success / data.total) * 100 : 0;
  const color = getColorForRate(successRate);
  const successCount = useCountUp(data.success, 800);
  const failureCount = useCountUp(data.failure, 800);
  const totalCount = useCountUp(data.total, 800);

  return (
    <div
      onClick={onClick}
      className="group relative rounded-2xl p-5 cursor-pointer overflow-hidden transition-all duration-300 hover:scale-[1.03] hover:-translate-y-1"
      style={{
        animation: `card-enter 0.5s cubic-bezier(0.22,1,0.36,1) ${delay}ms both`,
        background: 'rgba(255,255,255,0.95)',
        border: `1.5px solid ${color.ring}30`,
        boxShadow: `0 4px 16px ${color.glow}`,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = `0 12px 32px ${color.glow}, 0 0 0 1.5px ${color.ring}50`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = `0 4px 16px ${color.glow}`;
      }}
    >
      {/* Decorative gradient blob */}
      <div
        className="absolute -top-12 -right-12 w-32 h-32 rounded-full opacity-10 transition-opacity duration-300 group-hover:opacity-20"
        style={{ background: `radial-gradient(circle, ${color.ring}, transparent 70%)` }}
      />

      {/* Header */}
      <div className="flex items-start justify-between mb-4 relative">
        <h3 className="font-bold text-gray-900 text-sm pr-2">{perimetre}</h3>
        <ProgressRing
          percentage={successRate}
          size={64}
          strokeWidth={5}
          color={color.ring}
          delay={delay}
        />
      </div>

      {/* Counts */}
      <div className="space-y-1.5 mb-3">
        <div className="flex justify-between text-sm items-center">
          <span className="flex items-center gap-1.5 text-green-700 font-medium">
            <CheckCircle className="w-4 h-4" />
            Réussis
          </span>
          <span className="font-bold text-gray-900 tabular-nums">{successCount}</span>
        </div>
        <div className="flex justify-between text-sm items-center">
          <span className="flex items-center gap-1.5 text-red-700 font-medium">
            <XCircle className="w-4 h-4" />
            Échecs
          </span>
          <span className="font-bold text-gray-900 tabular-nums">{failureCount}</span>
        </div>
        <div className="flex justify-between text-sm items-center pt-1.5 border-t border-gray-200">
          <span className="text-gray-700 font-bold">Total</span>
          <span className="font-bold text-gray-900 tabular-nums">{totalCount}</span>
        </div>
      </div>

      {/* Split bar */}
      <SplitBar success={data.success} failure={data.failure} delay={delay} />

      {/* Partner logos */}
      {data.tests.length > 0 && (
        <div className="pt-3 border-t border-gray-200 mt-3 flex flex-wrap gap-1.5">
          {data.tests.slice(0, 8).map((t, idx) => {
            const partner = detectPartnerSafe(t.title);
            const logo = getPartnerLogo(partner);
            return (
              <div
                key={idx}
                className="relative group/item cursor-default"
                title={t.title}
                onClick={(e) => e.stopPropagation()}
                style={{ animation: `fade-in 0.4s ease both ${delay + 300 + idx * 50}ms` }}
              >
                <div className="w-7 h-7 rounded-md bg-white border border-gray-200 flex items-center justify-center overflow-hidden shadow-sm">
                  {logo && <img src={logo.src} alt={logo.alt} className="w-6 h-6 object-contain" />}
                </div>
                <div
                  className={`absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full flex items-center justify-center shadow ${
                    t.passed ? 'bg-green-500' : 'bg-red-500'
                  }`}
                >
                  {t.passed ? (
                    <CheckCircle className="w-2.5 h-2.5 text-white" />
                  ) : (
                    <XCircle className="w-2.5 h-2.5 text-white" />
                  )}
                </div>
              </div>
            );
          })}
          {data.tests.length > 8 && (
            <div className="w-7 h-7 rounded-md bg-gray-100 border border-gray-200 flex items-center justify-center text-xs font-bold text-gray-500">
              +{data.tests.length - 8}
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="mt-3 pt-2 flex items-center justify-center gap-1 text-xs text-gray-500 font-medium">
        <span>Voir les détails</span>
        <ChevronRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1" />
      </div>
    </div>
  );
};

// ─── Partner card ──────────────────────────────────────────────────────────
interface PartnerCardProps {
  partner: string;
  success: number;
  failure: number;
  total: number;
  perimetres: Set<string>;
  delay: number;
  onClick: () => void;
}

export const PartnerCard: React.FC<PartnerCardProps> = ({
  partner,
  success,
  failure,
  total,
  perimetres,
  delay,
  onClick,
}) => {
  const successRate = total > 0 ? (success / total) * 100 : 0;
  const color = getColorForRate(successRate);
  const logo = getPartnerLogo(partner as Partner);
  const successCount = useCountUp(success, 800);
  const failureCount = useCountUp(failure, 800);
  const totalCount = useCountUp(total, 800);
  const perimArray = Array.from(perimetres).sort();

  return (
    <div
      onClick={onClick}
      className="group relative rounded-2xl p-5 cursor-pointer overflow-hidden transition-all duration-300 hover:scale-[1.03] hover:-translate-y-1"
      style={{
        animation: `card-enter 0.5s cubic-bezier(0.22,1,0.36,1) ${delay}ms both`,
        background: 'rgba(255,255,255,0.95)',
        border: `1.5px solid ${color.ring}30`,
        boxShadow: `0 4px 16px ${color.glow}`,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = `0 12px 32px ${color.glow}, 0 0 0 1.5px ${color.ring}50`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = `0 4px 16px ${color.glow}`;
      }}
    >
      {/* Decorative blob */}
      <div
        className="absolute -top-12 -right-12 w-32 h-32 rounded-full opacity-10 transition-opacity duration-300 group-hover:opacity-20"
        style={{ background: `radial-gradient(circle, ${color.ring}, transparent 70%)` }}
      />

      {/* Header with logo + ring */}
      <div className="flex items-start justify-between mb-4 relative">
        <div className="flex items-center gap-2">
          {logo && (
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0 border border-gray-200 bg-white shadow-sm"
              style={logo.bgColor ? { backgroundColor: logo.bgColor } : undefined}
            >
              <img src={logo.src} alt={logo.alt} className="w-full h-full object-contain" style={{ padding: '2px' }} />
            </div>
          )}
          <h3 className="font-bold text-gray-900 text-sm capitalize">{partner}</h3>
        </div>
        <ProgressRing
          percentage={successRate}
          size={64}
          strokeWidth={5}
          color={color.ring}
          delay={delay}
        />
      </div>

      {/* Counts */}
      <div className="space-y-1.5 mb-3">
        <div className="flex justify-between text-sm items-center">
          <span className="flex items-center gap-1.5 text-green-700 font-medium">
            <CheckCircle className="w-4 h-4" />
            Réussis
          </span>
          <span className="font-bold text-gray-900 tabular-nums">{successCount}</span>
        </div>
        <div className="flex justify-between text-sm items-center">
          <span className="flex items-center gap-1.5 text-red-700 font-medium">
            <XCircle className="w-4 h-4" />
            Échecs
          </span>
          <span className="font-bold text-gray-900 tabular-nums">{failureCount}</span>
        </div>
        <div className="flex justify-between text-sm items-center pt-1.5 border-t border-gray-200">
          <span className="text-gray-700 font-bold">Total</span>
          <span className="font-bold text-gray-900 tabular-nums">{totalCount}</span>
        </div>
      </div>

      {/* Split bar */}
      <SplitBar success={success} failure={failure} delay={delay} />

      {/* Périmètres */}
      <div className="pt-3 border-t border-gray-200 mt-3">
        <p className="text-xs text-gray-500 mb-1.5">
          {perimetres.size} périmètre{perimetres.size > 1 ? 's' : ''}
        </p>
        <div className="flex flex-wrap gap-1">
          {perimArray.map((p, idx) => (
            <span
              key={p}
              className="inline-block text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full"
              style={{ animation: `fade-in 0.4s ease both ${delay + 300 + idx * 50}ms` }}
            >
              {p}
            </span>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-3 pt-2 flex items-center justify-center gap-1 text-xs text-gray-500 font-medium">
        <span>Voir les détails</span>
        <ChevronRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1" />
      </div>
    </div>
  );
};

// ─── Helper to avoid importing detectPartnerFromText in every render ───────
import { detectPartnerFromText } from '../utils/partnerLogos';
const detectPartnerSafe = (text: string): Partner => detectPartnerFromText(text);
