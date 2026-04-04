function Pagination({
  page = 1,
  totalPages = 1,
  onPageChange,
  disabled = false,
}) {
  if (totalPages <= 1) return null;

  const canPrev = page > 1 && !disabled;
  const canNext = page < totalPages && !disabled;

  const pages = [];
  const maxVisible = 7;

  let start = Math.max(1, page - 3);
  let end = Math.min(totalPages, start + maxVisible - 1);

  if (end - start + 1 < maxVisible) {
    start = Math.max(1, end - maxVisible + 1);
  }

  for (let i = start; i <= end; i += 1) {
    pages.push(i);
  }

  const baseBtnClass =
    'inline-flex h-9 min-w-[36px] items-center justify-center rounded-lg border px-3 text-sm font-medium transition-all duration-150';
  const normalBtnClass =
    'border-slate-300 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 active:scale-95';
  const activeBtnClass =
    'border-blue-600 bg-blue-600 text-white shadow-sm ring-2 ring-blue-100 scale-105';
  const disabledBtnClass =
    'disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-slate-300 disabled:hover:bg-white disabled:hover:text-slate-700 disabled:active:scale-100';

  return (
    <div className="mt-4 flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="text-sm font-medium text-slate-600">
        Trang <span className="text-slate-900">{page}</span> / {totalPages}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={!canPrev}
          onClick={() => {
            if (canPrev) onPageChange(page - 1);
          }}
          className={`inline-flex h-9 items-center justify-center rounded-lg border px-3 text-sm font-medium transition-all duration-150 ${normalBtnClass} ${disabledBtnClass}`}
        >
          ← Trước
        </button>

        {start > 1 && (
          <>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onPageChange(1)}
              className={`${baseBtnClass} ${normalBtnClass} ${disabledBtnClass}`}
            >
              1
            </button>
            {start > 2 && <span className="px-1 text-slate-400">...</span>}
          </>
        )}

        {pages.map((item) => {
          const isActive = item === page;

          return (
            <button
              key={item}
              type="button"
              disabled={disabled || isActive}
              onClick={() => {
                if (item !== page && !disabled) onPageChange(item);
              }}
              aria-current={isActive ? 'page' : undefined}
              className={`${baseBtnClass} ${
                isActive ? activeBtnClass : normalBtnClass
              } ${disabledBtnClass}`}
            >
              {item}
            </button>
          );
        })}

        {end < totalPages && (
          <>
            {end < totalPages - 1 && <span className="px-1 text-slate-400">...</span>}
            <button
              type="button"
              disabled={disabled}
              onClick={() => onPageChange(totalPages)}
              className={`${baseBtnClass} ${normalBtnClass} ${disabledBtnClass}`}
            >
              {totalPages}
            </button>
          </>
        )}

        <button
          type="button"
          disabled={!canNext}
          onClick={() => {
            if (canNext) onPageChange(page + 1);
          }}
          className={`inline-flex h-9 items-center justify-center rounded-lg border px-3 text-sm font-medium transition-all duration-150 ${normalBtnClass} ${disabledBtnClass}`}
        >
          Sau →
        </button>
      </div>
    </div>
  );
}

export default Pagination;