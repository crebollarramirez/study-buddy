"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import server from "../../server";
import brain from "../../../public/brain_pixel.png";
import duck from "../../../public/duckscholar.png";

export default function Sidebar() {
  const [points, setPoints] = useState(0);

  useEffect(() => {
    async function loadPoints() {
      try {
        const res = await server.get("/brain_points");
        setPoints(res.data?.brain_points ?? 0);
      } catch (e) {
        setPoints(0);
      }
    }
    loadPoints();
  }, []);

  return (
    <div className="flex flex-col w-full h-full">
      <div className="flex flex-col bg-white h-full border-l">
      <div className="bg-[#8AC0A8] text-black p-4">
        <h2 className="text-2xl text-[#8AC0A8] font-semibold">My Classes</h2>
      </div>
        {/* Brain + number arrangement and label */}
        <div className="px-6 pt-10">
  <div className="relative flex items-center">
    {/* Brain Image */}
    <div className="relative w-28 h-28 ml-8">
      <Image src={brain} alt="Brain" fill style={{ objectFit: "contain" }} />
    </div>

    {/* Points + Label */}
    <div className="relative flex flex-col ">
      <span className="text-[64px] leading-none text-black font-bold">
        {points}
      </span>
      <span className="mt-1 text-lg text-gray-700">Brain Points</span>
    </div>
  </div>
</div>

        {/* Avatar in a circle */}
        <div className="px-6 pt-8 flex items-center justify-center">
          <div className="w-64 h-64 rounded-full bg-gray-300 flex items-center justify-center">
            <div className="relative w-40 h-40">
              <Image src={duck} alt="Avatar" fill style={{ objectFit: "contain" }} />
            </div>
          </div>
        </div>

        {/* Ribbon name banner (SVG as provided) */}
        <div className="px-6 pt-6 flex items-center justify-center">
          <div className="relative" style={{ width: 258, height: 53 }}>
            <svg width="258" height="53" viewBox="0 0 258 53" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M1 16H75V53H0.5L19 33L1 16Z" fill="#D37B86"/>
              <path d="M186 16H258L245 34.5L258 53H186V16Z" fill="#D37B86"/>
              <g filter="url(#filter0_d_670_2)">
                <rect x="29" width="198" height="37" fill="#D37B86"/>
              </g>
              <defs>
                <filter id="filter0_d_670_2" x="25" y="0" width="206" height="45" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                  <feFlood floodOpacity="0" result="BackgroundImageFix"/>
                  <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
                  <feOffset dy="4"/>
                  <feGaussianBlur stdDeviation="2"/>
                  <feComposite in2="hardAlpha" operator="out"/>
                  <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"/>
                  <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_670_2"/>
                  <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_670_2" result="shape"/>
                </filter>
              </defs>
            </svg>
            <div className="absolute pb-[1vw] top-1/2 left-1/2 -translate-x-1/2 -translate-y-[60%] text-white" style={{ width: 198, textAlign: 'center' }}>
              John Bradley
            </div>
          </div>
        </div>

        {/* Progress with labels like mock */}
        <div className="px-6 pt-8 text-black">
          <div className="flex items-center justify-between mb-2 text-gray-700"><span>Level 3</span><span>50 % Complete</span></div>
          <div className="w-full h-5 bg-gray-200 overflow-hidden rounded-full">
            <div className="h-full bg-[#8AC0A8] rounded-full" style={{ width: "50%" }} />
          </div>
        </div>

        {/* Leaderboard link */}
        <div className="px-6 pt-10 mb-4">
          <a href="/leaderboard" className="text-black font-medium hover:underline">Leaderboard →</a>
        </div>
      </div>
    </div>
  );
}