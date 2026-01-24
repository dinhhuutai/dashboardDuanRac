import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // lên đầu trang mỗi lần đổi route
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    // nếu browser không hiểu "instant" thì dùng:
    // window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
