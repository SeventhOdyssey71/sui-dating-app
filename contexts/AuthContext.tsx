'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { SuiClient } from '@mysten/sui/client';

interface AuthContextType {
  address: string | null;
  isConnected: boolean;
  balance: string;
  currentAccount: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const suiClient = new SuiClient({ url: 'https://fullnode.testnet.sui.io' });

export function AuthProvider({ children }: { children: ReactNode }) {
  const currentAccount = useCurrentAccount();
  const [balance, setBalance] = useState('0');

  const address = currentAccount?.address || null;
  const isConnected = !!currentAccount;

  useEffect(() => {
    const fetchBalance = async () => {
      if (!address) {
        setBalance('0');
        return;
      }

      try {
        const { totalBalance } = await suiClient.getBalance({
          owner: address,
        });
        setBalance((Number(totalBalance) / 1_000_000_000).toFixed(4));
      } catch (error) {
        console.error('Error fetching balance:', error);
        setBalance('0');
      }
    };

    fetchBalance();
    const interval = setInterval(fetchBalance, 10000);
    return () => clearInterval(interval);
  }, [address]);

  return (
    <AuthContext.Provider
      value={{
        address,
        isConnected,
        balance,
        currentAccount: address,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}