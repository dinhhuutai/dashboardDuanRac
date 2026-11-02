// Layout nhân viên — module 9 "Biểu mẫu nội bộ" (khung chung ModuleShell, giống module 18)
import { useEffect } from "react";
import { ClipboardList } from "lucide-react";
import config from "~/config";
import ModuleShell from "~/components/ModuleShell";
import { preloadWhenIdle } from "~/utils/lazyPage";

const R = config.routes;
const PAGES = [{ preload: () => import("~/pagesForm/MyForms") }, { preload: () => import("~/pagesForm/FormFill") }];

function DefaultLayout({ children }) {
  useEffect(() => { preloadWhenIdle(...PAGES); }, []);
  return (
    <ModuleShell title="Biểu mẫu nội bộ" icon={ClipboardList} home={R.form} moduleId={9} adminTo={R.adminFormList}
      sections={[{ items: [{ to: R.form, label: "Biểu mẫu của tôi", icon: ClipboardList }] }]}>
      <div className="mx-auto max-w-3xl px-4 pb-16 pt-5">{children}</div>
    </ModuleShell>
  );
}

export default DefaultLayout;
