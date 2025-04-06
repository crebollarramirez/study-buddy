"use client";

import React, { useState, useEffect } from "react";
import server from "../../server";

export default function Counter() {
  const [counterState, setCounterState] = useState(0);

  const getUserPoints = async () => {
    server.get("/brain_points").then((response) => {
      console.log(response.data);
      setCounterState(response.data['brain_points']);
    });
  }

  useEffect(() => {
    getUserPoints();
  }, []);

  return (
    <div className="bg-green-400 justify-center flex flex-row items-center h-full">
      <p>{counterState}</p>
    </div>
  );
}