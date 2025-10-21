

// import React, { useEffect, useMemo, useRef, useState } from "react";
// import { motion, AnimatePresence } from "framer-motion";

// /**
//  * LoveGift20_10 — Soft Pastel Intro → Zen Ring (clean, minimal)
//  * - Intro: nút bức thư + ảnh bay.
//  * - Click: nền galaxy mềm + 1 vòng xoay ảnh “Zen Ring”, nhạc, confetti.
//  * - Tập trung vào độ tinh gọn: ánh sáng, kính, chiều sâu; hạn chế rối mắt.
//  */

// // ✅ Import 56 ảnh (tn1.jpg → tn56.jpg) trong ~/assets/imgs
// import tn1 from '~/assets/imgs/tn1.jpg';
// import tn2 from '~/assets/imgs/tn2.jpg';
// import tn3 from '~/assets/imgs/tn3.jpg';
// import tn4 from '~/assets/imgs/tn4.jpg';
// import tn5 from '~/assets/imgs/tn5.jpg';
// import tn6 from '~/assets/imgs/tn6.jpg';
// import tn7 from '~/assets/imgs/tn7.jpg';
// import tn8 from '~/assets/imgs/tn8.jpg';
// import tn9 from '~/assets/imgs/tn9.jpg';
// import tn10 from '~/assets/imgs/tn10.jpg';
// import tn11 from '~/assets/imgs/tn11.jpg';
// import tn12 from '~/assets/imgs/tn12.jpg';
// import tn13 from '~/assets/imgs/tn13.jpg';
// import tn14 from '~/assets/imgs/tn14.jpg';
// import tn15 from '~/assets/imgs/tn15.jpg';
// import tn16 from '~/assets/imgs/tn16.jpg';
// import tn17 from '~/assets/imgs/tn17.jpg';
// import tn18 from '~/assets/imgs/tn18.jpg';
// import tn19 from '~/assets/imgs/tn19.jpg';
// import tn20 from '~/assets/imgs/tn20.jpg';
// import tn21 from '~/assets/imgs/tn21.jpg';
// import tn22 from '~/assets/imgs/tn22.jpg';
// import tn23 from '~/assets/imgs/tn23.jpg';
// import tn24 from '~/assets/imgs/tn24.jpg';
// import tn25 from '~/assets/imgs/tn25.jpg';
// import tn26 from '~/assets/imgs/tn26.jpg';
// import tn27 from '~/assets/imgs/tn27.jpg';
// import tn28 from '~/assets/imgs/tn28.jpg';
// import tn29 from '~/assets/imgs/tn29.jpg';
// import tn30 from '~/assets/imgs/tn30.jpg';
// import tn31 from '~/assets/imgs/tn31.jpg';
// import tn32 from '~/assets/imgs/tn32.jpg';
// import tn33 from '~/assets/imgs/tn33.jpg';
// import tn34 from '~/assets/imgs/tn34.jpg';
// import tn35 from '~/assets/imgs/tn35.jpg';
// import tn36 from '~/assets/imgs/tn36.jpg';
// import tn37 from '~/assets/imgs/tn37.jpg';
// import tn38 from '~/assets/imgs/tn38.jpg';
// import tn39 from '~/assets/imgs/tn39.jpg';
// import tn40 from '~/assets/imgs/tn40.jpg';
// import tn41 from '~/assets/imgs/tn41.jpg';
// import tn42 from '~/assets/imgs/tn42.jpg';
// import tn43 from '~/assets/imgs/tn43.jpg';
// import tn44 from '~/assets/imgs/tn44.jpg';
// import tn45 from '~/assets/imgs/tn45.jpg';
// import tn46 from '~/assets/imgs/tn46.jpg';
// import tn47 from '~/assets/imgs/tn47.jpg';
// import tn48 from '~/assets/imgs/tn48.jpg';
// import tn49 from '~/assets/imgs/tn49.jpg';
// import tn50 from '~/assets/imgs/tn50.jpg';
// import tn51 from '~/assets/imgs/tn51.jpg';
// import tn52 from '~/assets/imgs/tn52.jpg';
// import tn53 from '~/assets/imgs/tn53.jpg';
// import tn54 from '~/assets/imgs/tn54.jpg';
// import tn55 from '~/assets/imgs/tn55.jpg';
// import tn56 from '~/assets/imgs/tn56.jpg';

// const AUDIO_SRC = `https://res.cloudinary.com/dvueewtsp/video/upload/v1761029535/QR_Trash/2010_pdekxl.mp3`;

// const ALL_IMAGES = [
//   tn1, tn2, tn3, tn4, tn5, tn6, tn7, tn8, tn9, tn10, tn11, tn12, tn13, tn14, tn15, tn16,
//   tn17, tn18, tn19, tn20, tn21, tn22, tn23, tn24, tn25, tn26, tn27, tn28, tn29, tn30,
//   tn31, tn32, tn33, tn34, tn35, tn36, tn37, tn38, tn39, tn40, tn41, tn42, tn43, tn44,
//   tn45, tn46, tn47, tn48, tn49, tn50, tn51, tn52, tn53, tn54, tn55, tn56,
// ];

// // helpers
// function sampleArray(arr, n) {
//   const a = [...arr];
//   for (let i = a.length - 1; i > 0; i--) {
//     const j = Math.floor(Math.random() * (i + 1));
//     [a[i], a[j]] = [a[j], a[i]];
//   }
//   return a.slice(0, n);
// }
// function useViewport() {
//   const [size, setSize] = useState({ vw: 0, vh: 0 });
//   useEffect(() => {
//     const update = () => setSize({ vw: window.innerWidth, vh: window.innerHeight });
//     update();
//     window.addEventListener('resize', update);
//     return () => window.removeEventListener('resize', update);
//   }, []);
//   return size;
// }
// function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }
// function useHasMounted() {
//   const [mounted, setMounted] = useState(false);
//   useEffect(() => setMounted(true), []);
//   return mounted;
// }

// /* ------------------------------ Root Component ------------------------------ */
// export default function LoveGift20_10() {
//   const mounted = useHasMounted();
//   const { vw } = useViewport();
//   const [started, setStarted] = useState(false);
//   const [muted, setMuted] = useState(false);
//   const mediaRef = useRef(null);

//   // unlock audio on first interaction
//   useEffect(() => {
//     const oneClick = () => {
//       const m = mediaRef.current;
//       if (!m) return;
//       m.muted = false;
//       m.volume = 0.6;
//       m.play().catch(() => {});
//     };
//     window.addEventListener("click", oneClick, { once: true });
//     return () => window.removeEventListener("click", oneClick);
//   }, []);

