import React from "react";
import Avatar from "./avatar";
import Counter from "./counter";

export default function Sidebar() {
    return (
      <div className="bg-green-400 flex flex-col items-center justify-center h-full w-[30%]">
          <Counter />
          <Avatar />

      </div>
    );
  }