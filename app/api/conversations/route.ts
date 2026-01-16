import { NextResponse } from 'next/server';
import { createClient } from '../../lib/supabase-server';

export async function GET() {
  try {
    const supabase = await createClient();
    
    // Try querying with explicit schema
    const { data: messages, error, status, statusText } = await supabase
      .from('messages')
      .select('*')
      .order('created_at', { ascending: true });

    console.log('Supabase query result:', {
      dataLength: messages?.length || 0,
      error,
      status,
      statusText,
      hasData: !!messages,
      data: messages?.slice(0, 2), // Log first 2 items for debugging
    });

    // If no error but empty data, check RLS
    if (!error && (!messages || messages.length === 0)) {
      console.warn('Query succeeded but returned empty array. This might indicate RLS policies are blocking access.');
      
      // Try a count query to see if RLS is the issue
      const { count, error: countError } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true });
      
      console.log('Count query result:', { count, countError });
    }

    if (error) {
      console.error('Supabase error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });
      return NextResponse.json({ 
        error: 'Failed to fetch conversations',
        details: error.message,
        code: error.code,
      }, { status: 500 });
    }

    // Group messages by session_id and create conversation objects
    const conversationsMap = new Map<string, {
      id: string;
      title: string;
      createdAt: Date;
      messageCount: number;
    }>();

    messages?.forEach((message) => {
      const sessionId = message.session_id;
      
      if (!conversationsMap.has(sessionId)) {
        // Find the first USER message to use as title
        const firstUserMessage = messages.find(
          (m) => m.session_id === sessionId && m.author === 'USER'
        );
        
        conversationsMap.set(sessionId, {
          id: sessionId,
          title: firstUserMessage?.content?.substring(0, 50) || 'New Conversation',
          createdAt: new Date(message.created_at),
          messageCount: 0,
        });
      }
      
      const conv = conversationsMap.get(sessionId)!;
      conv.messageCount++;
      // Update createdAt to the earliest message
      const messageDate = new Date(message.created_at);
      if (messageDate < conv.createdAt) {
        conv.createdAt = messageDate;
      }
    });

    // Convert map to array and sort by createdAt (newest first)
    const conversations = Array.from(conversationsMap.values()).sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );

    return NextResponse.json({ conversations });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
