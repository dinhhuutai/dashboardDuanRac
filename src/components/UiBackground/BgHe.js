import React, { useMemo } from "react";

import haiau from '~/assets/imgs/haiau.png';
import caydu from '~/assets/imgs/caydu.png';
import caydua from '~/assets/imgs/caydua.png';
// (tùy chọn) nếu bạn có ảnh du thuyền riêng thì import
// import yachtPng from '~/assets/imgs/yacht.png';

export default function SummerBeachBackground({
  className = "h-full w-full",
  bubbleCount = 60,
  gullCount = 6,
  cloudRows = 2,
  yachtImg,                  // ← optional: ảnh du thuyền
}) {
  /* --- particles --- */
  const bubbles = useMemo(
    () =>
      Array.from({ length: bubbleCount }).map(() => ({
        left: Math.random() * 100,
        size: 6 + Math.random() * 12,
        duration: 10 + Math.random() * 10,
        delay: Math.random() * 8,
        drift: (Math.random() * 16 - 8).toFixed(2),
        sway: 2 + Math.random() * 2.5,
      })),
    [bubbleCount]
  );

  // mỗi hải âu có biên độ lên/xuống & tốc độ riêng
  const gulls = useMemo(
    () =>
      Array.from({ length: gullCount }).map((_, i) => ({
        top: 10 + Math.random() * 26,                    // vh
        scale: 0.8 + Math.random() * 0.8,
        dir: i % 2 ? "left" : "right",
        dur: 16 + Math.random() * 10,                    // thời gian bay ngang
        delay: Math.random() * 6,
        opacity: 0.6 + Math.random() * 0.35,
        ampVH: (1 + Math.random() * 3.2).toFixed(2) + "vh", // biên độ dọc
        bobDur: (2 + Math.random() * 3).toFixed(2) + "s",   // tốc độ dọc
      })),
    [gullCount]
  );

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Sky (blue, trong) */}
      <div className="absolute inset-0">
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg,#CFEFFF 0%,#B5E3FF 40%,#9FD8FF 70%,#93D0FF 100%)",
          }}
        />
        {/* haze mỏng để sáng hơn vùng trên */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(1200px 700px at 60% -10%, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.12) 45%, rgba(255,255,255,0) 70%)",
            filter: "blur(10px)",
            opacity: 0.85,
          }}
        />
      </div>

      {/* Sun + Clouds */}
      <SunGlare size={88} className="absolute top-6 left-7" />
      {Array.from({ length: cloudRows }).map((_, row) => (
        <Clouds
          key={row}
          className={`absolute inset-x-0 ${row === 0 ? "top-8" : "top-20"} ${
            row ? "opacity-85" : ""
          }`}
          slower={!!row}
        />
      ))}

      {/* Seagulls: bay ngang + lên/xuống ngẫu nhiên */}
      <div className="absolute inset-0 pointer-events-none">
        {gulls.map((g, i) => (
          <div
            key={i}
            className="absolute"
            style={{
              // lớp ngoài: bay ngang
              left: g.dir === "left" ? "110vw" : "-10vw",
              top: `${g.top}vh`,
              transform: `scale(${g.scale})`,
              opacity: g.opacity,
              animation: `${g.dir === "left" ? "gull-left" : "gull-right"} ${
                g.dur
              }s linear ${g.delay}s infinite`,
              willChange: "transform",
              filter: "blur(0.2px)",
            }}
          >
            {/* lớp trong: lượn lên/xuống (biên độ & tốc độ random) */}
            <div
              style={{
                "--g-amp": g.ampVH,
                animation: `gull-bobY ${g.bobDur} ease-in-out ${(
                  Math.random() * 1.5
                ).toFixed(2)}s infinite alternate`,
                willChange: "transform",
              }}
            >
              <img
                src={haiau}
                alt="Seagull"
                draggable={false}
                style={{
                  width: 14,
                  height: "auto",
                  objectFit: "contain",
                  display: "block",
                  filter: "drop-shadow(0 2px 2px rgba(0,0,0,.15))",
                  animation: "gull-flap 1.6s ease-in-out infinite",
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Ocean + Yacht (đã bỏ lớp sóng gần) */}
      <OceanWavesRealistic />
      <YachtOnSea yachtImg={yachtImg} />

      {/* Bubbles rising (gần mặt biển) – bay cao hơn */}
      <div className="absolute inset-x-0 bottom-[26vh] pointer-events-none">
        {bubbles.map((b, i) => (
          <div
            key={i}
            className="absolute"
            style={{
              left: `${b.left}%`,
              bottom: "-8vh",
              ["--rise-drift"]: `${b.drift}vw`,
              animation: `bubble-rise ${b.duration}s linear ${b.delay}s infinite`,
              willChange: "transform, opacity",
            }}
          >
            <div
              className="rounded-full"
              style={{
                width: b.size,
                height: b.size,
                background:
                  "radial-gradient(circle, rgba(255,255,255,.85) 0%, rgba(255,255,255,.35) 45%, rgba(255,255,255,.15) 70%, rgba(255,255,255,0) 100%)",
                border: "1px solid rgba(255,255,255,.45)",
                animation: `bubble-sway ${b.sway}s ease-in-out ${b.delay *
                  0.25}s infinite alternate`,
                filter: "blur(.2px)",
              }}
            />
          </div>
        ))}
      </div>

      {/* Islands (2 đảo ở 2 góc) + decorations (ảnh đã import) */}
<IslandsBottom>
  <PalmLeft src={caydua} leftPct={2} bottomPct={3} />
  <UmbrellaRight src={caydu} rightPct={2.2} bottomPct={3} />
</IslandsBottom>


      {/* Vignette rất nhẹ để khung hình gọn lại */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(0,0,0,0) 68%, rgba(0,0,0,0.16) 100%)",
        }}
      />

      {/* Keyframes */}
      <style>{`
        @keyframes cloud-drift-left {
          0%   { transform: translateX(-14vw) translateY(0); }
          50%  { transform: translateX( 14vw) translateY(-2px); }
          100% { transform: translateX(-14vw) translateY(0); }
        }
        @keyframes cloud-drift-right {
          0%   { transform: translateX(14vw) translateY(0); }
          50%  { transform: translateX(-14vw) translateY(2px); }
          100% { transform: translateX(14vw) translateY(0); }
        }
        @keyframes gull-left {
          0%   { transform: translateX(0) }
          100% { transform: translateX(-120vw) }
        }
        @keyframes gull-right {
          0%   { transform: translateX(0) }
          100% { transform: translateX(120vw) }
        }
        /* lượn lên/xuống — dùng var(--g-amp) để đổi biên độ theo từng con */
        @keyframes gull-bobY {
          from { transform: translateY(calc(var(--g-amp, 1.5vh) * -1)); }
          to   { transform: translateY(var(--g-amp, 1.5vh)); }
        }
        @keyframes gull-flap {
          0%,100% { transform: translateY(0) rotate(0deg) }
          50% { transform: translateY(-2px) rotate(-1.2deg) }
        }
        /* bọt bay cao hơn (-30vh) */
        @keyframes bubble-rise {
          0%   { transform: translate3d(0, 6vh, 0); opacity: 0; }
          10%  { opacity: .8; }
          100% { transform: translate3d(var(--rise-drift, 8vw), -30vh, 0); opacity: 0; }
        }
        @keyframes bubble-sway {
          from { transform: translateX(-6px); }
          to   { transform: translateX( 6px); }
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
function SunGlare({ className = "", size = 90 }) {
  const s = size;
  return (
    <div className={`pointer-events-none ${className}`} style={{ width: s, height: s }}>
      <div
        className="absolute -inset-[22%] rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(255,255,210,.28) 0%, rgba(255,255,210,.14) 45%, rgba(255,255,210,0) 70%)",
          filter: "blur(12px)",
        }}
      />
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, #fff9cc 0%, #ffe27a 55%, #ffc85a 100%)",
          boxShadow:
            "inset 0 0 0 1px rgba(255,255,255,.65), 0 0 38px 14px rgba(255,220,120,.35), 0 0 80px 28px rgba(255,210,100,.18)",
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
        top: 0 + Math.random() * 8,
        scale: 0.8 + Math.random() * 0.9,
        dir: i % 2 === 0 ? "left" : "right",
        dur: (slower ? 24 : 16) + Math.random() * (slower ? 14 : 10),
        delay: Math.random() * 8,
        opacity: 0.5 + Math.random() * 0.35,
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
            filter: "blur(0.3px)",
          }}
        >
          <CloudSVG />
        </div>
      ))}
    </div>
  );
}

function CloudSVG({ width = 210, height = 80 }) {
  return (
    <svg viewBox="0 0 320 140" width={width} height={height} style={{ display: "block" }}>
      <defs>
        <linearGradient id="clg2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#eef7ff" />
        </linearGradient>
      </defs>
      <g fill="url(#clg2)">
        <circle cx="80" cy="90" r="40" />
        <circle cx="130" cy="74" r="54" />
        <circle cx="190" cy="92" r="44" />
        <rect x="70" y="92" width="150" height="34" rx="18" />
      </g>
    </svg>
  );
}

/* ---------- Ocean (xa & trung, bỏ “gần bờ”) ---------- */
function OceanWavesRealistic() {
  return (
    <>
      {/* dải biển */}
      <div className="absolute inset-x-0" style={{ top: "44vh", height: "32vh", overflow: "hidden" }}>
        {/* nền nước sâu — tông xanh/teal dịu hơn */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg,#63C3F2 0%,#49B4EE 45%,#2FA4EA 100%)",
          }}
        />
        {/* lớp sáng nhẹ ở đỉnh để bớt phẳng */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(1200px 400px at 50% 0%, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0.08) 40%, rgba(255,255,255,0) 70%)",
            pointerEvents: "none",
          }}
        />
        {/* far waves (nhạt) */}
        <WaveLayer
          height="36%"
          bottom="46%"
          amp={6}
          period={28}
          opacity={0.16}             // ↓ giảm
          blur={1.0}
          color="rgba(232,246,255,0.95)" // foam xanh-ngà
          speed={28}
          scaleY={0.6}
          blend="screen"             // 👈 blend vào nước
        />
        {/* mid waves (vừa) */}
        <WaveLayer
          height="42%"
          bottom="18%"
          amp={10}
          period={22}
          opacity={0.22}             // ↓ giảm
          blur={0.7}
          color="rgba(226,242,255,0.98)"
          speed={18}
          scaleY={0.9}
          blend="screen"
        />
        {/* (đã bỏ near waves) */}
      </div>
      {/* đường chân trời */}
      <div
        className="absolute inset-x-0"
        style={{
          top: "44vh",
          height: "2px",
          background:
            "linear-gradient(to right, rgba(255,255,255,.28), rgba(255,255,255,.06), rgba(255,255,255,.28))",
          opacity: 0.6, // ↓ nhẹ hơn
        }}
      />
    </>
  );
}


function WaveLayer({
  height, bottom, amp = 8, period = 20,
  opacity = 0.3, blur = 0.6, color = "rgba(232,246,255,.95)",
  speed = 16, scaleY = 1, blend = "screen" // 👈 thêm prop blend
}) {
  const path = useMemo(() => {
    const W = 1200, H = 60, A = amp, T = period;
    let d = `M 0 ${H / 2} `;
    for (let x = 0; x <= W * 2; x += 20) {
      const y = H / 2 + A * Math.sin((2 * Math.PI * x) / (W / (T / 10)));
      d += `L ${x} ${y} `;
    }
    d += `L ${W * 2} ${H} L 0 ${H} Z`;
    return { d, view: `0 0 ${W * 2} ${H}` };
  }, [amp, period]);

  return (
    <div
      style={{
        position: "absolute",
        left: 0, right: 0, bottom, height,
        transform: `scaleY(${scaleY})`,
        filter: `blur(${blur}px)`,
        opacity, overflow: "hidden",
        mixBlendMode: blend,          // 👈 blend vào nền nước
      }}
    >
      <div
        style={{
          position: "absolute",
          width: "200%",
          height: "100%",
          animation: `wave-scroll ${speed}s linear infinite`,
        }}
      >
        <svg viewBox={path.view} width="100%" height="100%" preserveAspectRatio="none" style={{ display: "block" }}>
          <path d={path.d} fill={color} />
        </svg>
      </div>
      <style>{`
        @keyframes wave-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}


/* ---------- Yacht chạy trên biển ---------- */
function YachtOnSea({ yachtImg }) {
  return (
    <div
      className="absolute pointer-events-none"
      style={{
        top: "50vh", // hơi dưới chân trời
        left: "-20vw",
        width: "22vw",
        animation: "yacht-sail 22s linear infinite",
      }}
    >
      {yachtImg ? (
        <img
          src={yachtImg}
          alt="Yacht"
          draggable={false}
          style={{
            width: "100%",
            height: "auto",
            objectFit: "contain",
            filter: "drop-shadow(0 6px 8px rgba(0,0,0,.18))",
            display: "block",
          }}
        />
      ) : (
        <YachtSVG />
      )}

      {/* vệt sóng đuôi */}
      <div
        style={{
          position: "absolute",
          right: "-6%",
          bottom: "6%",
          width: "26%",
          height: "26%",
          background:
            "radial-gradient(60% 50% at 0% 60%, rgba(255,255,255,.7) 0%, rgba(255,255,255,.35) 35%, rgba(255,255,255,0) 70%)",
          filter: "blur(1px)",
          transform: "rotate(-6deg)",
          opacity: 0.85,
          animation: "wake-fade 1.8s linear infinite",
        }}
      />
      <style>{`
        @keyframes yacht-sail {
          0% { transform: translateX(0) translateY(0); }
          50% { transform: translateX(120vw) translateY(-1vh); }
          100% { transform: translateX(240vw) translateY(0); }
        }
        @keyframes wake-fade {
          0% { opacity: .85; transform: scale(1) rotate(-6deg); }
          100% { opacity: 0; transform: scale(1.2) rotate(-6deg); }
        }
      `}</style>
    </div>
  );
}

function YachtSVG({ width = "100%", height = "auto" }) {
  return (
    <svg viewBox="0 0 400 160" width={width} height={height} style={{ display: "block" }}>
      <defs>
        <linearGradient id="hull" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#e6eef7" />
        </linearGradient>
      </defs>
      <g>
        <path d="M30,120 C110,120 220,120 360,120 C340,140 60,150 30,120 Z" fill="#1a6fbf" opacity=".85" />
        <path d="M30,118 C120,118 220,118 360,118 L330,102 L120,102 Z" fill="url(#hull)" stroke="#bfcfe4" />
        <rect x="150" y="84" width="120" height="16" rx="3" fill="#e3eef9" />
        <rect x="170" y="72" width="80" height="14" rx="3" fill="#d7e6f5" />
        {[0,1,2,3].map(i=>(
          <rect key={i} x={160+22*i} y="88" width="16" height="8" rx="2" fill="#9ec9f3"/>
        ))}
        <rect x="126" y="60" width="4" height="46" fill="#c9d7ea" />
        <path d="M130,62 L160,76 L130,82 Z" fill="#ff5d5d" />
      </g>
    </svg>
  );
}

/* ---------- Islands bottom (2 hòn đảo chiếm trọn 2 góc) ---------- */
function IslandsBottom({ children }) {
  return (
    <div
      className="absolute inset-x-0 bottom-0 pointer-events-none z-[5]"
      style={{ height: "30vh" }}  // ↑ cao hơn chút để ôm góc rõ
    >
      {/* Đảo trái — ôm sát trái & đáy, cong vào trong */}
      <div
        className="absolute"
        style={{
          left: "-15%",
          bottom: "-35%",
          width: "70vw",        // ↑ rộng để phủ kín góc
          maxWidth: 700,
          height: "240%",
        }}
      >
        <IslandSVG corner="left" />
      </div>

      {/* Đảo phải — ôm sát phải & đáy, cong vào trong */}
      <div
        className="absolute"
        style={{
          right: "-15%",
          bottom: "-35%",
          width: "70vw",        // ↑ rộng để phủ kín góc
          maxWidth: 700,
          height: "240%",
        }}
      >
        <IslandSVG corner="right" />
      </div>

      {/* Cho cây/ô dù “đứng trên đảo” */}
      {children}
    </div>
  );
}

function IslandSVG({ width = "100%", height = "100%", corner = "left" }) {
  // corner: "left" | "right"
  const flip = corner === "right";
  return (
    <svg
      viewBox="0 0 700 420"
      width={width}
      height={height}
      preserveAspectRatio="none"
      style={{
        display: "block",
        transform: flip ? "scaleX(-1)" : "none",
      }}
    >
      <defs>
        {/* cát ấm */}
        <linearGradient id="sandBody" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFE9B8" />
          <stop offset="100%" stopColor="#FFD084" />
        </linearGradient>
        {/* bọt ven bờ (blend nhẹ với nước) */}
        <linearGradient id="shoreFoam" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(232,246,255,0.95)" />
          <stop offset="100%" stopColor="rgba(224,240,252,0.85)" />
        </linearGradient>
      </defs>

      {/* bóng dưới nước sát góc */}
      <ellipse cx="140" cy="394" rx="140" ry="18" fill="rgba(0,0,0,.12)" />

      {/* bọt viền (ôm sát mép trái/phải + đáy) */}
      <path
        d="
          M0,360 
          C60,300 150,270 250,280 
          C350,290 430,330 480,370 
          C380,396 260,408 150,410 
          C80,410 26,404 0,388 Z"
        fill="url(#shoreFoam)"
        opacity="0.45"
        style={{ mixBlendMode: "screen", filter: "blur(1px)" }}
      />

      {/* thân đảo (cát) chiếm hẳn góc */}
      <path
        d="
          M0,368 
          C70,308 160,278 258,286 
          C344,294 420,328 470,362 
          C370,388 258,402 150,404 
          C60,406 16,398 0,384 Z"
        fill="url(#sandBody)"
      />

      {/* highlight mỏng cho độ phồng */}
      <path
        d="
          M10,362 
          C74,310 162,288 252,296 
          C320,302 392,328 430,352 
          C332,356 258,360 160,364 
          C80,366 36,366 10,362 Z"
        fill="rgba(255,255,255,.26)"
        opacity=".35"
      />

      {/* ripple nước chạy ngang quanh mép đảo */}
      <g style={{ mixBlendMode: "screen", opacity: 0.30 }}>
        <MovingRipples y={372} w={540} />
        <MovingRipples y={386} w={540} delay={4} speed={18} />
      </g>
    </svg>
  );
}

function MovingRipples({ y = 372, w = 540, speed = 14, delay = 0 }) {
  const strips = Array.from({ length: 8 }).map((_, i) => (
    <rect
      key={i}
      x={-w}
      y={y + i * 6}
      width={w}
      height={2}
      rx={1}
      fill="rgba(232,246,255,0.9)"
      opacity={0.6 - i * 0.06}
    />
  ));
  return (
    <g>
      <g style={{ animation: `island-rip ${speed}s linear ${delay}s infinite` }}>{strips}</g>
      <g style={{ animation: `island-rip ${speed}s linear ${delay + speed / 2}s infinite` }}>{strips}</g>
      <style>{`
        @keyframes island-rip {
          0%   { transform: translateX(0); }
          100% { transform: translateX(${w}px); }
        }
      `}</style>
    </g>
  );
}




/* ---------- Palm (left) ---------- */
function PalmLeft({
  src,
  scale = 1,
  leftPct = 2.8,
  bottomPct = 3.6,
}) {
  const base = 200 * scale;
  return (
    <div
      className="absolute"
      style={{
        left: `${leftPct}%`,
        bottom: `${bottomPct}%`,
        width: base,
        height: "auto",
        transformOrigin: "50% 100%",
        animation: "bob 3.4s ease-in-out infinite alternate",
      }}
    >
      {src ? (
        <img
          src={src}
          alt="Palm tree"
          draggable={false}
          style={{
            width: "100%",
            height: "auto",
            objectFit: "contain",
            filter: "drop-shadow(0 6px 8px rgba(0,0,0,.18))",
            display: "block",
          }}
        />
      ) : (
        <PalmSVG width={base} height={base * 1.3} />
      )}
    </div>
  );
}

function PalmSVG({ width = 220, height = 280 }) {
  return (
    <svg viewBox="0 0 220 280" width={width} height={height} style={{ display: "block" }}>
      <defs>
        <linearGradient id="trunk" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8c5b33" />
          <stop offset="100%" stopColor="#5d3a1f" />
        </linearGradient>
        <linearGradient id="leafG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1dbd76" />
          <stop offset="100%" stopColor="#0f8a55" />
        </linearGradient>
      </defs>
      <path d="M110,260 C100,210 104,160 110,110 C116,60 112,40 110,20" stroke="url(#trunk)" strokeWidth="16" fill="none" strokeLinecap="round" />
      {[{x:108,y:40,a:-30},{x:108,y:42,a:10},{x:108,y:44,a:40},{x:110,y:44,a:70},{x:110,y:42,a:100}].map((l,i)=>(
        <path key={i} d={`M${l.x},${l.y} c40,-12 70,0 86,12`} stroke="url(#leafG)" strokeWidth="10" fill="none" transform={`rotate(${l.a} 110 44)`}/>
      ))}
    </svg>
  );
}

/* ---------- Umbrella (right) ---------- */
function UmbrellaRight({
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
        height: "auto",
        transformOrigin: "50% 100%",
        animation: "bob 3s ease-in-out infinite alternate",
      }}
    >
      {src ? (
        <img
          src={src}
          alt="Beach umbrella"
          draggable={false}
          style={{
            width: "100%",
            height: "auto",
            objectFit: "contain",
            filter: "drop-shadow(0 6px 8px rgba(0,0,0,.18))",
            display: "block",
          }}
        />
      ) : (
        <UmbrellaSVG width={base} height={base * 1.1} />
      )}
    </div>
  );
}

