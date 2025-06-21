import { NextRequest, NextResponse } from 'next/server';
import { getSuiClient } from '@/lib/sui-client';
import { blockchainCache, CACHE_KEYS } from '@/lib/cache/blockchain-cache';

export async function GET(request: NextRequest) {
  try {
    // Try to get from cache first
    const cacheKey = CACHE_KEYS.TRIVIA_LEADERBOARD;
    const cachedLeaderboard = blockchainCache.get(cacheKey);
    if (cachedLeaderboard) {
      return NextResponse.json({ success: true, leaderboard: cachedLeaderboard });
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
    const leaderboard = fields.leaderboard || [];

    const leaderboardData = leaderboard.map((entry: any) => ({
      player: entry.player,
      correctAnswers: entry.correct_answers,
      totalAttempts: entry.total_attempts,
      accuracy: entry.total_attempts > 0 
        ? (parseInt(entry.correct_answers) / parseInt(entry.total_attempts) * 100).toFixed(1)
        : 0,
      totalEarnings: entry.total_earnings,
      currentStreak: entry.streak,
      bestStreak: entry.best_streak,
    })).sort((a: any, b: any) => parseInt(b.totalEarnings) - parseInt(a.totalEarnings));

    // Cache for 30 seconds
    blockchainCache.set(cacheKey, leaderboardData, 30000);

    return NextResponse.json({
      success: true,
      leaderboard: leaderboardData,
    });
  } catch (error: any) {
    console.error('Error fetching trivia leaderboard:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch leaderboard' },
      { status: 500 }
    );
  }
}