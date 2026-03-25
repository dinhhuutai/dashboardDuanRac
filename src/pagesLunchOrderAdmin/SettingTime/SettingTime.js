import React, { useEffect, useMemo, useState } from "react";
import {
  FaClock,
  FaSave,
  FaUtensils,
  FaBusinessTime,
  FaMoon,
  FaCheckCircle,
  FaRegCalendarAlt,
  FaSlidersH,
  FaUndo,
} from "react-icons/fa";
import { apiGetLunchSettings, apiSaveLunchSettings } from "../api/lunchApi";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const DEFAULT_FORM = {
  timeModifyRE: "",
  timeCancelRE: "",
  timeModifyWS: "",
  timeCancelWS: "",
  timeModifyOT: "",
  timeCancelOT: "",
  isActiveRE: true,
  isActiveWS: true,
  isActiveOT: true,
};

function toInputTime(value) {
  if (!value) return "";

  const s = String(value).trim();

  // Case 1: đã là HH:mm hoặc HH:mm:ss
  let m = s.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (m) {
    const hh = String(Number(m[1])).padStart(2, "0");
    const mm = String(Number(m[2])).padStart(2, "0");
    return `${hh}:${mm}`;
  }

  // Case 2: ISO datetime, ví dụ 1970-01-01T09:00:00.000Z
  const d = new Date(s);
  if (!Number.isNaN(d.getTime())) {
    const hh = String(d.getUTCHours()).padStart(2, "0");
    const mm = String(d.getUTCMinutes()).padStart(2, "0");
    return `${hh}:${mm}`;
  }

  return "";
}

function normalizeFromApi(data) {
  if (!data) return { ...DEFAULT_FORM };

  return {
    timeModifyRE: toInputTime(data.timeModifyRE),
    timeCancelRE: toInputTime(data.timeCancelRE),
    timeModifyWS: toInputTime(data.timeModifyWS),
    timeCancelWS: toInputTime(data.timeCancelWS),
    timeModifyOT: toInputTime(data.timeModifyOT),
    timeCancelOT: toInputTime(data.timeCancelOT),
    isActiveRE: !!data.isActiveRE,
    isActiveWS: !!data.isActiveWS,
    isActiveOT: !!data.isActiveOT,
  };
}

function normalizePayload(form) {
  return {
    timeModifyRE: form.timeModifyRE || null,
    timeCancelRE: form.timeCancelRE || null,
    timeModifyWS: form.timeModifyWS || null,
    timeCancelWS: form.timeCancelWS || null,
    timeModifyOT: form.timeModifyOT || null,
    timeCancelOT: form.timeCancelOT || null,
    isActiveRE: !!form.isActiveRE,
    isActiveWS: !!form.isActiveWS,
    isActiveOT: !!form.isActiveOT,
  };
}

function validateTimeRange(modifyTime, cancelTime, label) {
  if (!modifyTime || !cancelTime) return null;
  if (modifyTime > cancelTime) {
    return `${label}: Giờ sửa phải nhỏ hơn hoặc bằng giờ huỷ`;
  }
  return null;
}

