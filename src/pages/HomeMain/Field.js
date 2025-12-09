// src/pages/Home/components/Field.jsx
import React from "react";

function Field({ label, hint, children }) {
  return (
    <div className="space-y-1">
      {label && <label className="text-sm font-medium text-slate-700">{label}</label>}
      {children}
      {hint ? <p className="text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}

export default Field;