//   useEffect(() => {
//     if (!started || !mediaRef.current) return;
//     const m = mediaRef.current;
//     m.muted = muted;
//     m.volume = 0.5;
//     m.play().catch(() => {});
//   }, [started, muted]);

//   const startExperience = async () => {
//     setStarted(true);
//     const m = mediaRef.current;
//     if (!m) return;
//     try {
//       m.muted = false;
//       m.volume = 0.6;
//       await m.play();
//     } catch(e) { console.warn(e); }
//   };

//   const [burstKey, setBurstKey] = useState(0);
//   useEffect(() => { if (started) setBurstKey((k) => k + 1); }, [started]);

//   return (
//     <div className={`relative min-h-screen w-full overflow-hidden ${started ? 'text-slate-100' : 'text-slate-800'}`}>
//       {!started ? <SoftIntroBG /> : <GalaxySunBG />}

//       <FloatingSparkles started={started} />

//       <div className="absolute inset-0 grid place-items-center p-4">
//         {!started ? (
//           <IntroLetter startExperience={startExperience} />
//         ) : (
//           <ZenRingScene vw={vw} muted={muted} onToggleMute={() => setMuted(m => !m)} />
//         )}
//       </div>

//       <audio
//         ref={mediaRef}
//         src={AUDIO_SRC}
//         loop
//         preload="auto"
//         playsInline
//         onError={(e) => console.log('Audio error:', e.currentTarget.error)}
//       />

//       {mounted && <RisingPhotoParticles images={ALL_IMAGES} count={16} />}

//       <AnimatePresence>{started && <ConfettiBurst key={burstKey} />}</AnimatePresence>
//       <FooterSignature />
//     </div>
//   );
// }

// /* --------------------------------- Intro --------------------------------- */
// function IntroLetter({ startExperience }) {
//   return (
//     <motion.div
//       initial={{ opacity: 0, scale: 0.9 }}
//       animate={{ opacity: 1, scale: 1 }}
//       transition={{ type: 'spring', stiffness: 120, damping: 14 }}
//       className="relative z-10 w-full max-w-md"
//     >
//       <div className="backdrop-blur-md bg-white/70 shadow-2xl rounded-3xl p-6 md:p-8 border border-white/60 text-center text-slate-800">
//         <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Chạm để mở ✨</h1>
//         <div className="pt-6">
//           <motion.button
//             onClick={startExperience}
//             className="relative mx-auto grid place-items-center h-32 w-32 rounded-full bg-gradient-to-br from-rose-400 to-pink-500 text-white shadow-2xl"
//             whileTap={{ scale: 0.95 }}
//           >
//             <PulseHalo size={128} />
//             <EnvelopeIcon className="h-16 w-16" />
//             <span className="sr-only">Mở thư</span>
//           </motion.button>
//         </div>
//       </div>
//     </motion.div>
//   );
// }

// /* ------------------------------ Zen Ring Scene ------------------------------ */
// function ZenRingScene({ vw, muted, onToggleMute }) {
//   const [show, setShow] = useState(false);
//   useEffect(() => { const t = setTimeout(() => setShow(true), 900); return () => clearTimeout(t); }, []);

//   const heroImages = useMemo(() => sampleArray(ALL_IMAGES, 12), []);
//   const { baseR, cardW } = useMemo(() => {
//     const r = clamp(Math.min(vw * 0.36, 320), 130, 300);
//     const w = clamp(vw < 380 ? 112 : vw < 480 ? 132 : vw < 768 ? 168 : 208, 104, Math.floor(r * 0.88));
//     return { baseR: r, cardW: w };
//   }, [vw]);
//   const cardH = Math.floor(cardW * 0.64);

//   return (
//     <>
//       {/* heading */}
//       <motion.div
//         initial={{ opacity: 0, y: 14 }}
//         animate={{ opacity: 1, y: 0 }}
//         transition={{ duration: 0.6 }}
//         className="relative z-10 w-full px-4 pt-4 text-center"
//       >
//         <h2 className="text-3xl md:text-4xl font-black tracking-tight drop-shadow">Happy 20/10</h2>
//       </motion.div>

//       {/* soft center glow */}
//       <div className="pointer-events-none absolute inset-0 z-[4] grid place-items-center">
//         <span className="h-[42vmin] w-[42vmin] rounded-full blur-3xl opacity-60"
//               style={{ background: 'radial-gradient(circle, rgba(255,244,230,.55), rgba(210,210,255,.22) 45%, transparent 70%)' }} />
//       </div>

//       {/* the ring */}
//       <AnimatePresence>
//         {show && (
//           <motion.div
//             initial={{ opacity: 0, scale: 0.98 }}
//             animate={{ opacity: 1, scale: 1 }}
//             transition={{ duration: 0.6 }}
//             className="fixed inset-0 z-[6] grid place-items-center"
//           >
//             <RingClean images={heroImages} baseR={baseR} cardW={cardW} cardH={cardH} />
//           </motion.div>
//         )}
//       </AnimatePresence>

//       {/* controls */}
//       <div className="relative z-10 mt-[70vh] md:mt-[76vh] flex items-center justify-center pb-6">
//         <button
//           onClick={onToggleMute}
//           className="rounded-full border border-white/30 bg-white/10 backdrop-blur px-4 py-2 text-sm shadow inline-flex items-center gap-2 hover:bg-white/15"
//         >
//           <Icon type={muted ? 'mute' : 'music'} className="h-5 w-5" />
//           {muted ? 'Bật nhạc' : 'Tắt nhạc'}
//         </button>
//       </div>
//     </>
//   );
// }

// function RingClean({ images, baseR, cardW, cardH }) {
//   const [ang, setAng] = useState(0);
//   const [hover, setHover] = useState(null);
//   const speed = 0.018; // chậm, sang
//   const squash = 0.36; // ellipse ratio
//   const zBase = 1000;

//   useEffect(() => {
//     let raf = 0, last = performance.now();
//     const tick = (t) => { const dt = t - last; last = t; setAng(a => a + dt * speed); raf = requestAnimationFrame(tick); };
//     raf = requestAnimationFrame(tick);
//     return () => cancelAnimationFrame(raf);
//   }, []);

//   const ringW = Math.ceil(baseR * 2 + cardW * 1.2);
//   const ringH = Math.ceil(baseR * 1.08 + cardH + 50);

//   const items = useMemo(() => {
//     const step = 360 / Math.max(images.length, 1);
//     return images.map((src, i) => {
//       const a = (ang + i * step) * (Math.PI / 180);
//       const x = Math.cos(a) * baseR;
//       const y = Math.sin(a) * baseR * squash;
//       const z = Math.sin(a) * baseR;
//       const t = (z + baseR) / (2 * baseR); // 0..1
//       const scale = 0.84 + 0.22 * t;
//       const op = 0.55 + 0.43 * t;
//       return { i, src, x, y, z, scale, op };
//     });
//   }, [images, ang, baseR]);

