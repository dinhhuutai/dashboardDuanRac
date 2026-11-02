// Layout module 12 "Tính % tỷ lệ hình in với kích phim" (khung chung ModuleShell, giống module 18)
import { FileUp, Percent } from "lucide-react";
import config from "~/config";
import ModuleShell from "~/components/ModuleShell";

const R = config.routes;
const ITEMS = [
  { to: R.inkCovPerOnFilm, label: "Tính độ phủ", icon: Percent, end: true },
  { to: R.uploadFileFilm, label: "Tải file lên", icon: FileUp },
];

function DefaultLayout({ children }) {
  return (
    <ModuleShell title="Tính % mực" icon={Percent} home={R.inkCovPerOnFilm} moduleId={12}
      sections={[{ items: ITEMS }]} tabs={ITEMS}>
      {children}
    </ModuleShell>
  );
}

export default DefaultLayout;
