import Chat from "./components/chat";


export default function Home() {
  return (
    <div className="bg-white min-h-screen grid grid-rows-[40%_60%] gap-4 p-4">
      <div className="bg-gray-100 p-4 rounded shadow">
        <h2 className="text-lg font-bold mb-2">Left Panel</h2>
        <p>This is the left panel content.</p>
      </div>

      <div className="bg-gray-100 p-4 rounded shadow row-span-[60%]">
        <Chat />
      </div>
    </div>

  );
}