//   return (
//     <div className="relative" style={{ width: ringW, height: ringH }}>
//       {/* thin guide circle (rất mờ) */}
//       <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
//            style={{
//              width: baseR * 2.1,
//              height: baseR * 2.1 * squash,
//              border: '1px dashed rgba(255,255,255,0.12)',
//              filter: 'blur(.2px)',
//            }}
//       />
//       {/* soft halo ring */}
//       <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full blur-2xl"
//            style={{
//              width: baseR * 1.66,
//              height: baseR * 1.66 * squash,
//              background: 'radial-gradient(closest-side, rgba(255,255,255,.2), transparent 70%)',
//              opacity: .35
//            }}
//       />

//       {/* cards */}
//       <div className="absolute inset-0">
//         {items.map(({ i, src, x, y, z, scale, op }) => (
//           <div key={i} className="absolute left-1/2 top-1/2"
//                style={{ transform: 'translate(-50%, -50%)', zIndex: zBase + Math.round(z) }}
//                onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
//             <motion.div
//               animate={{ x, y, scale: hover === i ? scale * 1.08 : scale, opacity: hover === i ? 1 : op }}
//               transition={{ type: 'spring', stiffness: 120, damping: 16 }}
//             >
//               <div
//                 className="rounded-2xl overflow-hidden border backdrop-blur bg-white/10"
//                 style={{
//                   width: cardW, height: cardH,
//                   borderColor: 'rgba(255,255,255,0.35)',
//                   boxShadow: '0 12px 28px rgba(0,0,0,.22), inset 0 0 0 1px rgba(255,255,255,.06)'
//                 }}
//               >
//                 <img src={src} alt={`mem-${i}`} className="h-full w-full object-cover select-none" draggable={false}/>
//               </div>
//             </motion.div>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }

// /* ------------------------------- Backgrounds ------------------------------ */
// function SoftIntroBG() {
//   return (
//     <div className="pointer-events-none absolute inset-0 -z-10">
//       <div className="absolute inset-0 bg-gradient-to-br from-pink-100/70 via-rose-50/70 to-sky-100/70" />
//       <BokehLights />
//       <style>{`@keyframes pulseHalo { 0%,100%{ transform: scale(1); opacity:.8 } 50%{ transform: scale(1.15); opacity:.3 } }`}</style>
//     </div>
//   );
// }
// function GalaxySunBG() {
//   return (
//     <div className="pointer-events-none absolute inset-0 -z-10">
//       <div className="absolute inset-0 bg-[radial-gradient(1000px_600px_at_20%_30%,rgba(255,220,150,0.30),transparent),radial-gradient(900px_800px_at_80%_20%,rgba(140,170,255,0.28),transparent),radial-gradient(800px_800px_at_50%_80%,rgba(255,150,200,0.22),transparent)]" />
//       <StarField />
//       <div className="absolute -top-20 -left-20 h-[60vh] w-[60vh] rounded-full bg-gradient-to-br from-yellow-200/60 via-rose-200/35 to-transparent blur-3xl opacity-70" />
//       <div className="absolute top-0 right-0 h-[40vh] w-[40vh] rounded-full bg-[conic-gradient(from_0deg,rgba(255,255,255,0.18),transparent_60%)] blur-2xl opacity-50 animate-[spin_60s_linear_infinite]" />
//       <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
//     </div>
//   );
// }
// function BokehLights() {
//   const dots = Array.from({ length: 12 }).map((_, i) => ({ id: i, x: Math.random() * 100, y: Math.random() * 100, s: 80 + Math.random() * 140, o: 0.22 + Math.random() * 0.3 }));
//   return (
//     <div className="absolute inset-0">
//       {dots.map((d) => (
//         <span key={d.id} className="absolute rounded-full bg-white" style={{ left: `${d.x}%`, top: `${d.y}%`, width: d.s, height: d.s, opacity: d.o, filter: 'blur(18px)' }} />
//       ))}
//     </div>
//   );
// }
// function StarField() {
//   const stars = useMemo(() => Array.from({ length: 120 }).map((_, i) => ({ id: i, x: Math.random() * 100, y: Math.random() * 100, s: Math.random() * 2 + 0.5 })), []);
//   return (
//     <div className="absolute inset-0">
//       {stars.map((s) => (
//         <span key={s.id} className="absolute bg-white" style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.s, height: s.s, borderRadius: s.s, opacity: 0.75 }} />
//       ))}
//     </div>
//   );
// }

// /* ------------------------------- Particles ------------------------------- */
// function FloatingSparkles({ started }) {
//   const count = 28;
//   const items = useMemo(() => Array.from({ length: count }).map((_, i) => ({ id: i, left: Math.random() * 100, size: 10 + Math.random() * 18, delay: Math.random() * 8, duration: 16 + Math.random() * 12, drift: (Math.random() * 40 - 20).toFixed(1) })), []);
//   return (
//     <div className="pointer-events-none absolute inset-0 -z-0 overflow-hidden">
//       {items.map((it) => (
//         <div key={it.id} style={{ position: 'absolute', bottom: -40, left: `${it.left}vw`, width: it.size, height: it.size, animation: `floatUp ${it.duration}s linear ${it.delay}s infinite` }}>
//           <div style={{ animation: `drift ${it.duration}s ease-in-out ${it.delay}s infinite alternate`, ['--drift']: `${it.drift}px`, filter: started ? 'none' : 'blur(1px)' }}>
//             <Sparkle />
//           </div>
//         </div>
//       ))}
//       <style>{`
//         @keyframes floatUp { 0%{ transform: translateY(10vh) scale(1); opacity:0 } 10%{ opacity:.9 } 100%{ transform: translateY(-120vh) scale(1.05); opacity:0 } }
//         @keyframes drift { 0%{ transform: translateX(0) } 100%{ transform: translateX(var(--drift, 20px)) } }
//       `}</style>
//     </div>
//   );
// }
// function Sparkle() {
//   return (
//     <svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M12 2l2.2 5.5L20 9l-5.5 1.5L12 16l-2.5-5.5L4 9l5.8-1.5L12 2z" fill="rgba(255,255,255,.85)" /></svg>
//   );
// }

// /* --------------------------- Rising Photo Particles (Intro) ----------------------- */
// function RisingPhotoParticles({ images, count = 10 }) {
//   const uniqueSrcs = useMemo(() => sampleArray(images, Math.min(count, images.length || 0)), [images, count]);

//   const items = useMemo(() => {
//     const n = uniqueSrcs.length;
//     const phi = 0.61803398875;
//     return Array.from({ length: n }).map((_, i) => {
//       const laneCenter = ((i + 0.5) * (100 / n));
//       const jitter = (Math.random() * 6 - 3);
//       const left = Math.max(6, Math.min(94, laneCenter + jitter));

