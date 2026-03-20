import { useMemo, useState } from 'react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

import BtnDarkSmall from './BtnDarkSmall';
import { dayPickerCss } from '../constants/dayPickerCss';

function DateRangeField({ label, range, onChange }) {
  const [openCalendar, setOpenCalendar] = useState(false);

  const rangeText = useMemo(() => {
    if (!range?.from && !range?.to) return 'Chọn khoảng ngày';
    if (range?.from && !range?.to) return `Từ ${format(range.from, 'dd/MM/yyyy')}`;
    return `${format(range.from, 'dd/MM/yyyy')} → ${format(range.to, 'dd/MM/yyyy')}`;
  }, [range]);

  return (
    <div className="relative">
      <div className="mb-1 text-[12px] font-medium text-slate-700">{label}</div>

      <button
        type="button"
        onClick={() => setOpenCalendar(true)}
        className={[
          'w-full rounded-2xl border border-slate-200/70 bg-white/70 px-4 py-2.5 text-left',
          'text-[13px] text-slate-900 transition hover:bg-white/90',
          'focus:outline-none focus:ring-2 focus:ring-blue-200/70',
        ].join(' ')}
      >
        <div className="flex items-center justify-between gap-3">
          <span className={range?.from ? 'font-medium' : 'text-slate-500'}>
            {rangeText}
          </span>
          <span className="text-slate-500">📅</span>
        </div>
      </button>

      {openCalendar && (
        <div className="fixed inset-0 z-50" onClick={() => setOpenCalendar(false)} />
      )}

      {openCalendar && (
        <div
          className="absolute z-[60] mt-2 w-full min-w-[320px] rounded-2xl border border-slate-200/70 bg-white p-3 shadow-[0_18px_60px_rgba(15,23,42,0.18)]"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mb-2 flex items-center justify-between">
            <div className="text-[12px] font-semibold text-slate-700">
              Chọn khoảng ngày
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onChange({ from: undefined, to: undefined })}
                className="text-[12px] font-medium text-slate-600 transition hover:text-slate-900"
              >
                Xóa
              </button>

              <BtnDarkSmall onClick={() => setOpenCalendar(false)}>Đóng</BtnDarkSmall>
            </div>
          </div>

          <DayPicker
            mode="range"
            selected={range}
            onSelect={(r) => onChange(r || { from: undefined, to: undefined })}
            numberOfMonths={1}
            showOutsideDays
            className="rdp"
            locale={vi}
            weekStartsOn={1}
            formatters={{
              formatCaption: (date) => format(date, 'MMMM yyyy', { locale: vi }),
            }}
          />

          <style>{dayPickerCss}</style>
        </div>
      )}
    </div>
  );
}

export default DateRangeField;