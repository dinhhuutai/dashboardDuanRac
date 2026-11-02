// Layout quản trị — module 4 "Hòm thư góp ý" (khung chung ModuleShell, giống module 18)
import { FolderPlus, FolderTree, Inbox, MessageSquareHeart } from "lucide-react";
import config from "~/config";
import ModuleShell from "~/components/ModuleShell";
import Notice from "./components/Notice";

const R = config.routes;
const SECTIONS = [{ title: "Hòm thư", items: [
  { to: R.adminSuggestionList, label: "Góp ý của CNV", icon: Inbox },
  { to: R.adminSuggestionCategoriList, label: "Danh mục góp ý", icon: FolderTree },
  { to: R.adminSuggestionCategoriCreate, label: "Thêm danh mục", icon: FolderPlus },
] }];

function DefaultLayoutAdmin({ children }) {
  return (
    <ModuleShell title="Hòm thư góp ý" icon={MessageSquareHeart} home={R.adminSuggestionList} moduleId={4} side="admin" userTo={R.feedback1}
      sections={SECTIONS} extras={<Notice />}>
      <div className="min-h-[calc(100dvh-3.5rem)] bg-[#F1F4F6]">{children}</div>
    </ModuleShell>
  );
}

export default DefaultLayoutAdmin;