//       const size = 54 + Math.random() * 36;
//       const duration = 18 + Math.random() * 8;
//       const delay = (i * 0.45) + (Math.random() * 1);
//       const ampX = 20 + Math.random() * 28;
//       const rotAmp = 6 + Math.random() * 7;
//       const rotDir = Math.random() < 0.5 ? -1 : 1;
//       const depth = Math.random();
//       const zIndex = 1000 + Math.round(depth * 500);
//       const scaleBase = 0.96 + depth * 0.12;

//       const phase = (i * phi - Math.floor(i * phi)) * 2 * Math.PI;

//       return { id: i, src: uniqueSrcs[i], left, size, duration, delay, ampX, rotAmp: rotAmp * rotDir, phase, zIndex, scaleBase };
//     });
//   }, [uniqueSrcs]);

//   return (
//     <div className="pointer-events-none absolute inset-0 -z-0 overflow-hidden">
//       {items.map((it) => (
//         <div key={it.id} style={{
//           position: 'absolute', bottom: '-140px', left: `${it.left}vw`,
//           width: it.size, height: (it.size * 2) / 3, zIndex: it.zIndex,
//           ['--scaleBase']: it.scaleBase,
//           animation: `floatUp3 ${it.duration}s cubic-bezier(.25,.1,.1,1) ${it.delay}s infinite`,
//           opacity: 0, willChange: 'transform, opacity',
//         }}>
//           <div style={{ animation: `drift3 ${it.duration * 0.9}s ease-in-out ${it.delay}s infinite alternate`, ['--ampX']: `${it.ampX}px`, ['--phase']: `${it.phase}rad`, willChange: 'transform' }}>
//             <div style={{ animation: `wobble3 ${it.duration * 0.8}s ease-in-out ${it.delay + 0.2}s infinite alternate`, ['--rotAmp']: `${it.rotAmp}deg`, willChange: 'transform' }}>
//               <div className="rounded-xl overflow-hidden border backdrop-blur" style={{ width: '100%', height: '100%', borderColor: 'rgba(255,255,255,0.35)', background: 'rgba(255,255,255,0.08)', boxShadow: '0 10px 22px rgba(0,0,0,0.25)' }}>
//                 <img src={it.src} alt="floating" className="h-full w-full object-cover" />
//               </div>
//             </div>
//           </div>
//         </div>
//       ))}

//       <style>{`
//         @keyframes floatUp3 {
//           0%   { transform: translate3d(0, 14vh, 0) scale(var(--scaleBase, 1)); opacity: 0 }
//           12%  { opacity: .95 }
//           60%  { opacity: .95 }
//           100% { transform: translate3d(0, -145vh, 0) scale(var(--scaleBase, 1.04)); opacity: 0 }
//         }
//         @keyframes drift3 {
//           0%   { transform: translate3d(calc(var(--ampX, 24px) * sin(var(--phase, 0rad))), 0, 0) }
//           50%  { transform: translate3d(calc(var(--ampX, 24px) * sin(calc(var(--phase, 0rad) + 1.57rad))), 0, 0) }
//           100% { transform: translate3d(calc(var(--ampX, 24px) * sin(calc(var(--phase, 0rad) + 3.14rad))), 0, 0) }
//         }
//         @keyframes wobble3 {
//           0%   { transform: rotate(calc(var(--rotAmp, 8deg) * -1)) }
//           100% { transform: rotate(calc(var(--rotAmp, 8deg) * 1)) }
//         }
//       `}</style>
//     </div>
//   );
// }

// /* ------------------------------- Confetti -------------------------------- */
// function ConfettiBurst() {
//   const pieces = useMemo(() => Array.from({ length: 90 }).map((_, i) => ({ id: i, x: Math.random() * 100, y: Math.random() * 40 + 10, size: Math.random() * 7 + 4, rot: Math.random() * 360, dur: 1.4 + Math.random() * 0.8, delay: Math.random() * 0.25, hue: Math.floor(Math.random() * 360) })), []);
//   return (
//     <motion.div className="pointer-events-none absolute inset-0" initial={{ opacity: 1 }} animate={{ opacity: 0 }} exit={{ opacity: 0 }} transition={{ duration: 2.0, ease: 'easeOut' }}>
//       {pieces.map((p) => (
//         <motion.span key={p.id} initial={{ x: `${p.x}vw`, y: `${p.y}vh`, rotate: p.rot, scale: 1 }} animate={{ y: `${p.y + 54}vh`, rotate: p.rot + 360 }} transition={{ duration: p.dur, delay: p.delay, ease: 'easeOut' }} style={{ position: 'absolute', width: p.size, height: p.size, background: `hsl(${p.hue} 80% 60%)`, borderRadius: 2 }} />
//       ))}
//     </motion.div>
//   );
// }
// function FooterSignature() {
//   return (
//     <div className="absolute bottom-2 left-0 right-0 z-10 text-center text-[11px] opacity-70">
//       Made with ❤ — Chúc 20/10 thật hạnh phúc
//     </div>
//   );
// }

// /* --------------------------------- Icons/Utils --------------------------------- */
// function EnvelopeIcon({ className = 'h-6 w-6' }) {
//   return (
//     <svg viewBox="0 0 64 64" className={className} fill="currentColor">
//       <path d="M8 16h48a4 4 0 0 1 4 4v24a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V20a4 4 0 0 1 4-4Z" opacity=".85" />
//       <path d="M12 20l20 16a4 4 0 0 0 5 0L56 20" fill="white" opacity=".8" />
//       <path d="M12 20l40 24M52 20 12 44" stroke="white" strokeWidth="2" fill="none" />
//     </svg>
//   );
// }
// function Icon({ type, className = 'h-6 w-6' }) {
//   if (type === 'music') return <SvgMusic className={className} />;
//   if (type === 'mute') return <SvgMute className={className} />;
//   return <SvgMusic className={className} />;
// }
// function SvgMusic({ className }) {
//   return (
//     <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 18a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm6-2V6l5-1v10" /></svg>
//   );
// }
// function SvgMute({ className }) {
//   return (
//     <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 10v4h3l4 3V7L7 10H4Z" /><path d="m16 9 5 6M21 9l-5 6" /></svg>
//   );
// }
// function PulseHalo({ size = 112 }) {
//   return (
//     <div className="absolute inset-0 grid place-items-center">
//       <span className="absolute inline-block rounded-full bg-white/30 blur-lg" style={{ height: size, width: size }} />
//       <span className="absolute rounded-full border-2 border-white/70" style={{ height: size, width: size, animation: 'pulseHalo 2.1s ease-in-out infinite' }} />
//     </div>
//   );
// }

