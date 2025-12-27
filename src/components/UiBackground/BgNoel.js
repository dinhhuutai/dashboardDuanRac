import React, { useMemo } from "react";
import satanImg from "~/assets/imgs/satan.png";

/**
 * ChristmasSceneBackground
 * - Nền trời đêm + sao lấp lánh
 * - Tuyết rơi (hạt tròn) đan xen bông tuyết 6 cánh
 * - Đồi tuyết + sương + lấp lánh
 * - Người tuyết (nón + khăn) sát góc dưới bên phải
 * - Cây thông trang trí + hộp quà ở góc dưới bên trái
 */
export default function ChristmasSceneBackground({
  className = "h-[520px] w-full",
  starCount = 80,
  snowCount = 120,
  flakeRatio = 0.12,
  maxDriftVW = 10,
  groundHeight = "22vh",
}) {
  // particles cho tuyết rơi
  const particles = useMemo(() => {
    const arr = [];
    for (let i = 0; i < snowCount; i++) {
      const isFlake = Math.random() < flakeRatio;
      const size = isFlake ? 10 + Math.random() * 14 : 3 + Math.random() * 4;
      arr.push({
        isFlake,
        size,
        left: Math.random() * 100,
        duration: 10 + Math.random() * 16,
        delay: Math.random() * 10,
        drift: (Math.random() * (maxDriftVW * 2) - maxDriftVW).toFixed(2),
        sway: 3 + Math.random() * 4.5,
        spin: 2.8 + Math.random() * 3.5,
      });
    }
    return arr;
  }, [snowCount, flakeRatio, maxDriftVW]);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Sky */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(1200px 600px at 70% 0%, #0b1738 0%, rgba(11,23,56,0) 60%), linear-gradient(#071129, #0a183d 40%, #0b1c46 70%, #0b1e4b)",
        }}
      />

      {/* Stars */}
      <Stars density={starCount} className="absolute inset-0 opacity-70" />
      <Stars
        density={Math.max(24, Math.round(starCount * 0.5))}
        blur
        className="absolute inset-0 opacity-45"
      />

      {/* Santa + tuần lộc lượn ngang và thả quà */}

<SantaWithGifts
  className="absolute top-0 left-0 z-[99]"
  duration={25}
  amplitudeVH={8}
  giftEveryMs={1400}
  maxGifts={36}
  santaSrc={satanImg}        // ⬅️ truyền ảnh vào đây
  santaWidth={80}           // tuỳ chỉnh kích thước
  // Bay trong dải rất cao: 1vh..9vh
  minTopVH={2}
  maxTopVH={14}
