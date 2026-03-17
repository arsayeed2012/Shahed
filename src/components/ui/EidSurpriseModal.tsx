'use client';

import { useEffect, useRef } from 'react';

type Props = { onClose: () => void };

export default function EidSurpriseModal({ onClose }: Props) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = overlayRef.current;
    if (!el) return;
    requestAnimationFrame(() => {
      el.style.opacity = '1';
    });
  }, []);

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{
        opacity: 0,
        transition: 'opacity 0.6s ease',
        background: 'linear-gradient(135deg, #1a1612 0%, #2c1f14 35%, #1a1612 70%, #0f0c09 100%)',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Decorative stars */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 60 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              width: Math.random() * 2 + 1,
              height: Math.random() * 2 + 1,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              opacity: Math.random() * 0.5 + 0.2,
              animation: `shimmer ${Math.random() * 3 + 2}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 3}s`,
            }}
          />
        ))}
      </div>

      {/* Decorative crescent */}
      <div
        className="absolute top-12 right-10 opacity-20 pointer-events-none"
        style={{ fontSize: '120px', lineHeight: 1 }}
      >
        🌙
      </div>

      {/* Content */}
      <div className="relative px-10 text-center max-w-sm" style={{ animation: 'slideUp 0.8s ease 0.3s both' }}>
        {/* Decorative line */}
        <div className="flex items-center gap-4 mb-8 justify-center">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent to-amber-600/40" />
          <span className="text-amber-500/60 text-sm">✦</span>
          <div className="h-px flex-1 bg-gradient-to-l from-transparent to-amber-600/40" />
        </div>

        <div
          className="font-display text-cream-200 mb-3"
          style={{ fontSize: '11px', letterSpacing: '0.3em', textTransform: 'uppercase', fontStyle: 'normal' }}
        >
          A private gift
        </div>

        <h1
          className="font-display font-medium text-cream-100 leading-tight mb-2"
          style={{ fontSize: '42px', letterSpacing: '-0.02em', fontStyle: 'italic' }}
        >
          Eid Mubarak
        </h1>

        <div
          className="font-display text-amber-400/80 mb-8"
          style={{ fontSize: '20px', fontStyle: 'italic' }}
        >
          2026
        </div>

        <div className="space-y-3 mb-10">
          <div className="h-px bg-gradient-to-r from-transparent via-amber-700/30 to-transparent" />
          <p className="font-body text-cream-400/80 text-sm leading-relaxed" style={{ letterSpacing: '0.02em' }}>
            Built by ARS for Shahed
          </p>
          <p
            className="font-display italic text-cream-500/60"
            style={{ fontSize: '13px' }}
          >
            Some ideas are better when they're built.
          </p>
          <div className="h-px bg-gradient-to-r from-transparent via-amber-700/30 to-transparent" />
        </div>

        {/* Arabic Eid greeting */}
        <div
          className="font-display text-cream-300/70 mb-8 text-arabic"
          style={{ fontSize: '22px', direction: 'rtl' }}
        >
          عيد مبارك ✦ شهد
        </div>

        <button
          onClick={onClose}
          className="font-body text-xs text-cream-600/50 hover:text-cream-400/70 transition-colors tracking-widest uppercase"
        >
          Close
        </button>
      </div>
    </div>
  );
}
