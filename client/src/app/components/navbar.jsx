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