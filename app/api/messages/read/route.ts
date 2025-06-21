import { NextRequest, NextResponse } from 'next/server';
import { markMessageAsRead } from '@/lib/sui-client';
import { getKeypairFromPrivateKey } from '@/lib/sui-utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messageId, readerPrivateKey } = body;

    if (!messageId || !readerPrivateKey) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create keypair from private key
    const keypair = getKeypairFromPrivateKey(readerPrivateKey);

    // Mark message as read
    const result = await markMessageAsRead(messageId, keypair);

    return NextResponse.json({
      success: true,
      transactionDigest: result.digest,
    });
  } catch (error: any) {
    console.error('Error marking message as read:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to mark message as read' },
      { status: 500 }
    );
  }
}