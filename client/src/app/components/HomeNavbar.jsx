"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function HomeNavbar() {
  const pathname = usePathname();
  const isActive = (href) => pathname === href;
  const activeClass = (href) =>
    isActive(href)
      ? "bg-[#8AC0A8] text-black"
      : "text-gray-700 hover:bg-gray-200";

  return (
    <div className="flex flex-col w-[15vw] h-full bg-white border-l ">
      <div className="px-6 ">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 mt-12">Home</h2>
        <nav className="space-y-2 ">
          <Link 
            href="/home" 
            className={`block px-4 py-3 rounded-lg transition-colors ${activeClass("/home")}`}
          >
            Profile
          </Link>
          <Link 
            href="/progress" 
            className={`block px-4 py-3  rounded-lg transition-colors ${activeClass("/progress")}`}
          >
            Progress
          </Link>
          <Link 
            href="/leaderboard" 
            className={`block px-4 py-3 rounded-lg transition-colors ${activeClass("/leaderboard")}`}
          >
            Ranking
          </Link>
        </nav>
      </div>
    </div>
  );
}