/>

      {/* Snow */}
      <div className="absolute inset-0 pointer-events-none z-[110]">
        {particles.map((p, i) => (
          <div
            key={i}
            className="absolute will-change-transform"
            style={{
              left: `${p.left}%`,
              top: "-6vh",
              animation: `snow-fall ${p.duration}s linear ${p.delay}s infinite`,
              ["--drift"]: `${p.drift}vw`,
              transformOrigin: "50% 50%",
            }}
          >
            <div
              className="will-change-transform"
              style={{
                animation: `snow-sway ${p.sway}s ease-in-out ${
                  p.delay * 0.3
                }s infinite alternate${
                  p.isFlake
                    ? `, snow-spin ${p.spin}s linear ${p.delay * 0.2}s infinite`
                    : ""
                }`,
                transformOrigin: "50% 50%",
              }}
            >
              {p.isFlake ? (
                <SnowflakeIcon size={p.size} opacity={0.95} strokeWidth={3} />
              ) : (
                <div
                  className="rounded-full bg-white"
                  style={{
                    width: p.size,
                    height: p.size,
                    filter: "drop-shadow(0 0 2px rgba(255,255,255,.6))",
                    opacity: 0.9,
                  }}
                />
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Ground + Tree (trái) + Snowman (phải) */}
      <GroundSnow height={groundHeight}>
        <PineTreeBL scale={1.2} leftPct={2} bottomPct={4} />
        <SnowmanBR scale={1} rightPct={2.4} bottomPct={4} />
      </GroundSnow>

      {/* Moon góc phải + bóng người tuyết bên trong */}
<MoonWithSnowman className="absolute z-[98] top-[6px] right-6 md:top-[10px] md:right-8" size={150} />


      {/* Vignette */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 68%, rgba(0,0,0,.25) 100%)",
        }}
      />

      {/* Keyframes */}
      <style>{`
        @keyframes twinkle {
          from { opacity: .35; transform: translateZ(0); }
          to   { opacity: 1;    transform: translateZ(0); }
        }
        @keyframes snow-fall {
          0%   { transform: translate3d(0, -10vh, 0); opacity: 0; }
          8%   { opacity: 1; }
          100% { transform: translate3d(var(--drift, 8vw), 110vh, 0); opacity: .95; }
        }
        @keyframes snow-sway {
          from { transform: translateX(-6px); }
          to   { transform: translateX(6px); }
        }
        @keyframes snow-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes bob {
          from { transform: translateY(0) }
          to   { transform: translateY(-2px) }
        }
        @keyframes tree-wind {
  0%   { transform: rotate(-0.6deg) translateY(0) skewX(-0.2deg); }
  25%  { transform: rotate( 0.9deg) translateY(-1px) skewX( 0.3deg); }
  50%  { transform: rotate(-0.3deg) translateY(0) skewX(-0.15deg); }
  75%  { transform: rotate( 0.7deg) translateY(-1px) skewX( 0.25deg); }
  100% { transform: rotate(-0.6deg) translateY(0) skewX(-0.2deg); }
}
        @keyframes blink {
          0%, 100% { opacity: .2 }
          50%      { opacity: 1 }
        }
          @keyframes santa-fly {
  0%   { transform: translate3d(-20vw, 0, 0); }
  50%  { transform: translate3d(55vw, -2vh, 0); }
  100% { transform: translate3d(120vw, 0, 0); }
}
@keyframes santa-bob {
  from { transform: translateY(-2px); }
  to   { transform: translateY( 2px); }
}
@keyframes gift-fall {
  0%   { transform: translate3d(0, 0, 0); opacity: 1; }
  100% { transform: translate3d(var(--gift-drift, 0), 120vh, 0); opacity: 1; }
}

      `}</style>
    </div>
  );
}

