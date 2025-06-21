import { useState, useEffect, useCallback } from 'react';
import { Message } from '@/lib/sui-client';
import { useTransactionExecution } from './useTransactionExecution';
import { useCurrentAccount } from '@mysten/dapp-kit';

const PAGE_SIZE = 20;

export function useMessages(recipientAddress: string | undefined) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const currentAccount = useCurrentAccount();
  const { sendMessage: sendBlockchainMessage } = useTransactionExecution();

  const fetchMessages = useCallback(async (pageNum: number) => {
    if (!recipientAddress || !currentAccount?.address || loading) return;

    setLoading(true);
    try {
      // Fetch messages between current user and recipient
      const response = await fetch(
        `/api/messages/list?address=${currentAccount.address}&recipient=${recipientAddress}&page=${pageNum}&limit=${PAGE_SIZE}`
      );
      const data = await response.json();

      if (data.success) {
        if (pageNum === 0) {
          setMessages(data.messages);
        } else {
          setMessages(prev => [...prev, ...data.messages]);
        }
        setHasMore(data.messages.length === PAGE_SIZE);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  }, [recipientAddress, currentAccount?.address, loading]);

  const loadMore = useCallback(() => {
    if (hasMore && !loading) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchMessages(nextPage);
    }
  }, [hasMore, loading, page, fetchMessages]);

  const refresh = useCallback(() => {
    setPage(0);
    setHasMore(true);
    fetchMessages(0);
  }, [fetchMessages]);

  const sendMessage = useCallback(async (content: string) => {
    if (!recipientAddress || !content.trim()) {
      throw new Error('Invalid recipient or message content');
    }

    return new Promise<void>((resolve, reject) => {
      sendBlockchainMessage(
        recipientAddress,
        content,
        (result) => {
          // Add optimistic message update
          const newMessage: Message = {
            id: result.digest || Date.now().toString(),
            sender: currentAccount?.address || '',
            recipient: recipientAddress,
            content: content,
            timestamp: Date.now(),
            is_read: false,
          };
          
          setMessages(prev => [newMessage, ...prev]);
          resolve();
        },
        (error) => {
          reject(error);
        }
      );
    });
  }, [recipientAddress, currentAccount?.address, sendBlockchainMessage]);

  useEffect(() => {
    if (recipientAddress && currentAccount?.address) {
      refresh();
      
      // Set up polling for new messages
      const interval = setInterval(() => {
        fetchMessages(0);
      }, 5000); // Poll every 5 seconds

      return () => clearInterval(interval);
    }
  }, [recipientAddress, currentAccount?.address]);

  return {
    messages,
    loading,
    hasMore,
    loadMore,
    refresh,
    sendMessage
  };
}