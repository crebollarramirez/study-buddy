"use client";

import React, { useEffect, useState } from "react";
import NavBar from "../components/navbar";
import HomeNavbar from "../components/HomeNavbar";
import ProtectedRoute from "../components/ProtectedRoute";
import Image from "next/image";
import brain from "../../../public/brain_pixel.png";
import duck from "../../../public/duckscholar.png";

export default function HomePage() {
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
    <ProtectedRoute requiredRole="student">
      <main className="w-screen h-screen">
        <div className="w-full h-full flex flex-row overflow-hidden">
          <NavBar />
          <div className="flex-1 h-full flex flex-row overflow-hidden">
            <div className="flex-1 h-full flex flex-col bg-[#EDF6F9] overflow-hidden">
              {/* Profile Section */}
              <div className="p-8 flex-shrink-0 mt-12">
                <div className="flex items-start gap-8">
                  {/* Avatar */}
                  <div className="flex flex-col items-center">
                    <div className="w-32 h-32 rounded-full bg-gray-300 flex items-center justify-center mb-4">
                      <div className="relative w-24 h-24 p-12">
                        <Image
                          src={duck}
                          alt="Avatar"
                          fill
                          style={{ objectFit: "contain" }}
                        />
                      </div>
                    </div>
                    <button className="bg-[#D37B86] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#C06A75] transition-colors">
                      Edit Character
                    </button>
                  </div>

                  {/* User Details and Brain Points Row */}
                  <div className="flex-1 flex items-center justify-between mt-4">
                    {/* Profile Section */}
                    <div className="flex flex-col items-center">
                      <h1 className="text-4xl font-bold text-gray-800 mb-2 ">
                        John Bradley
                      </h1>
                      <div className="flex items-center gap-6 mb-6">
                        <span className="text-lg text-gray-600">Level 3</span>
                        <span className="text-lg text-gray-600">
                          Ranking: Bronze
                        </span>
                      </div>
                    </div>

                    {/* Brain Points Section */}
                    <div className="flex items-center mr-6">
                      {/* Brain Image */}
                      <div className="relative w-28 h-28">
                        <Image
                          src={brain}
                          alt="Brain"
                          fill
                          style={{ objectFit: "contain" }}
                        />
                      </div>

                      {/* Points + Label */}
                      <div className="flex flex-col">
                        <span className="text-[64px] leading-none text-black font-bold">
                          {points}
                        </span>
                        <span className="mt-1 text-lg text-gray-700">
                          Brain Points
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* My Classes Section */}
              <div className="flex-1 p-8 pt-0 min-h-0">
                <div className="bg-white rounded-lg shadow-sm h-full flex flex-col">
                  <div className="p-6 border-b border-gray-200 flex-shrink-0">
                    <div className="flex items-center justify-between">
                      <h2 className="text-2xl font-bold text-gray-800">
                        My Classes
                      </h2>
                      <button className="text-[#8AC0A8] hover:text-[#6BA68A] font-medium">
                        + add course
                      </button>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto min-h-0">
                    <div className="divide-y divide-gray-200">
                      {/* Class items */}
                      <div className="p-6 flex items-center gap-4 hover:bg-gray-50 cursor-pointer">
                        <div className="w-12 h-12 rounded-full bg-gray-400 flex items-center justify-center">
                          <div className="w-3 h-3 rounded-full bg-[#8AC0A8]"></div>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-medium text-gray-800">
                            Math 18
                          </h3>
                          <p className="text-gray-600">
                            Great work, can you explain the meaning of a vector
                            space?
                          </p>
                        </div>
                      </div>

                      <div className="p-6 flex items-center gap-4 hover:bg-gray-50 cursor-pointer">
                        <div className="w-12 h-12 rounded-full bg-gray-400"></div>
                        <div className="flex-1">
                          <h3 className="text-lg font-medium text-gray-800">
                            CSE 12
                          </h3>
                          <p className="text-gray-600">
                            What is the difference between dynamically typed and
                            statically typed?
                          </p>
                        </div>
                      </div>

                      <div className="p-6 flex items-center gap-4 hover:bg-gray-50 cursor-pointer">
                        <div className="w-12 h-12 rounded-full bg-gray-400 flex items-center justify-center">
                          <div className="w-3 h-3 rounded-full bg-[#8AC0A8]"></div>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-medium text-gray-800">
                            Class Name (1)
                          </h3>
                          <p className="text-gray-600">
                            Latest question from the chat is written here
                          </p>
                        </div>
                      </div>

                      <div className="p-6 flex items-center gap-4 hover:bg-gray-50 cursor-pointer">
                        <div className="w-12 h-12 rounded-full bg-gray-400"></div>
                        <div className="flex-1">
                          <h3 className="text-lg font-medium text-gray-800">
                            Class Name (2)
                          </h3>
                          <p className="text-gray-600">
                            Latest question from the chat is written here
                          </p>
                        </div>
                      </div>

                      <div className="p-6 flex items-center gap-4 hover:bg-gray-50 cursor-pointer">
                        <div className="w-12 h-12 rounded-full bg-gray-400"></div>
                        <div className="flex-1">
                          <h3 className="text-lg font-medium text-gray-800">
                            Class Name (3)
                          </h3>
                          <p className="text-gray-600">
                            Latest question from the chat is written here
                          </p>
                        </div>
                      </div>

                      {/* Additional classes to demonstrate scrolling */}
                      <div className="p-6 flex items-center gap-4 hover:bg-gray-50 cursor-pointer">
                        <div className="w-12 h-12 rounded-full bg-gray-400"></div>
                        <div className="flex-1">
                          <h3 className="text-lg font-medium text-gray-800">
                            Physics 2A
                          </h3>
                          <p className="text-gray-600">
                            State Newton's second law and provide an example.
                          </p>
                        </div>
                      </div>

                      <div className="p-6 flex items-center gap-4 hover:bg-gray-50 cursor-pointer">
                        <div className="w-12 h-12 rounded-full bg-gray-400 flex items-center justify-center">
                          <div className="w-3 h-3 rounded-full bg-[#8AC0A8]"></div>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-medium text-gray-800">
                            History 10
                          </h3>
                          <p className="text-gray-600">
                            Summarize the causes of the French Revolution.
                          </p>
                        </div>
                      </div>

                      <div className="p-6 flex items-center gap-4 hover:bg-gray-50 cursor-pointer">
                        <div className="w-12 h-12 rounded-full bg-gray-400"></div>
                        <div className="flex-1">
                          <h3 className="text-lg font-medium text-gray-800">
                            Chemistry 6A
                          </h3>
                          <p className="text-gray-600">
                            Explain the concept of molecular orbitals.
                          </p>
                        </div>
                      </div>

                      <div className="p-6 flex items-center gap-4 hover:bg-gray-50 cursor-pointer">
                        <div className="w-12 h-12 rounded-full bg-gray-400"></div>
                        <div className="flex-1">
                          <h3 className="text-lg font-medium text-gray-800">
                            Biology 1
                          </h3>
                          <p className="text-gray-600">
                            Describe the process of photosynthesis.
                          </p>
                        </div>
                      </div>

                      <div className="p-6 flex items-center gap-4 hover:bg-gray-50 cursor-pointer">
                        <div className="w-12 h-12 rounded-full bg-gray-400"></div>
                        <div className="flex-1">
                          <h3 className="text-lg font-medium text-gray-800">
                            Economics 1
                          </h3>
                          <p className="text-gray-600">
                            Explain the concept of supply and demand.
                          </p>
                        </div>
                      </div>

                      <div className="p-6 flex items-center gap-4 hover:bg-gray-50 cursor-pointer">
                        <div className="w-12 h-12 rounded-full bg-gray-400 flex items-center justify-center">
                          <div className="w-3 h-3 rounded-full bg-[#8AC0A8]"></div>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-medium text-gray-800">
                            Psychology 1
                          </h3>
                          <p className="text-gray-600">
                            Describe the stages of cognitive development.
                          </p>
                        </div>
                      </div>

                      <div className="p-6 flex items-center gap-4 hover:bg-gray-50 cursor-pointer">
                        <div className="w-12 h-12 rounded-full bg-gray-400"></div>
                        <div className="flex-1">
                          <h3 className="text-lg font-medium text-gray-800">
                            Art 1
                          </h3>
                          <p className="text-gray-600">
                            Analyze the elements of Renaissance art.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="w-48 h-full overflow-hidden">
              <HomeNavbar />
            </div>
          </div>
        </div>
      </main>
    </ProtectedRoute>
  );
}
