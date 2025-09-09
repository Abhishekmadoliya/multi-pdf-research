"use client";

import * as React from "react";
import { Upload } from "lucide-react";
import { useState } from "react";

const FileUploadComponent:React.FC = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const handlefileuploadclick = () => {
    const element = document.createElement("input");
    element.setAttribute("type", "file");
    element.setAttribute("accept", "application/pdf");
    element.addEventListener("change", async  (ev)=>{
        const input = ev.target as HTMLInputElement;
        if(input.files && input.files.length > 0){
            const file = input.files.item(0);
            if(file) {
              const formData = new FormData();
              formData.append("pdf", file );
              setIsUploading(true);
              setError(null);
              setSuccess(null);
              try {
                const response = await fetch("http://localhost:8000/upload/pdf", {
                  method: "POST",
                  body: formData
                });
                const data = await response.json();
                
                if (!response.ok) {
                  throw new Error(data.error || 'Upload failed');
                }
                
                setSuccess(data.message);
              } catch (err) {
                setError(err instanceof Error ? err.message : 'Upload failed');
              } finally {
                setIsUploading(false);
              }

            }
          }
    })
    element.click();
  };
  return (
    <div className="bg-slate-900 text-white  shadow-2x flex justify-center items-center p-4 rounded-lg border-white border-2">
      <div
        onClick={handlefileuploadclick}
        className="flex justify-center items-center flex-col "
      >
        <p>Upload Pdf</p>
        <Upload />
      </div>
    </div>
  );
};

export default FileUploadComponent;
