import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * LoveGift20_10 — Galaxy Sunshine + Flower Bloom → Spinning Image Ring (10 ảnh random)
 * - Intro: 1 nút bức thư (nền pastel).
 * - Click: nền galaxy + ánh nắng, hoa nở, VÒNG ẢNH XOAY (random 10/56 ảnh), ảnh bay lên.
 * - Nhạc auto sau khi bấm, confetti khi mở.
 */

import ms2010 from '~/assets/music/2010.mp4';

// ✅ Import 56 ảnh (tn1.jpg → tn56.jpg) trong ~/assets/imgs
import tn1 from '~/assets/imgs/tn1.jpg';
import tn2 from '~/assets/imgs/tn2.jpg';
import tn3 from '~/assets/imgs/tn3.jpg';
import tn4 from '~/assets/imgs/tn4.jpg';
import tn5 from '~/assets/imgs/tn5.jpg';
import tn6 from '~/assets/imgs/tn6.jpg';
import tn7 from '~/assets/imgs/tn7.jpg';
import tn8 from '~/assets/imgs/tn8.jpg';
import tn9 from '~/assets/imgs/tn9.jpg';
import tn10 from '~/assets/imgs/tn10.jpg';
import tn11 from '~/assets/imgs/tn11.jpg';
import tn12 from '~/assets/imgs/tn12.jpg';
import tn13 from '~/assets/imgs/tn13.jpg';
import tn14 from '~/assets/imgs/tn14.jpg';
import tn15 from '~/assets/imgs/tn15.jpg';
import tn16 from '~/assets/imgs/tn16.jpg';
import tn17 from '~/assets/imgs/tn17.jpg';
import tn18 from '~/assets/imgs/tn18.jpg';
import tn19 from '~/assets/imgs/tn19.jpg';
import tn20 from '~/assets/imgs/tn20.jpg';
import tn21 from '~/assets/imgs/tn21.jpg';
import tn22 from '~/assets/imgs/tn22.jpg';
import tn23 from '~/assets/imgs/tn23.jpg';
import tn24 from '~/assets/imgs/tn24.jpg';
import tn25 from '~/assets/imgs/tn25.jpg';
import tn26 from '~/assets/imgs/tn26.jpg';
import tn27 from '~/assets/imgs/tn27.jpg';
import tn28 from '~/assets/imgs/tn28.jpg';
import tn29 from '~/assets/imgs/tn29.jpg';
import tn30 from '~/assets/imgs/tn30.jpg';
import tn31 from '~/assets/imgs/tn31.jpg';
import tn32 from '~/assets/imgs/tn32.jpg';
import tn33 from '~/assets/imgs/tn33.jpg';
import tn34 from '~/assets/imgs/tn34.jpg';
import tn35 from '~/assets/imgs/tn35.jpg';
import tn36 from '~/assets/imgs/tn36.jpg';
import tn37 from '~/assets/imgs/tn37.jpg';
import tn38 from '~/assets/imgs/tn38.jpg';
import tn39 from '~/assets/imgs/tn39.jpg';
import tn40 from '~/assets/imgs/tn40.jpg';
import tn41 from '~/assets/imgs/tn41.jpg';
import tn42 from '~/assets/imgs/tn42.jpg';
import tn43 from '~/assets/imgs/tn43.jpg';
import tn44 from '~/assets/imgs/tn44.jpg';
import tn45 from '~/assets/imgs/tn45.jpg';
import tn46 from '~/assets/imgs/tn46.jpg';
import tn47 from '~/assets/imgs/tn47.jpg';
import tn48 from '~/assets/imgs/tn48.jpg';
import tn49 from '~/assets/imgs/tn49.jpg';
import tn50 from '~/assets/imgs/tn50.jpg';
import tn51 from '~/assets/imgs/tn51.jpg';
import tn52 from '~/assets/imgs/tn52.jpg';
import tn53 from '~/assets/imgs/tn53.jpg';
import tn54 from '~/assets/imgs/tn54.jpg';
import tn55 from '~/assets/imgs/tn55.jpg';
import tn56 from '~/assets/imgs/tn56.jpg';

