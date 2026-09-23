// src/pages/Home/components/ModuleCard.jsx
import React, { Suspense } from "react";
import { FiGrid } from "react-icons/fi";
import {
  FcApproval,
  FcCalendar,
  FcConferenceCall,
  FcEditImage,
  FcEngineering,
  FcFactory,
  FcFeedback,
  FcIcons8Cup,
  FcLike,
  FcMoneyTransfer,
  FcPackage,
  FcPicture,
  FcPieChart,
  FcPrivacy,
  FcSearch,
  FcStackOfPhotos,
  FcSurvey,
  FcTodoList,
  FcWorkflow,
} from "react-icons/fc";
import lazyPage from "~/utils/lazyPage";

// Icon đang dùng trong bảng dbo.Modules (cột icon). Import từng icon thay vì
// `import * as FcIcons` — cả bộ fc/fi nặng ~1,6 MB và nằm trong file JS chính.
const KNOWN_ICONS = {
  FcApproval,
  FcCalendar,
  FcEditImage,
  FcEngineering,
  FcFactory,
  FcFeedback,
  FcIcons8Cup,
  FcLike,
  FcMoneyTransfer,
  FcPackage,
  FcPicture,
  FcPieChart,
  FcSearch,
  FcStackOfPhotos,
  FcSurvey,
  FcTodoList,
  FcWorkflow,
};

// Icon khác (admin mới chọn trong trang Quản lý module) → tải cả bộ theo nhu cầu.
// Phải đi qua ~/components/IconSets, xem README.md trong đó.
const iconFromSet = (loadSet) =>
  lazyPage(() =>
    loadSet().then((mod) => {
      const set = mod.default || mod;
      return {
        default: ({ name, className }) => {
          const Cmp = set[name] || FiGrid;
          return <Cmp className={className} />;
        },
      };
    })
  );
const LazyFcIcon = iconFromSet(() => import("~/components/IconSets/fc"));
const LazyFiIcon = iconFromSet(() => import("~/components/IconSets/fi"));

// icon có thể là "FcSomething", "FiSomething" hoặc URL
const IconOrImg = ({ icon, className = "h-6 w-6" }) => {
  if (!icon) {
    return <FiGrid className={`${className} text-slate-800`} />;
  }

  if (KNOWN_ICONS[icon]) {
    const Cmp = KNOWN_ICONS[icon];
    return <Cmp className={className} />;
  }

  const placeholder = <span className={`inline-block ${className}`} />;

  // Feather icon
  if (/^Fi[A-Za-z0-9]+$/.test(icon)) {
    return (
      <Suspense fallback={placeholder}>
        <LazyFiIcon name={icon} className={`${className} text-slate-800`} />
      </Suspense>
    );
  }

  // Flat color icon
  if (/^Fc[A-Za-z0-9]+$/.test(icon)) {
    return (
      <Suspense fallback={placeholder}>
        <LazyFcIcon name={icon} className={className} />
      </Suspense>
    );
  }

  // URL ảnh
  return <img src={icon} alt="" className={`${className} object-contain`} />;
};

const ModuleCard = ({ module, onGoUser, onGoAdmin }) => {
  const { name, description, icon, allowedRoles = [] } = module || {};
  const canUser = allowedRoles.includes("user");
  const canAdmin = allowedRoles.includes("admin");

  return (
    <div
      className="
        group relative rounded-2xl bg-[#f5faf8] p-4 sm:p-5
        shadow-[2px_2px_8px_rgba(185,210,200,0.35),-2px_-2px_8px_rgba(255,255,255,0.9)]
        transition-all duration-300 hover:shadow-[2px_2px_6px_rgba(185,210,200,0.35),-2px_-2px_6px_rgba(255,255,255,0.9)]
        hover:-translate-y-1
      "
    >
      <div className="flex items-start gap-3">
        <div
          className="
            flex h-12 w-12 shrink-0 items-center justify-center rounded-xl
            bg-[#fafbfc]
            shadow-[3px_3px_6px_rgba(180,190,200,0.4),-3px_-3px_6px_rgba(255,255,255,0.8)]
          "
        >
          <IconOrImg icon={icon} className="h-6 w-6 text-gray-600" />
        </div>

        <div className="min-w-0 flex-1">
          {/* Tiêu đề với tooltip */}
          <div className="relative group/title">
            <h3 className="truncate text-lg font-semibold text-gray-700 cursor-pointer">
              {name}
            </h3>
            <div
              className="absolute left-0 top-full z-10 mt-1 hidden w-max max-w-xs rounded-md bg-gray-800 px-3 py-1 text-sm text-white shadow-lg group-hover/title:block"
            >
              {name}
            </div>
          </div>

          {/* Mô tả */}
          <div className="relative group/desc mt-1">
            <p className="text-sm text-gray-500 whitespace-normal break-words">
              {description || "—"}
            </p>
          </div>

          {/* Nút quyền */}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {canUser && (
              <button
                type="button"
                onClick={onGoUser}
                className="
                  inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-gray-600
                  bg-[#fafbfc]
                  shadow-[3px_3px_6px_rgba(180,190,200,0.4),-3px_-3px_6px_rgba(255,255,255,0.8)]
                  transition hover:shadow-[2px_2px_4px_rgba(180,190,200,0.4),-2px_-2px_4px_rgba(255,255,255,0.8)]
                "
              >
                <FcConferenceCall className="h-4 w-4" />
                <span>User</span>
              </button>
            )}

            {canAdmin && (
              <button
                type="button"
                onClick={onGoAdmin}
                className="
                  inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-gray-600
                  bg-[#fafbfc]
                  shadow-[3px_3px_6px_rgba(180,190,200,0.4),-3px_-3px_6px_rgba(255,255,255,0.8)]
                  transition hover:shadow-[2px_2px_4px_rgba(180,190,200,0.4),-2px_-2px_4px_rgba(255,255,255,0.8)]
                "
              >
                <FcPrivacy className="h-4 w-4" />
                <span>Admin</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModuleCard;
