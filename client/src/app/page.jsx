import Chat from "./components/chat";
import NavBar from "./components/navbar";
import Sidebar from "./components/sidebar";
import ProtectedRoute from "./components/ProtectedRoute";

export default function Home() {
  return (
    <ProtectedRoute requiredRole="student">
      <main className="w-screen h-screen">
        <NavBar />
        <div className="bg-white h-[95%] w-full flex flex-row justify-center items-center">
          <Chat />
          <Sidebar />
        </div>
      </main>
    </ProtectedRoute>
  );
}