const AUDIO_SRC = ms2010;
const ALL_IMAGES = [
  tn17, tn18, tn19, tn20,
  tn21, tn22, tn23, tn24, tn25, tn26, tn27, tn28, tn29, tn30,
  tn31, tn32, tn33, tn34, tn35, tn36, tn37, tn38, tn39, tn40,
  tn41, tn42, tn43, tn44, tn45, tn46, tn47, tn48, tn49, tn50,
  tn51, tn52, tn53, tn54, tn55, tn56,
];

// --- helpers ---
function sampleArray(arr, n) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.slice(0, n);
}

/* ------------------------------ Hooks & helpers ------------------------------ */
function useViewport() {
  const [size, setSize] = useState({ vw: 0, vh: 0 });
  useEffect(() => {
    const update = () => setSize({ vw: window.innerWidth, vh: window.innerHeight });
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);
  return size;
}
function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }

/* -------------------------------- Component -------------------------------- */

export default function LoveGift20_10() {
  const { vw } = useViewport();
  const [started, setStarted] = useState(false);
  const [muted, setMuted] = useState(false);
  const mediaRef = useRef(null);
  const isVideo = typeof AUDIO_SRC === 'string' ? AUDIO_SRC.toLowerCase().endsWith('.mp4') : true;

  useEffect(() => {
    if (!started || !mediaRef.current) return;
    const m = mediaRef.current;
    m.muted = muted;
    m.volume = 0.5;   
    m.play().catch(() => {});
  }, [started, muted]);

  const [burstKey, setBurstKey] = useState(0);
  useEffect(() => { if (started) setBurstKey((k) => k + 1); }, [started]);

  return (
    <div className={`relative min-h-screen w-full overflow-hidden ${started ? 'text-slate-100' : 'text-slate-800'}`}>
      {!started ? <SoftIntroBG /> : <GalaxySunBG />}

      <FloatingSparkles started={started} />

      <div className="absolute inset-0 grid place-items-center p-4">
        {!started ? (
          <IntroLetter onStart={() => setStarted(true)} />
        ) : (
          <AfterOpenScene vw={vw} muted={muted} onToggleMute={() => setMuted((m) => !m)} />
        )}
      </div>

      {isVideo ? (
        <video ref={mediaRef} src={AUDIO_SRC} loop preload="auto" className="hidden" />
      ) : (
        <audio ref={mediaRef} src={AUDIO_SRC} loop preload="auto" />
      )}

      {!started && <RisingPhotoParticles images={ALL_IMAGES} count={20} />}

      <AnimatePresence>{started && <ConfettiBurst key={burstKey} />}</AnimatePresence>
      <FooterSignature />
    </div>
  );
}

/* --------------------------------- Intro --------------------------------- */

function IntroLetter({ onStart }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 120, damping: 14 }}
      className="relative z-10 w-full max-w-md"
    >
      <div className="backdrop-blur-md bg-white/70 shadow-2xl rounded-3xl p-6 md:p-8 border border-white/60 text-center text-slate-800">
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Chạm để mở ✨</h1>
        <div className="pt-6">
          <motion.button
            onClick={onStart}
            className="relative mx-auto grid place-items-center h-32 w-32 rounded-full bg-gradient-to-br from-rose-400 to-pink-500 text-white shadow-2xl"
            whileTap={{ scale: 0.95 }}
          >
            <PulseHalo size={128} />
            <EnvelopeIcon className="h-16 w-16" />
            <span className="sr-only">Mở thư</span>
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

/* ------------------------------ After Open -------------------------------- */

