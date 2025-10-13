import React, { useMemo } from "react";
import lanImg from '~/assets/imgs/lan.png';

export default function MidAutumnLanternBackground({
  count = 60,
  className = "h-[520px] w-full",
  lanternSrc,
}) {
  const lanternImgs = Array.isArray(lanternSrc)
    ? lanternSrc
    : lanternSrc
    ? [lanternSrc]
    : [];
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

  const lanterns = useMemo(() => {
    const arr = [];
    for (let i = 0; i < count; i++) {
      const left = Math.random() * 100;
      const size = 16 + Math.random() * 24;
      const duration = 12 + Math.random() * 18;
      const delay = Math.random() * 12;
      const diagonal = Math.random() < 0.55;
      const drift = (Math.random() * 20 - 10).toFixed(2);
      const wobble = 2 + Math.random() * 4;
      arr.push({ left, size, duration, delay, diagonal, drift, wobble });
    }
    return arr;
  }, [count]);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Sky */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#050814] via-[#070a1c] to-[#0a0f24]" />
      <div className="pointer-events-none absolute inset-0">
        <Stars density={140} blur className="opacity-60" />
        <Stars density={90} className="opacity-40" />
      </div>

      {/* Moon */}
      <RealMoon className="absolute top-6 right-6 md:top-8 md:right-8" size={170} lionSrc={lanImg} />

      {/* Lanterns */}
      <div className="absolute inset-0 pointer-events-none">
        {lanterns.map((l, idx) => (
          <div
            key={idx}
            className="absolute will-change-transform"
            style={{
              left: `${l.left}vw`,
              bottom: `-${24 + Math.random() * 40}px`,
              animation: `${l.diagonal ? "float-diag" : "float-up"} ${l.duration}s linear ${l.delay}s infinite`,
              transformOrigin: "50% 100%",
              ["--drift"]: `${l.drift}vw`,
              // 🔧 ép chạy kể cả khi có stylesheet pause
              animationPlayState: "running",
            }}
          >
            <div
              className="will-change-transform"
              style={{
                animation: `sway ${l.wobble}s ease-in-out ${Math.random()}s infinite alternate`,
                transformOrigin: "50% 100%",
                // 🔧 ép chạy luôn
                animationPlayState: "running",
              }}
            >
              <LanternImg size={l.size} src={lanternImgs.length ? pick(lanternImgs) : null} />
            </div>
          </div>
        ))}
      </div>

      {/* Vignette */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_60%,rgba(0,0,0,0.35))]" />

      <style>{`
        @keyframes float-up {
          0% { transform: translate3d(0, 20vh, 0); opacity: 0; }
          10% { opacity: 1; }
          100% { transform: translate3d(0, -110vh, 0); opacity: 0.6; }
        }
        @keyframes float-diag {
          0% { transform: translate3d(0, 25vh, 0); opacity: 0; }
          10% { opacity: 1; }
          100% { transform: translate3d(var(--drift, 12vw), -115vh, 0); opacity: 0.6; }
        }
        @keyframes sway {
          from { transform: translateX(-1px) rotate(-1.2deg); }
          to   { transform: translateX( 1px) rotate( 1.2deg); }
        }
        @keyframes twinkle { from { opacity: .25; } to { opacity: .9; } }
      `}</style>
    </div>
  );
}

/* ---- Stars ---- */
function Stars({ density = 120, blur = false, className = "" }) {
  const stars = useMemo(
    () =>
      Array.from({ length: density }).map(() => ({
        left: Math.random() * 100,
        top: Math.random() * 100,
        size: Math.random() * 2 + 0.6,
        twinkle: 2 + Math.random() * 3,
        delay: Math.random() * 4,
      })),
    [density]
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
            opacity: 0.7,
            animation: `twinkle ${s.twinkle}s ease-in-out ${s.delay}s infinite alternate`,
            // ép chạy luôn phòng reduce-motion stylesheet
            animationPlayState: "running",
          }}
        />
      ))}
    </div>
  );
}

