import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { noticeAdminSelector } from "~/redux/selectors";
import { BsXOctagonFill, BsX, BsFillPatchCheckFill, BsGearFill } from "react-icons/bs";
import noticeAdminSlice from "~/redux/slices/noticeAdminSlice";


function Notice() {
    
    const tmp = useSelector(noticeAdminSelector);
    const [notice, setNotice] = useState()


    useEffect(() => {
        setNotice(tmp);
    }, [tmp]);


    const dispatch = useDispatch();

    const handleClosed = () => {
        dispatch(noticeAdminSlice.actions.hiddenNotice());
    }


    return (
        <div>
            {notice?.hidden && (
                <div
                    className={`${notice?.state ? 'animate-noticeSlideLeft' : 'animate-noticeSlideRight'} ${
                        notice?.status ? 'border-l-[#2fca32]' : 'border-l-[red]'
                    } fixed top-[70px] border-l-[4px] border-l-solid box-shadow-admin-notice right-[30px] z-[100] px-[20px] py-[8px] min-w-[260px] rounded-[6px] bg-[#fff] flex items-center`}
                >
                    <button
                        onClick={handleClosed}
                        className="absolute top-0 right-0 text-[24px] p-[2px] hover:opacity-[.9] active:bg-[#d2d0d0] active:opacity-[.7] rounded-[6px] cursor-pointer"
                    >
                        <BsX />
                    </button>
                    <div className={`${notice?.status ? 'text-[#2fca32]' : 'text-[red]'} text-[30px]`}>
                        {notice?.status ? <BsFillPatchCheckFill /> : <BsXOctagonFill />}
                    </div>
                    <div className="ml-[16px] flex-1 text-[#000]">
                        <h2
                            className={`${
                                notice?.status ? 'text-[#2fca32]' : 'text-[red]'
                            } uppercase text-[16px] font-[700]`}
                        >
                            {notice?.title}
                        </h2>
                        <p>{notice?.text}</p>
                    </div>
                    <div
                        className={`${notice?.state ? 'animate-noticeSlideTime w-[100%]' : 'w-[0%]'} ${
                            notice?.status ? 'bg-[#6efe4d]' : 'bg-[#e94b4b]'
                        }  absolute bottom-0 left-0 h-[4px] rounded-b-[6px]`}
                    ></div>
                </div>
            )}
            {
                notice?.processing &&
                <div
                    className={`border-l-[#6346f3] animate-noticeSlideLeft fixed top-[70px] border-l-[4px] border-l-solid box-shadow-admin-notice right-[30px] z-[100] px-[20px] py-[8px] min-w-[260px] rounded-[6px] bg-[#fff] flex items-center`}
                >
                    <button
                        onClick={handleClosed}
                        className="absolute top-0 right-0 text-[24px] p-[2px] hover:opacity-[.9] active:bg-[#d2d0d0] active:opacity-[.7] rounded-[6px] cursor-pointer"
                    >
                        <BsX />
                    </button>
                    <div className={`text-[#6346f3] text-[30px] animate-loading`}>
                        <BsGearFill />
                    </div>
                    <div className="ml-[16px] flex-1 text-[#000]">
                        <h2 className={`text-[#6346f3] uppercase text-[16px] font-[700]`}>
                            {notice?.title}
                        </h2>
                        <p>{notice?.text}</p>
                    </div>
                </div>
            }
        </div>
    );
}

export default Notice;
