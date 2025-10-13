import React, { useEffect, useMemo, useState } from "react";

import cayquytImg from '~/assets/imgs/cayquyt.png';
import caydaoImg from '~/assets/imgs/caydao.png';

/**
 * TetSpringBackground
 * - Bầu trời xanh sáng + mặt trời + mây bay qua lại
 * - Bao lì xì rơi + hoa mai rơi
 * - Dưới đất sương mờ + lấp lánh nhẹ
 * - Góc trái: Cây quýt (ảnh); Góc phải: Cây đào (ảnh) hoặc Cây cúc (SVG)
 */
export default function TetSpringBackground({
  className = "h-full w-full",
  envelopeCount = 40,
  flowerCount = 100,
  rightTree = "peach", // "peach" | "chrysanthemum"
}) {
  /* --- restart animation on resize (C) --- */
  const [animVersion, setAnimVersion] = useState(0);
  useEffect(() => {
    let raf = 0;
    const onResize = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setAnimVersion(v => v + 1));
    };
    window.addEventListener("resize", onResize);
    // chạy 1 lần sau mount để chắc chắn tính đúng khi layout/ảnh vừa load
    const t = setTimeout(() => setAnimVersion(v => v + 1), 0);
    return () => {
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(raf);
      clearTimeout(t);
    };
  }, []);

  /* --- particles --- */
  const envelopes = useMemo(() => {
    return Array.from({ length: envelopeCount }).map(() => ({
      left: Math.random() * 100,             // vw
      size: 26 + Math.random() * 14,         // px
      rot: (Math.random() * 40 - 20).toFixed(1), // initial rotate
      duration: 8 + Math.random() * 8,       // s
      delay: Math.random() * 8,              // s
      drift: (Math.random() * 18 - 9).toFixed(2), // vw
      sway: 2 + Math.random() * 3.2,         // s
      spin: 4 + Math.random() * 6,           // s
    }));
  }, [envelopeCount]);

  const flowers = useMemo(() => {
    return Array.from({ length: flowerCount }).map(() => ({
      left: Math.random() * 100,
      size: 12 + Math.random() * 12,
      duration: 10 + Math.random() * 14,
      delay: Math.random() * 10,
      drift: (Math.random() * 22 - 11).toFixed(2),
      sway: 2 + Math.random() * 3,
      spin: 6 + Math.random() * 8,
    }));
  }, [flowerCount]);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* SKY (sky-blue brighter, trong) */}
      <div className="absolute inset-0">
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg,#EAF6FF 0%,#D5EEFF 28%,#BFE4FF 60%,#A9DAFF 80%,#9FD4FF 100%)",
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(1200px 600px at 30% -10%, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.12) 45%, rgba(255,255,255,0) 70%)",
            filter: "blur(10px)",
            opacity: 0.9,
          }}
        />
      </div>

      {/* Sun + Clouds */}
      <Sun size={70} className="absolute top-6 left-8" />
      <Clouds className="absolute inset-x-0 top-6" />
      <Clouds className="absolute inset-x-0 top-20 opacity-80" slower />

      {/* Falling red envelopes */}
      <div className="absolute inset-0 pointer-events-none">
        {envelopes.map((e, i) => (
          <div
            key={`env-${animVersion}-${i}`}  /* ← thêm animVersion */
            className="absolute will-change-transform"
            style={{
              left: `${e.left}vw`,
              top: "-8vh",
              ["--fall-drift"]: `${e.drift}vw`,
              animation: `fall ${e.duration}s linear ${e.delay}s infinite`,
              transform: `rotate(${e.rot}deg)`,
            }}
          >
            <div
              className="will-change-transform"
              style={{
                animation: `sway ${e.sway}s ease-in-out ${e.delay * 0.3}s infinite alternate, spin ${e.spin}s linear ${e.delay * 0.2}s infinite`,
                transformOrigin: "50% 50%",
              }}
            >
              <RedEnvelope size={e.size} />
            </div>
          </div>
        ))}
      </div>

      {/* Falling mai blossoms */}
      <div className="absolute inset-0 pointer-events-none">
        {flowers.map((f, i) => (
          <div
            key={`fl-${animVersion}-${i}`}   /* ← thêm animVersion */
            className="absolute will-change-transform"
            style={{
              left: `${f.left}vw`,
              top: "-6vh",
              ["--fall-drift"]: `${f.drift}vw`,
              animation: `fall ${f.duration}s linear ${f.delay}s infinite`,
            }}
          >
            <div
              className="will-change-transform"
              style={{
                animation: `sway ${f.sway}s ease-in-out ${f.delay * 0.3}s infinite alternate, spin ${f.spin}s linear ${f.delay * 0.2}s infinite`,
                transformOrigin: "50% 50%",
              }}
            >
              <MaiFlower size={f.size} />
            </div>
          </div>
        ))}
      </div>

      {/* Ground + Decorations */}
      <Ground>
        {/* CÂY QUÝT (ảnh) */}
        <KumquatImageBL
          src={cayquytImg}
          scale={0.8}
          leftPct={1.4}
          bottomPct={3.5}
        />
        {/* CÂY ĐÀO (ảnh) hoặc CÚC (SVG) */}
        {rightTree === "peach" ? (
          <PeachImageBR
            src={caydaoImg}
            scale={0.8}
            rightPct={1.4}
            bottomPct={3.5}
          />
        ) : (
          <ChrysanthemumBR scale={1.08} rightPct={2.4} bottomPct={3.5} />
        )}
      </Ground>

      {/* Vignette nhẹ */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(0,0,0,0) 65%, rgba(0,0,0,0.18) 100%)",
        }}
      />

      {/* Keyframes */}
      <style>{`
        @keyframes fall {
          0%   { transform: translate3d(0, -10vh, 0); opacity: 0; }
          12%  { opacity: 1; }
          100% { transform: translate3d(var(--fall-drift, 8vw), 110vh, 0); opacity: .95; }
        }
        @keyframes sway {
          from { transform: translateX(-6px) rotate(-2deg); }
          to   { transform: translateX( 6px) rotate( 2deg); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes cloud-drift-left {
          0%   { transform: translateX(-12vw) translateY(0); }
          50%  { transform: translateX( 12vw) translateY(-2px); }
          100% { transform: translateX(-12vw) translateY(0); }
        }
        @keyframes cloud-drift-right {
          0%   { transform: translateX(12vw) translateY(0); }
          50%  { transform: translateX(-12vw) translateY(2px); }
          100% { transform: translateX(12vw) translateY(0); }
        }
        @keyframes bob {
          from { transform: translateY(0) }
          to   { transform: translateY(-2px) }
        }
        @keyframes sparkle {
          from { opacity: .35; transform: scale(.9); }
          to   { opacity: .95; transform: scale(1.08); }
        }
      `}</style>
    </div>
  );
}

