import React, { useMemo } from "react";

/**
 * MidAutumnLanternBackground (no-click version)
 * ------------------------------------------------------------
 * React + Tailwind component that paints a Mid-Autumn (Trung Thu)
 * night sky with a more realistic glowing moon and prettier lanterns.
 * - Lanterns float straight up or diagonally (randomized) with gentle sway.
 * - No click / modal anymore.
 *
 * Props:
 *  - count: number     (how many lanterns). Default: 60
 *  - className: string (extra classes for the wrapper)
 */

export default function MidAutumnLanternBackground({
  count = 60,
  className = "h-[520px] w-full"
}) {
  // Random lanterns: position, size, speed, direction
  const lanterns = useMemo(() => {
    const arr = [];
    for (let i = 0; i < count; i++) {
      const left = Math.random() * 100; // vw%
      const size = 16 + Math.random() * 26; // px
      const duration = 14 + Math.random() * 18; // s
      const delay = Math.random() * 12; // s
      const diagonal = Math.random() < 0.55; // mix of up and diagonal
      const drift = (Math.random() * 22 - 11).toFixed(2); // -11..11 vw drift
      const wobble = 2 + Math.random() * 4; // sway amplitude
      arr.push({ left, size, duration, delay, diagonal, drift, wobble });
    }
    return arr;
  }, [count]);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Night sky gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(20,24,42,0.9),transparent_55%),linear-gradient(to_bottom,#050814,#081127_35%,#0b1430_70%,#0a1025)]" />

      {/* Stars (parallax sparkle) */}
      <div className="pointer-events-none absolute inset-0">
        <Stars density={150} blur className="opacity-70" />
        <Stars density={110} className="opacity-50" />
      </div>

      {/* Realistic Moon */}
      <Moon className="absolute right-5 top-5 md:right-8 md:top-6" />

      {/* Lanterns */}
      <div className="absolute inset-0 pointer-events-none">
        {lanterns.map((l, idx) => (
          <div
            key={idx}
            className="absolute"
            style={{
              left: `${l.left}vw`,
              bottom: `-${28 + Math.random() * 44}px`,
              animation: `${l.diagonal ? "float-diag" : "float-up"} ${l.duration}s linear ${l.delay}s infinite, sway ${l.wobble}s ease-in-out ${Math.random()}s infinite alternate`,
              transformOrigin: "50% 100%",
            }}
          >
            <Lantern size={l.size} />
          </div>
        ))}
      </div>

      {/* Soft vignette edges */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_62%,rgba(0,0,0,0.38))]" />

      {/* Keyframes */}
      <style>{`
        @keyframes float-up {
          0% { transform: translate3d(0, 24vh, 0) rotate(0.2deg); opacity: 0; }
          12% { opacity: 1; }
          100% { transform: translate3d(0, -112vh, 0) rotate(-0.2deg); opacity: 0.7; }
        }
        @keyframes float-diag {
          0% { transform: translate3d(0, 26vh, 0) rotate(-0.2deg); opacity: 0; }
          12% { opacity: 1; }
          100% { transform: translate3d(var(--drift, 12vw), -116vh, 0) rotate(0.3deg); opacity: 0.7; }
        }
        @keyframes sway {
          from { transform: translateX(-1px) rotate(-1.2deg); }
          to   { transform: translateX(1px) rotate(1.2deg); }
        }
        @keyframes flame {
          0%, 100% { transform: scaleY(1) translateY(0); opacity: .95; }
          50%      { transform: scaleY(1.12) translateY(-1px); opacity: 1; }
        }
      `}</style>

      {/* Inject CSS variables for each lantern's drift */}
      <style>{lanterns
        .map((l, i) => `.absolute:nth-of-type(${i+1}){ --drift: ${l.drift}vw; }`)
        .join("")}
      </style>
    </div>
  );
}

/* -------------------- Subcomponents -------------------- */
function Stars({ density = 120, blur = false, className = "" }) {
  const stars = useMemo(() =>
    Array.from({ length: density }).map(() => ({
      left: Math.random() * 100,
      top: Math.random() * 100,
      size: Math.random() * 2 + 0.6,
      twinkle: 2 + Math.random() * 3,
      delay: Math.random() * 4,
    })), [density]
  );
  return (
    <div className={`absolute inset-0 ${className}`}> 
      {stars.map((s, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            left: `${s.left}%`,
            top: `${s.top}%`,
            width: `${s.size}px`,
            height: `${s.size}px`,
            backgroundColor: "white",
            filter: blur ? "blur(1px)" : "none",
            opacity: 0.75,
            animation: `twinkle ${s.twinkle}s ease-in-out ${s.delay}s infinite alternate`,
          }}
        />
      ))}
      <style>{`
        @keyframes twinkle { from { opacity: 0.3; } to { opacity: 0.95; } }
      `}</style>
    </div>
  );
}

