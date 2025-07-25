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

  console.log(user);

    return (
        <div className="flex items-center h-full gap-[8px]">
                <button
                    onClick={() => navigate(config.routes.home)}
                    className="text-[13px] px-[22px] py-[6px] bg-[#6b6a6a] text-white rounded hover:bg-[#7e7f80] transition-all"
                >
                    User
                </button>
               
            {
                user.operationType === 'canrac' ?
                <></> :
                <button
                    onClick={() => navigate(config.routes.adminInkWeighAnalytics)}
                    className={`text-[13px] px-[22px] py-[6px] bg-[#0077b6] text-white rounded hover:bg-[#0096c7] transition-all`}
                >
                    Cân mực
                </button>
            }
            
               
            {
                user.username !== 'dinhhuutai' && user.username !== 'thaonguyen' ?
                <></> :
                <button
                    onClick={() => navigate(config.routes.adminSuggestionList)}
                    className={`text-[13px] px-[22px] py-[6px] bg-[#ec407a] hover:bg-[#f48fb1] text-white rounded transition-all`}
                >
                    Hòm thư
                </button>
            }
        </div>
    );
}

export default HeaderSearch;