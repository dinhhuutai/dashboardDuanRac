import Footer from "./components/Footer";
import Header from "./components/Header";
import TabBar from "./components/TabBar";

function DefaultLayout({children}) {
    return (
        <div>
            <div className="hidden md:block h-14 fixed z-[999] top-0 left-0 right-0">
                <Header />
            </div>
            <div className="md:mt-14">
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
