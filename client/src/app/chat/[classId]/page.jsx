"use client";
import { useParams } from "next/navigation";
import NavBar from "../../components/navbar";
import Chat from "../../components/chat";
import Sidebar from "../../components/sidebar";
import ProtectedRoute from "../../components/ProtectedRoute";

export default function ClassChatPage() {
  const params = useParams();
  const classId = params?.classId || "demo";

  return (
    <ProtectedRoute requiredRole="student">
      <main className="w-screen h-screen">
        <div className="w-full h-full flex flex-row overflow-hidden">
          <NavBar />
          <div className="flex-1 h-full flex flex-row overflow-hidden">
            <div className="flex-1 h-full overflow-hidden">
              <Chat classId={classId} />
            </div>
            <div className="w-[360px] h-full overflow-hidden">
              <Sidebar />
            </div>
          </div>
        </div>
      </main>
    </ProtectedRoute>
  );
}




