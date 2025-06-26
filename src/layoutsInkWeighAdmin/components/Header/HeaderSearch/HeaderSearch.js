import { BsSearch, BsChevronDown } from "react-icons/bs";
import { useNavigate } from "react-router-dom";
import config from "~/config";



function HeaderSearch() {

    const navigate = useNavigate();

    return (
        <div className="flex items-center h-full gap-[8px]">
                <button
                    onClick={() => navigate(config.routes.home)}
                    className="text-[13px] px-[22px] py-[6px] bg-[#6b6a6a] text-white rounded hover:bg-[#7e7f80] transition-all"
                >
                    User
                </button>
                
  <button
    onClick={() => navigate(config.routes.adminAnalytics)}
    className="text-[13px] px-[22px] py-[6px] bg-[#2d8f6f] text-white rounded hover:bg-[#36a584] transition-all"
  >
    Cân rác
  </button>
        </div>
    );
}

export default HeaderSearch;