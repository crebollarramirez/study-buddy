import Chat from "./components/chat";
import NavBar from "./components/navbar";
import Sidebar from "./components/sidebar";
import ProtectedRoute from "./components/ProtectedRoute";
import { Pixelify_Sans } from 'next/font/google';

export const pixelifySans = Pixelify_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
}); 

export default function Home() {
  return (
    <ProtectedRoute requiredRole="student">
      <main className={`w-screen h-screen ${pixelifySans.className}`}>
        <NavBar />
        <div className="h-[95%] w-full flex flex-row justify-center items-center px-4" >
          <Chat />
          <Sidebar />
        </div>
      </main>
    </ProtectedRoute>
  );
}
