import DateRangeField from './DateRangeField';
import FilterField from './FilterField';

function DashboardFilters({
  level,
  currentFilters,
  setCurrentFilters,
  orderFilters,
  setOrderFilters,
  onReset,
}) {
  const isOrders = level === 'orders';
  const isItems = level === 'items';
  const isDetails = level === 'details';

  const showTextFilter = isOrders || isItems;
  const showStatusFilter = isOrders || isItems || isDetails;

  const gridClass = isOrders
    ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-4'
    : showTextFilter && showStatusFilter
    ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3'
    : showTextFilter || showStatusFilter
    ? 'grid-cols-1 md:grid-cols-2'
    : 'grid-cols-1';

  const statusValue = isOrders
    ? orderFilters.mstatus ?? ''
    : currentFilters.mstatus ?? '';

  const pageSizeValue = currentFilters.pageSize ?? 5;

  const handleStatusChange = (value) => {
    if (isOrders) {
      setOrderFilters((prev) => ({
        ...prev,
        mstatus: value,
        page: 1,
      }));
      return;
    }

    setCurrentFilters((prev) => ({
      ...prev,
      mstatus: value,
      page: 1,
    }));
  };

  const handlePageSizeChange = (value) => {
    const pageSize = Number(value);

    if (isOrders) {
      setOrderFilters((prev) => ({
        ...prev,
        pageSize,
        page: 1,
      }));
      return;
    }

    setCurrentFilters((prev) => ({
      ...prev,
      pageSize,
      page: 1,
    }));
  };

  return (
    <>
      <div className={`mb-4 grid gap-3 ${gridClass}`}>
        <DateRangeField
          label="Từ ngày - Đến ngày"
          range={currentFilters.range}
          onChange={(value) =>
            setCurrentFilters((prev) => ({
              ...prev,
              range: value,
              page: 1,
            }))
          }
        />

        {isOrders && (
          <FilterField
            label="Khách hàng"
            placeholder="Nhập tên khách hàng"
            value={orderFilters.customerName || ''}
            onChange={(value) =>
              setOrderFilters((prev) => ({
                ...prev,
                customerName: value,
                page: 1,
              }))
            }
          />
        )}

        {showTextFilter && (
          <FilterField
            label={isOrders ? 'Đơn hàng' : 'Mã hàng'}
            placeholder={isOrders ? 'Nhập đơn hàng' : 'Nhập mã hàng'}
            value={isOrders ? currentFilters.po || '' : currentFilters.id || ''}
            onChange={(value) =>
              setCurrentFilters((prev) => ({
                ...prev,
                [isOrders ? 'po' : 'id']: value,
                page: 1,
              }))
            }
          />
        )}

        {showStatusFilter && (
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-700">
              Tình trạng
            </label>

            <select
              value={statusValue}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="ALL">Tất cả tình trạng</option>
              <option value="01_OPEN">OPEN</option>
              <option value="READY">READY</option>
              <option value="RELEASE">RELEASE</option>
            </select>
          </div>
        )}
      </div>

      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <button
          type="button"
          onClick={onReset}
          className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
        >
          Tải lại
        </button>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <label className="whitespace-nowrap text-sm font-medium text-slate-700">
            Số dòng / trang
          </label>

          <select
            value={pageSizeValue}
            onChange={(e) => handlePageSizeChange(e.target.value)}
            className="h-10 min-w-[88px] rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>
    </>
  );
}

export default DashboardFilters;