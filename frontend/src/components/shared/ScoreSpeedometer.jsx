/**
 * @file frontend/src/components/shared/ScoreSpeedometer.jsx
 * @description Highly animated, dynamic semi-circular speedometer gauge with:
 * - Instrument cluster power-sweep on load/update
 * - Continuous live scanning / moving meter state while calculating
 * - Count-up numeric roll-up
 * - Replay / recalibrate trigger
 * - Matched to TenderHub's Dal Lake Blue / slate theme
 */
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RotateCcw } from 'lucide-react';

export function ScoreSpeedometer({ 
  score = 0, 
  maxScore = 100, 
  label = 'CHECK YOUR BID SCORE',
  probability = 'High',
  subtext = 'J&K Tender Allocation Odds',
  isCalculating = false
}) {
  const clampedScore = Math.min(Math.max(Number(score) || 0, 0), maxScore);
  
  // Angle: -90deg at 0 score, 0deg at 50, +90deg at 100
  const targetAngle = -90 + (clampedScore / maxScore) * 180;

  const [displayNumber, setDisplayNumber] = useState(0);
  const [animKey, setAnimKey] = useState(0); // For re-triggering the sweep

  // Re-trigger animation when score or calculating state changes
  useEffect(() => {
    setAnimKey(prev => prev + 1);
  }, [score, isCalculating]);

  // Count-up number animation
  useEffect(() => {
    if (isCalculating) {
      // Rapidly flicker/cycle numbers while calculating
      const interval = setInterval(() => {
        setDisplayNumber(Math.floor(Math.random() * 95) + 5);
      }, 70);
      return () => clearInterval(interval);
    }

    // Smooth count-up to target score
    let start = 0;
    const duration = 1200; // ms
    const startTime = performance.now();

    const updateCounter = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Ease out cubic
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      setDisplayNumber(Math.round(start + (clampedScore - start) * easedProgress));

      if (progress < 1) {
        requestAnimationFrame(updateCounter);
      } else {
        setDisplayNumber(clampedScore);
      }
    };

    const animFrame = requestAnimationFrame(updateCounter);
    return () => cancelAnimationFrame(animFrame);
  }, [clampedScore, isCalculating, animKey]);

  // SVG Geometry
  const cx = 150;
  const cy = 135;
  const r = 96;
  const rInner = 74;

  const getProbabilityBadge = (prob) => {
    if (isCalculating) {
      return { 
        bg: 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border-blue-300 animate-pulse', 
        text: 'Analyzing J&K Procurement Data...' 
      };
    }
    const p = String(prob).toLowerCase();
    if (p.includes('high')) return { bg: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300', text: 'High Allocation Odds' };
    if (p.includes('moderate')) return { bg: 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300', text: 'Moderate Allocation Odds' };
    return { bg: 'bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-300 border-red-300', text: 'Critical Disqualification Risk' };
  };

  const badgeInfo = getProbabilityBadge(probability);

  return (
    <div className="relative flex flex-col items-center justify-center p-6 bg-white dark:bg-slate-900/90 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-md overflow-hidden">
      
      {/* Subtle background ambient glow matched to dial position */}
      <div 
        className="absolute -top-12 inset-x-0 h-40 blur-3xl opacity-20 pointer-events-none transition-colors duration-700"
        style={{
          background: isCalculating 
            ? '#3b82f6'
            : clampedScore >= 75 ? '#10b981' : clampedScore >= 50 ? '#eab308' : '#ef4444'
        }}
      />

      {/* Replay Sweep Button */}
      {!isCalculating && (
        <button
          onClick={() => setAnimKey(k => k + 1)}
          title="Replay meter sweep"
          className="absolute top-4 right-4 p-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-dalBlue dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      )}

      {/* Gauge SVG */}
      <div className="relative w-full max-w-[280px] sm:max-w-[320px] aspect-[1.8/1] flex items-center justify-center">
        <svg 
          viewBox="0 0 300 170" 
          className="w-full h-full overflow-visible select-none drop-shadow-xs"
        >
          <defs>
            {/* Smooth Vibrant Gradient */}
            <linearGradient id="scoreGaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ef4444" />
              <stop offset="25%" stopColor="#f97316" />
              <stop offset="50%" stopColor="#eab308" />
              <stop offset="75%" stopColor="#84cc16" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>

            {/* Needle Drop Shadow */}
            <filter id="needleGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.3" />
            </filter>
          </defs>

          {/* 1. Track Base */}
          <path
            d={`M ${cx - r},${cy} A ${r},${r} 0 0,1 ${cx + r},${cy}`}
            fill="none"
            stroke="currentColor"
            className="text-slate-100 dark:text-slate-800/80"
            strokeWidth="24"
            strokeLinecap="round"
          />

          {/* 2. Main Color Spectrum Arc */}
          <path
            d={`M ${cx - r},${cy} A ${r},${r} 0 0,1 ${cx + r},${cy}`}
            fill="none"
            stroke="url(#scoreGaugeGradient)"
            strokeWidth="22"
            strokeLinecap="round"
          />

          {/* 3. Dotted Inner Track */}
          <path
            d={`M ${cx - rInner},${cy} A ${rInner},${rInner} 0 0,1 ${cx + rInner},${cy}`}
            fill="none"
            stroke="#94a3b8"
            strokeWidth="2.5"
            strokeDasharray="2 6"
            strokeLinecap="round"
            className="opacity-70 dark:opacity-40"
          />

          {/* 4. Radial Tick Marks */}
          {[0, 25, 50, 75, 100].map((tick) => {
            const rad = (-180 + (tick / 100) * 180) * (Math.PI / 180);
            const xTick = cx + (rInner - 8) * Math.cos(rad);
            const yTick = cy + (rInner - 8) * Math.sin(rad);
            return (
              <circle
                key={tick}
                cx={xTick}
                cy={yTick}
                r="2"
                className="fill-slate-400 dark:fill-slate-500"
              />
            );
          })}

          {/* 5. Animated Moving Needle */}
          <AnimatePresence mode="wait">
            <motion.g
              key={animKey}
              initial={{ rotate: -90 }}
              animate={
                isCalculating 
                  ? { 
                      rotate: [-75, 75, -75],
                      transition: { 
                        repeat: Infinity, 
                        duration: 1.5, 
                        ease: "easeInOut" 
                      }
                    }
                  : { 
                      // Realistic instrument cluster startup sweep:
                      // 0deg -> full rev (+85deg) -> rebound -> settle onto target with spring bounce
                      rotate: [
                        -90, 
                        Math.min(85, Math.max(targetAngle + 25, -30)), 
                        Math.max(-85, targetAngle - 10), 
                        targetAngle
                      ],
                      transition: { 
                        duration: 1.4, 
                        times: [0, 0.45, 0.75, 1],
                        ease: [0.34, 1.56, 0.64, 1] 
                      }
                    }
              }
              style={{ 
                transformOrigin: `${cx}px ${cy}px`
              }}
              filter="url(#needleGlow)"
            >
              {/* Tapered Needle Pointer */}
              <path
                d={`M ${cx - 5},${cy} L ${cx - 1.5},${cy - 84} Q ${cx},${cy - 88} ${cx + 1.5},${cy - 84} L ${cx + 5},${cy} Z`}
                className="fill-slate-800 dark:fill-slate-100"
              />
              {/* Pivot Center Outer Ring */}
              <circle
                cx={cx}
                cy={cy}
                r="12"
                className="fill-slate-800 dark:fill-slate-100"
              />
              {/* Pivot Inner Dot */}
              <circle
                cx={cx}
                cy={cy}
                r="5"
                className="fill-white dark:fill-slate-900"
              />
            </motion.g>
          </AnimatePresence>

          {/* Base Limit Indicators */}
          <text 
            x={cx - r - 2} 
            y={cy + 16} 
            textAnchor="middle" 
            className="text-[10px] font-mono font-bold fill-slate-400 dark:fill-slate-500"
          >
            0
          </text>
          <text 
            x={cx + r + 2} 
            y={cy + 16} 
            textAnchor="middle" 
            className="text-[10px] font-mono font-bold fill-slate-400 dark:fill-slate-500"
          >
            100
          </text>
        </svg>
      </div>

      {/* Numerical Score Display (Count-up) */}
      <div className="mt-2 text-center space-y-1">
        <motion.div 
          className="text-4xl sm:text-5xl font-display font-black tracking-tight text-slate-900 dark:text-white"
        >
          {displayNumber} <span className="text-xl font-normal text-slate-400 font-sans">/ 100</span>
        </motion.div>

        {/* Status Badge */}
        <div className="pt-1">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border shadow-xs ${badgeInfo.bg}`}>
            {badgeInfo.text}
          </span>
        </div>

        {/* Title & Subtext */}
        <div className="pt-2">
          <p className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-700 dark:text-slate-200 font-mono">
            {label}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            {subtext}
          </p>
        </div>
      </div>

    </div>
  );
}