function SantaWithGifts({
  className = "",
  duration = 18,
  amplitudeVH = 3.5,
  giftEveryMs = 1400,
  maxGifts = 36,
  santaSrc,
  santaWidth = 460,
  santaHeight,
  minTopVH = 2,     // 👈 NEW: cao nhất (gần đỉnh)
  maxTopVH = 24,    // 👈 NEW: thấp nhất của đường bay (vẫn khá cao)
}) {
  const santaRef = React.useRef(null);
  const [gifts, setGifts] = React.useState([]);

  // helper random base & amp theo khoảng mới
  const pickBaseTop = React.useCallback(() => {
    // giữ khoảng an toàn: min < max
    const lo = Math.max(0, Math.min(minTopVH, maxTopVH));
    const hi = Math.min(100, Math.max(minTopVH, maxTopVH));
    return lo + Math.random() * (hi - lo);
  }, [minTopVH, maxTopVH]);

  const pathRef = React.useRef({
    start: performance.now(),
    phase: Math.random() * Math.PI * 2,
    amp: amplitudeVH * (0.5 + Math.random() * 0.5),
    baseTop: 0, // sẽ set ngay bên dưới
  });
  // khởi tạo baseTop lần đầu
  React.useEffect(() => {
    pathRef.current.baseTop = pickBaseTop();
  }, [pickBaseTop]);

  const uid = React.useRef(0);
  const posRef = React.useRef({ xVW: -20, yVH: 0 });

  React.useEffect(() => {
    let rafId;
    const loop = (now) => {
      let { start, phase, amp, baseTop } = pathRef.current;
      const T = duration * 1000;
      let t = now - start;

      if (t >= T) {
        pathRef.current = {
          start: now,
          phase: Math.random() * Math.PI * 2,
          amp: amplitudeVH * (0.5 + Math.random() * 0.5),
          baseTop: pickBaseTop(), // 👈 random trong dải cao mới
        };
        ({ start, phase, amp, baseTop } = pathRef.current);
        t = 0;
      }

      const p = t / T;
      const xVW = -20 + 140 * p;

      // Clamp biên độ để không vượt khỏi [minTopVH..maxTopVH]
      const maxUp = baseTop - Math.min(minTopVH, maxTopVH);
      const maxDown = Math.max(minTopVH, maxTopVH) - baseTop;
      const safeAmp = Math.min(amp, maxUp, maxDown, amplitudeVH);

      const yVH = baseTop + safeAmp * Math.sin(2 * Math.PI * p + phase);

      posRef.current = { xVW, yVH };
      const el = santaRef.current;
      if (el) el.style.transform = `translate3d(${xVW}vw, ${yVH}vh, 0)`;

      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, [duration, amplitudeVH, minTopVH, maxTopVH, pickBaseTop]);

  React.useEffect(() => {
    const iv = setInterval(() => {
      setGifts((prev) => {
        if (prev.length >= maxGifts) return prev;
        const { xVW, yVH } = posRef.current;
        const size = 10 + Math.random() * 12;
        const fallDur = 8 + Math.random() * 6;
        const drift = (Math.random() * 12 - 6).toFixed(2);
        const id = uid.current++;
        setTimeout(() => {
          setGifts((list) => list.filter((g) => g.id !== id));
        }, (fallDur + 0.5) * 1000);
        return [...prev, { id, leftVW: xVW, topVH: yVH, size, fallDur, drift }];
      });
    }, giftEveryMs);
    return () => clearInterval(iv);
  }, [giftEveryMs, maxGifts]);

  return (
    <div className={`${className} pointer-events-none`}>
      <div ref={santaRef} className="relative" style={{ willChange: "transform" }}>
        <div style={{ animation: "santa-bob 2.6s ease-in-out infinite alternate" }}>
          {santaSrc ? (
            <img
              src={santaSrc}
              alt="Santa on sleigh"
              width={santaWidth}
              height={santaHeight}
              style={{ display: "block", objectFit: "contain", filter: "drop-shadow(0 6px 8px rgba(0,0,0,.25))", transform: "translateZ(0)" }}
            />
          ) : (
            <SantaSleighSVG width={440} height={132} />
          )}
        </div>
      </div>

      <div className="absolute inset-0">
        {gifts.map((g) => (
          <div
            key={g.id}
            className="absolute will-change-transform"
            style={{
              left: `${g.leftVW}vw`,
              top: `${g.topVH}vh`,
              ["--gift-drift"]: `${g.drift}vw`,
              animation: `gift-fall ${g.fallDur}s linear 0s 1`,
            }}
          >
            <GiftBox size={g.size} />
          </div>
        ))}
      </div>
    </div>
  );
}



function SantaSleighSVG({ width = 400, height = 120 }) {
  return (
    <svg viewBox="0 0 400 120" width={width} height={height} className="opacity-95">
      {/* dây kéo */}
      <path d="M50,70 C110,40 190,40 250,70" stroke="#d9e6ff" strokeWidth="2" fill="none" />
      {/* tuần lộc */}
      <Reindeer x={80} y={60} scale={0.9} />
      <Reindeer x={150} y={56} scale={1.0} />
      {/* xe trượt + Santa */}
      <g transform="translate(260,60)">
        {/* sleigh */}
        <path d="M0,20 C10,10 40,10 60,20 L90,20 L90,30 L60,30 C40,40 10,40 0,30 Z" fill="#8b2c19" />
        <path d="M0,30 C10,40 40,40 60,30" stroke="#eac39d" strokeWidth="2" fill="none" />
        <path d="M-10,32 C10,50 70,50 100,32" stroke="#b88963" strokeWidth="3" fill="none" />
        {/* Santa (đơn giản) */}
        <circle cx="25" cy="18" r="8" fill="#ffd7c2" />
        <rect x="18" y="22" width="18" height="10" rx="3" fill="#c41e20" />
        <rect x="36" y="20" width="6" height="12" rx="2" fill="#c41e20" />
        <circle cx="18" cy="18" r="3" fill="#ffffff" />
      </g>
    </svg>
  );
}

function Reindeer({ x = 0, y = 0, scale = 1 }) {
  const s = scale;
  return (
    <g transform={`translate(${x},${y}) scale(${s})`}>
      <ellipse cx="0" cy="0" rx="18" ry="10" fill="#8a5a3a" />
      <circle cx="20" cy="-6" r="8" fill="#8a5a3a" />
      <circle cx="23" cy="-8" r="2" fill="#000" />
      <path d="M18,-14 l6,-6 m-3,3 l6,-6" stroke="#d4b08d" strokeWidth="2" />
      <path d="M-10,8 v10 M0,8 v10 M10,8 v10" stroke="#6e472f" strokeWidth="2" />
    </g>
  );
}

function GiftBox({ size = 16 }) {
  const s = size;
  return (
    <svg viewBox="0 0 40 50" width={s} height={s * 1.25} style={{ display: "block" }}>
      {/* bóng */}
      <ellipse cx="20" cy="46" rx="10" ry="4" fill="rgba(0,0,0,.18)" />
      {/* hộp */}
      <rect x="6" y="18" width="28" height="22" rx="3" fill="#ff6b6b" />
      <rect x="18" y="18" width="4" height="22" fill="#ffd166" />
      <rect x="6" y="28" width="28" height="4" fill="#ffd166" opacity=".7" />
      {/* nắp */}
      <rect x="4" y="14" width="32" height="8" rx="2" fill="#ff6b6b" />
      <rect x="18" y="14" width="4" height="8" fill="#ffd166" />
      {/* nơ */}
      <path d="M18,14 C14,10 10,12 10,14 C10,16 14,16 18,14" fill="#ffd166" />
      <path d="M22,14 C26,10 30,12 30,14 C30,16 26,16 22,14" fill="#ffd166" />
    </svg>
  );
}


/* ---------- Moon with Snowman Silhouette (Top-Right) ---------- */
function MoonWithSnowman({ className = "", size = 150, intensity = 1 }) {
  const s = size;
  return (
    <div
      className={`relative pointer-events-none ${className}`}
      style={{ width: s, height: s }}
    >
      {/* Halo xa mềm */}
      <div
        className="absolute -inset-[12%] rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(255,255,235,.18) 0%, rgba(255,255,235,.07) 48%, rgba(255,255,235,0) 70%)",
          filter: "blur(10px)",
          opacity: 0.9 * intensity,
        }}
      />
      {/* Corona sát mép */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(255,255,255,0) 62%, rgba(255,255,230,.34) 72%, rgba(255,255,230,.1) 82%, rgba(255,255,230,0) 88%)",
          filter: "blur(2px)",
          opacity: 0.95 * intensity,
        }}
      />
      {/* Đĩa mặt trăng */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background:
            "radial-gradient(circle at 52% 48%, #ffffff 0%, #f4f4f2 60%, #e7e7e0 100%)",
          boxShadow:
            "inset 0 0 0 1px rgba(255,255,255,.55), 0 0 30px 12px rgba(255,255,230,.24), 0 0 50px 22px rgba(255,255,230,.12)",
        }}
      />
      {/* Craters nhẹ để có texture */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          mixBlendMode: "multiply",
          opacity: 0.22,
          backgroundImage: [
            "radial-gradient( circle at 28% 38%, rgba(0,0,0,0.10) 0 7%, transparent 7.5%)",
            "radial-gradient( circle at 62% 42%, rgba(0,0,0,0.08) 0 8%, transparent 8.5%)",
            "radial-gradient( circle at 46% 65%, rgba(0,0,0,0.08) 0 6%, transparent 6.5%)",
            "radial-gradient( circle at 72% 66%, rgba(0,0,0,0.07) 0 5%, transparent 5.5%)",
            "radial-gradient( circle at 38% 76%, rgba(0,0,0,0.06) 0 6%, transparent 6.5%)",
          ].join(","),
        }}
      />

      {/* Silhouette người tuyết — đặt xuống gần đáy mặt trăng */}
