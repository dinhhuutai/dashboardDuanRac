import { useState } from "react";
import { BsList } from "react-icons/bs";
import { Link } from "react-router-dom";

import logo from '~/assets/imgs/logoAdmin.png';
import config from "~/config";



function HeaderLogo({ onToggle }) {


    return (
        <div className="flex justify-between items-center px-[24px] w-auto md:w-[var(--admin-width-sidebar)] h-full">
            <Link to={config.routes.adminAnalytics} className="md:flex items-center hidden">
                <img alt="logo" src={logo} className="h-[40px]" />
            </Link>
            <div onClick={onToggle} className="text-[26px] text-[#3e5cb1] cursor-pointer">
                <BsList />
            </div>
        </div>
    );
}

export default HeaderLogo;
