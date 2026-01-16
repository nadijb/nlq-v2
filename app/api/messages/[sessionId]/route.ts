import { NextResponse } from 'next/server';
import { createClient } from '../../../lib/supabase-server';

export async function GET(
  request: Request,
  context: { params: Promise<{ sessionId: string }> }
) {
  try {
    const params = await context.params;
    const { sessionId } = params;
    const supabase = await createClient();

    const { data: messages, error } = await supabase
      .from('messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
    }

    // Transform messages to match frontend format
    const transformedMessages = messages?.map((msg) => ({
      id: msg.id.toString(),
      role: msg.author === 'USER' ? 'user' : 'assistant',
      content: msg.content,
      timestamp: new Date(msg.created_at),
    })) || [];

    return NextResponse.json({ messages: transformedMessages });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