<svg
  viewBox="0 0 100 100"
  className="absolute inset-0"
  width={50}
  height={50}
  style={{
    display: "block",
    mixBlendMode: "multiply",
    opacity: 0.28,
    transform: "translateY(80%) translateX(60%)",   // 👈 đẩy xuống ~18% chiều cao
  }}
>
  {/* thân dưới */}
  <circle cx="58" cy="64" r="16" fill="#000" />
  {/* thân trên */}
  <circle cx="58" cy="48" r="12" fill="#000" />
  {/* mũ (brim + crown) */}
  <rect x="46" y="34" width="24" height="4" rx="1.5" fill="#000" />
  <rect x="50" y="26" width="16" height="10" rx="2" fill="#000" />
  {/* khăn quàng (dải ngang + vạt rơi) */}
  <rect x="48" y="52" width="20" height="4" rx="2" fill="#000" />
  <rect x="66" y="52" width="3" height="10" rx="1.5" fill="#000" />
  {/* tay cành đơn giản */}
  <path d="M44 54 L36 50 M44 54 L36 58" stroke="#000" strokeWidth="2" strokeLinecap="round" />
  <path d="M72 54 L80 50 M72 54 L80 58" stroke="#000" strokeWidth="2" strokeLinecap="round" />
</svg>


      {/* Viền highlight mỏng */}
      <div
        className="absolute inset-0 rounded-full"
        style={{ boxShadow: "0 0 0 1px rgba(255,255,255,0.5) inset" }}
      />
    </div>
  );
}