function UmbrellaSVG({ width = 200, height = 220 }) {
  return (
    <svg viewBox="0 0 220 240" width={width} height={height} style={{ display: "block" }}>
      <defs>
        <linearGradient id="stripeR" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ff6b6b" />
          <stop offset="100%" stopColor="#ff3b3b" />
        </linearGradient>
        <linearGradient id="stripeY" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffd166" />
          <stop offset="100%" stopColor="#ffb703" />
        </linearGradient>
      </defs>
      <rect x="108" y="90" width="6" height="120" rx="3" fill="#c5d1e0" />
      <g transform="translate(110,90)">
        {[-90,-54,-18,18,54,90].map((a,i)=>(
          <path key={i} d={`M0,0 L${80*Math.cos(a*Math.PI/180)},${80*Math.sin(a*Math.PI/180)} A80,80 0 0,1 ${80*Math.cos((a+36)*Math.PI/180)},${80*Math.sin((a+36)*Math.PI/180)} Z`}
            fill={i%2? "url(#stripeY)" : "url(#stripeR)"} opacity=".95"/>
        ))}
        <circle cx="0" cy="0" r="6" fill="#fff"/>
      </g>
      <ellipse cx="150" cy="210" rx="60" ry="10" fill="rgba(0,0,0,.12)" />
    </svg>
  );
}
