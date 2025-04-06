

import React, { use } from "react";
import StudentList from "./components/StudentList";
import SelectedChatLog from "./components/SelectedChatLog";

const teacherHome = () => {
  return (
    <main className="h-screen w-full border grid grid-cols-1 grid-rows-[10%_90%]">
      <div className="font-bold text-3xl text-center bg-red-900 text-white justify-center items-center flex">
        <h1>Teacher Home</h1>
      </div>
      <div className="flex flex-row h-full border-white">
        <StudentList />
        <SelectedChatLog />
      </div>
    </main>
  );
};

export default teacherHome;
