import Chat from "./components/chat";
import NavBar from "./components/navbar";
import Avatar from "./components/avatar";


export default function Home() {
  return (
    <div className="bg-white min-h-screen grid grid-rows-[10%_90%] grid-cols-[70%_30%] p-4 overflow-hidden h-full max-h-full">
      <div className="bg-blue-100 p-4 rounded shadow row-span-1 col-span-2 border border-blue-900">
        <NavBar />
      </div>

      <div className="bg-white-100 p-4 rounded shadow row-span-1 col-span-1">
        <Chat />
      </div>

      <div className="bg-white-100 p-4 rounded shadow row-span-1 col-span-1">
        <Avatar />
      </div>
    </div>

  );
}
