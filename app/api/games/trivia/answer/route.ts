import { NextRequest, NextResponse } from 'next/server';
import { Transaction } from '@mysten/sui/transactions';
import { getSuiClient } from '@/lib/sui-client';
import { getKeypairFromPrivateKey } from '@/lib/sui-utils';

export async function POST(request: NextRequest) {
  try {
    const { answer, senderPrivateKey } = await request.json();

    if (answer === undefined || !senderPrivateKey) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const client = getSuiClient();
    const keypair = getKeypairFromPrivateKey(senderPrivateKey);
    const sender = keypair.toSuiAddress();

    const tx = new Transaction();
    
    // Get entry fee payment
    const entryFee = 50_000_000; // 0.05 SUI
    const [paymentCoin] = tx.splitCoins(tx.gas, [entryFee]);
    
    // Call answer_question function
    tx.moveCall({
      target: `${process.env.NEXT_PUBLIC_GAMES_PACKAGE_ID}::trivia_game::answer_question`,
      arguments: [
        tx.object(process.env.NEXT_PUBLIC_TRIVIA_HUB_ID!),
        tx.pure.u8(answer),
        paymentCoin,
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

    // Parse events to get answer result
    const events = result.events || [];
    const answerEvent = events.find((e) => 
      e.type.includes('::trivia_game::QuestionAnswered')
    );

    if (!answerEvent) {
      return NextResponse.json({
        success: false,
        error: 'Failed to get answer result',
      });
    }

    const parsedEvent = answerEvent.parsedJson as any;

    return NextResponse.json({
      success: true,
      transaction: result.digest,
      result: {
        questionId: parsedEvent.question_id,
        answer: parsedEvent.answer,
        correct: parsedEvent.correct,
        reward: parsedEvent.reward,
      },
    });
  } catch (error: any) {
    console.error('Error answering trivia question:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to answer question' },
      { status: 500 }
    );
  }
}