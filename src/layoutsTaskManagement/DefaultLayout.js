import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";


import HeaderBar from './components/HeaderBar';
import Sidebar from './components/Sidebar';
import MobileSidebar from './components/MobileSidebar';
import MobileBottomBar from './components/MobileBottomBar';
import { useNavigate } from "react-router-dom";
import config from "~/config";

export default function TaskManagementLayout({
  children,
  initialPhase = "work",
  onCreateQuick,
}) {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [phase, setPhase] = useState(initialPhase); // 'work' or 'projects'

  const navigate = useNavigate();

  useEffect(() => {
    navigate(phase === 'work' ? config.routes.taskManagementDashboard : config.routes.taskManagementProjectList);
  }, [phase]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50 text-slate-800">
      {/* Top Header */}
      <div className="fixed top-0 left-0 right-0 z-40 border-b border-slate-200/60 bg-white/80 backdrop-blur">
        <div className="mx-auto max-w-screen-2xl px-3 sm:px-6">
          <HeaderBar
            phase={phase}
            onPhaseChange={setPhase}
            onToggleSidebar={() => setSidebarOpen(true)}
            onCreateQuick={onCreateQuick}
          />
        </div>
      </div>

      {/* Main Frame */}
      <div className="mx-auto max-w-screen-2xl pt-[64px] md:pt-[76px] md:flex md:gap-6">
        {/* Desktop Sidebar */}
        {
          phase === 'work' &&
          <aside className="hidden md:block md:w-[270px] shrink-0">
            <Sidebar phase={phase} />
          </aside>
        }

        {/* Content */}
        <main
          className="w-full px-4"
          style={{
            paddingBottom: "max(56px, env(safe-area-inset-bottom))", // avoid mobile bottom-bar overlay
          }}
        >
          {/* Page Content Slot */}
          <div className="py-2 md:py-4">{children}</div>
        </main>
      </div>

      {/* Mobile Bottom Tab */}
      <MobileBottomBar phase={phase} onPhaseChange={setPhase} />

      {/* Mobile Sidebar Sheet */}
      <AnimatePresence>
        {isSidebarOpen && (
          <MobileSidebar onClose={() => setSidebarOpen(false)} phase={phase} />)
        }
      </AnimatePresence>
    </div>
  );
}


