// import React, { useEffect, useRef, useState } from "react";

// export default function QuantityStepper({ value = 1, min = 1, onChange, disabled }) {
//   const clamp = (v) => Math.max(min, Number.isFinite(+v) ? parseInt(v, 10) : min);

//   // State hiển thị trong ô input (cho phép rỗng)
//   const [draft, setDraft] = useState(
//     value === undefined || value === null ? "" : String(value)
//   );

//   // Sync khi prop value đổi từ bên ngoài
//   useEffect(() => {
//     const s = value === undefined || value === null ? "" : String(value);
//     setDraft(s);
//   }, [value]);

//   const apply = (next) => {
//     if (disabled) return;
//     if (typeof next === "function") onChange?.((prev) => clamp(next(prev)));
//     else onChange?.(clamp(next));
//   };

//   // Auto-hold (không cộng ngay, tránh double-step)
//   const holdRef = useRef({ t: null, i: null });
//   const startHold = (delta) => (e) => {
//     e.preventDefault();
//     e.stopPropagation();
//     if (disabled) return;
//     holdRef.current.t = setTimeout(() => {
//       holdRef.current.i = setInterval(() => {
//         apply((prev) => (typeof prev === "number" ? prev + delta : (value ?? min) + delta));
//       }, 120);
//     }, 300);
//   };
//   const stopHold = () => {
//     if (holdRef.current.t) clearTimeout(holdRef.current.t);
//     if (holdRef.current.i) clearInterval(holdRef.current.i);
//     holdRef.current.t = null;
//     holdRef.current.i = null;
//   };

//   // Commit khi blur hoặc Enter
//   const commitDraft = () => {
//     const n = draft === "" ? min : parseInt(draft, 10);
//     const c = clamp(n);
//     onChange?.(c);
//     setDraft(String(c));
//   };

//   return (
//     <div
//       className="inline-flex items-center rounded-full bg-white/90 backdrop-blur border border-slate-200 shadow-sm h-10 select-none"
//       role="group"
//       onClick={(e) => e.stopPropagation()}
//       onWheel={(e) => e.preventDefault()}
//       onMouseUp={stopHold}
//       onMouseLeave={stopHold}
//       onTouchEnd={stopHold}
//     >
//       <button
//         type="button"
//         aria-label="Giảm"
//         disabled={disabled || (Number.isFinite(+value) ? value <= min : false)}
//         onClick={(e) => { e.stopPropagation(); apply((value ?? min) - 1); }}
//         onMouseDown={startHold(-1)}
//         onTouchStart={startHold(-1)}
//         className={`w-10 h-10 rounded-l-full grid place-items-center border-r border-slate-200
//           ${disabled ? "text-slate-300" : "hover:bg-slate-50 active:scale-95"}`}
//       >
//         −
//       </button>

//       <input
//         type="text"
//         inputMode="numeric"
//         pattern="[0-9]*"
//         value={draft}
//         onFocus={() => setDraft("")}
//         onChange={(e) => {
//           const raw = e.target.value.replace(/[^\d]/g, "");
//           setDraft(raw); // KHÔNG clamp ở đây
//         }}
//         onBlur={commitDraft}
//         onKeyDown={(e) => {
//           if (e.key === "ArrowUp") { e.preventDefault(); apply((value ?? min) + 1); }
//           if (e.key === "ArrowDown") { e.preventDefault(); apply((value ?? min) - 1); }
//           if (e.key === "Enter") { e.preventDefault(); commitDraft(); }
//           if (e.key === " ") e.preventDefault();
//         }}
//         className="w-14 text-center outline-none bg-transparent text-slate-800 font-medium"
//       />

//       <button
//         type="button"
//         aria-label="Tăng"
//         disabled={disabled}
//         onClick={(e) => { e.stopPropagation(); apply((value ?? min) + 1); }}
//         onMouseDown={startHold(1)}
//         onTouchStart={startHold(1)}
//         className={`w-10 h-10 rounded-r-full grid place-items-center border-l border-slate-200
//           ${disabled ? "text-slate-300" : "hover:bg-slate-50 active:scale-95"}`}
//       >
//         +
//       </button>
//     </div>
//   );
// }




