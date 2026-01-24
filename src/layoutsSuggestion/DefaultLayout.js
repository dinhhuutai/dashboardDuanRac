import { useSelector } from "react-redux";
import Footer from "./components/Footer";
import Header from "./components/Header";
import { userSelector } from "~/redux/selectors";

function DefaultLayout({children}) {

    const tmp = useSelector(userSelector);

    return (
        <div>
            {
                tmp?.login?.currentUser?.fullName &&
                <div className='hidden md:block h-[70px] fixed z-[999] top-[0px] left-[0px] right-[0px]'>
                    <Header />
                </div>
            }
            <div className={`${tmp?.login?.currentUser?.fullName && 'md:mt-[70px]'}`}>
                {children}
            </div>
            {
                tmp?.login?.currentUser?.fullName &&
                <div className='hidden md:block'>
                    <Footer />
                </div>
            }
        </div>
    );
}

export default DefaultLayout;