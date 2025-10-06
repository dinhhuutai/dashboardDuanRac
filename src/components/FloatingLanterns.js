import React, { useMemo, useState } from "react";

/**
 * FloatingLanterns – nền lồng đèn bay + click mở ảnh (lightbox)
 * - Dựa trên CSS animation (mượt, ít tốn CPU)
 * - Tùy biến: số lượng, vị trí, tốc độ, trôi ngang, kích thước
 * - Click vào lồng đèn sẽ mở ảnh (imageUrl) và có thể tắt
 * - Hỗ trợ giảm chuyển động khi user bật `prefers-reduced-motion`
 *
 * Cách dùng nhanh:
 * <FloatingLanterns
 *   backgroundUrl="/images/bg-mid-autumn.jpg"
 *   lanternSrc="/images/lantern.png"
 *   lanterns={[
 *     { imageUrl: "/gallery/1.jpg" },
 *     { imageUrl: "/gallery/2.jpg" },
 *   ]}
 * />
 */
export default function FloatingLanterns({
  backgroundUrl,
  lanternSrc = "/lantern.png",
  lanterns = [], // mỗi item: { imageUrl, left, size, speed, drift, delay }
  autoCount = 40, // nếu không truyền lanterns sẽ sinh ngẫu nhiên số lượng này
}) {
  const [active, setActive] = useState(null); // {imageUrl}

  const items = useMemo(() => {
    if (lanterns?.length) return lanterns.map(fillDefaults);
    // tạo ngẫu nhiên
    return Array.from({ length: autoCount }).map(() =>
      fillDefaults({})
    );
  }, [lanterns, autoCount]);

  return (
    <div className="relative w-full h-dvh overflow-hidden">
      {/* Background */}
      <div
        className="absolute inset-0 bg-black"
        style={{
          backgroundImage: `url(${backgroundUrl})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
        aria-hidden
      />

      {/* Overlay sao nhẹ (tuỳ chọn, tạo chiều sâu) */}
      <Stars />

      {/* Lanterns */}
      <div className="absolute inset-0 pointer-events-none">
        {items.map((it, i) => (
          <Lantern
            key={i}
            {...it}
            lanternSrc={lanternSrc}
            onClick={() => setActive({ imageUrl: it.imageUrl })}
          />
        ))}
      </div>

      {/* Lightbox */}
      {active && (
        <Lightbox
          src={active.imageUrl}
          onClose={() => setActive(null)}
        />
      )}

      {/* Style cục bộ */}
      <style>{css}</style>
    </div>
  );
}

/* ================= Helpers & Subcomponents ================= */
function fillDefaults(item) {
  const rand = (min, max) => Math.random() * (max - min) + min;
  return {
    imageUrl: item.imageUrl || undefined,
    left: pctClamp(item.left ?? rand(0, 100)), // % ngang màn hình
    size: item.size ?? rand(18, 42), // px chiều rộng
    speed: item.speed ?? rand(18, 36), // s – thời gian bay từ dưới lên trên
    drift: item.drift ?? rand(-18, 18), // px – trôi ngang
    delay: item.delay ?? rand(0, 20), // s – trễ bắt đầu
  };
}
function pctClamp(n) {
  return Math.max(0, Math.min(100, n));
}

function Lantern({ left, size, speed, drift, delay, imageUrl, lanternSrc, onClick }) {
  // pointer-events: auto để click, parent đã pointer-events-none
  return (
    <button
      type="button"
      className="absolute bottom-[-64px] select-none"
      style={{
        left: `${left}%`,
        width: `${size}px`,
        animation: `rise ${speed}s linear ${delay}s infinite`,
        transform: `translateX(0)`,
        // custom property cho trôi ngang
        ["--drift"]: `${drift}px`,
      }}
      onClick={onClick}
      aria-label="Open image"
    >
      <img
        src={lanternSrc}
        alt="Lantern"
        draggable={false}
        className="block w-full drop-shadow-[0_0_10px_rgba(255,150,50,0.8)] pointer-events-auto"
      />
    </button>
  );
}

function Stars() {
  return (
    <svg className="absolute inset-0 w-full h-full opacity-60" aria-hidden>
      {Array.from({ length: 120 }).map((_, i) => {
        const cx = Math.random() * 100;
        const cy = Math.random() * 100;
        const r = Math.random() * 0.6 + 0.2;
        const tw = Math.random() * 3 + 1;
        return (
          <circle
            key={i}
            cx={`${cx}%`}
            cy={`${cy}%`}
            r={r}
            fill="white"
            style={{ animation: `twinkle ${tw}s ease-in-out ${Math.random() * 5}s infinite` }}
          />
        );
      })}
    </svg>
  );
}

function Lightbox({ src, onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="relative max-w-5xl w-full max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 z-10 rounded-full bg-white/90 text-slate-900 px-3 py-1 text-sm shadow hover:bg-white"
        >
          Đóng
        </button>
        {src ? (
          <img
            src={src}
            alt="Preview"
            className="w-full h-auto max-h-[85vh] object-contain rounded-xl shadow"
          />
        ) : (
          <div className="w-full h-[60vh] bg-white/10 rounded-xl grid place-items-center text-white">
            Không có ảnh
          </div>
        )}
      </div>
    </div>
  );
}

/* ================= Styles (CSS-in-JS) ================= */
const css = `
@keyframes rise {
  0% {
    transform: translate(-50%, 100vh) translateX(0);
    opacity: 0;
  }
  10% { opacity: 1; }
  50% {
    transform: translate(-50%, 50vh) translateX(var(--drift));
  }
  100% {
    transform: translate(-50%, -10vh) translateX(0);
    opacity: 0.8;
  }
}
@keyframes twinkle {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 1; }
}
@media (prefers-reduced-motion: reduce) {
  [style*='animation: rise'] { animation-duration: 40s !important; }
  svg circle { animation: none !important; }
}
`;
