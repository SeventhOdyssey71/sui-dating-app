'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useDatingPlatform } from '@/hooks/useDatingPlatform';
import { WalletConnect } from '@/components/WalletConnect';
import { MatchCard } from '@/components/MatchCard';
import { Heart, MessageSquare, ArrowLeft, Users, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface UserProfile {
  id: string;
  name: string;
  age: number;
  bio: string;
  location: string;
  images: string[];
  interests: string[];
}

export default function MatchesPage() {
  const { isConnected, currentAccount } = useAuth();
  const { getMatches } = useDatingPlatform();
  const router = useRouter();
  const [matches, setMatches] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isConnected && currentAccount) {
      loadMatches();
    }
  }, [isConnected, currentAccount]);

  const loadMatches = async () => {
    setLoading(true);
    try {
      const matchedProfiles = await getMatches();
      setMatches(matchedProfiles);
    } catch (error) {
      console.error('Error loading matches:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <main className="min-h-screen bg-gradient-subtle">
        <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => router.push('/')}
                  className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center">
                    <Heart className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-2xl font-bold">Matches</span>
                </button>
              </div>
              <WalletConnect />
            </div>
          </div>
        </nav>

        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <div className="text-center space-y-6 p-8">
            <div className="inline-flex p-4 rounded-2xl bg-gradient-to-br from-pink-500/10 to-rose-500/10">
              <Heart className="w-20 h-20 text-pink-500" />
            </div>
            <h2 className="text-3xl font-bold">Connect to See Your Matches</h2>
            <p className="text-lg text-muted-foreground max-w-md">
              Connect your wallet to see all your matches and start chatting
            </p>
            <WalletConnect />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-subtle">
      {/* Navigation */}
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/swipe')}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center">
                  <Heart className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">Your Matches</h1>
                  <p className="text-sm text-muted-foreground">
                    {matches.length} {matches.length === 1 ? 'match' : 'matches'}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/chat')}
                className="btn-outline flex items-center gap-2"
              >
                <MessageSquare className="w-5 h-5" />
                Messages
              </button>
              <WalletConnect />
            </div>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-muted-foreground">Loading your matches...</p>
            </div>
          </div>
        ) : matches.length === 0 ? (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center space-y-6 max-w-md">
              <div className="inline-flex p-4 rounded-2xl bg-muted">
                <Users className="w-16 h-16 text-muted-foreground" />
              </div>
              <h2 className="text-2xl font-bold">No matches yet</h2>
              <p className="text-muted-foreground">
                Keep swiping to find your perfect match! When you both swipe right, you'll see them here.
              </p>
              <button
                onClick={() => router.push('/swipe')}
                className="btn-primary flex items-center gap-2 mx-auto"
              >
                <Sparkles className="w-5 h-5" />
                Start Swiping
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Matches grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {matches.map((match) => (
                <MatchCard
                  key={match.id}
                  match={match}
                  onStartCall={(address, type) => {
                    // Handle call initiation
                    console.log('Starting', type, 'call with', address);
                    router.push(`/chat?recipient=${address}&call=${type}`);
                  }}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  );
}