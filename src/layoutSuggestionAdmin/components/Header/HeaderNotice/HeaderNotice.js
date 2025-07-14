import { BsFillBellFill, BsCircleFill } from "react-icons/bs";


import nationGermany from '~/assets/imgs/nation-germany.svg';


function HeaderNotice() {
    return (
        <div className="flex gap-[14px] items-center">
            <div className="hover:bg-[#e4dadd] ease-linear duration-[.2s] text-[20px] text-[#D92550] p-[10px] rounded-[50%] cursor-pointer bg-[#EBECED]">
                <BsFillBellFill className="animate-infoBigSmall" />
            </div>
            <div className="hover:bg-[#e4dadd] ease-linear duration-[.2s] rounded-[50%] p-[5px] cursor-pointer bg-[#EBECED]">
                <img className="h-[30px] w-[30px] rounded-[50px]" alt="language Germany" src={nationGermany} />
            </div>
            <div className="hover:bg-[#e4dadd] ease-linear duration-[.2s] text-[#3AC47D] text-[20px] p-[10px] rounded-[50%] cursor-pointer bg-[#EBECED]">
                <BsCircleFill />
            </div>
        </div>
    );
}

export default HeaderNotice;