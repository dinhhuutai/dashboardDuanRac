import {
  FolderKanban,
  BarChart3,
  Settings,
  CheckSquare,
} from "lucide-react";

export default function MobileBottomBar() {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200/60 bg-white/90 backdrop-blur hidden">
      <div className="mx-auto max-w-screen-sm">
        <nav className="grid grid-cols-4">
          <BottomItem icon={CheckSquare} label="Việc" />
          <BottomItem icon={FolderKanban} label="Dự án" />
          <BottomItem icon={BarChart3} label="Báo cáo" />
          <BottomItem icon={Settings} label="Cài đặt" />
        </nav>
      </div>
    </div>
  );
}

function BottomItem({ icon: Icon, label }) {
  return (
    <a
      href="#"
      className="flex flex-col items-center justify-center gap-1 py-2 text-xs text-slate-600 hover:bg-slate-50"
    >
      <Icon className="h-5 w-5" />
      {label}
    </a>
  );
}