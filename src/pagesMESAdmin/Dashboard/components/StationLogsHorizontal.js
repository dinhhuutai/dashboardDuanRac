import { safeValue, formatDateTime } from '../utils/dashboardHelpers';

function StationLogsHorizontal({ logs = [] }) {
  if (!logs.length) {
    return <span className="text-xs text-slate-400">Không có log</span>;
  }

  return (
    <div className="max-w-[520px] overflow-x-auto">
      <div className="flex min-w-max gap-2">
        {logs.map((log, index) => (
          <div
            key={`${log.StationID}-${log.Timestamp}-${index}`}
            className="min-w-[150px] rounded-xl border border-slate-200 bg-slate-50 px-3 py-2"
          >
            <div className="text-[11px] text-slate-500">Trạm</div>
            <div className="text-sm font-semibold text-slate-900">
              {safeValue(log.StationID)}
            </div>

            <div className="mt-1 text-[11px] text-slate-500">Trạng thái</div>
            <div className="text-sm font-semibold text-slate-900">
              {safeValue(log.MStatus)}
            </div>

            <div className="mt-1 text-[11px] text-slate-500">Thời gian</div>
            <div className="text-xs font-medium text-slate-700">
              {formatDateTime(log.Timestamp)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default StationLogsHorizontal;