/* ---------- Stars ---------- */
function Stars({ density = 80, blur = false, className = "" }) {
  const stars = useMemo(
    () =>
      Array.from({ length: density }).map(() => ({
        left: Math.random() * 100,
        top: Math.random() * 100,
        size: Math.random() * 1.8 + 0.6,
        twinkle: 2 + Math.random() * 3,
        delay: Math.random() * 4,
      })),
    [density]
  );

  return (
    <div className={`pointer-events-none ${className}`}>
      {stars.map((s, i) => (
        <div
          key={i}
          className="absolute rounded-full will-change-opacity"
          style={{
            left: `${s.left}%`,
            top: `${s.top}%`,
            width: `${s.size}px`,
            height: `${s.size}px`,
            backgroundColor: "white",
            filter: blur ? "blur(1px)" : "none",
            opacity: 0.8,
            animation: `twinkle ${s.twinkle}s ease-in-out ${s.delay}s infinite alternate`,
          }}
        />
      ))}
    </div>
  );
}

/* ---------- Snowflake SVG (6 cánh) ---------- */
function SnowflakeIcon({
  size = 16,
  stroke = "#ffffff",
  strokeWidth = 4,
  opacity = 0.95,
  glow = true,
  className = "",
}) {
  const s = size;
  return (
    <svg
      viewBox="0 0 100 100"
      width={s}
      height={s}
      className={className}
      style={{
        filter: glow ? "drop-shadow(0 0 3px rgba(255,255,255,.7))" : "none",
        opacity,
        display: "block",
      }}
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    >
      <path d="M50 6 L50 94" />
      <path d="M50 20 L40 30" />
      <path d="M50 20 L60 30" />
      <path d="M50 80 L40 70" />
      <path d="M50 80 L60 70" />
      <g transform="rotate(60 50 50)">
        <path d="M50 6 L50 94" />
        <path d="M50 20 L40 30" />
        <path d="M50 20 L60 30" />
        <path d="M50 80 L40 70" />
        <path d="M50 80 L60 70" />
      </g>
      <g transform="rotate(120 50 50)">
        <path d="M50 6 L50 94" />
        <path d="M50 20 L40 30" />
        <path d="M50 20 L60 30" />
        <path d="M50 80 L40 70" />
        <path d="M50 80 L60 70" />
      </g>
    </svg>
  );
}

/* ---------- Ground Snow (đồi tuyết + sương + lấp lánh) ---------- */
function GroundSnow({ height = "22vh", children }) {
  return (
    <div
      className="absolute inset-x-0 bottom-0 pointer-events-none z-[100]"
      style={{ height }}
    >
      {/* Đồi tuyết 2 lớp (SVG rất nhẹ) */}
      <svg
        className="absolute inset-x-0 bottom-0 w-full h-full"
        viewBox="0 0 1200 400"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="snowNear" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f8fcff" />
            <stop offset="100%" stopColor="#eef7ff" />
          </linearGradient>
          <linearGradient id="snowFar" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#eaf3ff" />
            <stop offset="100%" stopColor="#dfeeff" />
          </linearGradient>
        </defs>

        {/* lớp xa (nhạt hơn) */}
        <path
          d="M0,250 C180,230 360,260 520,240 C720,220 920,260 1200,230 L1200,400 L0,400 Z"
          fill="url(#snowFar)"
          opacity="0.75"
        />
        {/* lớp gần (sáng hơn) */}
        <path
          d="M0,300 C220,280 420,310 620,300 C820,288 980,330 1200,310 L1200,400 L0,400 Z"
          fill="url(#snowNear)"
        />
      </svg>

      {/* Sương lạnh bốc lên nhẹ nhàng */}
      <div
        className="absolute inset-x-0 bottom-0"
        style={{
          height: "50%",
          background:
            "linear-gradient(to top, rgba(255,255,255,.85), rgba(255,255,255,0))",
          filter: "blur(2px)",
          opacity: 0.9,
        }}
      />

      {/* Lấp lánh nhỏ trên bề mặt tuyết (rất thưa để nhẹ) */}
      <Sparkles count={28} />

      {/* Nội dung “đứng trên tuyết” */}
      {children}
    </div>
  );
}