function AfterOpenScene({ vw, muted, onToggleMute }) {
  const [showRing, setShowRing] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setShowRing(true), 1800);
    return () => clearTimeout(t);
  }, []);

  // random 10 ảnh, cố định 1 lần
  const ringImages = useMemo(() => sampleArray(ALL_IMAGES, 10), []);

  return (
    <>
      {/* Header (nằm bình thường) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 120, damping: 16 }}
        className="relative z-10 w-full px-4 pt-4 text-center"
      >
        <h2 className="text-3xl md:text-4xl font-black tracking-tight drop-shadow">
          Happy 20/10
        </h2>
      </motion.div>

      {/* BLOOM: nổi phía trên ring trong 1.8s đầu */}
      <AnimatePresence>
        {!showRing && (
          <motion.div
            key="bloom"
            className="fixed inset-0 z-[6] pointer-events-none grid place-items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <FlowerBloom />
          </motion.div>
        )}
      </AnimatePresence>

      {/* RING: fixed toàn màn, luôn giữa, không bị đẩy lệch bởi header/footer */}
      <AnimatePresence>
        {showRing && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="fixed inset-0 z-[5] grid place-items-center"
          >
            {/* bật pointer-events lại ở trong để hover/click vẫn hoạt động */}
            <div className="pointer-events-auto">
              <SpinningImageRing vw={vw} images={ringImages} />
              <SpinningImageRing1 vw={vw} images={ringImages} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controls (nằm dưới, không ảnh hưởng tới ring) */}
      <div className="relative z-10 mt-[70vh] md:mt-[76vh] flex items-center justify-center pb-6">
        <button
          onClick={onToggleMute}
          className="rounded-full border border-white/30 bg-white/10 backdrop-blur px-4 py-2 text-sm shadow inline-flex items-center gap-2 hover:bg-white/15"
        >
          <Icon type={muted ? 'mute' : 'music'} className="h-5 w-5" />
          {muted ? 'Bật nhạc' : 'Tắt nhạc'}
        </button>
      </div>
    </>
  );
}



/* --------------------------- Spinning Image Ring -------------------------- */

