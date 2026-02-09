'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { v4 as uuidv4 } from 'uuid'
import Logo from './Logo'
import ChatMessage from './ChatMessage'
import TypingIndicator from './TypingIndicator'
import SessionsSidebar from './SessionsSidebar'
import {
  Message,
  ApiResponse,
  TextResponse,
  ChartResponse,
  RawMessage,
  SessionMessagesResponse,
} from '@/types/chat'

function generateSessionId(): string {
  return `session_${uuidv4().replace(/-/g, '').substring(0, 9)}`
}

function parseAIContent(content: string): {
  type: 'text' | 'chart'
  text?: string
  chartData?: ChartResponse['chart']
} {
  try {
    const parsed = JSON.parse(content)
    // Check if it looks like chart data (has type and data properties)
    if (parsed.type && parsed.data) {
      return {
        type: 'chart',
        chartData: {
          type: parsed.type,
          data: parsed.data,
        },
      }
    }
    // Not chart data, treat as text
    return { type: 'text', text: content }
  } catch {
    // Not JSON, treat as plain text
    return { type: 'text', text: content }
  }
}

function convertRawMessageToMessage(rawMessage: RawMessage): Message {
  const isUser = rawMessage.author === 'USER'

  if (isUser) {
    return {
      id: rawMessage.id,
      role: 'user',
      content: rawMessage.content,
      timestamp: new Date(rawMessage.created_at),
    }
  }

  // AI message - determine if it's text or chart
  const parsed = parseAIContent(rawMessage.content)

  if (parsed.type === 'chart' && parsed.chartData) {
    return {
      id: rawMessage.id,
      role: 'assistant',
      content: '',
      responseType: 'chart',
      chartData: parsed.chartData,
      timestamp: new Date(rawMessage.created_at),
    }
  }

  return {
    id: rawMessage.id,
    role: 'assistant',
    content: parsed.text || rawMessage.content,
    responseType: 'text',
    timestamp: new Date(rawMessage.created_at),
  }
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, isLoading, scrollToBottom])

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`
    }
  }, [input])

  const loadSessionMessages = async (selectedSessionId: string) => {
    setIsLoadingHistory(true)
    setMessages([])
    setSessionId(selectedSessionId)

    try {
      const response = await fetch(`/api/sessions?id=${selectedSessionId}`)
      const data: SessionMessagesResponse = await response.json()

      if (data.status === 'success' && data.data?.sessions?.messages) {
        // Messages come in reverse order (newest first), so we reverse them
        const rawMessages = [...data.data.sessions.messages].reverse()
        const convertedMessages = rawMessages.map(convertRawMessageToMessage)
        setMessages(convertedMessages)
      }
    } catch (error) {
      console.error('Error loading session messages:', error)
    } finally {
      setIsLoadingHistory(false)
    }
  }

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return

    const currentSessionId = sessionId || generateSessionId()
    if (!sessionId) {
      setSessionId(currentSessionId)
    }

    const userMessage: Message = {
      id: uuidv4(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: currentSessionId,
          message: userMessage.content,
        }),
      })

      const data: ApiResponse = await response.json()

      if (data.status === 'success' && data.data) {
        const assistantMessage: Message = {
          id: uuidv4(),
          role: 'assistant',
          content: '',
          timestamp: new Date(),
        }

        if (data.data.type === 'text') {
          const textData = data.data as TextResponse
          assistantMessage.content = textData.text.value
          assistantMessage.responseType = 'text'
        } else if (data.data.type === 'chart') {
          const chartData = data.data as ChartResponse
          assistantMessage.responseType = 'chart'
          assistantMessage.chartData = chartData.chart
          assistantMessage.analysis = chartData.analysis?.value
          assistantMessage.content = chartData.analysis?.value || ''
        }

        setMessages((prev) => [...prev, assistantMessage])
      } else {
        const errorMessage: Message = {
          id: uuidv4(),
          role: 'assistant',
          content: data.message || 'Sorry, I encountered an error processing your request. Please try again.',
          responseType: 'text',
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, errorMessage])
      }
    } catch (error) {
      console.error('Error sending message:', error)
      const errorMessage: Message = {
        id: uuidv4(),
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your request. Please try again.',
        responseType: 'text',
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const handleNewChat = () => {
    setMessages([])
    setSessionId(null)
    setInput('')
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Sessions Sidebar */}
      <SessionsSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onSelectSession={loadSessionMessages}
        onDeleteSession={handleNewChat}
        currentSessionId={sessionId}
      />

      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          {/* Menu Button */}
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 text-gray-600 hover:text-primary hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Open chat history"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
          <Logo width={100} height={38} />
          <div className="hidden sm:block h-6 w-px bg-gray-300" />
          <h1 className="hidden sm:block text-lg font-semibold text-primary">AI Assistant</h1>
        </div>
        <button
          onClick={handleNewChat}
          className="px-4 py-2 text-sm font-medium text-primary border border-primary rounded-lg hover:bg-primary hover:text-white transition-colors"
        >
          New Chat
        </button>
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          {isLoadingHistory ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[60vh]">
              <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-gray-500">Loading chat history...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[60vh] text-center">
              <Logo width={150} height={58} className="mb-6 opacity-80" />
              <h2 className="text-2xl font-semibold text-primary mb-2">Welcome to IOHealth AI</h2>
              <p className="text-gray-500 max-w-md">
                Ask me anything about your healthcare data. I can help you analyze patient information,
                generate reports, and visualize trends.
              </p>
              <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
                {[
                  'Show me the patient gender distribution',
                  'What are the top diagnoses this month?',
                  'How many patients visited last week?',
                  'Display age distribution of patients',
                ].map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => setInput(suggestion)}
                    className="p-3 text-sm text-left text-gray-600 bg-white border border-gray-200 rounded-lg hover:border-primary hover:text-primary transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))}
              {isLoading && (
                <div className="flex justify-start mb-4">
                  <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-md shadow-sm">
                    <TypingIndicator />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-gray-200 px-4 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-end gap-3">
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask a question about your healthcare data..."
                className="w-full px-4 py-3 pr-12 text-sm md:text-base border border-gray-300 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                rows={1}
                disabled={isLoading || isLoadingHistory}
              />
            </div>
            <button
              onClick={sendMessage}
              disabled={!input.trim() || isLoading || isLoadingHistory}
              className="px-5 py-3 bg-primary text-white rounded-xl hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
            </button>
          </div>
          <p className="mt-2 text-xs text-gray-400 text-center">
            Press Enter to send, Shift + Enter for new line
          </p>
        </div>
      </div>
    </div>
  )
}
