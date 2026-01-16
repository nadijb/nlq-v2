'use client';

import { useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatAreaProps {
  messages: Message[];
  isLoading: boolean;
}

export default function ChatArea({ messages, isLoading  }: ChatAreaProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);



  return (
    <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-3xl mx-auto space-y-5">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-16">
            <div className="w-20 h-20 bg-sky-100 rounded-full flex items-center justify-center mb-6 shadow-sm">
              <svg className="w-10 h-10 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <h3 className="text-2xl font-semibold text-gray-800 mb-3">
              Welcome to Healthcare Assistant
            </h3>
            <p className="text-gray-600 max-w-md leading-relaxed">
              Ask me anything about your healthcare data. I'm here to help you understand your medical information.
            </p>
          </div>
        ) : (
          messages.map((message) => {
            return (
              <MessageBubble key={message.id} message={message} />
            )
          })
        )}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 rounded-xl px-5 py-4 shadow-sm">
              <div className="flex items-center justify-center">
                <svg className="animate-spin h-5 w-5 text-sky-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>
    </div>
  );
  
}