/* ---- Lantern Img / SVG ---- */
function LanternImg({ size = 28, src }) {
  if (src) {
    const s = size;
    return (
      <img
        src={src}
        alt=""
        draggable={false}
        style={{
          width: s,
          height: s * 1.35,
          objectFit: "contain",
          filter: "drop-shadow(0 0 6px rgba(255,150,60,0.55))",
          transform: "translateZ(0)",
        }}
        className="select-none"
      />
    );
  }
  return <LanternSVG size={size} />;
}

function LanternSVG({ size = 24 }) {
  const s = size;
  return (
    <svg viewBox="0 0 48 64" width={s} height={s * 1.35} style={{ filter: "drop-shadow(0 0 6px rgba(255,150,60,0.55))" }}>
      <defs>
        <linearGradient id="lanternBody" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFB167" />
          <stop offset="55%" stopColor="#FF8C3B" />
          <stop offset="100%" stopColor="#DA5C16" />
        </linearGradient>
      </defs>
      <rect x="10" y="6" width="28" height="4" rx="2" fill="#3F2D27" />
      <rect x="8" y="10" width="32" height="38" rx="12" fill="url(#lanternBody)" />
    </svg>
  );
}

function RealMoon({ className = "", size = 170, intensity = 1, lionSrc }) {
  const s = size;
  return (
    <div className={`relative pointer-events-none ${className}`} style={{ width: s, height: s }}>
      {/* halos */}
      <div className="absolute -inset-[18%] rounded-full"
        style={{ background:"radial-gradient(circle, rgba(255,255,240,0.20) 0%, rgba(255,255,240,0.10) 45%, rgba(255,255,240,0.04) 62%, rgba(255,255,240,0) 75%)",
                 filter:"blur(16px)", opacity:0.9 * intensity }} />
      <div className="absolute -inset-[8%] rounded-full"
        style={{ background:"radial-gradient(circle, rgba(255,255,255,0.38) 0%, rgba(255,255,255,0.16) 55%, rgba(255,255,255,0) 75%)",
                 filter:"blur(8px)", opacity:0.85 * intensity }} />
      <div className="absolute inset-0 rounded-full"
        style={{ background:"radial-gradient(circle, rgba(255,255,255,0) 63%, rgba(255,255,235,0.38) 72%, rgba(255,255,235,0.12) 82%, rgba(255,255,235,0) 88%)",
                 filter:"blur(3px)", opacity:0.95 * intensity }} />

      {/* đĩa mặt trăng */}
      <div className="absolute inset-0 rounded-full"
        style={{ background:"radial-gradient(circle at 50% 48%, #ffffff 0%, #f4f4f1 62%, #e7e7e0 100%)",
                 boxShadow:"inset 0 0 0 1px rgba(255,255,255,0.65), inset 0 -6px 16px rgba(0,0,0,0.06), 0 0 42px 14px rgba(255,255,230,0.35), 0 0 70px 28px rgba(255,255,230,0.18)" }} />

      {/* bóng con lân — nằm xéo góc phải dưới */}
      {lionSrc && (
        <img
          src={lionSrc}
          alt=""
          className="absolute"
          style={{
            right: "20%",      // sát mép phải
            bottom: "4%",     // sát đáy
            width: "25%",
            height: "25%",
            objectFit: "contain",
            opacity: 0.28,
            mixBlendMode: "multiply",
            transform: "rotate(-12deg) translateY(2%)",
            animation: "lion-bob 3.1s ease-in-out infinite alternate",
          }}
          draggable={false}
        />
      )}

      <style>{`
        @keyframes lion-bob { from { transform: rotate(-12deg) translateY(0); }
                              to   { transform: rotate(-12deg) translateY(-3%); } }
      `}</style>
    </div>
  );
}