import React, { useEffect, useRef, useState } from "react";

export default function QuantityStepper({
  value = 0,
  min = 0,
  onChange,
  disabled,
  autoFocus = false,
}) {
  const clamp = (v) => Math.max(min, Number.isFinite(+v) ? parseInt(v, 10) : min);

  const [draft, setDraft] = useState(
    value === undefined || value === null ? "" : String(value)
  );

  const inputRef = useRef(null);

  useEffect(() => {
    const s = value === undefined || value === null ? "" : String(value);
    setDraft(s);
  }, [value]);

  useEffect(() => {
    if (autoFocus && inputRef.current && !disabled) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [autoFocus, disabled]);

  const apply = (next) => {
    if (disabled) return;
    if (typeof next === "function") onChange?.((prev) => clamp(next(prev)));
    else onChange?.(clamp(next));
  };

  const holdRef = useRef({ t: null, i: null });

  const startHold = (delta) => (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    holdRef.current.t = setTimeout(() => {
      holdRef.current.i = setInterval(() => {
        apply((prev) =>
          typeof prev === "number" ? prev + delta : (value ?? min) + delta
        );
      }, 120);
    }, 300);
  };

  const stopHold = () => {
    if (holdRef.current.t) clearTimeout(holdRef.current.t);
    if (holdRef.current.i) clearInterval(holdRef.current.i);
    holdRef.current.t = null;
    holdRef.current.i = null;
  };

  const commitDraft = () => {
    const n = draft === "" ? min : parseInt(draft, 10);
    const c = clamp(n);
    onChange?.(c);
    setDraft(String(c));
  };

  return (
    <div
      className="inline-flex items-center rounded-full bg-white/90 backdrop-blur border border-slate-200 shadow-sm h-10 select-none"
      role="group"
      onClick={(e) => e.stopPropagation()}
      onWheel={(e) => e.preventDefault()}
      onMouseUp={stopHold}
      onMouseLeave={stopHold}
      onTouchEnd={stopHold}
    >
      <button
        type="button"
        aria-label="Giảm"
        disabled={disabled || (Number.isFinite(+value) ? value <= min : false)}
        onClick={(e) => {
          e.stopPropagation();
          apply((value ?? min) - 1);
        }}
        onMouseDown={startHold(-1)}
        onTouchStart={startHold(-1)}
        className={`w-10 h-10 rounded-l-full grid place-items-center border-r border-slate-200
          ${disabled ? "text-slate-300" : "hover:bg-slate-50 active:scale-95"}`}
      >
        −
      </button>

      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={draft}
        onFocus={() => setDraft("")}
        onChange={(e) => {
          const raw = e.target.value.replace(/[^\d]/g, "");
          setDraft(raw);
        }}
        onBlur={commitDraft}
        onKeyDown={(e) => {
          if (e.key === "ArrowUp") {
            e.preventDefault();
            apply((value ?? min) + 1);
          }
          if (e.key === "ArrowDown") {
            e.preventDefault();
            apply((value ?? min) - 1);
          }
          if (e.key === "Enter") {
            e.preventDefault();
            commitDraft();
          }
          if (e.key === " ") e.preventDefault();
        }}
        className="w-14 text-center outline-none bg-transparent text-slate-800 font-medium"
      />

      <button
        type="button"
        aria-label="Tăng"
        disabled={disabled}
        onClick={(e) => {
          e.stopPropagation();
          apply((value ?? min) + 1);
        }}
        onMouseDown={startHold(1)}
        onTouchStart={startHold(1)}
        className={`w-10 h-10 rounded-r-full grid place-items-center border-l border-slate-200
          ${disabled ? "text-slate-300" : "hover:bg-slate-50 active:scale-95"}`}
      >
        +
      </button>
    </div>
  );
}

