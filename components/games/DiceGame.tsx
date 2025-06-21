'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Dice1, Dice2, Dice3, Dice4, Dice5, Dice6, TrendingUp, Users, Loader2 } from 'lucide-react';
import { useGameTransactions } from '@/hooks/useGameTransactions';

const diceIcons = [Dice1, Dice2, Dice3, Dice4, Dice5, Dice6];

interface GameStats {
  balance: string;
  totalGames: string;
  totalWins: string;
  winRate: number;
  paused: boolean;
  leaderboard: Array<{
    player: string;
    totalWinnings: string;
    gamesPlayed: string;
    biggestWin: string;
  }>;
}

export function DiceGame() {
  const { currentAccount } = useAuth();
  const { playDice } = useGameTransactions();
  const [selectedDice, setSelectedDice] = useState<number | null>(null);
  const [betAmount, setBetAmount] = useState('0.1');
  const [isRolling, setIsRolling] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);
  const [stats, setStats] = useState<GameStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/games/dice/stats');
      const data = await response.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePlayDice = async () => {
    if (!selectedDice || !currentAccount) return;

    setIsRolling(true);
    
    playDice(
      selectedDice,
      Math.floor(parseFloat(betAmount) * 1_000_000_000),
      (result) => {
        if (result.gameResult) {
          setLastResult(result.gameResult);
          fetchStats();
        }
        setIsRolling(false);
      },
      (error) => {
        console.error('Error playing dice:', error);
        alert('Failed to play dice game: ' + error.message);
        setIsRolling(false);
      }
    );
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatSUI = (amount: string) => {
    return (parseInt(amount) / 1_000_000_000).toFixed(2);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      
      {/* Game Area */}
      <div className="grid md:grid-cols-2 gap-8">
        {/* Play Area */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-2xl font-bold">Roll the Dice</h2>
            <p className="text-muted-foreground">
              Pick a number and test your luck! 6x payout on correct guess.
            </p>
          </div>
          <div className="card-content space-y-6">
            {/* Dice Selection */}
            <div>
              <label className="label mb-3">Select your number</label>
              <div className="grid grid-cols-3 gap-3">
                {[1, 2, 3, 4, 5, 6].map((num) => {
                  const Icon = diceIcons[num - 1];
                  return (
                    <button
                      key={num}
                      onClick={() => setSelectedDice(num)}
                      disabled={isRolling}
                      className={`p-6 rounded-lg border-2 transition-all ${
                        selectedDice === num
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <Icon className="w-12 h-12 mx-auto" />
                      <p className="mt-2 font-semibold">{num}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bet Amount */}
            <div>
              <label className="label mb-2">Bet Amount (SUI)</label>
              <input
                type="number"
                value={betAmount}
                onChange={(e) => setBetAmount(e.target.value)}
                min="0.1"
                max="10"
                step="0.1"
                disabled={isRolling}
                className="input"
                placeholder="Enter bet amount"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Min: 0.1 SUI | Max: 10 SUI
              </p>
            </div>

            {/* Play Button */}
            <button
              onClick={handlePlayDice}
              disabled={!selectedDice || !currentAccount || isRolling}
              className="btn-primary w-full"
            >
              {isRolling ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Rolling...
                </>
              ) : (
                'Roll Dice'
              )}
            </button>

            {/* Last Result */}
            {lastResult && (
              <div className={`p-4 rounded-lg border ${
                lastResult.won ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">
                      {lastResult.won ? 'You Won!' : 'Try Again!'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      You rolled: {lastResult.result} | You guessed: {lastResult.guess}
                    </p>
                  </div>
                  {lastResult.won && (
                    <p className="text-lg font-bold text-green-600 dark:text-green-400">
                      +{formatSUI(lastResult.payout)} SUI
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="space-y-6">
          {/* House Stats */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                House Statistics
              </h3>
            </div>
            <div className="card-content">
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
              ) : stats ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">House Balance</p>
                    <p className="text-2xl font-bold">{formatSUI(stats.balance)} SUI</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Games</p>
                    <p className="text-2xl font-bold">{stats.totalGames}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Player Wins</p>
                    <p className="text-2xl font-bold">{stats.totalWins}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Win Rate</p>
                    <p className="text-2xl font-bold">{stats.winRate}%</p>
                  </div>
                </div>
              ) : (
                <p className="text-center text-muted-foreground">Failed to load stats</p>
              )}
            </div>
          </div>

          {/* Leaderboard */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Users className="w-5 h-5" />
                Top Players
              </h3>
            </div>
            <div className="card-content">
              {stats?.leaderboard.length ? (
                <div className="space-y-3">
                  {stats.leaderboard.map((player, index) => (
                    <div key={player.player} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{formatAddress(player.player)}</p>
                          <p className="text-sm text-muted-foreground">
                            {player.gamesPlayed} games
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatSUI(player.totalWinnings)} SUI</p>
                        <p className="text-xs text-muted-foreground">
                          Best: {formatSUI(player.biggestWin)} SUI
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No players yet. Be the first!
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}