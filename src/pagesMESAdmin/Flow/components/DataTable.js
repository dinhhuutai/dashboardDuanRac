import { safeValue } from '../utils/dashboardHelpers';

function DataTable({
  columns,
  rows,
  rowKey,
  emptyText,
  onRowClick,
  mobileTitle,
  mobileSubtitle,
  headerGroups = null,
}) {
  if (!rows?.length) {
    return (
      <div className="flex min-h-[120px] items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 text-center text-slate-500 shadow-sm">
        {emptyText}
      </div>
    );
  }

  const hasGroupedHeader = Array.isArray(headerGroups) && headerGroups.length > 0;

  const getRowKey = (row, index) => {
    if (typeof rowKey === 'function') return rowKey(row, index);
    return row?.[rowKey] ?? index;
  };

  return (
    <>
      <div className="hidden lg:block">
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full border-separate border-spacing-0">
            <thead>
  {hasGroupedHeader ? (
    <>
      <tr className="bg-slate-100">
        {headerGroups.map((group, index) => {
          const isSingleCol = group.colSpan === 1 && group.mergeSingle !== false;

          return (
            <th
              key={`${group.title}-${index}`}
              colSpan={isSingleCol ? undefined : group.colSpan}
              rowSpan={isSingleCol ? 2 : undefined}
              className={[
                'border-b border-r border-slate-200 bg-slate-100 px-4 py-3 text-center text-sm font-bold text-slate-800 align-middle whitespace-nowrap',
                index === 0 ? 'rounded-tl-2xl' : '',
                index === headerGroups.length - 1 ? 'rounded-tr-2xl border-r-0' : '',
              ].join(' ')}
            >
              {group.title}
            </th>
          );
        })}
      </tr>

      <tr className="bg-slate-50/90">
        {columns
          .filter((col) => !col.hideSubHeader)
          .map((col, index, arr) => (
            <th
              key={col.key}
              className={[
                'sticky z-10 whitespace-nowrap border-b border-slate-200 bg-slate-50/95 px-4 py-3 text-left text-sm font-bold text-slate-700',
                'top-[41px]',
                index !== arr.length - 1 ? 'border-r border-slate-200' : '',
              ].join(' ')}
            >
              {col.title ?? ''}
            </th>
          ))}
      </tr>
    </>
  ) : (
    <tr className="bg-slate-50/90">
      {columns.map((col, index) => (
        <th
          key={col.key}
          className={[
            'sticky top-0 z-10 whitespace-nowrap border-b border-slate-200 bg-slate-50/95 px-4 py-3 text-left text-sm font-bold text-slate-700',
            index !== columns.length - 1 ? 'border-r border-slate-200' : '',
            index === 0 ? 'rounded-tl-2xl' : '',
            index === columns.length - 1 ? 'rounded-tr-2xl' : '',
          ].join(' ')}
        >
          {col.title ?? ''}
        </th>
      ))}
    </tr>
  )}
</thead>

            <tbody>
              {rows.map((row, rowIndex) => (
                <tr
                  key={getRowKey(row, rowIndex)}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={[
                    'transition',
                    onRowClick ? 'cursor-pointer hover:bg-sky-50/70' : '',
                    rowIndex % 2 === 0 ? 'bg-white' : 'bg-slate-50/30',
                  ].join(' ')}
                >
                  {columns.map((col, colIndex) => (
                    <td
                      key={col.key}
                      className={[
                        'align-top text-center whitespace-nowrap border-b border-slate-100 px-4 py-3 text-sm text-slate-900',
                        colIndex !== columns.length - 1 ? 'border-r border-slate-100' : '',
                      ].join(' ')}
                    >
                      <div className="min-h-[24px]">
                        {col.render ? col.render(row) : safeValue(row[col.key])}
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid gap-3 lg:hidden">
        {rows.map((row) => (
          <div
            key={row[rowKey]}
            onClick={onRowClick ? () => onRowClick(row) : undefined}
            className={[
              'rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition',
              onRowClick ? 'cursor-pointer hover:bg-sky-50/70' : '',
            ].join(' ')}
          >
            <div className="text-base font-bold text-slate-900">
              {mobileTitle ? mobileTitle(row) : safeValue(row[rowKey])}
            </div>

            <div className="mt-1 text-sm text-slate-500">
              {mobileSubtitle ? mobileSubtitle(row) : ''}
            </div>

            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {columns.map((col) => (
                <div
                  key={col.key}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5"
                >
                  <div className="mb-1 text-xs font-medium text-slate-500">
                    {col.title}
                  </div>
                  <div className="break-words text-sm font-semibold text-slate-900">
                    {col.render ? col.render(row) : safeValue(row[col.key])}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

export default DataTable;