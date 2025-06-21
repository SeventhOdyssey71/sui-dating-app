'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { WalletConnect } from '@/components/WalletConnect';
import { DiceGame } from '@/components/games/DiceGame';
import { TriviaGame } from '@/components/games/TriviaGame';
import { Gamepad2, Dice5, Brain, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

type GameType = 'dice' | 'trivia';

export default function GamesPage() {
  const { isConnected } = useAuth();
  const router = useRouter();
  const [activeGame, setActiveGame] = useState<GameType>('dice');

  const games = [
    {
      id: 'dice' as GameType,
      name: 'Dice Roll',
      icon: Dice5,
      description: 'Guess the dice roll and win up to 6x your bet!',
      color: 'from-blue-500 to-purple-500',
    },
    {
      id: 'trivia' as GameType,
      name: 'Trivia Challenge',
      icon: Brain,
      description: 'Answer questions correctly and win from the prize pool!',
      color: 'from-green-500 to-teal-500',
    },
  ];

  if (!isConnected) {
    return (
      <main className="min-h-screen bg-gradient-subtle">
        <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => router.push('/')}
                  className="btn-ghost"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <h1 className="text-xl font-bold flex items-center gap-2">
                  <Gamepad2 className="w-6 h-6" />
                  Mini Games
                </h1>
              </div>
              <WalletConnect />
            </div>
          </div>
        </nav>

        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="text-center">
            <Gamepad2 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Connect to Play</h2>
            <p className="text-muted-foreground mb-6">
              Connect your wallet to start playing games
            </p>
            <WalletConnect />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-subtle">
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/')}
                className="btn-ghost"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-xl font-bold flex items-center gap-2">
                <Gamepad2 className="w-6 h-6" />
                Mini Games
              </h1>
            </div>
            <WalletConnect />
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Game Selector */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          {games.map((game) => (
            <button
              key={game.id}
              onClick={() => setActiveGame(game.id)}
              className={`relative overflow-hidden rounded-xl p-6 text-left transition-all ${
                activeGame === game.id
                  ? 'ring-2 ring-primary shadow-lg'
                  : 'hover:shadow-md'
              }`}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${game.color} opacity-10`} />
              <div className="relative">
                <div className="flex items-start justify-between mb-4">
                  <game.icon className="w-12 h-12" />
                  {activeGame === game.id && (
                    <span className="badge-default">Active</span>
                  )}
                </div>
                <h3 className="text-lg font-semibold mb-2">{game.name}</h3>
                <p className="text-sm text-muted-foreground">{game.description}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Active Game */}
        <div className="animate-fade-in">
          {activeGame === 'dice' && <DiceGame />}
          {activeGame === 'trivia' && <TriviaGame />}
        </div>
      </div>
    </main>
  );
}