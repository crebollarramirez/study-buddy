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

// NEW CHANGES BELOW
// "use client";

// import React from "react";

// export default function NavBar({ setActiveComponent, activeComponent }) {
//   return (
//     <div className="flex justify-between items-center h-[5%] w-full px-4 bg-gray-800 text-white">
//       <div className="links flex flex-row items-center justify-center h-full space-x-4">
//         {/* Home Button */}
//         <button
//           className={`px-4 py-2 rounded-lg ${
//             activeComponent === "chat"
//               ? "bg-blue-500 text-white"
//               : "bg-gray-600 text-gray-300"
//           }`}
//           onClick={() => setActiveComponent("chat")}
//         >
//           Chat
//         </button>

//         {/* Shop Button */}
//         <button
//           className={`px-4 py-2 rounded-lg ${
//             activeComponent === "shop"
//               ? "bg-blue-500 text-white"
//               : "bg-gray-600 text-gray-300"
//           }`}
//           onClick={() => setActiveComponent("shop")}
//         >
//           Shop
//         </button>
//       </div>

//       <div className="logout">
//         <button className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600">
//           Logout
//         </button>
//       </div>
//     </div>
//   );
// }
