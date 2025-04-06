import Chat from "./components/chat";
import NavBar from "./components/navbar";
import Sidebar from "./components/sidebar";
import ProtectedRoute from "./components/ProtectedRoute";
import { Pixelify_Sans } from 'next/font/google';

export const pixelifySans = Pixelify_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
}); 

export default function Home() {
  return (
    <ProtectedRoute requiredRole="student">
      <main className={`w-screen h-screen ${pixelifySans.className}`}>
        <NavBar />
        <div className="h-[95%] w-full flex flex-row justify-center items-center px-4" >
          <Chat />
          <Sidebar />
        </div>
      </main>
    </ProtectedRoute>
  );
}

// NEW CHANGES BELOW
// "use client"

// import React, { useState } from "react";
// import Chat from "./components/chat";
// import Shop from "./components/shop";
// import NavBar from "./components/navbar";
// import Sidebar from "./components/sidebar";
// import ProtectedRoute from "./components/ProtectedRoute";

// export default function Home() {
//   const [activeComponent, setActiveComponent] = useState("chat"); // State to track the active component

//   return (
//     <ProtectedRoute requiredRole="student">
//       <main className="w-screen h-screen">
//         {/* Pass state and setter to NavBar */}
//         <NavBar
//           setActiveComponent={setActiveComponent}
//           activeComponent={activeComponent}
//         />
//         <div className="bg-white h-[95%] w-full flex flex-row justify-center items-center">
//           {/* Render the active component */}
//           <div className="flex flex-col w-[70%] h-full">
//             {activeComponent === "chat" ? <Chat /> : <Shop />}
//           </div>
//           <Sidebar />
//         </div>
//       </main>
//     </ProtectedRoute>
//   );
// }