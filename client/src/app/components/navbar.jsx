"use client";
import LogoutButton from "./logoutButton";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function NavBar() {
  const pathname = usePathname();
  const isActive = (href) => {
    if (href === "/classes") {
      // Highlight classes button for both /classes and any /chat/* page
      return pathname === "/classes" || pathname.startsWith("/chat/");
    }
    if (href === "/home") {
      // Highlight home button for /home, /progress, and /leaderboard pages
      return pathname === "/home" || pathname === "/progress" || pathname === "/leaderboard";
    }
    return pathname === href;
  };
  const activeClass = (href) =>
    isActive(href)
      ? "bg-[#8AC0A8] text-black"
      : "text-gray-700 hover:bg-gray-200";

  return (
    <div className="flex flex-col items-center justify-between h-full w-16 bg-white py-4 border-r">
      <div className="flex flex-col items-center gap-4">
        <Link href="/home" className={`w-10 h-10 rounded-md flex items-center justify-center transition-colors ${activeClass("/home")}`}>
          <span className="text-xl">🏠</span>
        </Link>
        <Link href="/classes" className={`w-10 h-10 rounded-md flex items-center justify-center transition-colors ${activeClass("/classes")}`}>
          <span className="text-xl">💬</span>
        </Link>
        <Link href="/shop" className={`w-10 h-10 rounded-md flex items-center justify-center transition-colors ${activeClass("/shop")}`}>
          <span className="text-xl">🏪</span>
        </Link>
      </div>
      <div className="">
        <LogoutButton />
      </div>
    </div>
  );
}