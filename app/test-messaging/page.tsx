'use client';

import { useState } from 'react';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { useTransactionExecution } from '@/hooks/useTransactionExecution';

export default function TestMessagingPage() {
  const currentAccount = useCurrentAccount();
  const { sendMessage } = useTransactionExecution();
  const [recipient, setRecipient] = useState('');
  const [content, setContent] = useState('');
  const [status, setStatus] = useState('');

  const handleSend = async () => {
    if (!recipient || !content) {
      setStatus('Please fill in all fields');
      return;
    }

    setStatus('Sending...');
    
    sendMessage(
      recipient,
      content,
      (result) => {
        setStatus(`Success! Digest: ${result.digest}`);
        setContent('');
      },
      (error) => {
        setStatus(`Error: ${error.message}`);
        console.error('Full error:', error);
      }
    );
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Test Messaging</h1>
      
      <div className="space-y-4">
        <div>
          <p className="text-sm text-gray-600 mb-2">Current Account:</p>
          <p className="font-mono text-sm">{currentAccount?.address || 'Not connected'}</p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Recipient Address</label>
          <input
            type="text"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg"
            placeholder="0x..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Message Content</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg"
            rows={3}
            placeholder="Enter your message..."
          />
        </div>

        <button
          onClick={handleSend}
          disabled={!currentAccount}
          className="btn-primary disabled:opacity-50"
        >
          Send Message
        </button>

        {status && (
          <div className={`p-4 rounded-lg ${status.includes('Error') ? 'bg-red-100' : 'bg-green-100'}`}>
            <p className="text-sm">{status}</p>
          </div>
        )}
      </div>

      <div className="mt-8 p-4 bg-gray-100 rounded-lg">
        <p className="text-sm font-medium mb-2">Environment Info:</p>
        <p className="text-xs font-mono">Package ID: {process.env.NEXT_PUBLIC_MESSAGE_PACKAGE_ID}</p>
        <p className="text-xs font-mono">Hub ID: {process.env.NEXT_PUBLIC_MESSAGE_HUB_ID}</p>
        <p className="text-xs font-mono">Network: {process.env.NEXT_PUBLIC_SUI_NETWORK}</p>
      </div>
    </div>
  );
}