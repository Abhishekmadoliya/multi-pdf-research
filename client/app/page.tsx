// import Image from "next/image";
import Chat from "./components/Chat";
import FileUploadComponent from "./components/file-upload";

export default function Home() {
  return (
    <div>
      <div className="min-h-screen w-screen border-red-400 flex">
        
        <div className="w-[30vw] min-h-screen p-4 flex justify-center items-center">
          <FileUploadComponent/>
          </div>
        <div className="w-[70vw] min-h-screen border-l-2">
          <Chat />
        </div>
      </div>
    </div>
  );
}
