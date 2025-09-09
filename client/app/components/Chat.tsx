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
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [expectedAnswer, setExpectedAnswer] = React.useState<string>('');

  console.log({ messages });

  const handleSendChatMessage = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setMessages((prev) => [...prev, { role: 'user', content: message }]);
      
      const res = await fetch('http://localhost:8000/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: message,
          expectedAnswer: expectedAnswer || undefined
        })
      });

      if (!res.ok) {
        throw new Error('Failed to get response');
      }

      const data = await res.json();
      
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data?.message,
          documents: data?.context,
        },
      ]);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to send message');
    } finally {
      setIsLoading(false);
      setMessage('');
    }
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
      
      <div className="fixed bottom-4 w-100 flex flex-col gap-3">
        <Input
          value={expectedAnswer}
          onChange={(e) => setExpectedAnswer(e.target.value)}
          placeholder="Expected answer (optional)"
          className="mb-2"
        />
        <div className="flex gap-3">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message here"
            disabled={isLoading}
          />
          <Button 
            onClick={handleSendChatMessage} 
            disabled={!message.trim() || isLoading} 
            className='bg-blue-900 hover:bg-blue-600 text-white cursor-pointer'
          >
            {isLoading ? 'Sending...' : 'Send'}
          </Button>
        </div>
        {error && <div className="text-red-500 text-sm">{error}</div>}
      </div>
    </div>
  );
};
export default Chat;