'use client';

import { useAuth } from '@/contexts/AuthContext';
import { RefreshCw } from 'lucide-react';

export function ClearRegistration() {
  const { currentAccount } = useAuth();

  const clearRegistration = () => {
    if (currentAccount) {
      localStorage.removeItem(`registered_${currentAccount}`);
      localStorage.removeItem(`blockchain_registered_${currentAccount}`);
      window.location.reload();
    }
  };

  return (
    <button
      onClick={clearRegistration}
      className="fixed bottom-4 right-4 p-3 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-colors"
      title="Clear Registration (Dev Only)"
    >
      <RefreshCw className="w-5 h-5" />
    </button>
  );
}