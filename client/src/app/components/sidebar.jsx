import React from "react";
import Avatar from "./avatar";
import Counter from "./counter";

import duck from "../../../public/duckscholar.png";
import duck2 from "../../../public/duckscholar_2.png";
import duck3 from "../../../public/duckscholar_3.png";

var image_name = duck3;

export default function Sidebar() {
    return (

      <div className="bg-green-400 justify-center grid grid-rows-9 h-full w-full grid-cols-1">

        <div className="row-span-4 border h-full w-full">
          <Counter />
        </div>
        
        <div className="row-span-5 border h-full w-full"> 
          <Avatar name={ image_name }/>
        </div>

      </div>
    );
  }