function Lantern({ size = 24 }) {
  const s = size;
  return (
    <div className="relative" style={{ width: s, height: s * 1.55 }}>
      {/* subtle outer glow */}
      <div
        className="absolute -inset-2 rounded-xl"
        style={{
          background: `radial-gradient(circle at 50% 70%, rgba(255,170,70,.35), rgba(255,130,40,.15) 35%, rgba(255,110,30,0) 70%)`,
          filter: "blur(6px)",
        }}
      />
      <svg viewBox="0 0 52 74" width={s} height={s * 1.55} className="relative z-10">
        <defs>
          {/* warmer body gradient with inner glow */}
          <linearGradient id="bodyWarm" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFC889"/>
            <stop offset="55%" stopColor="#FF9A47"/>
            <stop offset="100%" stopColor="#D2611E"/>
          </linearGradient>
          <radialGradient id="innerGlow" cx="50%" cy="70%" r="65%">
            <stop offset="0%" stopColor="rgba(255,230,180,0.95)"/>
            <stop offset="60%" stopColor="rgba(255,220,150,0.35)"/>
            <stop offset="100%" stopColor="rgba(255,220,150,0)"/>
          </radialGradient>
        </defs>
        {/* rope */}
        <path d="M26 0 v10" stroke="#b37a52" strokeWidth="2" strokeLinecap="round" />
        {/* top cap */}
        <rect x="12" y="10" width="28" height="5" rx="2.5" fill="#3F2D27"/>
        {/* body */}
        <rect x="9" y="15" width="34" height="44" rx="12" fill="url(#bodyWarm)" stroke="#a25022" strokeWidth="1.2"/>
        {/* inner glow overlay */}
        <rect x="9" y="15" width="34" height="44" rx="12" fill="url(#innerGlow)" />
        {/* ribs */}
        {[23,31,39,47,55].map((y)=> (
          <rect key={y} x="12" y={y} width="28" height="2" rx="1" fill="#F08A3C" opacity=".85"/>
        ))}
        {/* base wood */}
        <rect x="16" y="59" width="20" height="7" rx="3.5" fill="#3F2D27"/>
        {/* flame (animated) */}
        <g transform="translate(0,4)">
          <ellipse cx="26" cy="55" rx="3.4" ry="5.8" fill="#FFE1A8" style={{animation: "flame 1.6s ease-in-out infinite"}}/>
          <ellipse cx="26" cy="56" rx="1.7" ry="3.8" fill="#FFF8DC" style={{animation: "flame 1.6s ease-in-out infinite .2s"}}/>
        </g>
      </svg>
    </div>
  );
}

function Moon({ className = "" }) {
  return (
    <div className={`relative ${className}`}>
      {/* glow halo layers */}
      <div className="absolute -inset-10 rounded-full" style={{
        boxShadow: "0 0 80px 20px rgba(255,255,235,0.18), 0 0 160px 70px rgba(245,245,220,0.10)",
        filter: "blur(1px)",
      }} />
      <svg width="160" height="160" viewBox="0 0 160 160" className="relative">
        <defs>
          <radialGradient id="moonGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff"/>
            <stop offset="65%" stopColor="#e9e9e4"/>
            <stop offset="100%" stopColor="#d9d9d1"/>
          </radialGradient>
        </defs>
        {/* disc */}
        <circle cx="80" cy="80" r="58" fill="url(#moonGrad)" />
        {/* subtle shading */}
        <ellipse cx="70" cy="60" rx="58" ry="58" fill="rgba(0,0,0,0.06)" />
        {/* soft craters */}
        {[
          [52,68,6,0.22],[96,72,8,0.18],[72,92,5,0.16],
          [102,50,4,0.15],[60,108,7,0.14]
        ].map(([cx,cy,r,o],i)=> (
          <circle key={i} cx={cx} cy={cy} r={r} fill={`rgba(0,0,0,${o})`} style={{mixBlendMode:"multiply"}} />
        ))}
        {/* highlight rim */}
        <circle cx="80" cy="80" r="58" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1" />
      </svg>
    </div>
  );
}
