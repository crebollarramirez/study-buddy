

import React, { use } from "react";
import StudentList from "./components/StudentList";
import SelectedChatLog from "./components/SelectedChatLog";

const teacherHome = () => {
  return (
    <main className="h-screen w-full border">
      <h1>Teacher Home</h1>
      <div className="flex flex-row h-full border-white">
        <StudentList />
        <SelectedChatLog />
      </div>
    </main>
  );
};

export default teacherHome;
