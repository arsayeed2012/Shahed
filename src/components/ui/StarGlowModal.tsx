'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';

type Props = {
  name: string;
  onClose: () => void;
};

type Phase = 'memory' | 'words';

export default function StarGlowModal({ name, onClose }: Props) {
  const [phase, setPhase] = useState<Phase>('memory');
  const [photoLoaded, setPhotoLoaded] = useState(false);
  const [captionIn, setCaptionIn] = useState(false);
  const [hintIn, setHintIn] = useState(false);
  const [visibleLines, setVisibleLines] = useState(0);
  const overlayRef = useRef<HTMLDivElement>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const runIfMounted = (fn: () => void) => {
    if (isMounted.current) fn();
  };

  useEffect(() => {
    const el = overlayRef.current;
    if (!el) return;
    requestAnimationFrame(() => {
      el.style.opacity = '1';
    });
  }, []);

  useEffect(() => {
    const fallback = setTimeout(() => runIfMounted(() => setPhotoLoaded(true)), 2500);
    return () => clearTimeout(fallback);
  }, []);

  useEffect(() => {
    if (!photoLoaded) return;
    const t1 = setTimeout(() => runIfMounted(() => setCaptionIn(true)), 700);
    const t2 = setTimeout(() => runIfMounted(() => setHintIn(true)), 1600);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [photoLoaded]);

  useEffect(() => {
    if (phase !== 'words') return;
    const delays = [0, 700, 1400, 2200, 3000, 3700, 4400];
    const timers = delays.map((delay, index) =>
      setTimeout(() => runIfMounted(() => setVisibleLines(index + 1)), delay)
    );
    return () => {
      timers.forEach(clearTimeout);
    };
  }, [phase]);

  const handleClose = () => {
    const el = overlayRef.current;
    if (el) el.style.opacity = '0';
    setTimeout(onClose, 380);
  };

  const goToWords = () => {
    setPhase('words');
    setVisibleLines(0);
  };

  const firstName = name.split(' ')[0] || name;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[95] flex flex-col"
      style={{ opacity: 0, transition: 'opacity 0.5s ease', background: '#07090f' }}
    >
      <button
        type="button"
        onClick={handleClose}
        aria-label="Close"
        style={{
          position: 'fixed',
          top: 'max(16px, env(safe-area-inset-top))',
          right: 20,
          zIndex: 100,
          width: 36,
          height: 36,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.08)',
          border: '1px solid rgba(255,255,255,0.12)',
          color: 'rgba(255,255,255,0.5)',
          fontSize: 18,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
        }}
      >
        ×
      </button>

      {phase === 'memory' && (
        <div className="flex h-full flex-col">
          <div className="relative flex-shrink-0 overflow-hidden" style={{ height: '60%' }}>
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: 'url(/memories/bracelet.jpg)',
                backgroundSize: 'cover',
                backgroundPosition: 'center 40%',
                filter: 'blur(18px) brightness(0.3)',
                transform: 'scale(1.08)',
              }}
            />

            <div className="absolute inset-0 flex items-center justify-center" style={{ padding: '24px 32px 0' }}>
              <button
                type="button"
                onDoubleClick={goToWords}
                aria-label="Open message"
                style={{
                  position: 'relative',
                  width: '100%',
                  maxWidth: 320,
                  borderRadius: 18,
                  overflow: 'hidden',
                  aspectRatio: '3/4',
                  boxShadow: '0 8px 48px rgba(0,0,0,0.7)',
                  opacity: photoLoaded ? 1 : 0,
                  transform: photoLoaded ? 'scale(1) translateY(0)' : 'scale(0.96) translateY(10px)',
                  transition: 'opacity 1s ease, transform 1s ease',
                  cursor: 'pointer',
                  padding: 0,
                  border: '1px solid rgba(255,255,255,0.08)',
                  background: 'transparent',
                }}
              >
                <Image
                  src="/memories/bracelet.jpg"
                  alt="A memory"
                  fill
                  priority
                  sizes="320px"
                  style={{ objectFit: 'cover', objectPosition: 'center 30%' }}
                  onLoad={() => setPhotoLoaded(true)}
                />
                <div
                  className="absolute inset-0"
                  style={{ background: 'linear-gradient(to bottom, transparent 50%, rgba(7,9,15,0.8) 100%)' }}
                />
              </button>
            </div>

            <div
              className="pointer-events-none absolute left-0 right-0 top-0 h-10"
              style={{ background: 'linear-gradient(to bottom, #07090f, transparent)' }}
            />
          </div>

          <div
            className="flex-1 flex flex-col items-center justify-between px-8 pt-6"
            style={{ paddingBottom: 'max(2.5rem, env(safe-area-inset-bottom))' }}
          >
            <div className="text-center">
              <p
                style={{
                  opacity: captionIn ? 1 : 0,
                  transform: captionIn ? 'translateY(0)' : 'translateY(10px)',
                  transition: 'opacity 0.9s ease, transform 0.9s ease',
                  fontFamily: 'var(--font-cormorant), Georgia, serif',
                  fontStyle: 'italic',
                  fontSize: 'clamp(18px, 5.5vw, 22px)',
                  color: 'rgba(220,200,165,0.85)',
                  lineHeight: 1.6,
                  marginBottom: 8,
                }}
              >
                Some moments do not start with words...
                <br />
                they start with meaning.
              </p>
              <p
                style={{
                  opacity: captionIn ? 1 : 0,
                  transition: 'opacity 0.9s ease 0.4s',
                  fontFamily: 'var(--font-jost), sans-serif',
                  fontSize: 10,
                  letterSpacing: '0.28em',
                  textTransform: 'uppercase',
                  color: 'rgba(180,155,100,0.35)',
                }}
              >
                ✦ a memory
              </p>
            </div>

            <div
              style={{
                opacity: hintIn ? 1 : 0,
                transform: hintIn ? 'translateY(0)' : 'translateY(8px)',
                transition: 'opacity 0.7s ease, transform 0.7s ease',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  fontFamily: 'var(--font-jost), sans-serif',
                  fontSize: 10,
                  letterSpacing: '0.24em',
                  textTransform: 'uppercase',
                  color: 'rgba(210,175,90,0.52)',
                  marginBottom: 6,
                }}
              >
                double tap the photo
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-cormorant), Georgia, serif',
                  fontStyle: 'italic',
                  fontSize: 16,
                  color: 'rgba(220,200,165,0.66)',
                }}
              >
                to reveal the words
              </div>
            </div>
          </div>
        </div>
      )}

      {phase === 'words' && (
        <div
          className="flex-1 flex flex-col items-center justify-center overflow-y-auto px-8"
          style={{
            paddingTop: 'max(4rem, env(safe-area-inset-top))',
            paddingBottom: 'max(3rem, env(safe-area-inset-bottom))',
            animation: 'fadeIn 0.5s ease both',
          }}
        >
          {Array.from({ length: 28 }).map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full pointer-events-none"
              style={{
                width: Math.random() * 2 + 0.8,
                height: Math.random() * 2 + 0.8,
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                background: `rgba(210,${160 + Math.floor(Math.random() * 70)},${40 + Math.floor(Math.random() * 40)},${Math.random() * 0.4 + 0.08})`,
                animation: `shimmer ${2.5 + Math.random() * 3}s ease-in-out infinite`,
                animationDelay: `${Math.random() * 4}s`,
              }}
            />
          ))}

          <div className="relative flex w-full max-w-[320px] flex-col items-center text-center">
            <div style={{ opacity: visibleLines >= 1 ? 1 : 0, transition: 'opacity 0.6s ease', width: '100%', marginBottom: 28 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ flex: 1, height: 1, background: 'linear-gradient(to right, transparent, rgba(200,160,50,0.3))' }} />
                <span style={{ color: 'rgba(200,160,50,0.45)', fontSize: 10 }}>✦</span>
                <div style={{ flex: 1, height: 1, background: 'linear-gradient(to left, transparent, rgba(200,160,50,0.3))' }} />
              </div>
            </div>

            <div
              style={{
                opacity: visibleLines >= 2 ? 1 : 0,
                transform: visibleLines >= 2 ? 'translateY(0)' : 'translateY(12px)',
                transition: 'opacity 0.7s ease, transform 0.7s ease',
                fontFamily: 'var(--font-cormorant), Georgia, serif',
                fontStyle: 'italic',
                fontWeight: 600,
                fontSize: 'clamp(42px, 12vw, 56px)',
                lineHeight: 1.05,
                color: 'rgba(255,255,255,0.93)',
                textShadow: '0 0 7px rgba(255,75,55,1), 0 0 20px rgba(255,55,35,0.85), 0 0 45px rgba(255,45,25,0.6), 0 0 90px rgba(220,30,15,0.35)',
                marginBottom: 2,
              }}
            >
              you are
            </div>

            <div
              style={{
                opacity: visibleLines >= 3 ? 1 : 0,
                transform: visibleLines >= 3 ? 'translateY(0)' : 'translateY(12px)',
                transition: 'opacity 0.7s ease, transform 0.7s ease',
                fontFamily: 'var(--font-cormorant), Georgia, serif',
                fontStyle: 'italic',
                fontWeight: 600,
                fontSize: 'clamp(42px, 12vw, 56px)',
                lineHeight: 1.05,
                color: 'rgba(255,255,255,0.93)',
                textShadow: '0 0 7px rgba(255,75,55,1), 0 0 20px rgba(255,55,35,0.85), 0 0 45px rgba(255,45,25,0.6), 0 0 90px rgba(220,30,15,0.35)',
                marginBottom: 18,
              }}
            >
              the art.
            </div>

            <div
              style={{
                opacity: visibleLines >= 4 ? 1 : 0,
                transform: visibleLines >= 4 ? 'translateY(0)' : 'translateY(8px)',
                transition: 'opacity 0.7s ease, transform 0.7s ease',
                fontFamily: 'var(--font-jost), sans-serif',
                fontSize: 12,
                letterSpacing: '0.3em',
                textTransform: 'uppercase',
                color: 'rgba(200,165,85,0.55)',
                marginBottom: 26,
              }}
            >
              — {firstName}
            </div>

            <div
              style={{
                opacity: visibleLines >= 4 ? 1 : 0,
                transition: 'opacity 0.6s ease',
                width: '80%',
                height: 1,
                marginBottom: 26,
                background: 'linear-gradient(to right, transparent, rgba(200,160,50,0.2), transparent)',
              }}
            />

            <div
              style={{
                opacity: visibleLines >= 5 ? 1 : 0,
                transform: visibleLines >= 5 ? 'translateY(0)' : 'translateY(8px)',
                transition: 'opacity 0.7s ease, transform 0.7s ease',
                fontFamily: 'var(--font-cormorant), Georgia, serif',
                fontStyle: 'italic',
                fontWeight: 500,
                fontSize: 'clamp(30px, 9vw, 40px)',
                lineHeight: 1.2,
                color: 'rgba(255,222,130,0.93)',
                textShadow: '0 0 10px rgba(255,190,50,0.75), 0 0 28px rgba(255,160,30,0.5), 0 0 55px rgba(200,120,10,0.28)',
                marginBottom: 4,
              }}
            >
              Eid Mubarak
            </div>

            <div
              style={{
                opacity: visibleLines >= 5 ? 1 : 0,
                transition: 'opacity 0.7s ease',
                fontFamily: 'var(--font-cormorant), Georgia, serif',
                fontStyle: 'italic',
                fontSize: 'clamp(20px, 6vw, 26px)',
                color: 'rgba(220,185,80,0.55)',
                marginBottom: 14,
              }}
            >
              2026
            </div>

            <div
              style={{
                opacity: visibleLines >= 6 ? 1 : 0,
                transform: visibleLines >= 6 ? 'translateY(0)' : 'translateY(6px)',
                transition: 'opacity 0.7s ease, transform 0.7s ease',
                fontFamily: 'var(--font-amiri), serif',
                fontSize: 'clamp(18px, 5.5vw, 23px)',
                direction: 'rtl',
                color: 'rgba(200,168,80,0.55)',
                textShadow: '0 0 20px rgba(190,150,40,0.25)',
                marginBottom: 22,
              }}
            >
              عيد مبارك ✦ شهد
            </div>

            <div style={{ opacity: visibleLines >= 7 ? 1 : 0, transition: 'opacity 0.8s ease', marginBottom: 28 }}>
              <div
                style={{
                  fontFamily: 'var(--font-jost), sans-serif',
                  fontSize: 10,
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  color: 'rgba(170,140,65,0.4)',
                  marginBottom: 5,
                }}
              >
                Built by ARS for {firstName}
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-cormorant), Georgia, serif',
                  fontStyle: 'italic',
                  fontSize: 13,
                  color: 'rgba(165,135,60,0.32)',
                }}
              >
                Some ideas are better when they are built.
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes shimmer {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.9; transform: scale(1.35); }
        }
      `}</style>
    </div>
  );
}
