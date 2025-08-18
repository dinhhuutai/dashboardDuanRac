import { useEffect, useState } from "react";
import { BsSearch, BsChevronDown } from "react-icons/bs";
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

    return (
        <div className="flex items-center h-full gap-[8px]">
                
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