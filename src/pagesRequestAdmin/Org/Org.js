// Quản trị module 18: phòng ban, tổ, chức danh, gán cho nhân viên — dùng chung trang của module 9
// (bảng org_* dùng chung toàn hệ thống; API /api/fm/admin/org/* cho phép admin module 9 hoặc 18).
import OrgManagement from "~/pagesFormAdmin/OrgManagement";
import { PageScroll } from "~/pagesRequest/shared/components";

export default function Org() {
  return (
    <PageScroll max="max-w-[1500px]">
      <OrgManagement />
    </PageScroll>
  );
}
