import { useState, useEffect } from 'react';
import { useChat } from 'ai/react';
import { VehicleMessage } from '@/lib/ai/vehicle-handler';

interface VehicleChatProps {
  initialMessages?: VehicleMessage[];
}

export function VehicleChat({ initialMessages = [] }: VehicleChatProps) {
  const [messages, setMessages] = useState<VehicleMessage[]>(initialMessages);
  
  const { messages: chatMessages, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/chat/vehicle',
    initialMessages: messages.map(msg => ({
      id: msg.id,
      role: msg.role,
      content: msg.content,
      createdAt: msg.createdAt,
    })),
    onResponse: (response) => {
      // Handle vehicle-specific responses
      console.log('Vehicle chat response:', response);
    }
  });

  useEffect(() => {
    setMessages(chatMessages.map(msg => ({
      id: msg.id,
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
      createdAt: new Date(msg.createdAt || Date.now()),
    })));
  }, [chatMessages]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
              message.role === 'user' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-200 text-gray-800'
            }`}>
              {message.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg">
              正在处理您的车辆请求...
            </div>
          </div>
        )}
      </div>
      
      <form onSubmit={handleSubmit} className="p-4 border-t">
        <div className="flex space-x-2">
          <input
            type="text"
            placeholder="例如：预订明天上午的商务车去机场"
            className="flex-1 border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            onChange={handleInputChange}
          />
          <button
            type="submit"
            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
            disabled={isLoading}
          >
            发送
          </button>
        </div>
      </form>
    </div>
  );
}