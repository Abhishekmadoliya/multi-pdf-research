'use client';

import { Button } from '@/components/ui/button';
import { RefreshCw, Globe } from "lucide-react"

import { Input } from '@/components/ui/input';
import * as React from 'react';




const Chat: React.FC = () => {

  const [messages, setMessages] = React.useState<{ responseText: string; message: string }[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [message, setMessage] = React.useState<string>('');


  // console.log({ messages });

  const handleSendChatMessage = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const res = await fetch('http://localhost:8000/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: message,
        })
      });

      if (!res.ok) {
        throw new Error('Failed to get response');
      }

      const data = await res.json();
      const responseText = data?.result || '';
      // console.log("Response Text:", responseText);
      
      // console.log("Client received data:", data);

    
      
      setMessages([...messages, {responseText, message: message}]);
      // console.log("Updated messages:", [...messages, {responseText, message: message}]);

    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to send message');
    } finally {
      setIsLoading(false);
      setMessage('');
    }
  };

  return (
    <div className="p-4">
      {/* <div>
        {messages.map((message, index) => (
          <pre key={index}>{JSON.stringify(message, null, 2)}</pre>
        ))}
      </div> */}
      <div className="mt-4 p-4 border rounded-2xl bg-gray-50 shadow-sm ">
        {/* mt-4 p-4 border rounded-2xl bg-gray-50 shadow-sm max-w-lg */}
      <div className="mb-3">
        <h2 className="text-lg font-semibold mb-2">Response:</h2>
       {messages.length > 0 ? messages.map((msg, index) => (
        <>
        <p className='flex  justify-end text-center'>{msg.message}</p>

        <pre key={index} className="whitespace-pre-wrap   mt-4 p-4 border rounded-2xl bg-gray-50 shadow-sm ">{msg.responseText}</pre> 
        {/* max-w-lg    upperrow */}
        </>
       )): <p>No response yet.</p>}
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" className="flex items-center gap-1">
          <RefreshCw size={16} /> Refine
        </Button>
        <Button variant="outline" size="sm" className="flex items-center gap-1">
          <Globe size={16} /> Search Web
        </Button>
      </div>
    </div>
      

     
      
      <div className="fixed bottom-4 w-100 flex flex-col gap-3 bg-white p-4 max-w-lg">
        
        <div className="flex gap-3">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message here"
            disabled={isLoading}
          />
          <button 
            onClick={handleSendChatMessage} 
            // disabled={!message.trim() || isLoading} 
            className=' bg-blue-900 text-white hover:bg-blue-700 cursor-pointer px-4 py-2 rounded-lg disabled:opacity-50'
          >
            {isLoading ? 'Sending...' : 'Send'}
          </button>
        </div>
        {error && <div className="text-red-500 text-sm">{error}</div>}
      </div>
    </div>
  );
};
export default Chat;