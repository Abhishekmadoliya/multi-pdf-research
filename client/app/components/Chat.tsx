'use client';

import { Button } from '@/components/ui/button';
// import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import * as React from 'react';

interface Doc {
  pageContent?: string;
  metdata?: {
    loc?: {
      pageNumber?: number;
    };
    source?: string;
  };
}
interface IMessage {
  role: 'assistant' | 'user';
  content?: string;
  documents?: Doc[];
}

const Chat: React.FC = () => {
  const [message, setMessage] = React.useState<string>('');
  const [messages, setMessages] = React.useState<IMessage[]>([]);

  console.log({ messages });

  const handleSendChatMessage = async () => {
    setMessages((prev) => [...prev, { role: 'user', content: message }]);
    const res = await fetch(`http://localhost:8000/chat?message=${message}`);
    const data = await res.json();
    setMessages((prev) => [
      ...prev,
      {
        role: 'assistant',
        content: data?.message,
        documents: data?.docs,
      },
    ]);
  };

  return (
    <div className="p-4">
      <div>
        {messages.map((message, index) => (
          <pre key={index}>{JSON.stringify(message, null, 2)}</pre>
        ))}
      </div>
      <div>
        {message}
      </div>
      
      <div className="fixed bottom-4 w-100 flex gap-3">
        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message here"
        />
        <Button onClick={handleSendChatMessage} disabled={!message.trim()} className='bg-blue-900 hover:bg-blue-600 text-black cursor-pointer'>
          Send
        </Button>
      </div>
    </div>
  );
};
export default Chat;