function SpinningImageRing({ images, vw }) {
  const baseR = useMemo(() => clamp(Math.min(vw * 0.36, 300), 120, 280), [vw]);
  const cardW = useMemo(() => {
    const ideal = vw < 380 ? 110 : vw < 480 ? 130 : vw < 768 ? 170 : 220;
    return clamp(ideal, 100, Math.floor(baseR * 0.9));
  }, [vw, baseR]);
  const cardH = Math.floor(cardW * 0.64);

  // 👉 nới khung: đủ cho ảnh phía trước khi scale
  const ringW = Math.ceil(baseR * 2 + cardW * 1.25);
  const ringH = Math.ceil(baseR * 1.1 + cardH + 60);

  const [angle, setAngle] = useState(0);
  const [hoverIdx, setHoverIdx] = useState(null);

  useEffect(() => {
    let raf = null, last = performance.now();
    const speed = 0.02;
    const tick = (t) => { const dt = t - last; last = t; setAngle(a => a + dt * speed); raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const items = useMemo(() => {
    const step = 360 / Math.max(images.length, 1);
    return images.map((src, i) => {
      const a = (angle + i * step) * (Math.PI / 180);
      const x = Math.cos(a) * baseR;
      const y = Math.sin(a) * baseR * 0.38;
      const z = Math.sin(a) * baseR;
      const depthScale = 0.82 + 0.22 * ((z + baseR) / (2 * baseR));
      const opacity = 0.6 + 0.4 * ((z + baseR) / (2 * baseR));
      return { i, src, x, y, z, depthScale, opacity };
    });
  }, [images, angle, baseR]);

  const isTouch = typeof window !== 'undefined' && window.matchMedia('(hover: none)').matches;

  return (
    <div className="relative" style={{ width: ringW, height: ringH }}>
      <div className="absolute inset-0 mt-[200px]">
        {items.map(({ i, src, x, y, z, depthScale, opacity }) => (
          
          <div className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2"
    style={{ zIndex: 1000 + Math.round(z) }}>
  <motion.div
    style={{ zIndex: Math.round(z + 1000), position: 'relative' }}
    animate={{ x, y,
    scale: isTouch ? depthScale : (hoverIdx === i ? depthScale * 1.08 : depthScale),
    opacity: hoverIdx === i ? 1 : opacity, }}
    transition={{ type: 'spring', stiffness: 120, damping: 16 }}
  >
    
            <div
              className="rounded-2xl overflow-hidden border border-white/40 backdrop-blur bg-white/10"
              style={{ width: cardW, height: cardH }}
            >
              <img src={src} alt={`mem-${i}`} className="h-full w-full object-cover" />
            </div>
  </motion.div>
</div>
        ))}
      </div>
    </div>
  );
}

function SpinningImageRing1({ images, vw }) {
  const baseR = useMemo(() => clamp(Math.min(vw * 0.36, 300), 120, 280), [vw]);
  const cardW = useMemo(() => {
    const ideal = vw < 380 ? 110 : vw < 480 ? 130 : vw < 768 ? 170 : 220;
    return clamp(ideal, 100, Math.floor(baseR * 0.9));
  }, [vw, baseR]);
  const cardH = Math.floor(cardW * 0.64);

  // 👉 nới khung: đủ cho ảnh phía trước khi scale
  const ringW = Math.ceil(baseR * 2 + cardW * 1.25);
  const ringH = Math.ceil(baseR * 1.1 + cardH + 60);

  const [angle, setAngle] = useState(0);
  const [hoverIdx, setHoverIdx] = useState(null);

  useEffect(() => {
    let raf = null, last = performance.now();
    const speed = 0.02;
    const tick = (t) => { const dt = t - last; last = t; setAngle(a => a + dt * speed); raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const items = useMemo(() => {
    const step = 360 / Math.max(images.length, 1);
    return images.map((src, i) => {
      const a = (angle + i * step) * (Math.PI / 180);
      const x = Math.cos(a) * baseR;
      const y = Math.sin(a) * baseR * 0.38;
      const z = Math.sin(a) * baseR;
      const depthScale = 0.82 + 0.22 * ((z + baseR) / (2 * baseR));
      const opacity = 0.6 + 0.4 * ((z + baseR) / (2 * baseR));
      return { i, src, x, y, z, depthScale, opacity };
    });
  }, [images, angle, baseR]);

  const isTouch = typeof window !== 'undefined' && window.matchMedia('(hover: none)').matches;

  return (
    <div className="relative" style={{ width: ringW, height: ringH }}>
      <div className="absolute inset-0">
        {items.map(({ i, src, x, y, z, depthScale, opacity }) => (
          
          <div className="absolute top-3/4 right-0 -translate-y-1/2"
    style={{ zIndex: 1000 + Math.round(z) }}>
  <motion.div
    style={{ zIndex: Math.round(z + 1000), position: 'relative' }}
    animate={{ x, y,
    scale: isTouch ? depthScale : (hoverIdx === i ? depthScale * 1.08 : depthScale),
    opacity: hoverIdx === i ? 1 : opacity, }}
    transition={{ type: 'spring', stiffness: 120, damping: 16 }}
  >
    
            <div
              className="rounded-2xl overflow-hidden border border-white/40 backdrop-blur bg-white/10"
              style={{ width: cardW, height: cardH }}
            >
              <img src={src} alt={`mem-${i}`} className="h-full w-full object-cover" />
            </div>
  </motion.div>
</div>
        ))}
      </div>
    </div>
  );
}
/* ------------------------------- Backgrounds ------------------------------ */

function SoftIntroBG() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10">
      <div className="absolute inset-0 bg-gradient-to-br from-pink-100/70 via-rose-50/70 to-sky-100/70" />
      <BokehLights />
      <style>{`@keyframes pulseHalo { 0%,100%{ transform: scale(1); opacity:.8 } 50%{ transform: scale(1.15); opacity:.3 } }`}</style>
    </div>
  );
}
function GalaxySunBG() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10">
      <div className="absolute inset-0 bg-[radial-gradient(1000px_600px_at_20%_30%,rgba(255,220,150,0.35),transparent),radial-gradient(900px_800px_at_80%_20%,rgba(140,170,255,0.35),transparent),radial-gradient(800px_800px_at_50%_80%,rgba(255,150,200,0.28),transparent)]" />
      <StarField />
      <div className="absolute -top-20 -left-20 h-[60vh] w-[60vh] rounded-full bg-gradient-to-br from-yellow-200/70 via-rose-200/40 to-transparent blur-3xl opacity-70" />
      <div className="absolute top-0 right-0 h-[40vh] w-[40vh] rounded-full bg-[conic-gradient(from_0deg,rgba(255,255,255,0.2),transparent_60%)] blur-2xl opacity-60 animate-[spin_60s_linear_infinite]" />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  );
}
function BokehLights() {
  const dots = Array.from({ length: 14 }).map((_, i) => ({ id: i, x: Math.random() * 100, y: Math.random() * 100, s: 80 + Math.random() * 140, o: 0.25 + Math.random() * 0.35 }));
  return (
    <div className="absolute inset-0">
      {dots.map((d) => (
        <span key={d.id} className="absolute rounded-full bg-white" style={{ left: `${d.x}%`, top: `${d.y}%`, width: d.s, height: d.s, opacity: d.o, filter: 'blur(18px)' }} />
      ))}
    </div>
  );
}
function StarField() {
  const stars = useMemo(() => Array.from({ length: 160 }).map((_, i) => ({ id: i, x: Math.random() * 100, y: Math.random() * 100, s: Math.random() * 2 + 0.5 })), []);
  return (
    <div className="absolute inset-0">
      {stars.map((s) => (
        <span key={s.id} className="absolute bg-white" style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.s, height: s.s, borderRadius: s.s, opacity: 0.8 }} />
      ))}
    </div>
  );
}

