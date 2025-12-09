// src/pageTaskManagement/MyTasks/taskFormatters.js

export function fmtDate(v) {
  if (!v) return "—";
  try {
    return new Date(v).toLocaleDateString("vi-VN");
  } catch {
    return "—";
  }
}

export function fmtTime(v) {
  if (!v) return "—";

  if (typeof v === "string") {
    const isoMatch = v.match(/T(\d{2}:\d{2})/);
    if (isoMatch) return isoMatch[1];

    const parts = v.split(":");
    if (parts.length >= 2) {
      const hh = parts[0].padStart(2, "0");
      const mm = parts[1].padStart(2, "0");
      return `${hh}:${mm}`;
    }
    return v;
  }

  try {
    return new Date(v).toTimeString().slice(0, 5);
  } catch {
    return "—";
  }
}

export function fmtSize(bytes) {
  if (!bytes && bytes !== 0) return "";
  const b = Number(bytes);
  if (Number.isNaN(b)) return "";
  if (b < 1024) return `${b} B`;
  const kb = b / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(1)} MB`;
}
