import Footer from "./components/Footer";
import Header from "./components/Header";

function DefaultLayout({children}) {
    return (
        <div>
            <div className='h-[70px] fixed z-[999] top-[0px] left-[0px] right-[0px]'>
                <Header />
            </div>
            <div className="mt-[70px]">
                {children}
            </div>
            <div>
                <Footer />
            </div>
        </div>
    );
}

export default DefaultLayout;