function isSameForm(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function SimpleToggle({ checked, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200
        ${checked ? "bg-sky-500/80" : "bg-slate-300"}`}
      aria-pressed={checked}
    >
      <span
        className={`absolute left-1 h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200
          ${checked ? "translate-x-5" : "translate-x-0"}`}
      />
    </button>
  );
}

function TimeField({ label, value, onChange, disabled }) {
  const selected = value ? new Date(`1970-01-01T${value}:00`) : null;

  return (
    <label className="block">
      <div className="mb-1.5 text-[13px] font-medium text-slate-600">{label}</div>

      <DatePicker
        selected={selected}
        onChange={(date) => {
          if (!date) return onChange({ target: { value: "" } });

          const hh = String(date.getHours()).padStart(2, "0");
          const mm = String(date.getMinutes()).padStart(2, "0");
          onChange({ target: { value: `${hh}:${mm}` } });
        }}
        showTimeSelect
        showTimeSelectOnly
        timeIntervals={30}
        timeCaption="Giờ"
        dateFormat="HH:mm"
        timeFormat="HH:mm"
        disabled={disabled}
        placeholderText="Chọn giờ"
        className={`h-10 w-full rounded-xl border px-3 text-sm outline-none
          ${disabled
            ? "border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed"
            : "border-slate-200 bg-white focus:border-sky-300 focus:ring-2 focus:ring-sky-100"}`}
      />
    </label>
  );
}

function TimeCard({
  code,
  title,
  note,
  icon,
  tint,
  activeKey,
  modifyKey,
  cancelKey,
  form,
  setForm,
}) {
  const isActive = !!form[activeKey];

  const tintMap = {
    slate: "bg-slate-50 text-slate-600 border-slate-100",
    sky: "bg-sky-50 text-sky-600 border-sky-100",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm min-h-[250px] flex flex-col">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className={`mt-0.5 h-10 w-10 rounded-xl border grid place-items-center shrink-0 ${tintMap[tint]}`}>
            {icon}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-semibold text-slate-800">{code}</h3>
              <span className="text-sm text-slate-300">•</span>
              <span className="text-sm text-slate-500">{title}</span>
            </div>
            <p className="mt-1 text-sm text-slate-500">{note}</p>
          </div>
        </div>

        <SimpleToggle
          checked={isActive}
          onChange={(val) => setForm((prev) => ({ ...prev, [activeKey]: val }))}
        />
      </div>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <TimeField
          label="Giờ sửa"
          value={form[modifyKey]}
          disabled={!isActive}
          onChange={(e) => setForm((prev) => ({ ...prev, [modifyKey]: e.target.value }))}
        />

        <TimeField
          label="Giờ huỷ"
          value={form[cancelKey]}
          disabled={!isActive}
          onChange={(e) => setForm((prev) => ({ ...prev, [cancelKey]: e.target.value }))}
        />
      </div>

      <div className="mt-auto pt-4">
        <div
          className={`rounded-xl px-3 py-2 text-xs border ${
            isActive
              ? "border-sky-100 bg-sky-50 text-sky-700"
              : "border-slate-200 bg-slate-50 text-slate-500"
          }`}
        >
          {isActive ? "Đang áp dụng giới hạn giờ" : "Đang tắt giới hạn giờ"}
        </div>
      </div>
    </div>
  );
}

function InfoBox({ icon, title, text, tint = "slate" }) {
  const map = {
    slate: "bg-white border-slate-200 text-slate-700",
    sky: "bg-sky-50/70 border-sky-100 text-sky-700",
    emerald: "bg-emerald-50/70 border-emerald-100 text-emerald-700",
  };

  return (
    <div className={`rounded-2xl border p-4 ${map[tint]}`}>
      <div className="flex items-start gap-3">
        <div className="mt-0.5 text-sm opacity-80">{icon}</div>
        <div>
          <div className="text-sm font-semibold">{title}</div>
          <div className="mt-1 text-sm opacity-90">{text}</div>
        </div>
      </div>
    </div>
  );
}

function SettingTime() {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [initialForm, setInitialForm] = useState(DEFAULT_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setLoading(true);
        const data = await apiGetLunchSettings();
        if (!mounted) return;

        const normalized = normalizeFromApi(data);
        setForm(normalized);
        setInitialForm(normalized);
      } catch (err) {
        console.error("Load lunch settings error:", err);
        setMessage("Không tải được cấu hình");
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const validationError = useMemo(() => {
    return (
      validateTimeRange(form.timeModifyRE, form.timeCancelRE, "RE") ||
      validateTimeRange(form.timeModifyWS, form.timeCancelWS, "WS") ||
      validateTimeRange(form.timeModifyOT, form.timeCancelOT, "OT") ||
      ""
    );
  }, [form]);

  const isDirty = useMemo(() => !isSameForm(form, initialForm), [form, initialForm]);

  async function handleSave() {
    setMessage("");

    if (validationError) {
      setMessage(validationError);
      return;
    }

    try {
      setSaving(true);
      const res = await apiSaveLunchSettings(normalizePayload(form));

      if (res?.success === false) {
        setMessage(res?.message || "Lưu thất bại");
        return;
      }

      setInitialForm(form);
      setMessage("Đã lưu");
    } catch (err) {
      console.error("Save lunch settings error:", err);
      setMessage(err?.response?.data?.message || "Lưu thất bại");
    } finally {
      setSaving(false);
    }
  }

  function handleReset() {
    setForm(initialForm);
    setMessage("Đã hoàn tác");
  }

  return (
    <div className="min-h-screen bg-slate-50 p-3 sm:p-5">
      <div className="mx-auto max-w-5xl space-y-4">
        <div className="rounded-3xl border border-slate-200 bg-white px-4 py-4 sm:px-5 sm:py-5 shadow-sm">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h1 className="text-xl font-semibold text-slate-800">Áp dụng giờ</h1>
              <p className="mt-1 text-sm text-slate-500">
                Ca ngày: hôm nay · Đi ca, Tăng ca: hôm sau
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleReset}
                disabled={!isDirty || saving || loading}
                className={`inline-flex h-9 items-center gap-1.5 rounded-xl px-3 text-sm font-medium transition
                  ${!isDirty || saving || loading
                    ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                    : "bg-white border border-slate-300 text-slate-700 hover:bg-slate-50"}`}
              >
                <FaUndo className="text-xs" />
                Hoàn tác
              </button>

              <button
                type="button"
                onClick={handleSave}
                disabled={saving || loading || !isDirty}
                className={`inline-flex h-9 items-center gap-1.5 rounded-xl px-3.5 text-sm font-medium transition
                  ${saving || loading || !isDirty
                    ? "bg-slate-300 text-white cursor-not-allowed"
                    : "bg-sky-600 text-white hover:bg-sky-500"}`}
              >
                <FaSave className="text-xs" />
                {saving ? "Đang lưu" : "Lưu"}
              </button>
            </div>
          </div>
        </div>

        {message ? (
          <div
            className={`rounded-2xl border px-4 py-3 text-sm
              ${message === "Đã lưu" || message === "Đã hoàn tác"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-rose-200 bg-rose-50 text-rose-700"}`}
          >
            {message}
          </div>
        ) : null}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <InfoBox icon={<FaRegCalendarAlt />} title="Ca ngày" text="Áp dụng trong ngày hiện tại" tint="slate" />
          <InfoBox icon={<FaRegCalendarAlt />} title="Đi ca" text="Áp dụng cho ngày kế tiếp" tint="sky" />
          <InfoBox icon={<FaRegCalendarAlt />} title="Tăng ca" text="Áp dụng cho ngày kế tiếp" tint="emerald" />
        </div>

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
            Đang tải...
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <TimeCard
              code="RE"
              title="Ca ngày"
              note="Áp dụng hôm nay"
              icon={<FaUtensils />}
              tint="slate"
              activeKey="isActiveRE"
              modifyKey="timeModifyRE"
              cancelKey="timeCancelRE"
              form={form}
              setForm={setForm}
            />

            <TimeCard
              code="WS"
              title="Đi ca"
              note="Áp dụng hôm sau"
              icon={<FaBusinessTime />}
              tint="sky"
              activeKey="isActiveWS"
              modifyKey="timeModifyWS"
              cancelKey="timeCancelWS"
              form={form}
              setForm={setForm}
            />

            <TimeCard
              code="OT"
              title="Tăng ca"
              note="Áp dụng hôm sau"
              icon={<FaMoon />}
              tint="emerald"
              activeKey="isActiveOT"
              modifyKey="timeModifyOT"
              cancelKey="timeCancelOT"
              form={form}
              setForm={setForm}
            />
          </div>
        )}

        {!loading && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <InfoBox
              icon={<FaSlidersH />}
              title="Tắt áp dụng"
              text="Người dùng có thể sửa hoặc huỷ bất kỳ lúc nào."
              tint="slate"
            />
            <InfoBox
              icon={<FaCheckCircle />}
              title="Lưu ý"
              text="Giờ sửa nên nhỏ hơn hoặc bằng giờ huỷ."
              tint="sky"
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default SettingTime;