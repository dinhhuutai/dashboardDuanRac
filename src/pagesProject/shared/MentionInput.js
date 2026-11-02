// Ô soạn có @nhắc tên (module 3) — gõ @ để hiện danh sách người (people: [{ id, name, avatar }]).
// Chọn tên → chèn "@Họ Tên " và gọi onMention(user); gửi kèm mentionIds của những người CÒN được nhắc trong nội dung.
// Cách đặt con trỏ giống MentionTextarea của module 18 (useLayoutEffect — requestAnimationFrame làm đảo chữ khi gõ nhanh).
import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { cn } from "~/pagesForm/shared/ui";
import { norm } from "./meta";
import { Avatar } from "./components";

export function mentionIdsOf(text, picked) {
  return [...new Set((picked || []).filter((u) => text.includes(`@${u.name}`)).map((u) => u.id))];
}

export default function MentionInput({ value, onChange, people = [], onMention, onPaste, onSubmit, placeholder, disabled, inputRef, className, rows = 2, enterToSend = false }) {
  const [query, setQuery] = useState(null); // { start, text }
  const [active, setActive] = useState(0);
  const local = useRef(null);
  const ref = inputRef || local;
  const caretRef = useRef(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (caretRef.current === null || !el) return;
    const pos = caretRef.current;
    caretRef.current = null;
    el.focus();
    el.setSelectionRange(pos, pos);
  }, [value, ref]);

  const suggestions = useMemo(() => {
    if (!query) return [];
    const q = norm(query.text);
    return people.filter((u) => !q || norm(u.name).includes(q)).slice(0, 7);
  }, [query, people]);

  const detect = (text, caret) => {
    const before = text.slice(0, caret);
    const m = /(^|\s)@([^\s@]{0,30}(?:\s[^\s@]{0,20}){0,3})$/.exec(before);
    if (m) { setQuery({ start: caret - m[2].length - 1, text: m[2] }); setActive(0); } else setQuery(null);
  };
  const pick = (u) => {
    const caret = ref.current?.selectionStart ?? value.length;
    const next = `${value.slice(0, query.start)}@${u.name} ${value.slice(caret)}`;
    caretRef.current = query.start + u.name.length + 2;
    onChange(next);
    onMention?.(u);
    setQuery(null);
  };

  return (
    <div className="relative">
      <textarea
        ref={ref} value={value} disabled={disabled} rows={rows} placeholder={placeholder} onPaste={onPaste}
        onChange={(e) => { onChange(e.target.value); detect(e.target.value, e.target.selectionStart); }}
        onKeyDown={(e) => {
          if (query && suggestions.length) {
            if (e.key === "ArrowDown") { e.preventDefault(); setActive((i) => (i + 1) % suggestions.length); return; }
            if (e.key === "ArrowUp") { e.preventDefault(); setActive((i) => (i - 1 + suggestions.length) % suggestions.length); return; }
            if (e.key === "Enter" || e.key === "Tab") { e.preventDefault(); pick(suggestions[active]); return; }
            if (e.key === "Escape") { setQuery(null); return; }
          }
          if (e.key === "Enter" && ((e.ctrlKey || e.metaKey) || (enterToSend && !e.shiftKey && window.innerWidth >= 1024))) { e.preventDefault(); onSubmit?.(); }
        }}
        onInput={(e) => { e.target.style.height = "auto"; e.target.style.height = `${Math.min(200, e.target.scrollHeight)}px`; }}
        className={cn("block w-full resize-none border-0 bg-transparent p-0 text-sm outline-none placeholder:text-slate-400 focus:ring-0", className)}
        style={{ maxHeight: 200 }}
      />
      {query && suggestions.length > 0 && (
        <ul className="absolute bottom-full left-0 z-50 mb-1 w-72 max-w-[85vw] overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-xl" data-mention-list>
          {suggestions.map((u, i) => (
            <li key={u.id}>
              <button type="button" onMouseDown={(e) => { e.preventDefault(); pick(u); }}
                className={cn("flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm", i === active ? "bg-blue-50" : "hover:bg-slate-50")}>
                <Avatar name={u.name} src={u.avatar} size={24} /> <span className="truncate">{u.name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
