import { NextRequest, NextResponse } from 'next/server';
import { Transaction } from '@mysten/sui/transactions';
import { suiClient } from '@/lib/sui-client';
import { getKeypairFromPrivateKey } from '@/lib/sui-utils';

export async function POST(request: NextRequest) {
  try {
    const { 
      name, 
      description, 
      isPublic, 
      maxMembers, 
      senderPrivateKey 
    } = await request.json();

    if (!name || !description || isPublic === undefined || !senderPrivateKey) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const client = suiClient;
    const keypair = getKeypairFromPrivateKey(senderPrivateKey);

    const tx = new Transaction();
    
    // Call create_group function
    tx.moveCall({
      target: `${process.env.NEXT_PUBLIC_GAMES_PACKAGE_ID}::group_chat::create_group`,
      arguments: [
        tx.object(process.env.NEXT_PUBLIC_GROUP_REGISTRY_ID!),
        tx.pure.string(name),
        tx.pure.string(description),
        tx.pure.bool(isPublic),
        tx.pure.u64(maxMembers || 100),
        tx.object('0x6'), // Clock object
      ],
    });

    // Execute transaction
    const result = await client.signAndExecuteTransaction({
      transaction: tx,
      signer: keypair,
      options: {
        showEffects: true,
        showEvents: true,
        showObjectChanges: true,
      },
    });

    // Parse events to get group ID
    const events = result.events || [];
    const groupCreatedEvent = events.find((e) => 
      e.type.includes('::group_chat::GroupCreated')
    );

    if (!groupCreatedEvent) {
      return NextResponse.json({
        success: false,
        error: 'Failed to create group',
      });
    }

    const parsedEvent = groupCreatedEvent.parsedJson as any;

    return NextResponse.json({
      success: true,
      transaction: result.digest,
      groupId: parsedEvent.group_id,
      name: parsedEvent.name,
    });
  } catch (error: any) {
    console.error('Error creating group:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create group' },
      { status: 500 }
    );
  }
}