/* ------------------------------ Flower Bloom ------------------------------ */

function FlowerBloom({ size = 180 }) {
  return (
    <motion.div className="relative" initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1.2, ease: 'easeOut' }}>
      <GalaxyFlower size={size} animatePulse />
    </motion.div>
  );
}
function GalaxyFlower({ size = 120, animatePulse = false }) {
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <motion.div className="absolute inset-0 rounded-full" style={{ background: 'radial-gradient(circle at 50% 45%, #ffd6e7, #f0a3ff 40%, #8bc5ff 75%, transparent 76%)' }} animate={animatePulse ? { scale: [1, 1.06, 1] } : undefined} transition={{ duration: 2.4, repeat: animatePulse ? Infinity : 0 }} />
      {[0,1,2,3,4,5,6,7].map((p) => (
        <motion.span key={p} className="absolute left-1/2 top-1/2 block rounded-[46%]" style={{ width: size * 0.52, height: size * 0.32, background: 'radial-gradient(closest-side, rgba(255,255,255,.9), rgba(255,200,240,.2))', transformOrigin: '0% 50%', filter: 'blur(0.2px)' }} animate={{ rotate: [p*45, p*45+360] }} transition={{ duration: 18, repeat: Infinity, ease: 'linear' }} />
      ))}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-6 w-6 rounded-full bg-yellow-200 shadow-inner" />
    </div>
  );
}

/* ------------------------------- Particles ------------------------------- */

function FloatingSparkles({ started }) {
  const count = 36;
  const items = useMemo(() => Array.from({ length: count }).map((_, i) => ({ id: i, left: Math.random() * 100, size: 10 + Math.random() * 20, delay: Math.random() * 8, duration: 16 + Math.random() * 12, drift: (Math.random() * 60 - 30).toFixed(1) })), []);
  return (
    <div className="pointer-events-none absolute inset-0 -z-0 overflow-hidden">
      {items.map((it) => (
        <div key={it.id} style={{ position: 'absolute', bottom: -40, left: `${it.left}vw`, width: it.size, height: it.size, animation: `floatUp ${it.duration}s linear ${it.delay}s infinite` }}>
          <div style={{ animation: `drift ${it.duration}s ease-in-out ${it.delay}s infinite alternate`, ['--drift']: `${it.drift}px`, filter: started ? 'none' : 'blur(1px)' }}>
            <Sparkle />
          </div>
        </div>
      ))}
      <style>{`@keyframes floatUp { 0%{ transform: translateY(10vh) scale(1); opacity:0 } 10%{ opacity:.9 } 100%{ transform: translateY(-120vh) scale(1.1); opacity:0 } } @keyframes drift { 0%{ transform: translateX(0) } 100%{ transform: translateX(var(--drift, 20px)) } }`}</style>
    </div>
  );
}
function Sparkle() {
  return (
    <svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M12 2l2.2 5.5L20 9l-5.5 1.5L12 16l-2.5-5.5L4 9l5.8-1.5L12 2z" fill="rgba(255,255,255,.85)" /></svg>
  );
}

