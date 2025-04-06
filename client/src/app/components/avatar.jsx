import React from "react";
import duck from "../../../public/duckscholar.png";
import Image from "next/image";

export default function Avatar({ name = duck }) {
    return (
      <div className="bg-green-400 justify-center flex flex-row items-center h-full">
        <Image src={ name } alt='duck scholar' width={200} height={200}/>
      </div>
    );
  }