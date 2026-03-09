// Header.jsx
import HeaderLogo from "./HeaderLogo";
import HeaderSearch from "./HeaderSearch";
import HeaderNotice from "./HeaderNotice";
import HeaderInfo from "./HeaderInfo";
import HeaderInfoMobile from "./HeaderInfoMobile"; // <-- thêm dòng này

function Header({ toggleSidebar }) {
  return (
    <div className="shadow-lg shadow-indigo-500/10 h-full w-full flex">
      <HeaderLogo onToggle={toggleSidebar} />

      <div className="flex-1 flex justify-between items-center px-[24px]">
        <HeaderSearch />

        {/* Desktop: notice + avatar */}
        <div className="md:flex items-center hidden">
          {/* <HeaderNotice /> */}
          <div className="w-[1.5px] h-[28px] bg-[#DEE2E6] mx-[20px]" />
          <HeaderInfo />
        </div>

        {/* Mobile: chỉ hiện avatar dropdown */}
        <div className="md:hidden">
          <HeaderInfoMobile />
        </div>
      </div>
    </div>
  );
}

export default Header;
