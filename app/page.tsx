'use client';

import { useChat } from './hooks/useChat';
import ChatSidebar from './components/ChatSidebar';
import ChatArea from './components/ChatArea';
import ChatInput from './components/ChatInput';

export default function Home() {
  const {
    conversations,
    activeConversationId,
    activeConversation,
    isLoading,
    createNewConversation,
    selectConversation,
    deleteConversation,
    addMessage,
  } = useChat();

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <ChatSidebar
        conversations={conversations.map((conv) => ({
          id: conv.id,
          title: conv.title,
          createdAt: conv.createdAt,
        }))}
        activeConversationId={activeConversationId}
        onSelectConversation={selectConversation}
        onNewConversation={createNewConversation}
        onDeleteConversation={deleteConversation}
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-sky-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-800">Healthcare Assistant</h1>
              <p className="text-sm text-gray-600">Ask questions about your healthcare data</p>
            </div>
          </div>
        </header>

        {/* Chat Messages */}
        <ChatArea
          messages={activeConversation?.messages || []}
          isLoading={isLoading}
        />

        {/* Input Area */}
        <ChatInput
          onSendMessage={addMessage}
          disabled={isLoading}
        />
      </div>
    </div>
  );
}
