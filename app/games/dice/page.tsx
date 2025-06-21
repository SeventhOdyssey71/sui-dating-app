'use client';

import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { WalletConnect } from '@/components/WalletConnect';
import { DiceGame } from '@/components/games/DiceGame';
import { ArrowLeft, Heart, Dices } from 'lucide-react';

function DiceGameContent() {
  const { isConnected } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Get match context from URL params
  const matchId = searchParams.get('matchId');
  const matchName = searchParams.get('matchName');
  const returnTo = searchParams.get('returnTo');

  const handleBack = () => {
    if (returnTo) {
      router.push(returnTo);
    } else {
      router.push('/games');
    }
  };

  if (!isConnected) {
    return (
      <main className="min-h-screen bg-white">
        <nav className="glass-white border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center gap-4">
                <button
                  onClick={handleBack}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <h1 className="text-xl font-bold flex items-center gap-2">
                  <Dices className="w-6 h-6" />
                  Dice Game
                </h1>
              </div>
              <WalletConnect />
            </div>
          </div>
        </nav>

        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="text-center">
            <Dices className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Connect to Play</h2>
            <p className="text-gray-600 mb-6">
              Connect your wallet to start playing
            </p>
            <WalletConnect />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      <nav className="glass-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
              <button
                onClick={handleBack}
                className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-full transition-colors shrink-0"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <Dices className="w-5 h-5 sm:w-6 sm:h-6 shrink-0" />
                <h1 className="text-base sm:text-xl font-bold truncate">
                  Dice Game
                </h1>
                {matchName && (
                  <span className="text-sm text-gray-500 hidden sm:inline">
                    with {matchName}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {matchName && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-pink-100 rounded-full">
                  <Heart className="w-4 h-4 text-pink-500" fill="currentColor" />
                  <span className="text-sm font-medium text-pink-700 hidden sm:inline">
                    Playing with {matchName}
                  </span>
                  <span className="text-sm font-medium text-pink-700 sm:hidden">
                    {matchName}
                  </span>
                </div>
              )}
              <WalletConnect />
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        <DiceGame />
        
        {matchName && (
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500 mb-4">
              Playing with your match adds extra fun to the game!
            </p>
            <button
              onClick={handleBack}
              className="btn-secondary inline-flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Chat
            </button>
          </div>
        )}
      </div>
    </main>
  );
}

export default function DiceGamePage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading game...</p>
        </div>
      </div>
    }>
      <DiceGameContent />
    </Suspense>
  );
}