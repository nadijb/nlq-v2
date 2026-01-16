import { NextResponse } from 'next/server';
import { createClient } from '../../../lib/supabase-server';

export async function DELETE(
  request: Request,
  context: { params: Promise<{ sessionId: string }> }
) {
  try {
    const params = await context.params;
    const { sessionId } = params;
    const supabase = await createClient();

    // Delete all messages with this session_id
    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('session_id', sessionId);

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to delete conversation', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting conversation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
