import { NextRequest, NextResponse } from 'next/server';
import { getSuiClient } from '@/lib/sui-client';
import { blockchainCache, CACHE_KEYS } from '@/lib/cache/blockchain-cache';

export async function GET(request: NextRequest) {
  try {
    // Try to get from cache first
    const cacheKey = CACHE_KEYS.GAME_STATS('dice');
    const cachedStats = blockchainCache.get(cacheKey);
    if (cachedStats) {
      return NextResponse.json({ success: true, stats: cachedStats });
    }

    const client = getSuiClient();

    // Get GameHouse object
    const gameHouse = await client.getObject({
      id: process.env.NEXT_PUBLIC_GAME_HOUSE_ID!,
      options: {
        showContent: true,
      },
    });

    if (!gameHouse.data?.content || gameHouse.data.content.dataType !== 'moveObject') {
      return NextResponse.json(
        { success: false, error: 'Failed to fetch game house' },
        { status: 500 }
      );
    }

    const fields = gameHouse.data.content.fields as any;

    // Get leaderboard
    const leaderboard = fields.leaderboard || [];

    const stats = {
      balance: fields.balance,
      totalGames: fields.total_games,
      totalWins: fields.total_wins,
      winRate: fields.total_games > 0 
        ? (parseInt(fields.total_wins) / parseInt(fields.total_games) * 100).toFixed(2) 
        : 0,
      paused: fields.paused,
      leaderboard: leaderboard.map((entry: any) => ({
        player: entry.player,
        totalWinnings: entry.total_winnings,
        gamesPlayed: entry.games_played,
        biggestWin: entry.biggest_win,
      })),
    };

    // Cache the stats for 30 seconds
    blockchainCache.set(cacheKey, stats, 30000);

    return NextResponse.json({
      success: true,
      stats,
    });
  } catch (error: any) {
    console.error('Error fetching dice game stats:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}