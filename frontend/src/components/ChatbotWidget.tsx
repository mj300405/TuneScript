// frontend/components/ChatbotWidget.tsx

import React, { useState, useRef, useEffect, useContext } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';
import AuthContext from '../context/AuthContext';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const ChatbotWidget: React.FC = () => {
  const { isAuthenticated, user } = useContext(AuthContext);
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  useEffect(() => {
    const loadChatHistory = async () => {
      if (isAuthenticated && user) {
        try {
          const response = await fetch(`http://localhost:8000/api/chatbot/history/?user_id=${user.id}`);
          if (response.ok) {
            const data = await response.json();
            setMessages(data.history);
          }
        } catch (error) {
          console.error('Error loading chat history:', error);
        }
      }
    };

    loadChatHistory();
  }, [isAuthenticated, user]);

  const handleSend = async () => {
    if (input.trim() === '') return;

    const newMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, newMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:8000/api/chatbot/query/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: isAuthenticated && user ? user.id : 'anonymous',
          question: input,
        }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      const botMessage: Message = { role: 'assistant', content: data.answer };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error:', error);
      const errorMessage: Message = { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
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
                <span className={`inline-block p-2 rounded-lg ${message.role === 'user' ? 'bg-blue-100' : 'bg-gray-100'}`}>
                  {message.content}
                </span>
              </div>
            ))}
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