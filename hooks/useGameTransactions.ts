import { useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { GAS_BUDGET } from '@/lib/sui-config';

export function useGameTransactions() {
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();

  const playDice = async (
    guess: number,
    betAmount: number,
    onSuccess?: (result: any) => void,
    onError?: (error: any) => void
  ) => {
    const tx = new Transaction();
    
    // Set gas budget
    tx.setGasBudget(GAS_BUDGET.GAME_PLAY);
    
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

    signAndExecute(
      {
        transaction: tx,
        options: {
          showEffects: true,
          showEvents: true,
          showObjectChanges: true,
        },
      },
      {
        onSuccess: (result) => {
          // Parse events to get game result
          const events = result.events || [];
          const diceRolledEvent = events.find((e: any) => 
            e.type.includes('::dice_game::DiceRolled')
          );

          if (diceRolledEvent) {
            const parsedEvent = diceRolledEvent.parsedJson as any;
            const gameResult = {
              guess: parsedEvent.guess,
              result: parsedEvent.result,
              won: parsedEvent.won,
              payout: parsedEvent.payout,
              betAmount: parsedEvent.bet_amount,
            };
            onSuccess?.({ ...result, gameResult });
          } else {
            onSuccess?.(result);
          }
        },
        onError: (error) => {
          console.error('Failed to play dice:', error);
          if (error.message?.toLowerCase().includes('gas') || error.message?.toLowerCase().includes('budget')) {
            onError?.(new Error('Transaction failed due to insufficient gas budget. Please try again.'));
          } else {
            onError?.(error);
          }
        },
      }
    );
  };

  const answerTrivia = async (
    answer: number,
    onSuccess?: (result: any) => void,
    onError?: (error: any) => void
  ) => {
    const tx = new Transaction();
    
    // Set gas budget
    tx.setGasBudget(GAS_BUDGET.GAME_PLAY);
    
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

    signAndExecute(
      {
        transaction: tx,
        options: {
          showEffects: true,
          showEvents: true,
          showObjectChanges: true,
        },
      },
      {
        onSuccess: (result) => {
          // Parse events to get answer result
          const events = result.events || [];
          const answerEvent = events.find((e: any) => 
            e.type.includes('::trivia_game::QuestionAnswered')
          );

          if (answerEvent) {
            const parsedEvent = answerEvent.parsedJson as any;
            const answerResult = {
              questionId: parsedEvent.question_id,
              answer: parsedEvent.answer,
              correct: parsedEvent.correct,
              reward: parsedEvent.reward,
            };
            onSuccess?.({ ...result, answerResult });
          } else {
            onSuccess?.(result);
          }
        },
        onError: (error) => {
          console.error('Failed to answer trivia:', error);
          if (error.message?.toLowerCase().includes('gas') || error.message?.toLowerCase().includes('budget')) {
            onError?.(new Error('Transaction failed due to insufficient gas budget. Please try again.'));
          } else {
            onError?.(error);
          }
        },
      }
    );
  };

  const createGroup = async (
    name: string,
    description: string,
    isPublic: boolean,
    maxMembers: number,
    onSuccess?: (result: any) => void,
    onError?: (error: any) => void
  ) => {
    const tx = new Transaction();
    
    // Set gas budget
    tx.setGasBudget(GAS_BUDGET.GROUP_CREATE);
    
    // Call create_group function
    tx.moveCall({
      target: `${process.env.NEXT_PUBLIC_GAMES_PACKAGE_ID}::group_chat::create_group`,
      arguments: [
        tx.object(process.env.NEXT_PUBLIC_GROUP_REGISTRY_ID!),
        tx.pure.string(name),
        tx.pure.string(description),
        tx.pure.bool(isPublic),
        tx.pure.u64(maxMembers),
        tx.object('0x6'), // Clock object
      ],
    });

    signAndExecute(
      {
        transaction: tx,
        options: {
          showEffects: true,
          showEvents: true,
          showObjectChanges: true,
        },
      },
      {
        onSuccess: (result) => {
          // Parse events to get group ID
          const events = result.events || [];
          const groupCreatedEvent = events.find((e: any) => 
            e.type.includes('::group_chat::GroupCreated')
          );

          if (groupCreatedEvent) {
            const parsedEvent = groupCreatedEvent.parsedJson as any;
            onSuccess?.({ 
              ...result, 
              groupId: parsedEvent.group_id,
              name: parsedEvent.name,
            });
          } else {
            onSuccess?.(result);
          }
        },
        onError: (error) => {
          console.error('Failed to create group:', error);
          if (error.message?.toLowerCase().includes('gas') || error.message?.toLowerCase().includes('budget')) {
            onError?.(new Error('Transaction failed due to insufficient gas budget. Please try again.'));
          } else {
            onError?.(error);
          }
        },
      }
    );
  };

  return {
    playDice,
    answerTrivia,
    createGroup,
  };
}