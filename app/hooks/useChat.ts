'use client';

import { useState, useCallback, useEffect } from 'react';
import { fetchConversations, fetchMessages, sendMessage, deleteConversation as deleteConversationAPI } from '../lib/api';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface Conversation {
  id: string; // session_id
  title: string;
  messages: Message[];
  createdAt: Date;
}

export function useChat() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, []);

  // Load messages when a conversation is selected
  // Only load if conversation has no messages (to avoid overwriting optimistic updates)
  useEffect(() => {
    if (activeConversationId) {
      const conversation = conversations.find((c) => c.id === activeConversationId);
      // Only load if conversation exists but has no messages
      // This prevents overwriting optimistic messages
      if (conversation && conversation.messages.length === 0) {
        loadMessages(activeConversationId);
      }
    }
  }, [activeConversationId]);

  const loadConversations = async () => {
    try {
      setIsLoadingConversations(true);
      const convs = await fetchConversations();
      setConversations(
        convs.map((conv) => ({
          ...conv,
          messages: [], // Messages will be loaded separately
        }))
      );
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setIsLoadingConversations(false);
    }
  };

  const loadMessages = async (sessionId: string, mergeWithExisting = false) => {
    try {
      setIsLoadingMessages(true);
      const messages = await fetchMessages(sessionId);
      
      setConversations((prev) =>
        prev.map((conv) => {
          if (conv.id === sessionId) {
            // Always merge if there are existing messages (to preserve optimistic updates)
            // Only replace if conversation has no messages yet
            if (conv.messages.length > 0 || mergeWithExisting) {
              // Merge Supabase messages with existing optimistic messages
              // Keep optimistic messages that aren't in Supabase yet
              const supabaseMessageContents = new Set(
                messages.map((m) => `${m.role}:${m.content}`)
              );
              
              // Start with Supabase messages
              const merged = [...messages];
              
              // Add optimistic messages that aren't in Supabase yet
              conv.messages.forEach((msg) => {
                const key = `${msg.role}:${msg.content}`;
                if (!supabaseMessageContents.has(key)) {
                  merged.push(msg);
                }
              });
              
              // Sort by timestamp
              merged.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
              
              return {
                ...conv,
                messages: merged,
              };
            } else {
              // Replace with Supabase messages (only when conversation is empty)
              return {
                ...conv,
                messages,
              };
            }
          }
          return conv;
        })
      );
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const getActiveConversation = () => {
    return conversations.find((c) => c.id === activeConversationId);
  };

  const createNewConversation = useCallback(() => {
    // Generate session_id in format: chat_{{timestamp}}
    const timestamp = Date.now();
    const sessionId = `chat_${timestamp}`;
    
    const newConversation: Conversation = {
      id: sessionId,
      title: 'New Conversation',
      messages: [],
      createdAt: new Date(),
    };
    
    setConversations((prev) => [newConversation, ...prev]);
    setActiveConversationId(sessionId);
    return sessionId;
  }, []);

  const selectConversation = useCallback((id: string) => {
    setActiveConversationId(id);
  }, []);

  const deleteConversation = useCallback(async (id: string) => {
    try {
      // Delete from backend
      await deleteConversationAPI(id);
      
      // Remove from local state
      setConversations((prev) => prev.filter((conv) => conv.id !== id));
      if (activeConversationId === id) {
        const remaining = conversations.filter((conv) => conv.id !== id);
        setActiveConversationId(remaining.length > 0 ? remaining[0].id : null);
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
      // Still remove from UI even if backend deletion fails
      setConversations((prev) => prev.filter((conv) => conv.id !== id));
      if (activeConversationId === id) {
        const remaining = conversations.filter((conv) => conv.id !== id);
        setActiveConversationId(remaining.length > 0 ? remaining[0].id : null);
      }
    }
  }, [activeConversationId, conversations]);

  const addMessage = useCallback(
    async (content: string) => {
      setIsLoading(true);

      // Determine current conversation ID (session_id)
      let currentSessionId = activeConversationId;
      let isNewConversation = false;

      // Create new conversation if none exists
      if (!currentSessionId) {
        const timestamp = Date.now();
        currentSessionId = `chat_${timestamp}`;
        isNewConversation = true;
        setActiveConversationId(currentSessionId);
      }

      // Get current conversation
      const currentConversation = conversations.find((c) => c.id === currentSessionId);
      const isFirstMessage = !currentConversation || currentConversation.messages.length === 0;

      // Add user message optimistically
      const userMessage: Message = {
        id: `temp-${Date.now()}-user`,
        role: 'user',
        content,
        timestamp: new Date(),
      };

      // Update local state optimistically
      if (isNewConversation) {
        setConversations((prev) => [
          {
            id: currentSessionId,
            title: content.substring(0, 50),
            messages: [userMessage],
            createdAt: new Date(),
          },
          ...prev,
        ]);
      } else {
        setConversations((prev) =>
          prev.map((conv) =>
            conv.id === currentSessionId
              ? {
                  ...conv,
                  messages: [...conv.messages, userMessage],
                  title: isFirstMessage ? content.substring(0, 50) : conv.title,
                }
              : conv
          )
        );
      }

      try {
        // Send to backend (n8n)
        const response = await sendMessage(content, currentSessionId);

        console.log('Response from sendMessage:', response);

        if (response.status === 'success' && response.message) {
          // Add assistant message - use functional update to ensure we have latest state
          const assistantMessage: Message = {
            id: `temp-${Date.now()}-assistant`,
            role: 'assistant',
            content: response.message,
            timestamp: new Date(),
          };

          // Update state with functional update to avoid stale closures
          setConversations((prev) => {
            const updated = prev.map((conv) => {
              if (conv.id === currentSessionId) {
                // Check if message already exists to avoid duplicates
                const messageExists = conv.messages.some(
                  (msg) => msg.role === 'assistant' && msg.content === response.message
                );
                
                if (!messageExists) {
                  return {
                    ...conv,
                    messages: [...conv.messages, assistantMessage],
                  };
                }
                return conv;
              }
              return conv;
            });
            
            // If conversation doesn't exist, add it
            if (!updated.find((c) => c.id === currentSessionId)) {
              return [
                {
                  id: currentSessionId,
                  title: content.substring(0, 50),
                  messages: [userMessage, assistantMessage],
                  createdAt: new Date(),
                },
                ...updated,
              ];
            }
            
            return updated;
          });

          // Wait a bit before reloading from Supabase to give n8n time to insert
          // Use a timeout to ensure message appears even if Supabase is slow
          // Pass mergeWithExisting=true to preserve optimistic messages
          setTimeout(async () => {
            try {
              await loadMessages(currentSessionId, true);
            } catch (error) {
              console.error('Error reloading messages from Supabase:', error);
              // Don't fail - we already have the message in state
            }
          }, 2000); // Wait 2 seconds before reloading
        } else if (response.status === 'error') {
          // Add error message
          const errorMessage: Message = {
            id: `temp-${Date.now()}-error`,
            role: 'assistant',
            content: response.error?.message || 'Sorry, I encountered an error. Please try again.',
            timestamp: new Date(),
          };

          setConversations((prev) =>
            prev.map((conv) =>
              conv.id === currentSessionId
                ? {
                    ...conv,
                    messages: [...conv.messages, errorMessage],
                  }
                : conv
            )
          );
        } else {
          // Unknown response format - log it and show error
          console.warn('Unexpected response format:', response);
          const errorMessage: Message = {
            id: `temp-${Date.now()}-error`,
            role: 'assistant',
            content: 'Received an unexpected response format. Please try again.',
            timestamp: new Date(),
          };

          setConversations((prev) =>
            prev.map((conv) =>
              conv.id === currentSessionId
                ? {
                    ...conv,
                    messages: [...conv.messages, errorMessage],
                  }
                : conv
            )
          );
        }
      } catch (error) {
        console.error('Error sending message:', error);
        // Add error message
        const errorMessage: Message = {
          id: `temp-${Date.now()}-error`,
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.',
          timestamp: new Date(),
        };

        setConversations((prev) =>
          prev.map((conv) =>
            conv.id === currentSessionId
              ? {
                  ...conv,
                  messages: [...conv.messages, errorMessage],
                }
              : conv
          )
        );
      } finally {
        setIsLoading(false);
      }
    },
    [activeConversationId, conversations]
  );

  return {
    conversations,
    activeConversationId,
    activeConversation: getActiveConversation(),
    isLoading,
    isLoadingConversations,
    isLoadingMessages,
    createNewConversation,
    selectConversation,
    deleteConversation,
    addMessage,
    refreshConversations: loadConversations,
  };
}