/* --------------------------- Rising Photo Particles ----------------------- */

function RisingPhotoParticles({ images, count = 10 }) {
  // chọn ảnh duy nhất, tránh trùng
  const uniqueSrcs = useMemo(() => {
    const n = Math.min(count, images.length || 0);
    return sampleArray(images, n);
  }, [images, count]);

  // tạo vị trí/làn + tham số động
  const items = useMemo(() => {
    const n = uniqueSrcs.length;
    const phi = 0.61803398875; // golden ratio conjugate để rải đều
    return Array.from({ length: n }).map((_, i) => {
      // làn đều + jitter nhẹ, clamp trong 6–94vw
      const laneCenter = ((i + 0.5) * (100 / n));
      const jitter = (Math.random() * 6 - 3); // ±3vw
      const left = Math.max(6, Math.min(94, laneCenter + jitter));

      const size = 54 + Math.random() * 36;           // 54–90px
      const duration = 18 + Math.random() * 8;        // 18–26s
      const delay = (i * 0.45) + (Math.random() * 1); // so le nhịp
      const ampX = 20 + Math.random() * 28;           // 20–48px drift ngang
      const rotAmp = 6 + Math.random() * 7;           // 6–13deg lắc
      const rotDir = Math.random() < 0.5 ? -1 : 1;    // trái/phải
      const depth = Math.random();                    // 0..1
      const zIndex = 1000 + Math.round(depth * 500);  // lớp trước–sau
      const scaleBase = 0.96 + depth * 0.12;          // xa nhỏ, gần to

      // xếp theo chuỗi low-discrepancy để ít cụm
      const phase = (i * phi - Math.floor(i * phi)) * 2 * Math.PI;

      return {
        id: i,
        src: uniqueSrcs[i],
        left,
        size,
        duration,
        delay,
        ampX,
        rotAmp: rotAmp * rotDir,
        phase,
        zIndex,
        scaleBase,
      };
    });
  }, [uniqueSrcs]);

  return (
    <div className="pointer-events-none absolute inset-0 -z-0 overflow-hidden">
      {items.map((it) => (
        <div
          key={it.id}
          style={{
            position: 'absolute',
            bottom: -140,
            left: `${it.left}vw`,
            width: it.size,
            height: (it.size * 2) / 3,
            zIndex: it.zIndex, // 👈 lớp theo "độ sâu"
            // rise + scale + fade
            animation: `floatUp3 ${it.duration}s cubic-bezier(.25,.1,.1,1) ${it.delay}s infinite`,
            transform: `scale(${it.scaleBase})`,
            opacity: 0, // sẽ fade-in qua keyframes
          }}
        >
          {/* drift ngang tách riêng, dùng biến amp & phase để lệch nhịp */}
          <div
            style={{
              animation: `drift3 ${it.duration * 0.9}s ease-in-out ${it.delay}s infinite alternate`,
              ['--ampX']: `${it.ampX}px`,
              ['--phase']: `${it.phase}rad`,
            }}
          >
            {/* wobble xoay nhẹ */}
            <div
              style={{
                animation: `wobble3 ${it.duration * 0.8}s ease-in-out ${it.delay + 0.2}s infinite alternate`,
                ['--rotAmp']: `${it.rotAmp}deg`,
              }}
            >
              <div
                className="rounded-xl overflow-hidden border backdrop-blur"
                style={{
                  width: '100%',
                  height: '100%',
                  borderColor: 'rgba(255,255,255,0.35)',
                  background: 'rgba(255,255,255,0.08)',
                  boxShadow: '0 10px 22px rgba(0,0,0,0.25)',
                }}
              >
                <img src={it.src} alt="floating" className="h-full w-full object-cover" />
              </div>
            </div>
          </div>
        </div>
      ))}

      <style>{`
        @keyframes floatUp3 {
          0%   { transform: translateY(14vh) scale(0.92); opacity: 0 }
          12%  { opacity: .95 }
          60%  { opacity: .95 }
          100% { transform: translateY(-145vh) scale(1.04); opacity: 0 }
        }
        /* drift ngang: x = amp * sin(progress + phase) */
        @keyframes drift3 {
          0%   { transform: translateX(calc(var(--ampX, 24px) * sin(var(--phase, 0rad)))) }
          50%  { transform: translateX(calc(var(--ampX, 24px) * sin(calc(var(--phase, 0rad) + 1.57rad)))) }
          100% { transform: translateX(calc(var(--ampX, 24px) * sin(calc(var(--phase, 0rad) + 3.14rad)))) }
        }
        @keyframes wobble3 {
          0%   { transform: rotate(calc(var(--rotAmp, 8deg) * -1)) }
          100% { transform: rotate(calc(var(--rotAmp, 8deg) * 1)) }
        }
      `}</style>
    </div>
  );
}

