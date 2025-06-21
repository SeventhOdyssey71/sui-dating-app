import { NextRequest, NextResponse } from 'next/server';
import { sendMessage } from '@/lib/sui-client';
import { getKeypairFromPrivateKey } from '@/lib/sui-utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { recipient, content, senderPrivateKey } = body;

    if (!recipient || !content || !senderPrivateKey) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create keypair from private key
    const keypair = getKeypairFromPrivateKey(senderPrivateKey);

    // Send message
    const result = await sendMessage({
      senderKeypair: keypair,
      recipient,
      content,
    });

    // Extract message ID from events
    let messageId = null;
    if (result.events) {
      for (const event of result.events) {
        if (event.type.includes('MessageSent')) {
          messageId = (event.parsedJson as any)?.message_id;
          break;
        }
      }
    }

    return NextResponse.json({
      success: true,
      transactionDigest: result.digest,
      messageId,
    });
  } catch (error: any) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send message' },
      { status: 500 }
    );
  }
}