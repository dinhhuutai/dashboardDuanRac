import { safeValue } from '../utils/dashboardHelpers';

function StatusBadge({ value }) {
  return (
    <span className="inline-flex min-h-7 items-center justify-center rounded-full bg-sky-100 px-3 py-1 text-xs font-bold text-sky-800">
      {safeValue(value)}
    </span>
  );
}

export default StatusBadge;