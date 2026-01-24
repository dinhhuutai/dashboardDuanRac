import React, { useId } from "react";

export default function LedMarquee({ text }) {
  const uid = useId();
  const animName = `marq_${uid}`;
  const twinkleName = `twinkle_${uid}`;

  return (
    <div className="ledWrap2">
      <style>{`
        .ledWrap2{
          position: relative;
          border-radius: 18px;
          background:
            radial-gradient(circle at 18% 18%, rgba(124,247,255,.35), transparent 55%),
            radial-gradient(circle at 85% 80%, rgba(255,224,138,.32), transparent 55%),
            linear-gradient(180deg, rgba(255,255,255,.72), rgba(255,255,255,.52));
          box-shadow: 0 8px 18px rgba(2,6,23,.10);
          backdrop-filter: blur(10px);
          overflow: hidden;
          border: 1px solid rgba(226,232,240,.7);
        }
        .ledInner2{
          position: relative;
          border-radius: 14px;
          padding: 10px 12px;
          background:
            linear-gradient(180deg, rgba(255,255,255,.70), rgba(255,255,255,.34)),
            radial-gradient(circle at 25% 25%, rgba(124,247,255,.18), transparent 58%);
          box-shadow: inset 0 6px 14px rgba(2,6,23,.06);
          overflow: hidden;
          z-index: 1;
        }
        .ledInner2::before{
          content:"";
          position:absolute;
          inset:0;
          background:
            repeating-linear-gradient(
              to bottom,
              rgba(2,6,23,.05),
              rgba(2,6,23,.05) 1px,
              rgba(255,255,255,0) 5px,
              rgba(255,255,255,0) 9px
            );
          opacity:.20;
          pointer-events:none;
        }
        .ledInner2::after{
          content:"";
          position:absolute;
          left:-30%;
          top:-20%;
          width:60%;
          height:140%;
          background: linear-gradient(90deg, transparent, rgba(124,247,255,.16), transparent);
          transform: rotate(12deg);
          animation: sheen_${uid} 4.8s ease-in-out infinite;
          pointer-events:none;
          opacity:.55;
        }
        @keyframes sheen_${uid}{
          0%   { transform: translateX(-10%) rotate(12deg); opacity:.20; }
          50%  { transform: translateX(120%) rotate(12deg); opacity:.50; }
          100% { transform: translateX(220%) rotate(12deg); opacity:.20; }
        }
        .marqueeRow2{
          position: relative;
          display:flex;
          align-items:center;
          white-space: nowrap;
          overflow: hidden;
        }
        .marqueeText2{
          font-size: 13.5px;
          display:flex;
          align-items:center;
          gap: 12px;
          padding-left: 110%;
          will-change: transform;
          animation: ${animName} 8.5s linear infinite;
          font-family: "Baloo 2", system-ui, sans-serif;
          font-weight: 700;
          letter-spacing: .2px;
        }
        .marqueeText2 .msg{
          color: rgba(15,23,42,.72);
          text-shadow: 0 1px 0 rgba(255,255,255,.50), 0 0 12px rgba(124,247,255,.14);
        }
        .marqueeText2 span{
          background: none !important;
          -webkit-background-clip: initial !important;
          background-clip: initial !important;
          color: inherit !important;
        }
        @keyframes ${animName}{
          0%{ transform: translateX(0); }
          100%{ transform: translateX(-100%); }
        }
        .twinkleLayer{
          position:absolute;
          inset:0;
          pointer-events:none;
          background:
            radial-gradient(circle at 15% 30%, rgba(255,255,255,.20), transparent 42%),
            radial-gradient(circle at 70% 40%, rgba(124,247,255,.12), transparent 45%),
            radial-gradient(circle at 40% 80%, rgba(255,224,138,.10), transparent 40%);
          opacity:.12;
          animation: ${twinkleName} 3.2s ease-in-out infinite;
        }
        @keyframes ${twinkleName}{
          0%{ opacity:.08; transform: translateY(0px); }
          50%{ opacity:.14; transform: translateY(-1px); }
          100%{ opacity:.08; transform: translateY(0px); }
        }
      `}</style>

      <div className="ledInner2">
        <div className="twinkleLayer" />
        <div className="marqueeRow2">
          <div className="marqueeText2">
            <span className="msg">{text}</span>
            <span className="gap">{"        "}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
