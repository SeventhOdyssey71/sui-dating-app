import { NextRequest, NextResponse } from 'next/server';
import { Transaction } from '@mysten/sui/transactions';
import { suiClient } from '@/lib/sui-client';
import { getKeypairFromPrivateKey } from '@/lib/sui-utils';

export async function POST(request: NextRequest) {
  try {
    const { guess, betAmount, senderPrivateKey } = await request.json();

    if (!guess || !betAmount || !senderPrivateKey) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (guess < 1 || guess > 6) {
      return NextResponse.json(
        { success: false, error: 'Invalid guess. Must be between 1 and 6' },
        { status: 400 }
      );
    }

    const client = suiClient;
    const keypair = getKeypairFromPrivateKey(senderPrivateKey);
    const sender = keypair.toSuiAddress();

    const tx = new Transaction();
    
    // Get payment coin
    const [paymentCoin] = tx.splitCoins(tx.gas, [betAmount]);
    
    // Call play_dice function
    tx.moveCall({
      target: `${process.env.NEXT_PUBLIC_GAMES_PACKAGE_ID}::dice_game::play_dice`,
      arguments: [
        tx.object(process.env.NEXT_PUBLIC_GAME_HOUSE_ID!),
        tx.pure.u8(guess),
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

    // Parse events to get game result
    const events = result.events || [];
    const diceRolledEvent = events.find((e) => 
      e.type.includes('::dice_game::DiceRolled')
    );

    if (!diceRolledEvent) {
      return NextResponse.json({
        success: false,
        error: 'Failed to get game result',
      });
    }

    const parsedEvent = diceRolledEvent.parsedJson as any;

    return NextResponse.json({
      success: true,
      transaction: result.digest,
      gameResult: {
        guess: parsedEvent.guess,
        result: parsedEvent.result,
        won: parsedEvent.won,
        payout: parsedEvent.payout,
        betAmount: parsedEvent.bet_amount,
      },
    });
  } catch (error: any) {
    console.error('Error playing dice game:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to play dice game' },
      { status: 500 }
    );
  }
}