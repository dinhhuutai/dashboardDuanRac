function BranchChips({
  item, isSec, day, orderType,
  selected, selectedSec,
  branchByType, branchSecByType,
  setBranchByType, setBranchSecByType,
  ensureBranches, disabled
}) {
  const entryId = item?.weeklyMenuEntryId;
  const foodId = item?.foodId;

  const [list, setList] = useState(() => item?.branches || []);
  useEffect(() => {
    (async () => {
      const l = await ensureBranches(foodId, item?.branches || []);
      setList(Array.isArray(l) ? l : []);
    })();
  }, [foodId]);

  // trạng thái chọn hiện tại
  const currentBranchId = useMemo(() => {
    if (isSec) {
      return branchSecByType[orderType]?.[day]?.[entryId] ?? null;
    }
    return branchByType[orderType]?.[day] ?? null;
  }, [isSec, branchSecByType, branchByType, orderType, day, entryId]);

  // chỉ cho chọn branch khi món đang được chọn
  const isChecked = isSec ? !!(selectedSec[day]?.[entryId]) : selected[day] === entryId;

  if (!list.length) return null;

  const toggle = (bId) => {
    if (disabled || !isChecked) return;
    if (isSec) {
      setBranchSecByType(prev => {
        const next = { ...prev };
        const cur = { ...(next[orderType] || {}) };
        const m = { ...(cur[day] || {}) };
        m[entryId] = (m[entryId] === bId ? null : bId); // chọn lại = bỏ chọn → null
        cur[day] = m;
        next[orderType] = cur;
        return next;
      });
    } else {
      setBranchByType(prev => {
        const next = { ...prev };
        const m = { ...(next[orderType] || {}) };
        m[day] = (m[day] === bId ? null : bId);
        next[orderType] = m;
        return next;
      });
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {list.map(b => {
        const active = isChecked && currentBranchId === b.branchId;
        return (
          <button
            key={b.branchId}
            type="button"
            onClick={() => toggle(b.branchId)}
            disabled={disabled || !isChecked}
            className={`px-2.5 py-1 rounded-lg border text-xs transition
              ${active
                ? "bg-emerald-100 border-emerald-300 text-emerald-700"
                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"}
              ${disabled || !isChecked ? "opacity-50 cursor-not-allowed" : ""}`}
            title={b.branchName || b.branchCode}
          >
            {b.branchCode || b.branchName}
          </button>
        );
      })}
      {/* chip 'Không chọn' (branchId = null) */}
      <button
        type="button"
        onClick={() => toggle(null)}
        disabled={disabled || !isChecked}
        className={`px-2.5 py-1 rounded-lg border text-xs transition
          ${isChecked && currentBranchId == null
            ? "bg-rose-100 border-rose-300 text-rose-700"
            : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"}
          ${disabled || !isChecked ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        Không chọn chi nhánh
      </button>
    </div>
  );
}