function Sparkles({ count = 24 }) {
  const dots = useMemo(
    () =>
      Array.from({ length: count }).map(() => ({
        left: Math.random() * 100, // %
        bottom: Math.random() * 18, // % chiều cao ground
        size: Math.random() * 2.2 + 0.8, // px
        delay: Math.random() * 3.5,
        dur: 1.6 + Math.random() * 2.4,
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
      <style>{`
        @keyframes sparkle {
          from { opacity: .35; transform: scale(.9); }
          to   { opacity: .95; transform: scale(1.1); }
        }
      `}</style>
    </div>
  );
}

/* ---------- Snowman (Bottom-Right) ---------- */
function SnowmanBR({
  scale = 1,
  rightPct = 2.4,
  bottomPct = 6,
}) {
  const base = 110 * scale;
  return (
    <div
      className="absolute"
      style={{
        right: `${rightPct}%`,
        bottom: `${bottomPct}%`,
        width: base,
        height: base * 1.2,
        animation: "bob 2.8s ease-in-out 0s infinite alternate",
      }}
    >
      <SnowmanSVG width={base} height={base * 1.2} />
    </div>
  );
}

function SnowmanSVG({ width = 110, height = 132 }) {
  return (
    <svg viewBox="0 0 220 260" width={width} height={height} style={{ display: "block" }}>
      <defs>
        <radialGradient id="snowBodyGrad" cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="65%" stopColor="#f6fbff" />
          <stop offset="100%" stopColor="#eaf3ff" />
        </radialGradient>
        <radialGradient id="shadowGrad" cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor="rgba(0,0,0,0.28)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0)" />
        </radialGradient>
      </defs>

      <ellipse cx="150" cy="240" rx="58" ry="10" fill="rgba(0,0,0,0.22)" />
      <circle cx="140" cy="175" r="55" fill="url(#snowBodyGrad)" />
      <circle cx="140" cy="120" r="40" fill="url(#snowBodyGrad)" />
      <circle cx="140" cy="175" r="55" fill="none" stroke="rgba(255,255,255,.6)" strokeWidth="1" />
      <circle cx="140" cy="120" r="40" fill="none" stroke="rgba(255,255,255,.6)" strokeWidth="1" />

      <circle cx="152" cy="112" r="3.5" fill="#222" /> {/* mắt phải bình thường */}

{/* mắt trái nháy */}
<circle className="eye-wink" cx="132" cy="112" r="3.5" fill="#222" />

      <path d="M146,120 L168,124 L146,128 Z" fill="#f98937" stroke="#dc6f1f" strokeWidth="1" />

      {[-10,-6,-2,2,6,10].map((dx,i)=>( <circle key={i} cx={140+dx} cy="132" r="2" fill="#c04e2b" opacity="0.85" /> ))}

      <path d="M105,132 C120,126 160,126 175,132 C170,138 110,138 105,132 Z" fill="#d62828" stroke="#b71f1f" strokeWidth="1" />
      <rect x="170" y="132" width="10" height="32" rx="3" fill="#d62828" />
      <rect x="162" y="132" width="8" height="26" rx="3" fill="#b71f1f" opacity=".7" />

      {[160,175,190].map((y,i)=>( <circle key={i} cx="140" cy={y-10} r="3.2" fill="#2b2b2b" /> ))}

      {/* tay trái (nhẹ) */}
<g className="arm arm-left">
  <path
    d="M90,145 C70,138 58,134 46,132"
    stroke="#6e5034"
    strokeWidth="4"
    fill="none"
    strokeLinecap="round"
  />
</g>

{/* tay phải (vẫy) */}
<g className="arm arm-right">
  <path
    d="M185,145 C202,138 214,134 226,132"
    stroke="#6e5034"
    strokeWidth="4"
    fill="none"
    strokeLinecap="round"
  />
</g>

      <g transform="translate(140,96)">
        <ellipse cx="0" cy="0" rx="34" ry="6" fill="#111" />
        <rect x="-22" y="-26" width="44" height="22" rx="2" fill="#111" />
        <rect x="-22" y="-10" width="44" height="6" fill="#d62828" />
        <rect x="-20" y="-24" width="16" height="3" fill="rgba(255,255,255,.25)" />
      </g>

      <ellipse cx="120" cy="175" rx="36" ry="18" fill="url(#shadowGrad)" opacity=".22" />
    
    <style>{`
  /* tay vẫy */
  .arm {
    transform-box: fill-box;
    transform-origin: 90% 20%;
    will-change: transform;
  }
  .arm-left {
    animation: arm-sway 4.2s ease-in-out infinite;
    opacity: .95;
  }
  .arm-right {
    transform-origin: 10% 20%;
    animation: arm-wave 2.6s ease-in-out infinite;
  }

  @keyframes arm-sway {
    0%,100% { transform: rotate(-2deg); }
    50%     { transform: rotate( 2deg); }
  }
  @keyframes arm-wave {
    0%,100% { transform: rotate( 6deg); }
    50%     { transform: rotate(-10deg); }
  }

  /* mắt nháy kiểu “wink” theo nhịp (thỉnh thoảng) */
  .eye-wink {
    transform-box: fill-box;
    transform-origin: 50% 50%;
    animation: wink 5.5s ease-in-out infinite;
  }
  @keyframes wink {
    0%, 86%, 100% { transform: scaleY(1); opacity: 1; }
    88%           { transform: scaleY(0.15); opacity: .9; }
    90%           { transform: scaleY(1); opacity: 1; }
    92%           { transform: scaleY(0.15); opacity: .9; }
    94%           { transform: scaleY(1); opacity: 1; }
  }
`}</style>

    </svg>
  );
}

/* ---------- Pine Tree + Gifts (Bottom-Left) ---------- */
function PineTreeBL({
  scale = 1.15,
  leftPct = 3,
  bottomPct = 4,
}) {
  const base = 150 * scale;
  return (
    <div
      className="absolute"
      style={{
        left: `${leftPct}%`,
        bottom: `${bottomPct}%`,
        width: base,
        height: base * 1.2,
        willChange: "transform",
      }}
    >
      <PineTreeSVG width={base} height={base * 1.2} />
    </div>
  );
}

function PineTreeSVG({ width = 180, height = 210 }) {
  return (
    <svg viewBox="0 0 220 260" width={width} height={height} style={{ display: "block" }}>
      <defs>
        <linearGradient id="leaf1" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1e6b3a" />
          <stop offset="100%" stopColor="#124d2b" />
        </linearGradient>
        <linearGradient id="leaf2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#228a49" />
          <stop offset="100%" stopColor="#166236" />
        </linearGradient>
        <linearGradient id="snowCap" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#e8f4ff" />
        </linearGradient>
        <linearGradient id="trunk" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6b4126" />
          <stop offset="100%" stopColor="#4f311f" />
        </linearGradient>
      </defs>

      {/* ✅ CHỈ CÂY LẮC (không gồm quà) */}
      <g className="treeOnly">
        {/* Bóng dưới gốc cây */}
        <ellipse cx="95" cy="238" rx="55" ry="10" fill="rgba(0,0,0,.18)" />

        {/* Thân cây */}
        <rect x="86" y="200" width="18" height="30" rx="3" fill="url(#trunk)" />

        {/* Tầng 3 (dưới) */}
        <path d="M30,180 L160,180 L95,120 Z" fill="url(#leaf1)" />
        <path d="M60,168 C85,160 105,160 130,168 Q95,170 60,168 Z" fill="url(#snowCap)" opacity=".95" />

        {/* Tầng 2 (giữa) */}
        <path d="M45,150 L145,150 L95,98 Z" fill="url(#leaf2)" />
        <path d="M70,140 C88,134 102,134 120,140 Q95,142 70,140 Z" fill="url(#snowCap)" opacity=".95" />

        {/* Tầng 1 (trên) */}
        <path d="M60,124 L130,124 L95,82 Z" fill="url(#leaf1)" />
        <path d="M78,116 C90,112 100,112 112,116 Q95,118 78,116 Z" fill="url(#snowCap)" opacity=".95" />

        {/* Sao trên đỉnh */}
        <g transform="translate(95,74)">
          <polygon points="0,-14 4,-4 14,0 4,4 0,14 -4,4 -14,0 -4,-4" fill="#ffd35a" opacity=".95" />
        </g>

        {/* Dây kim tuyến */}
        <path d="M55,128 C95,140 95,140 135,128" stroke="#ffd35a" strokeWidth="3" fill="none" opacity=".85" />
        <path d="M42,154 C95,170 95,170 148,154" stroke="#ffd35a" strokeWidth="3" fill="none" opacity=".85" />
        <path d="M30,182 C95,200 95,200 160,182" stroke="#ffd35a" strokeWidth="3" fill="none" opacity=".85" />

        {/* Bóng trang trí */}
        {[
          { x: 80, y: 130, c: "#ff5b5b" },
          { x: 110, y: 132, c: "#5bc0ff" },
          { x: 65, y: 158, c: "#ffd35a" },
          { x: 125, y: 156, c: "#ad8cff" },
          { x: 95, y: 182, c: "#ff8fb0" },
        ].map((b, i) => (
          <circle
            key={i}
            cx={b.x}
            cy={b.y}
            r="5.5"
            fill={b.c}
            style={{ filter: "drop-shadow(0 0 2px rgba(255,255,255,.4))" }}
          />
        ))}

        {/* Đèn nháy */}
        {[{ x: 70, y: 170 }, { x: 120, y: 170 }, { x: 95, y: 146 }, { x: 105, y: 188 }].map((d, i) => (
          <circle
            key={i}
            cx={d.x}
            cy={d.y}
            r="2.4"
            fill="#fff"
            opacity=".8"
            style={{ animation: `blink ${1.2 + i * 0.2}s ease-in-out ${i * 0.15}s infinite` }}
          />
        ))}
      </g>

      {/* ✅ HỘP QUÀ KHÔNG LẮC */}
      <rect x="28" y="206" width="36" height="26" rx="2" fill="#ff6b6b" />
      <rect x="44" y="206" width="4" height="26" fill="#fff3" />
      <rect x="28" y="218" width="36" height="4" fill="#fff3" />
      <rect x="38" y="200" width="16" height="8" rx="2" fill="#ff6b6b" />

      <rect x="62" y="212" width="32" height="20" rx="2" fill="#4dabf7" />
      <rect x="76" y="212" width="4" height="20" fill="#fff3" />
      <rect x="62" y="222" width="32" height="4" fill="#fff3" />
      <rect x="70" y="206" width="16" height="8" rx="2" fill="#4dabf7" />

      <rect x="96" y="214" width="22" height="18" rx="2" fill="#ffd166" />
      <rect x="106" y="214" width="3" height="18" fill="#fff3" />
      <rect x="96" y="223" width="22" height="3" fill="#fff3" />
      <rect x="100" y="208" width="14" height="7" rx="2" fill="#ffd166" />

      {/* CSS ngay trong SVG để chỉ lắc group treeOnly */}
      <style>{`
        .treeOnly {
          transform-box: fill-box;
          transform-origin: 50% 100%;
          animation: tree-wind-strong 3.8s ease-in-out infinite;
          will-change: transform;
        }

        @keyframes tree-wind-strong {
          0%   { transform: rotate(-1.4deg) skewX(-0.35deg) translateY(0); }
          25%  { transform: rotate( 2.0deg) skewX( 0.55deg) translateY(-1px); }
          50%  { transform: rotate(-0.9deg) skewX(-0.25deg) translateY(0); }
          75%  { transform: rotate( 1.6deg) skewX( 0.45deg) translateY(-1px); }
          100% { transform: rotate(-1.4deg) skewX(-0.35deg) translateY(0); }
        }
      `}</style>
    </svg>
  );
}
