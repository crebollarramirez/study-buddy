"use client";
import Link from "next/link";

const demoClasses = [
  { id: "math-18", name: "Math 18", preview: "Great work, can you explain the meaning of a vector space?" },
  { id: "cse-12", name: "CSE 12", preview: "What is the difference between dynamically-typed and statically-typed?" },
  { id: "hist-10", name: "History 10", preview: "Summarize the causes of the French Revolution." },
  { id: "phys-2a", name: "Physics 2A", preview: "State Newton's second law and provide an example." }
];

export default function ClassList() {
  return (
    <div className="flex flex-col w-full h-full">
      <div className="bg-[#8AC0A8] text-black p-4">
        <h2 className="text-2xl font-semibold">My Classes</h2>
      </div>
      <div className="flex-grow overflow-y-auto bg-white divide-y">
        {demoClasses.map((c) => (
          <Link key={c.id} href={`/chat/${c.id}`} className="flex items-center gap-4 p-4 hover:bg-gray-50">
            <div className="w-14 h-14 rounded-full bg-gray-400" />
            <div className="flex flex-col">
              <span className="text-black font-medium">{c.name}</span>
              <span className="text-gray-500 text-sm">{c.preview}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}


