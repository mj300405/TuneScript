import React, { useState, useRef, useEffect, useContext } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';
import AuthContext from '../context/AuthContext';

interface Message {
  role: 'user' | 'assistant' | 'error';
  content: string;
}

const ThinkingDots = () => (
  <div className="flex space-x-1">
    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
  </div>
);

const ChatbotWidget: React.FC = () => {
  const { isAuthenticated, user } = useContext(AuthContext);
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const pollStatus = async (taskId: string) => {
    const maxAttempts = 60; // 5 minutes (5 * 60 seconds)
    let attempts = 0;

    const poll = async () => {
      if (attempts >= maxAttempts) {
        setIsLoading(false);
        setMessages(prev => [...prev, { role: 'error', content: 'Request timed out. Please try again.' }]);
        return;
      }

      try {
        const response = await fetch(`/api/rag-status/${taskId}`);
        const data = await response.json();

        if (data.status === 'completed') {
          setIsLoading(false);
          setMessages(prev => [...prev, { role: 'assistant', content: data.answer }]);
        } else if (data.status === 'error') {
          setIsLoading(false);
          setMessages(prev => [...prev, { role: 'error', content: 'An error occurred. Please try again.' }]);
        } else {
          attempts++;
          setTimeout(poll, 5000); // Poll every 5 seconds
        }
      } catch (error) {
        console.error('Error polling status:', error);
        setIsLoading(false);
        setMessages(prev => [...prev, { role: 'error', content: 'An error occurred. Please try again.' }]);
      }
    };

    poll();
  };

  const handleSend = async () => {
    if (input.trim() === '') return;

    const newMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, newMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/rag-query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: input,
          user_id: isAuthenticated && user ? user.id : 'anonymous',
        }),
      });

      const data = await response.json();

      if (data.task_id) {
        pollStatus(data.task_id);
      } else {
        throw new Error('No task ID received');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setIsLoading(false);
      setMessages(prev => [...prev, { role: 'error', content: 'An error occurred. Please try again.' }]);
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {isOpen ? (
        <div className="bg-white rounded-lg shadow-xl w-80 h-96 flex flex-col">
          <div className="bg-blue-500 text-white p-4 rounded-t-lg flex justify-between items-center">
            <h3 className="font-bold">TuneScript Assistant</h3>
            <button onClick={() => setIsOpen(false)} className="text-white">
              <X size={20} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {messages.map((message, index) => (
              <div key={index} className={`mb-2 ${message.role === 'user' ? 'text-right' : 'text-left'}`}>
                <span className={`inline-block p-2 rounded-lg ${
                  message.role === 'user' 
                    ? 'bg-blue-100' 
                    : message.role === 'assistant'
                    ? 'bg-gray-100'
                    : 'bg-red-100'
                }`}>
                  {message.content}
                </span>
              </div>
            ))}
            {isLoading && (
              <div className="mb-2 text-left">
                <div className="inline-block p-2 rounded-lg bg-gray-100">
                  <ThinkingDots />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          <div className="p-4 border-t">
            <div className="flex items-center">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Type your message..."
                className="flex-1 border rounded-l-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
              />
              <button
                onClick={handleSend}
                className="bg-blue-500 text-white p-2 rounded-r-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
              >
                <Send size={20} />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-blue-500 text-white rounded-full p-3 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <MessageCircle size={24} />
        </button>
      )}
    </div>
  );
};

export default ChatbotWidget;