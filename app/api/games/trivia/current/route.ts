import { NextRequest, NextResponse } from 'next/server';
import { getSuiClient } from '@/lib/sui-client';
import { blockchainCache, CACHE_KEYS } from '@/lib/cache/blockchain-cache';

export async function GET(request: NextRequest) {
  try {
    // Try to get from cache first
    const cacheKey = CACHE_KEYS.TRIVIA_QUESTION;
    const cachedQuestion = blockchainCache.get(cacheKey);
    if (cachedQuestion) {
      return NextResponse.json({ success: true, ...cachedQuestion });
    }

    const client = getSuiClient();

    // Get TriviaHub object
    const triviaHub = await client.getObject({
      id: process.env.NEXT_PUBLIC_TRIVIA_HUB_ID!,
      options: {
        showContent: true,
      },
    });

    if (!triviaHub.data?.content || triviaHub.data.content.dataType !== 'moveObject') {
      return NextResponse.json(
        { success: false, error: 'Failed to fetch trivia hub' },
        { status: 500 }
      );
    }

    const fields = triviaHub.data.content.fields as any;
    const currentQuestion = fields.current_question;

    if (!currentQuestion || currentQuestion.vec?.length === 0) {
      return NextResponse.json({
        success: true,
        hasActiveQuestion: false,
        stats: {
          balance: fields.balance,
          totalQuestionsAnswered: fields.total_questions_answered,
          paused: fields.paused,
        },
      });
    }

    const question = currentQuestion.vec[0];
    const now = Date.now();
    const isActive = parseInt(question.active_until) > now;

    const responseData = {
      hasActiveQuestion: isActive,
      question: isActive ? {
        id: question.id,
        question: question.question,
        options: question.options,
        rewardPool: question.reward_pool,
        activeUntil: question.active_until,
        totalAttempts: question.total_attempts,
        correctAttempts: question.correct_attempts,
        timeRemaining: parseInt(question.active_until) - now,
      } : null,
      stats: {
        balance: fields.balance,
        totalQuestionsAnswered: fields.total_questions_answered,
        paused: fields.paused,
      },
    };

    // Cache for 10 seconds
    blockchainCache.set(cacheKey, responseData, 10000);

    return NextResponse.json({
      success: true,
      ...responseData,
    });
  } catch (error: any) {
    console.error('Error fetching current question:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch question' },
      { status: 500 }
    );
  }
}