'use client';

import { useState } from 'react';

interface MessageBubbleProps {
  message: {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
  };
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div
      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} group`}
    >
      <div
        className={`relative max-w-[80%] rounded-xl px-4 py-3 shadow-sm ${
          message.role === 'user'
            ? 'bg-sky-600 text-white'
            : 'bg-white text-gray-800 border border-gray-200'
        }`}
      >
        <div className="whitespace-pre-wrap break-words pr-8">{message.content}</div>
        
        {/* Copy button */}
        <button
          onClick={handleCopy}
          className={`absolute top-2 right-2 p-1.5 rounded-md transition-all duration-200 ${
            message.role === 'user'
              ? 'text-sky-100 hover:bg-sky-700 hover:text-white'
              : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'
          } opacity-0 group-hover:opacity-100`}
          title="Copy message"
        >
          {copied ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          )}
        </button>

        <div
          className={`text-xs mt-2 ${
            message.role === 'user' ? 'text-sky-100' : 'text-gray-500'
          }`}
        >
          {message.timestamp.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>
      </div>
    </div>
  );
}
