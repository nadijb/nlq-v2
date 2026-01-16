// Client-side API functions that call our Next.js API routes

export interface Conversation {
  id: string;
  title: string;
  createdAt: Date;
  messageCount: number;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface ChatResponse {
  status: 'success' | 'error';
  message?: string;
  error?: {
    type: string;
    message: string;
  };
}

// Fetch all conversations
export async function fetchConversations(): Promise<Conversation[]> {
  try {
    const response = await fetch('/api/conversations');
    if (!response.ok) {
      throw new Error('Failed to fetch conversations');
    }
    const data = await response.json();
    return data.conversations.map((conv: any) => ({
      ...conv,
      createdAt: new Date(conv.createdAt),
    }));
  } catch (error) {
    console.error('Error fetching conversations:', error);
    throw error;
  }
}

// Fetch messages for a specific session
export async function fetchMessages(sessionId: string): Promise<Message[]> {
  try {
    const response = await fetch(`/api/messages/${encodeURIComponent(sessionId)}`);
    if (!response.ok) {
      throw new Error('Failed to fetch messages');
    }
    const data = await response.json();
    return data.messages.map((msg: any) => ({
      ...msg,
      timestamp: new Date(msg.timestamp),
    }));
  } catch (error) {
    console.error('Error fetching messages:', error);
    throw error;
  }
}

// Delete a conversation
export async function deleteConversation(sessionId: string): Promise<void> {
  try {
    const response = await fetch(`/api/conversations/${encodeURIComponent(sessionId)}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to delete conversation');
    }
  } catch (error) {
    console.error('Error deleting conversation:', error);
    throw error;
  }
}

// Send message to n8n backend
export async function sendMessage(
  message: string,
  sessionId: string
): Promise<ChatResponse> {
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        sessionId,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        status: 'error',
        error: data.error || {
          type: 'UNKNOWN_ERROR',
          message: 'Failed to send message',
        },
      };
    }

    return data;
  } catch (error) {
    console.error('Error sending message:', error);
    return {
      status: 'error',
      error: {
        type: 'NETWORK_ERROR',
        message: 'Network error occurred',
      },
    };
  }
}