/* ---------- Sun ---------- */
function Sun({ className = "", size = 150 }) {
  const s = size;
  return (
    <div className={`pointer-events-none ${className}`} style={{ width: s, height: s }}>
      <div
        className="absolute -inset-[18%] rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(255,200,80,.25) 0%, rgba(255,200,80,.12) 45%, rgba(255,200,80,0) 70%)",
          filter: "blur(10px)",
        }}
      />
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, #fff0b5 0%, #ffd374 55%, #ffb85c 100%)",
          boxShadow:
            "inset 0 0 0 1px rgba(255,255,255,.6), 0 0 36px 12px rgba(255,190,90,.35), 0 0 72px 24px rgba(255,180,80,.18)",
        }}
      />
    </div>
  );
}

/* ---------- Clouds ---------- */
function Clouds({ className = "", slower = false }) {
  const clouds = useMemo(
    () =>
      Array.from({ length: 6 }).map((_, i) => ({
        left: Math.random() * 100,
        top: 0 + Math.random() * 8, // vh offset
        scale: 0.8 + Math.random() * 0.8,
        dir: i % 2 === 0 ? "left" : "right",
        dur: (slower ? 22 : 14) + Math.random() * (slower ? 16 : 10),
        delay: Math.random() * 8,
        opacity: 0.4 + Math.random() * 0.35,
      })),
    [slower]
  );

  return (
    <div className={`pointer-events-none ${className}`}>
      {clouds.map((c, i) => (
        <div
          key={i}
          className="absolute"
          style={{
            left: `${c.left}vw`,
            top: `${c.top}vh`,
            transform: `scale(${c.scale})`,
            opacity: c.opacity,
            animation: `${c.dir === "left" ? "cloud-drift-left" : "cloud-drift-right"} ${c.dur}s ease-in-out ${c.delay}s infinite`,
            filter: "blur(0.4px)",
          }}
        >
          <CloudSVG />
        </div>
      ))}
    </div>
  );
}

