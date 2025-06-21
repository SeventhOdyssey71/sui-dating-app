'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { WalletConnect } from '@/components/WalletConnect';
import { SwipeInterface } from '@/components/SwipeInterface-simple';
import { UserRegistration } from '@/components/UserRegistration-simple';
import { DatingDebugPanel } from '@/components/DatingDebugPanel';
import { MessageSquare, User, Heart } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useDatingPlatform } from '@/hooks/useDatingPlatform';

export default function SwipePage() {
  const { isConnected, currentAccount } = useAuth();
  const router = useRouter();
  const [isRegistered, setIsRegistered] = useState(false);
  const [checkingRegistration, setCheckingRegistration] = useState(true);

  useEffect(() => {
    checkRegistration();
  }, [currentAccount]);

  const checkRegistration = async () => {
    if (!currentAccount) {
      setCheckingRegistration(false);
      return;
    }

    try {
      // Check both local and blockchain registration
      const localRegistered = localStorage.getItem(`registered_${currentAccount}`);
      const blockchainRegistered = localStorage.getItem(`blockchain_registered_${currentAccount}`);
      setIsRegistered(!!localRegistered || !!blockchainRegistered);
    } catch (error) {
      console.error('Error checking registration:', error);
    } finally {
      setCheckingRegistration(false);
    }
  };

  if (!isConnected) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5">
        <nav className="border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => router.push('/')}
                  className="flex items-center gap-3"
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                    <Heart className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-2xl font-bold">Discoveer Dating</span>
                </button>
              </div>
              <WalletConnect />
            </div>
          </div>
        </nav>

        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <div className="text-center space-y-6 p-8">
            <div className="inline-flex p-4 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10">
              <Heart className="w-20 h-20 text-primary" />
            </div>
            <h2 className="text-3xl font-bold">Connect to Start Dating</h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-md">
              Connect your wallet to find your perfect match on the blockchain
            </p>
            <WalletConnect />
          </div>
        </div>
      </main>
    );
  }

  if (checkingRegistration) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-gray-500">Loading...</p>
        </div>
      </main>
    );
  }

  if (!isRegistered) {
    return <UserRegistration />;
  }

  return (
    <main className="h-screen overflow-hidden">
      <SwipeInterface />
      <DatingDebugPanel />
      {/* Dev only - remove in production */}
      {process.env.NODE_ENV === 'development' && (
        <button
          onClick={() => {
            if (currentAccount) {
              localStorage.removeItem(`registered_${currentAccount}`);
              localStorage.removeItem(`blockchain_registered_${currentAccount}`);
              window.location.reload();
            }
          }}
          className="fixed bottom-4 right-4 p-2 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-colors text-xs"
          title="Clear Registration (Dev Only)"
        >
          Reset
        </button>
      )}
    </main>
  );
}