"use client";
import LogoutButton from "./logoutButton";

export default function NavBar() {
  return (
    <div className="flex justify-between items-center h-[5%] w-full px-4">
      <div className="links flex flex-row items-center justify-center h-full">
        <button className="bg-blue-500/80 text-white p-2 rounded transition-all duration-300 hover:bg-blue-600 hover:scale-105 hover:shadow-lg">
          Home
        </button>

        <button className="ml-2 bg-blue-500/80 text-white p-2 rounded transition-all duration-300 hover:bg-blue-600 hover:scale-105 hover:shadow-lg">
          Shop
        </button>
      </div>

      <div className="logout">
        <LogoutButton />
      </div>
    </div>
  );
}
//             <div className="logout">
//                 <LogoutButton/>
//             </div>
//         </div>
//     );
// };

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