import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * LoveGift20_10 — Galaxy + Blooming Flower + Top Horizontal Timeline + Spinning Image Ring
 * - Intro: nút bức thư (pastel).
 * - Màn 2: nền galaxy; hoa nở phía dưới ring; cột thời gian HORIZONTAL ở trên (ảnh so le trên/ dưới đường) chạy vô hạn.
 * - Nhạc auto sau khi bấm, confetti khi mở.
 */

// ====== ẢNH (thay đường dẫn theo project bạn) ======
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

const AUDIO_SRC = `https://res.cloudinary.com/dvueewtsp/video/upload/v1761029535/QR_Trash/2010_pdekxl.mp3`;

const ALL_IMAGES = [
  tn1, tn2, tn3, tn4, tn5, tn6, tn7, tn8, tn9, tn10, tn11, tn12, tn13, tn14, tn15, tn16,
  tn17, tn18, tn19, tn20, tn21, tn22, tn23, tn24, tn25, tn26, tn27, tn28, tn29, tn30,
  tn31, tn32, tn33, tn34, tn35, tn36, tn37, tn38, tn39, tn40, tn41, tn42, tn43, tn44,
  tn45, tn46, tn47, tn48, tn49, tn50, tn51, tn52, tn53, tn54, tn55, tn56,
];

// ====== Helpers ======
function sampleArray(arr, n) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.slice(0, n);
}
function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }
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
function useHasMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}

// ====== Root ======
export default function LoveGift20_10() {
  const mounted = useHasMounted();
  const { vw } = useViewport();
  const [started, setStarted] = useState(false);
  const [muted, setMuted] = useState(false);
  const mediaRef = useRef(null);

  // unlock audio sau 1 click
  useEffect(() => {
    const oneClick = () => {
      const m = mediaRef.current;
      if (!m) return;
      m.muted = false;
      m.volume = 0.6;
      m.play().catch(() => {});
    };
    window.addEventListener("click", oneClick, { once: true });
    return () => window.removeEventListener("click", oneClick);
  }, []);

  useEffect(() => {
    if (!started || !mediaRef.current) return;
    const m = mediaRef.current;
    m.muted = muted;
    m.volume = 0.5;
    m.play().catch(() => {});
  }, [started, muted]);

  const startExperience = async () => {
    setStarted(true);
    const m = mediaRef.current;
    if (!m) return;
    try {
      m.muted = false;
      m.volume = 0.6;
      await m.play();
    } catch(e) { console.warn(e); }
  };

  const [burstKey, setBurstKey] = useState(0);
  useEffect(() => { if (started) setBurstKey(k => k + 1); }, [started]);

  return (
    <div className={`relative min-h-screen w-full overflow-hidden ${started ? 'text-slate-100' : 'text-slate-800'}`}>
      {!started ? <SoftIntroBG /> : <GalaxySunBG />}

      <FloatingSparkles started={started} />

      <div className="absolute inset-0 grid place-items-center">
        {!started ? (
          <IntroLetter startExperience={startExperience} />
        ) : (
          <AfterOpenScene vw={vw} muted={muted} onToggleMute={() => setMuted(m => !m)} />
        )}
      </div>

      <audio ref={mediaRef} src={AUDIO_SRC} loop preload="auto" playsInline />

      {!started && mounted && <RisingPhotoParticles images={ALL_IMAGES} count={16} />}

      <AnimatePresence>{started && <ConfettiBurst key={burstKey} />}</AnimatePresence>
      <FooterSignature />
    </div>
  );
}

// ====== Intro ======
function IntroLetter({ startExperience }) {
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
            onClick={startExperience}
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

// ====== Scene 2 ======
function AfterOpenScene({ vw, muted, onToggleMute }) {
  const [show, setShow] = useState(false);
  useEffect(() => { const t = setTimeout(() => setShow(true), 700); return () => clearTimeout(t); }, []);

  // Ảnh cho ring và timeline trên
  const ringImages = useMemo(() => sampleArray(ALL_IMAGES, 12), []);
  const topImages = useMemo(() => sampleArray(ALL_IMAGES, 18), []);

  // Kích thước ring
  const baseR = useMemo(() => clamp(Math.min(vw * 0.36, 320), 130, 300), [vw]);
  const cardW = useMemo(() => clamp(vw < 380 ? 112 : vw < 480 ? 132 : vw < 768 ? 168 : 208, 104, Math.floor(baseR * 0.88)), [vw, baseR]);
  const cardH = Math.floor(cardW * 0.64);

  // Ticker phía trên
  const tickW = clamp(vw < 380 ? 86 : vw < 520 ? 96 : vw < 768 ? 112 : 124, 82, 140);
  const tickH = Math.floor(tickW * 0.64);

  return (
    <>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55 }}
        className="relative z-10 w-full px-4 text-center"
      >
        <h2 className="text-3xl md:text-4xl font-black tracking-tight drop-shadow">Happy 20/10</h2>
      </motion.div>

      {/* Top Horizontal Timeline */}
      {show && (
  <TopHorizontalTimeline
    images={topImages}
    cardW={ tickW }               // bạn đang tính tickW/ tickH sẵn
    cardH={ tickH }
    gap={18}
    amplitude={Math.floor(tickH * 0.55)}
    duration={36}
  />
)}


      {/* Ring + Flower */}
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, scale: 0.985 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="fixed inset-0 z-[6] grid place-items-center"
          >
            {/* Hoa: NGẮN & ở dưới ring (z thấp hơn) */}
            <BloomingFlower
              size={clamp(vw * 0.16, 120, 180)}
              className="z-[5]"
            />

            {/* Ring ở giữa */}
            <RingClean images={ringImages} baseR={baseR} cardW={cardW} cardH={cardH} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controls */}
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

