"use client";

import ShopButton from "./shopButton";
import HomeButton from "./homeButton";
import LogoutButton from "./logoutButton";

export default function NavBar() {
    return (
        <div className= "flex justify-between items-center h-[5%] w-full px-4">
            <div className="links flex flex-row items-center justify-center h-full">
                    <HomeButton />  
            
                    <ShopButton />
            </div>

            <div className="logout">
                <LogoutButton/>
            </div>
        </div>
    );
};
