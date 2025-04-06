import React from "react";
import Avatar from "./avatar";
import Counter from "./counter";

import duck from "../../../public/duckscholar.png";
import duck2 from "../../../public/duckscholar_2.png";
import duck3 from "../../../public/duckscholar_3.png";

var image_name = duck3;

export default function Sidebar() {
    return (
      <div className="bg-green-400 flex flex-col items-center justify-center h-full w-[30%]">
          <Counter />
          <Avatar />

      </div>
    );
  }