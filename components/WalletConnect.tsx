'use client';

import { useState } from 'react';
import { ConnectModal, useCurrentAccount, useDisconnectWallet } from '@mysten/dapp-kit';
import { useAuth } from '@/contexts/AuthContext';
import { Wallet, Copy, LogOut, ChevronDown, Check } from 'lucide-react';

export function WalletConnect() {
  const [showDropdown, setShowDropdown] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const currentAccount = useCurrentAccount();
  const { mutate: disconnect } = useDisconnectWallet();
  const { address, isConnected, balance } = useAuth();

  const handleCopyAddress = async () => {
    if (address) {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDisconnect = () => {
    if (currentAccount) {
      disconnect();
    }
    setShowDropdown(false);
  };

  if (isConnected && address) {
    return (
      <div className="relative">
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="flex items-center gap-3 px-4 py-2 rounded-lg border border-border hover:bg-accent transition-colors"
        >
          <Wallet className="w-4 h-4" />
          <div className="text-left">
            <p className="text-xs text-muted-foreground">{balance} SUI</p>
            <p className="font-mono text-sm">
              {address.slice(0, 6)}...{address.slice(-4)}
            </p>
          </div>
          <ChevronDown className={`w-4 h-4 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
        </button>
        
        {showDropdown && (
          <>
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setShowDropdown(false)}
            />
            <div className="absolute top-full right-0 mt-2 w-64 rounded-lg border bg-background shadow-lg z-50">
              <div className="p-3 border-b">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                  Connected Wallet
                </p>
                <p className="font-mono text-sm break-all">{address}</p>
              </div>
              
              <div className="p-1">
                <button
                  onClick={handleCopyAddress}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-accent rounded-md transition-colors"
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                  {copied ? 'Copied!' : 'Copy Address'}
                </button>
                
                <div className="my-1 border-t" />
                
                <button
                  onClick={handleDisconnect}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-destructive/10 hover:text-destructive rounded-md transition-colors"
                >
                  <LogOut size={16} />
                  Disconnect
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <ConnectModal
      trigger={
        <button className="btn-primary flex items-center gap-2">
          <Wallet size={20} />
          Connect Wallet
        </button>
      }
    />
  );
}