import React, { useId } from "react";

export default function SparkleBubbles({ className = "" }) {
  const uid = useId();
  const anim = `bubble_${uid}`;

  const items = [
    { x: 8, y: 72, s: 10, d: 0.0 },
    { x: 18, y: 22, s: 7, d: 0.4 },
    { x: 34, y: 58, s: 6, d: 0.2 },
    { x: 58, y: 18, s: 9, d: 0.6 },
    { x: 72, y: 62, s: 7, d: 0.1 },
    { x: 86, y: 30, s: 6, d: 0.5 },
  ];

  return (
    <div className={["pointer-events-none absolute inset-0", className].join(" ")}>
      <style>{`
        @keyframes ${anim}{
          0%{ transform: translateY(0px); opacity:.08; }
          40%{ opacity:.16; }
          70%{ opacity:.12; }
          100%{ transform: translateY(-6px); opacity:.08; }
        }
        .bubble{
          position:absolute;
          border-radius:999px;
          background: radial-gradient(circle at 35% 30%, rgba(255,255,255,.65), rgba(255,255,255,.10) 35%, rgba(255,255,255,0) 70%);
          box-shadow: 0 0 14px rgba(255,230,130,.12);
          animation: ${anim} 3.4s ease-in-out infinite;
        }
        .spark{
          position:absolute;
          width: 10px; height: 10px;
          transform: rotate(45deg);
          background: radial-gradient(circle, rgba(255,255,255,.75), rgba(255,255,255,0) 65%);
          filter: drop-shadow(0 0 6px rgba(255,235,160,.22));
          opacity:.14;
          animation: ${anim} 2.8s ease-in-out infinite;
        }
      `}</style>

      {items.map((it, i) => (
        <span
          key={i}
          className="bubble"
          style={{
            left: `${it.x}%`,
            top: `${it.y}%`,
            width: `${it.s}px`,
            height: `${it.s}px`,
            animationDelay: `${it.d}s`,
          }}
        />
      ))}

      <span className="spark" style={{ left: "12%", top: "12%", animationDelay: "0.2s" }} />
      <span className="spark" style={{ left: "64%", top: "8%", animationDelay: "0.5s" }} />
      <span className="spark" style={{ left: "84%", top: "74%", animationDelay: "0.1s" }} />
    </div>
  );
}
