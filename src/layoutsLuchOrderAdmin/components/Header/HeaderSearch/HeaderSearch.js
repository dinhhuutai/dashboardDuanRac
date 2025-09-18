import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import config from "~/config";
import { userSelector } from "~/redux/selectors";

function HeaderSearch() {
  const navigate = useNavigate();
  const tmp = useSelector(userSelector);
  const [user, setUser] = useState({});

  useEffect(() => {
    setUser(tmp?.login?.currentUser);
  }, [tmp]);

  // base style cho pill button
  const pill =
    "text-[13px] px-4 py-2 rounded-xl font-medium shadow-sm transition active:scale-[.98] focus:outline-none focus-visible:ring-4";

  return (
    <div className="flex items-center h-full gap-2 sm:gap-3">
      
              <button
  onClick={() => {
    navigate(config.routes.homeMain); // Điều hướng đến trang chọn ứng dụng
  }}
  className="
    w-full rounded-lg px-3 py-2 text-sm font-medium
    bg-slate-100 text-slate-700
    hover:bg-slate-200 transition-colors
  "
>
  Chọn ứng dụng
</button>
    </div>
  );
}

export default HeaderSearch;
