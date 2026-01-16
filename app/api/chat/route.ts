import { NextResponse } from 'next/server';

const N8N_WEBHOOK_URL = process.env.N8N_BASE_URL 
  ? `${process.env.N8N_BASE_URL}/webhook/nlq-chat-v2`
  : 'https://n8n-test.iohealth.com/webhook/nlq-chat-v2';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { message, sessionId } = body;

    if (!message || !sessionId) {
      return NextResponse.json(
        { error: 'Missing message or sessionId' },
        { status: 400 }
      );
    }

    // Call n8n webhook
    const response = await fetch(N8N_WEBHOOK_URL, {
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

    console.log('n8n response:', {
      status: response.status,
      ok: response.ok,
      data,
    });

    if (!response.ok) {
      console.error('n8n request failed:', {
        status: response.status,
        data,
      });
      return NextResponse.json(
        { 
          status: 'error',
          error: {
            type: 'HTTP_ERROR',
            message: data.error || `Request failed with status ${response.status}`,
          },
        },
        { status: response.status }
      );
    }

    // Handle n8n response - be more flexible with response format
    if (data.status === 'success') {
      const answer = data.answer || data.message || data.response;
      if (answer) {
        return NextResponse.json({
          status: 'success',
          message: answer,
        });
      } else {
        console.warn('Success status but no answer field:', data);
        return NextResponse.json({
          status: 'error',
          error: {
            type: 'MISSING_ANSWER',
            message: 'Response missing answer field',
          },
        }, { status: 400 });
      }
    } else if (data.status === 'error') {
      return NextResponse.json(
        {
          status: 'error',
          error: data.error || {
            type: 'UNKNOWN_ERROR',
            message: 'An error occurred',
          },
        },
        { status: 400 }
      );
    }

    // If response doesn't have status field, try to extract answer anyway
    const answer = data.answer || data.message || data.response;
    if (answer) {
      console.warn('Response missing status field, but has answer:', data);
      return NextResponse.json({
        status: 'success',
        message: answer,
      });
    }

    // Last resort - return error
    console.error('Unexpected response format:', data);
    return NextResponse.json({
      status: 'error',
      error: {
        type: 'UNEXPECTED_FORMAT',
        message: 'Unexpected response format from server',
      },
    }, { status: 400 });
  } catch (error) {
    console.error('Error sending message to n8n:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
