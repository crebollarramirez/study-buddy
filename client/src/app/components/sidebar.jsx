import React from "react";
import Avatar from "./avatar";
import Counter from "./counter";

export default function Sidebar({message}) {
    return (
      <div className="bg-green-400 justify-center grid grid-rows-9 h-full w-full grid-cols-1">

        <div className="row-span-2 border h-full w-full">
          <Counter />
        </div>
        
        <div className="row-span-7 border h-full w-full"> 
          <Avatar />
        </div>

      </div>
    );
  }