import { motion } from "framer-motion";
import Sidebar from "../Sidebar";
import {
  X,
} from "lucide-react";
import { Link } from "react-router-dom";
import logo from "~/assets/imgs/logoAdmin.png";
import config from "~/config";

export default function MobileSidebar({ onClose, phase }) {
  return (
    <motion.div
      className="fixed inset-0 z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-slate-900/30" onClick={onClose} />
      <motion.aside
        className="absolute left-0 top-0 h-full w-[86%] max-w-[340px] rounded-r-2xl border-r border-slate-200 bg-white p-3 shadow-xl"
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: -20, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <div className="mb-3 flex items-center justify-between">
          <div className="inline-flex items-center gap-2 font-semibold">
            <Link
              to={phase === 'work' ? config.routes.taskManagementDashboard : config.routes.taskManagementProjectList}
              className="flex items-center gap-3 group pr-[10px]"
              aria-label="Trang phân tích"
            >
              <img alt="logo" src={logo} className="h-9 w-auto object-contain" />
            </Link>
            <span>{phase === 'work' ? 'QL Công Việc' : 'QL Dự Án'}</span>
          </div>
          <button
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 hover:bg-slate-50"
            aria-label="Đóng menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <Sidebar phase={phase} />
      </motion.aside>
    </motion.div>
  );
}