/* ------------------------------- Confetti -------------------------------- */

function ConfettiBurst() {
  const pieces = useMemo(() => Array.from({ length: 120 }).map((_, i) => ({ id: i, x: Math.random() * 100, y: Math.random() * 40 + 10, size: Math.random() * 8 + 4, rot: Math.random() * 360, dur: 1.4 + Math.random() * 0.8, delay: Math.random() * 0.25, hue: Math.floor(Math.random() * 360) })), []);
  return (
    <motion.div className="pointer-events-none absolute inset-0" initial={{ opacity: 1 }} animate={{ opacity: 0 }} exit={{ opacity: 0 }} transition={{ duration: 2.2, ease: 'easeOut' }}>
      {pieces.map((p) => (
        <motion.span key={p.id} initial={{ x: `${p.x}vw`, y: `${p.y}vh`, rotate: p.rot, scale: 1 }} animate={{ y: `${p.y + 60}vh`, rotate: p.rot + 360 }} transition={{ duration: p.dur, delay: p.delay, ease: 'easeOut' }} style={{ position: 'absolute', width: p.size, height: p.size, background: `hsl(${p.hue} 90% 60%)`, borderRadius: 2 }} />
      ))}
    </motion.div>
  );
}
function FooterSignature() {
  return (
    <div className="absolute bottom-2 left-0 right-0 z-10 text-center text-[11px] opacity-70">Made with ❤ — Chúc 20/10 thật hạnh phúc</div>
  );
}

/* --------------------------------- Icons --------------------------------- */

function EnvelopeIcon({ className = 'h-6 w-6' }) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="currentColor">
      <path d="M8 16h48a4 4 0 0 1 4 4v24a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V20a4 4 0 0 1 4-4Z" opacity=".85" />
      <path d="M12 20l20 16a4 4 0 0 0 5 0L56 20" fill="white" opacity=".8" />
      <path d="M12 20l40 24M52 20 12 44" stroke="white" strokeWidth="2" fill="none" />
    </svg>
  );
}
function Icon({ type, className = 'h-6 w-6', filled = false }) {
  if (type === 'heart') return <SvgHeart className={className} filled={filled} />;
  if (type === 'music') return <SvgMusic className={className} />;
  if (type === 'mute') return <SvgMute className={className} />;
  return <SvgHeart className={className} filled={filled} />;
}
function SvgHeart({ className, filled }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5"><path d="M12 20s-6.5-4.5-8.3-8.3C2.4 9.3 4 6.8 6.5 6.5c1.6-.2 3.1.5 4 1.7.9-1.2 2.4-1.9 4-1.7 2.5.3 4.1 2.8 2.8 5.2C18.5 15.5 12 20 12 20Z" /></svg>
  );
}
function SvgMusic({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 18a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm6-2V6l5-1v10" /></svg>
  );
}
function SvgMute({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 10v4h3l4 3V7L7 10H4Z" /><path d="m16 9 5 6M21 9l-5 6" /></svg>
  );
}

/* ------------------------------- Utilities ------------------------------- */

function PulseHalo({ size = 112 }) {
  return (
    <div className="absolute inset-0 grid place-items-center">
      <span className="absolute inline-block rounded-full bg-white/30 blur-lg" style={{ height: size, width: size }} />
      <span className="absolute rounded-full border-2 border-white/70" style={{ height: size, width: size, animation: 'pulseHalo 2.1s ease-in-out infinite' }} />
    </div>
  );
}

