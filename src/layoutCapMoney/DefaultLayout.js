import config from "~/config";
import Footer from "./components/Footer";
import Header from "./components/Header";
import TabBar from "./components/TabBar";
import { useLocation } from "react-router-dom";

function DefaultLayout({children}) {
  const location = useLocation();

  const HIDE_TABBAR_ROUTES = [
    config.routes.consolidateTickTime
  ];

  const hideTabBar = HIDE_TABBAR_ROUTES.includes(location.pathname);

    return (
        <div>
            <div className='hidden md:block h-[70px] fixed z-[999] top-[0px] left-[0px] right-[0px]'>
                <Header />
            </div>
            <div className="md:mt-[70px]">
                {children}
            </div>
            <div className='hidden md:block'>
                <Footer />
            </div>

            {/* TabBar mobile */}
            {!hideTabBar && <TabBar />}
        </div>
    );
}

export default DefaultLayout;