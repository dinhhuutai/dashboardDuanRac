import Footer from "./components/Footer";
import Header from "./components/Header";
import TabBar from "./components/TabBar";

function DefaultLayout({children}) {
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
            <TabBar />
        </div>
    );
}

export default DefaultLayout;