function CloudSVG({ width = 180, height = 70 }) {
  return (
    <svg viewBox="0 0 300 120" width={width} height={height} style={{ display: "block" }}>
      <defs>
        <linearGradient id="clg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#f2f6ff" />
        </linearGradient>
      </defs>
      <g fill="url(#clg)">
        <circle cx="70" cy="70" r="36" />
        <circle cx="110" cy="56" r="44" />
        <circle cx="160" cy="70" r="36" />
        <rect x="58" y="70" width="112" height="30" rx="16" />
      </g>
    </svg>
  );
}

/* ---------- Red Envelope ---------- */
function RedEnvelope({ size = 32 }) {
  const s = size;
  return (
    <svg viewBox="0 0 60 80" width={s} height={s * 1.3} style={{ display: "block" }}>
      <defs>
        <linearGradient id="env" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ff4242" />
          <stop offset="100%" stopColor="#c91010" />
        </linearGradient>
        <linearGradient id="gold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffd66b" />
          <stop offset="100%" stopColor="#e6b341" />
        </linearGradient>
      </defs>
      <rect x="6" y="10" width="48" height="60" rx="6" fill="url(#env)" />
      <path d="M6 18 L30 32 L54 18" fill="#a80e0e" opacity=".85" />
      <circle cx="30" cy="44" r="12" fill="url(#gold)" />
      <path d="M30 36 L30 52 M22 44 L38 44" stroke="#9e6b00" strokeWidth="2" />
      <rect x="6" y="10" width="48" height="60" rx="6" fill="none" stroke="rgba(255,255,255,.35)" />
    </svg>
  );
}

/* ---------- Mai Flower ---------- */
function MaiFlower({ size = 18 }) {
  const s = size;
  return (
    <svg viewBox="0 0 60 60" width={s} height={s} style={{ display: "block" }}>
      <defs>
        <radialGradient id="petal" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fff6b0" />
          <stop offset="100%" stopColor="#ffd44d" />
        </radialGradient>
      </defs>
      <g>
        {[0, 60, 120, 180, 240, 300].map((a, i) => (
          <ellipse
            key={i}
            cx="30"
            cy="30"
            rx="10"
            ry="18"
            fill="url(#petal)"
            transform={`rotate(${a} 30 30)`}
          />
        ))}
        <circle cx="30" cy="30" r="6" fill="#ffb300" />
        <circle cx="30" cy="30" r="3" fill="#ff7b00" />
      </g>
    </svg>
  );
}

/* ---------- Ground with mist + sparkles ---------- */
function Ground({ children }) {
  return (
    <div className="absolute inset-x-0 bottom-0 pointer-events-none" style={{ height: "26vh" }}>
      <svg
        className="absolute inset-x-0 bottom-0 w-full h-full"
        viewBox="0 0 1200 400"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="groundNear" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fff6df" />
            <stop offset="100%" stopColor="#ffe9cc" />
          </linearGradient>
          <linearGradient id="groundFar" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffe9cc" />
            <stop offset="100%" stopColor="#ffd9b8" />
          </linearGradient>
        </defs>
        <path
          d="M0,250 C200,230 420,260 600,240 C800,220 980,260 1200,230 L1200,400 L0,400 Z"
          fill="url(#groundFar)"
          opacity="0.8"
        />
        <path
          d="M0,300 C220,280 440,310 660,300 C880,288 1040,330 1200,310 L1200,400 L0,400 Z"
          fill="url(#groundNear)"
        />
      </svg>

      <div
        className="absolute inset-x-0 bottom-0"
        style={{
          height: "55%",
          background:
            "linear-gradient(to top, rgba(255,255,255,.85), rgba(255,255,255,0))",
          filter: "blur(2px)",
          opacity: 0.9,
        }}
      />

      {/* sparkles lưa thưa */}
      <Sparkles count={24} />

      {children}
    </div>
  );
}

function Sparkles({ count = 24 }) {
  const dots = useMemo(
    () =>
      Array.from({ length: count }).map(() => ({
        left: Math.random() * 100,
        bottom: Math.random() * 22,
        size: Math.random() * 2 + 0.8,
        delay: Math.random() * 2.5,
        dur: 1.4 + Math.random() * 2,
      })),
    [count]
  );
  return (
    <div className="absolute inset-x-0 bottom-0 h-full">
      {dots.map((d, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            left: `${d.left}%`,
            bottom: `${d.bottom}%`,
            width: `${d.size}px`,
            height: `${d.size}px`,
            background:
              "radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(255,255,255,.6) 60%, rgba(255,255,255,0) 100%)",
            filter: "blur(0.2px)",
            animation: `sparkle ${d.dur}s ease-in-out ${d.delay}s infinite alternate`,
          }}
        />
      ))}
    </div>
  );
}