// ====== Ring ======
function RingClean({ images, baseR, cardW, cardH }) {
  const [ang, setAng] = useState(0);
  const [hover, setHover] = useState(null);
  const speed = 0.018;
  const squash = 0.36;
  const zBase = 1000;

  useEffect(() => {
    let raf = 0, last = performance.now();
    const tick = (t) => { const dt = t - last; last = t; setAng(a => a + dt * speed); raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const ringW = Math.ceil(baseR * 2 + cardW * 1.2);
  const ringH = Math.ceil(baseR * 1.08 + cardH + 50);

  const items = useMemo(() => {
    const step = 360 / Math.max(images.length, 1);
    return images.map((src, i) => {
      const a = (ang + i * step) * (Math.PI / 180);
      const x = Math.cos(a) * baseR;
      const y = Math.sin(a) * baseR * squash;
      const z = Math.sin(a) * baseR;
      const t = (z + baseR) / (2 * baseR); // 0..1 depth
      const scale = 0.84 + 0.22 * t;
      const op = 0.55 + 0.43 * t;
      return { i, src, x, y, z, scale, op };
    });
  }, [images, ang, baseR]);

  return (
    <div className="relative" style={{ width: ringW, height: ringH }}>
      {/* vòng gợi ý mờ */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
           style={{
             width: baseR * 2.06,
             height: baseR * 2.06 * 0.36,
             border: '1px dashed rgba(255,255,255,0.12)',
             filter: 'blur(.2px)',
           }}
      />
      {/* halo */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full blur-2xl"
           style={{
             width: baseR * 1.62,
             height: baseR * 1.62 * 0.36,
             background: 'radial-gradient(closest-side, rgba(255,255,255,.2), transparent 70%)',
             opacity: .35
           }}
      />

      <div className="absolute inset-0">
        {items.map(({ i, src, x, y, z, scale, op }) => (
          <div key={i} className="absolute left-1/2 top-1/2"
               style={{ transform: 'translate(-50%, -50%)', zIndex: zBase + Math.round(z) }}
               onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
            <motion.div
              animate={{ x, y, scale: hover === i ? scale * 1.1 : scale, opacity: hover === i ? 1 : op }}
              transition={{ type: 'spring', stiffness: 120, damping: 16 }}
            >
              <div
                className="rounded-2xl overflow-hidden border backdrop-blur bg-white/10"
                style={{
                  width: cardW, height: cardH,
                  borderColor: 'rgba(255,255,255,0.35)',
                  boxShadow: '0 12px 28px rgba(0,0,0,.22), inset 0 0 0 1px rgba(255,255,255,.06)'
                }}
              >
                <img src={src} alt={`mem-${i}`} className="h-full w-full object-cover select-none" draggable={false}/>
              </div>
            </motion.div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ====== Top Horizontal Timeline ======
/* ==================== Top Horizontal Timeline (fixed) ==================== */

/* ==================== Top Horizontal Timeline (Framer Motion marquee) ==================== */

function TopHorizontalTimeline({
  className = "",
  images,
  cardW = 110,
  cardH = 70,
  gap = 16,
  amplitude = 38,
  duration = 36, // giây/ vòng
}) {
  const track = useMemo(() => {
    const max = Math.min(images?.length ?? 0, 24);
    return (images ?? []).slice(0, max);
  }, [images]);

  if (!track.length) return null;

  const trackWidth = (cardW + gap) * track.length;

  return (
    <div className={`${className} pointer-events-none`}>
      {/* wrapper full viewport, cố định & căn giữa tuyệt đối */}
      <div
        style={{
          position: "fixed",
          left: "50%",
          transform: "translateX(-50%)",
          top: 64,            // chỉnh nếu header cao hơn
          width: "100vw",
          zIndex: 7,
        }}
      >
        {/* khung có chiều cao cố định theo cardH + amplitude*2 */}
        <div
          style={{
            position: "relative",
            width: "100%",
            height: cardH + amplitude * 2,
            overflow: "hidden",
            WebkitMaskImage:
              "linear-gradient(to right, transparent 0%, black 6%, black 94%, transparent 100%)",
            maskImage:
              "linear-gradient(to right, transparent 0%, black 6%, black 94%, transparent 100%)",
          }}
        >
          {/* line giữa */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              top: "50%",
              transform: "translateY(-50%)",
              height: 2,
              background: "rgba(255,255,255,0.35)",
              borderRadius: 2,
            }}
          >
            <span
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: 0,
                height: 2,
                background:
                  "linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.7), rgba(255,255,255,0))",
                filter: "blur(1px)",
              }}
            />
          </div>

          {/* vùng chứa track, luôn căn giữa theo trục dọc */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
            }}
          >
            <motion.div
              style={{
                display: "flex",
                alignItems: "center",
                height: "100%",          // rất quan trọng để center theo chiều dọc
                willChange: "transform",
              }}
              animate={{ x: [0, -trackWidth] }}
              transition={{ duration, ease: "linear", repeat: Infinity }}
            >
              <TickerRow
                track={track}
                cardW={cardW}
                cardH={cardH}
                gap={gap}
                amplitude={amplitude}
              />
              <TickerRow
                track={track}
                cardW={cardW}
                cardH={cardH}
                gap={gap}
                amplitude={amplitude}
              />
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TickerRow({ track, cardW, cardH, gap, amplitude }) {
  return (
    <div style={{ display: "flex", alignItems: "center", height: "100%" }}>
      {track.map((src, i) => {
        const above = i % 2 === 0; // so le trên/ dưới
        const dy = above ? -amplitude : amplitude;
        return (
          <div
            key={`tick-${i}`}
            style={{
              marginRight: gap,
              // dịch đúng từ TÂM: parent đã alignItems:'center', nên chỉ cần translateY(dy)
              transform: `translateY(${dy}px)`,
            }}
          >
            <div
              className="rounded-xl overflow-hidden border backdrop-blur bg-white/10"
              style={{
                width: cardW,
                height: cardH,
                borderColor: "rgba(255,255,255,0.26)",
                boxShadow:
                  "0 10px 22px rgba(0,0,0,.22), inset 0 0 0 1px rgba(255,255,255,.05)",
              }}
            >
              <img
                src={src}
                alt={`tick-${i}`}
                className="h-full w-full object-cover select-none"
                draggable={false}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ====== Blooming Flower — SHORT version (ở dưới ring) ======
function BloomingFlower({ size = 150, className = "" }) {
  // làm hoa NGẮN hơn: stem thấp
  const stemH = size * 1.05; // ngắn hơn trước
  const potW = size * 0.68;

  return (
    <div className={`pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 ${className}`} style={{ width: size * 2, height: stemH + size * 0.6 }}>
      {/* chậu nhỏ mờ */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2">
        <div
          className="rounded-2xl"
          style={{
            width: potW, height: potW*0.36,
            background: 'linear-gradient(to bottom, rgba(255,255,255,.35), rgba(255,255,255,.15))',
            boxShadow: '0 8px 22px rgba(0,0,0,.28)',
            border: '1px solid rgba(255,255,255,.35)'
          }}
        />
      </div>

      {/* thân cây NGẮN, đung đưa nhẹ */}
      <motion.div
        className="absolute bottom-[12%] left-1/2 -translate-x-1/2 origin-bottom"
        initial={{ scaleY: 0.1 }}
        animate={{ scaleY: 1 }}
        transition={{ duration: 1.4, ease: [0.2, 0.9, 0.2, 1] }}
        style={{
          width: 6, height: stemH,
          borderRadius: 999,
          background: 'linear-gradient(to top, #6cd06c, #a8efb2)',
          filter: 'drop-shadow(0 6px 16px rgba(0,0,0,.25))'
        }}
      />

      {/* lá ngắn gọn */}
      <Leaf angle={-16} dist={stemH * 0.38} size={size * 0.26} dir={-1} />
      <Leaf angle={14} dist={stemH * 0.56} size={size * 0.3} dir={1} />

      {/* bông hoa nở ở đỉnh thân (ngắn) */}
      <motion.div
        className="absolute bottom-[calc(12%+var(--stemH))] left-1/2"
        style={{ '--stemH': `${stemH}px` }}
      >
        <motion.div
          initial={{ y: 0, x: '-50%', rotate: 0, scale: 0.1, opacity: 0 }}
          animate={{ y: -stemH, x: '-50%', rotate: [0, -2.8, 2.8, 0], scale: 1, opacity: 1 }}
          transition={{ duration: 1.6, ease: 'easeOut', rotate: { repeat: Infinity, duration: 6, ease: 'easeInOut' } }}
          className="relative"
          style={{ width: size, height: size }}
        >
          <GalaxyFlower size={size} animatePulse />
        </motion.div>
      </motion.div>
    </div>
  );
}

function Leaf({ angle = -15, dist = 120, size = 60, dir = 1 }) {
  return (
    <motion.div
      className="absolute bottom-[12%] left-1/2 -translate-x-1/2 origin-left"
      initial={{ rotate: angle, opacity: 0 }}
      animate={{ rotate: [angle - 2*dir, angle + 2*dir, angle - 2*dir], opacity: 1 }}
      transition={{ duration: 5.2, repeat: Infinity, ease: 'easeInOut' }}
      style={{ transform: `translateX(-50%) rotate(${angle}deg)` }}
    >
      <div
        style={{
          width: size, height: size * 0.5,
          background: 'radial-gradient(closest-side, #c7ffd2, #6dd08b)',
          borderRadius: `${size}px ${size}px ${size}px ${size}px / ${size*0.6}px ${size*0.6}px ${size*0.4}px ${size*0.4}px`,
          transform: `translate(${dist}px, -${dist*0.06}px) rotate(${angle}deg)`,
          boxShadow: '0 10px 22px rgba(0,0,0,.22)',
          border: '1px solid rgba(255,255,255,.35)',
        }}
      />
    </motion.div>
  );
}

function GalaxyFlower({ size = 120, animatePulse = false }) {
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{ background: 'radial-gradient(circle at 50% 45%, #ffd6e7, #f0a3ff 40%, #8bc5ff 75%, transparent 76%)' }}
        animate={animatePulse ? { scale: [1, 1.06, 1] } : undefined}
        transition={{ duration: 2.4, repeat: animatePulse ? Infinity : 0 }}
      />
      {[0,1,2,3,4,5,6,7].map((p) => (
        <motion.span
          key={p}
          className="absolute left-1/2 top-1/2 block rounded-[46%]"
          style={{
            width: size * 0.52, height: size * 0.32,
            background: 'radial-gradient(closest-side, rgba(255,255,255,.9), rgba(255,200,240,.2))',
            transformOrigin: '0% 50%', filter: 'blur(0.2px)'
          }}
          animate={{ rotate: [p*45, p*45+360] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
        />
      ))}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-6 w-6 rounded-full bg-yellow-200 shadow-inner" />
    </div>
  );
}

// ====== Backgrounds ======
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
      <div className="absolute inset-0 bg-[radial-gradient(1000px_600px_at_20%_30%,rgba(255,220,150,0.30),transparent),radial-gradient(900px_800px_at_80%_20%,rgba(140,170,255,0.28),transparent),radial-gradient(800px_800px_at_50%_80%,rgba(255,150,200,0.22),transparent)]" />
      <StarField />
      <div className="absolute -top-20 -left-20 h-[60vh] w-[60vh] rounded-full bg-gradient-to-br from-yellow-200/60 via-rose-200/35 to-transparent blur-3xl opacity-70" />
      <div className="absolute top-0 right-0 h-[40vh] w-[40vh] rounded-full bg-[conic-gradient(from_0deg,rgba(255,255,255,0.18),transparent_60%)] blur-2xl opacity-50 animate-[spin_60s_linear_infinite]" />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  );
}
function BokehLights() {
  const dots = Array.from({ length: 12 }).map((_, i) => ({ id: i, x: Math.random() * 100, y: Math.random() * 100, s: 80 + Math.random() * 140, o: 0.22 + Math.random() * 0.3 }));
  return (
    <div className="absolute inset-0">
      {dots.map((d) => (
        <span key={d.id} className="absolute rounded-full bg-white" style={{ left: `${d.x}%`, top: `${d.y}%`, width: d.s, height: d.s, opacity: d.o, filter: 'blur(18px)' }} />
      ))}
    </div>
  );
}
function StarField() {
  const stars = useMemo(() => Array.from({ length: 120 }).map((_, i) => ({ id: i, x: Math.random() * 100, y: Math.random() * 100, s: Math.random() * 2 + 0.5 })), []);
  return (
    <div className="absolute inset-0">
      {stars.map((s) => (
        <span key={s.id} className="absolute bg-white" style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.s, height: s.s, borderRadius: s.s, opacity: 0.75 }} />
      ))}
    </div>
  );
}

// ====== Particles (intro) ======
function FloatingSparkles({ started }) {
  const count = 28;
  const items = useMemo(() => Array.from({ length: count }).map((_, i) => ({ id: i, left: Math.random() * 100, size: 10 + Math.random() * 18, delay: Math.random() * 8, duration: 16 + Math.random() * 12, drift: (Math.random() * 40 - 20).toFixed(1) })), []);
  return (
    <div className="pointer-events-none absolute inset-0 -z-0 overflow-hidden">
      {items.map((it) => (
        <div key={it.id} style={{ position: 'absolute', bottom: -40, left: `${it.left}vw`, width: it.size, height: it.size, animation: `floatUp ${it.duration}s linear ${it.delay}s infinite` }}>
          <div style={{ animation: `drift ${it.duration}s ease-in-out ${it.delay}s infinite alternate`, ['--drift']: `${it.drift}px`, filter: started ? 'none' : 'blur(1px)' }}>
            <Sparkle />
          </div>
        </div>
      ))}
      <style>{`
        @keyframes floatUp { 0%{ transform: translateY(10vh) scale(1); opacity:0 } 10%{ opacity:.9 } 100%{ transform: translateY(-120vh) scale(1.05); opacity:0 } }
        @keyframes drift { 0%{ transform: translateX(0) } 100%{ transform: translateX(var(--drift, 20px)) } }
      `}</style>
    </div>
  );
}
function Sparkle() {
  return (
    <svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M12 2l2.2 5.5L20 9l-5.5 1.5L12 16l-2.5-5.5L4 9l5.8-1.5L12 2z" fill="rgba(255,255,255,.85)" /></svg>
  );
}

// ====== Rising Photo Particles (intro bg) ======
function RisingPhotoParticles({ images, count = 10 }) {
  const uniqueSrcs = useMemo(() => sampleArray(images, Math.min(count, images.length || 0)), [images, count]);

  const items = useMemo(() => {
    const n = uniqueSrcs.length;
    const phi = 0.61803398875;
    return Array.from({ length: n }).map((_, i) => {
      const laneCenter = ((i + 0.5) * (100 / n));
      const jitter = (Math.random() * 6 - 3);
      const left = Math.max(6, Math.min(94, laneCenter + jitter));

      const size = 54 + Math.random() * 36;
      const duration = 18 + Math.random() * 8;
      const delay = (i * 0.45) + (Math.random() * 1);
      const ampX = 20 + Math.random() * 28;
      const rotAmp = 6 + Math.random() * 7;
      const rotDir = Math.random() < 0.5 ? -1 : 1;
      const depth = Math.random();
      const zIndex = 1000 + Math.round(depth * 500);
      const scaleBase = 0.96 + depth * 0.12;
      const phase = (i * phi - Math.floor(i * phi)) * 2 * Math.PI;

      return { id: i, src: uniqueSrcs[i], left, size, duration, delay, ampX, rotAmp: rotAmp * rotDir, phase, zIndex, scaleBase };
    });
  }, [uniqueSrcs]);

  return (
    <div className="pointer-events-none absolute inset-0 -z-0 overflow-hidden">
      {items.map((it) => (
        <div key={it.id} style={{
          position: 'absolute', bottom: '-140px', left: `${it.left}vw`,
          width: it.size, height: (it.size * 2) / 3, zIndex: it.zIndex,
          ['--scaleBase']: it.scaleBase,
          animation: `floatUp3 ${it.duration}s cubic-bezier(.25,.1,.1,1) ${it.delay}s infinite`,
          opacity: 0, willChange: 'transform, opacity',
        }}>
          <div style={{ animation: `drift3 ${it.duration * 0.9}s ease-in-out ${it.delay}s infinite alternate`, ['--ampX']: `${it.ampX}px`, ['--phase']: `${it.phase}rad`, willChange: 'transform' }}>
            <div style={{ animation: `wobble3 ${it.duration * 0.8}s ease-in-out ${it.delay + 0.2}s infinite alternate`, ['--rotAmp']: `${it.rotAmp}deg`, willChange: 'transform' }}>
              <div className="rounded-xl overflow-hidden border backdrop-blur" style={{ width: '100%', height: '100%', borderColor: 'rgba(255,255,255,0.35)', background: 'rgba(255,255,255,0.08)', boxShadow: '0 10px 22px rgba(0,0,0,0.25)' }}>
                <img src={it.src} alt="floating" className="h-full w-full object-cover" />
              </div>
            </div>
          </div>
        </div>
      ))}

      <style>{`
        @keyframes floatUp3 {
          0%   { transform: translate3d(0, 14vh, 0) scale(var(--scaleBase, 1)); opacity: 0 }
          12%  { opacity: .95 }
          60%  { opacity: .95 }
          100% { transform: translate3d(0, -145vh, 0) scale(var(--scaleBase, 1.04)); opacity: 0 }
        }
        @keyframes drift3 {
          0%   { transform: translate3d(calc(var(--ampX, 24px) * sin(var(--phase, 0rad))), 0, 0) }
          50%  { transform: translate3d(calc(var(--ampX, 24px) * sin(calc(var(--phase, 0rad) + 1.57rad))), 0, 0) }
          100% { transform: translate3d(calc(var(--ampX, 24px) * sin(calc(var(--phase, 0rad) + 3.14rad))), 0, 0) }
        }
        @keyframes wobble3 {
          0%   { transform: rotate(calc(var(--rotAmp, 8deg) * -1)) }
          100% { transform: rotate(calc(var(--rotAmp, 8deg) * 1)) }
        }
      `}</style>
    </div>
  );
}

// ====== Confetti & Footer ======
function ConfettiBurst() {
  const pieces = useMemo(() => Array.from({ length: 90 }).map((_, i) => ({ id: i, x: Math.random() * 100, y: Math.random() * 40 + 10, size: Math.random() * 7 + 4, rot: Math.random() * 360, dur: 1.4 + Math.random() * 0.8, delay: Math.random() * 0.25, hue: Math.floor(Math.random() * 360) })), []);
  return (
    <motion.div className="pointer-events-none absolute inset-0" initial={{ opacity: 1 }} animate={{ opacity: 0 }} exit={{ opacity: 0 }} transition={{ duration: 2.0, ease: 'easeOut' }}>
      {pieces.map((p) => (
        <motion.span key={p.id} initial={{ x: `${p.x}vw`, y: `${p.y}vh`, rotate: p.rot, scale: 1 }} animate={{ y: `${p.y + 54}vh`, rotate: p.rot + 360 }} transition={{ duration: p.dur, delay: p.delay, ease: 'easeOut' }} style={{ position: 'absolute', width: p.size, height: p.size, background: `hsl(${p.hue} 80% 60%)`, borderRadius: 2 }} />
      ))}
    </motion.div>
  );
}
function FooterSignature() {
  return (
    <div className="absolute bottom-2 left-0 right-0 z-10 text-center text-[11px] opacity-70">
      Made with ❤ — Chúc 20/10 thật hạnh phúc
    </div>
  );
}

// ====== Icons & utilities ======
function EnvelopeIcon({ className = 'h-6 w-6' }) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="currentColor">
      <path d="M8 16h48a4 4 0 0 1 4 4v24a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V20a4 4 0 0 1 4-4Z" opacity=".85" />
      <path d="M12 20l20 16a4 4 0 0 0 5 0L56 20" fill="white" opacity=".8" />
      <path d="M12 20l40 24M52 20 12 44" stroke="white" strokeWidth="2" fill="none" />
    </svg>
  );
}
function Icon({ type, className = 'h-6 w-6' }) {
  if (type === 'music') return <SvgMusic className={className} />;
  if (type === 'mute') return <SvgMute className={className} />;
  return <SvgMusic className={className} />;
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
function PulseHalo({ size = 112 }) {
  return (
    <div className="absolute inset-0 grid place-items-center">
      <span className="absolute inline-block rounded-full bg-white/30 blur-lg" style={{ height: size, width: size }} />
      <span className="absolute rounded-full border-2 border-white/70" style={{ height: size, width: size, animation: 'pulseHalo 2.1s ease-in-out infinite' }} />
    </div>
  );
}