/* ---------- Kumquat (LEFT) as IMAGE ---------- */
function KumquatImageBL({
  src,
  scale = 1,
  leftPct = 3,
  bottomPct = 4,
}) {
  const base = 170 * scale;
  return (
    <div
      className="absolute"
      style={{
        left: `${leftPct}%`,
        bottom: `${bottomPct}%`,
        width: base,
        height: 'auto',
        transformOrigin: "50% 100%",
        animation: "bob 3.2s ease-in-out infinite alternate",
        pointerEvents: "none",
      }}
    >
      <img
        src={src}
        alt="Cây quýt"
        draggable={false}
        style={{
          width: "100%",
          height: "auto",
          objectFit: "contain",
          filter: "drop-shadow(0 6px 8px rgba(0,0,0,.18))",
          display: "block",
          transform: "translateZ(0)",
          imageRendering: "auto",
        }}
      />
    </div>
  );
}

/* ---------- Peach (RIGHT) as IMAGE ---------- */
function PeachImageBR({
  src,
  scale = 1,
  rightPct = 2.6,
  bottomPct = 4,
}) {
  const base = 180 * scale;
  return (
    <div
      className="absolute"
      style={{
        right: `${rightPct}%`,
        bottom: `${bottomPct}%`,
        width: base,
        height: 'auto',
        transformOrigin: "50% 100%",
        animation: "bob 3.6s ease-in-out infinite alternate",
        pointerEvents: "none",
      }}
    >
      <img
        src={src}
        alt="Cây đào"
        draggable={false}
        style={{
          width: "100%",
          height: "auto",
          objectFit: "contain",
          filter: "drop-shadow(0 6px 8px rgba(0,0,0,.18))",
          display: "block",
          transform: "translateZ(0)",
          imageRendering: "auto",
        }}
      />
    </div>
  );
}

/* ---------- Chrysanthemum (RIGHT) (SVG fallback) ---------- */
function ChrysanthemumBR({ scale = 1, rightPct = 2.6, bottomPct = 4 }) {
  const base = 180 * scale;
  return (
    <div
      className="absolute"
      style={{
        right: `${rightPct}%`,
        bottom: `${bottomPct}%`,
        width: base,
        height: base * 1.2,
        transformOrigin: "50% 100%",
        animation: "bob 3s ease-in-out infinite alternate",
      }}
    >
      <ChrysanthemumSVG width={base} height={base * 1.2} />
    </div>
  );
}

function ChrysanthemumSVG({ width = 210, height = 240 }) {
  return (
    <svg viewBox="0 0 240 260" width={width} height={height} style={{ display: "block" }}>
      <defs>
        <linearGradient id="stem" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2a7a39" />
          <stop offset="100%" stopColor="#1f5d2a" />
        </linearGradient>
        <radialGradient id="petalY" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#fff2a0" />
          <stop offset="100%" stopColor="#ffd13a" />
        </radialGradient>
      </defs>
      {/* stems */}
      <path d="M120,210 C118,175 120,150 122,120" stroke="url(#stem)" strokeWidth="6" fill="none" />
      <path d="M150,210 C152,180 150,156 148,126" stroke="url(#stem)" strokeWidth="6" fill="none" />
      {/* leaves */}
      {[{x:118,y:160,a:-30},{x:124,y:180,a:20},{x:150,y:168,a:30},{x:146,y:188,a:-25}].map((l,i)=>(
        <ellipse key={i} cx={l.x} cy={l.y} rx="10" ry="20" fill="#2f8f3a" transform={`rotate(${l.a} ${l.x} ${l.y})`}/>
      ))}
      {/* flowers */}
      {[{x:122,y:110,s:1.0},{x:148,y:116,s:0.9},{x:136,y:98,s:0.8}].map((f,i)=>(
        <g key={i} transform={`translate(${f.x},${f.y}) scale(${f.s})`}>
          {Array.from({length:20}).map((_,k)=>(
            <ellipse key={k} cx="0" cy="0" rx="4" ry="14" fill="url(#petalY)" transform={`rotate(${(360/20)*k})`} />
          ))}
          <circle cx="0" cy="0" r="4.5" fill="#ffb300" />
        </g>
      ))}
    </svg>
  );
}
