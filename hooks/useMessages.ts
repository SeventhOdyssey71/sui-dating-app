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

    // Add optimistic message update IMMEDIATELY
    const optimisticMessage: Message = {
      id: `optimistic-${Date.now()}`,
      sender: currentAccount?.address || '',
      recipient: recipientAddress,
      content: content,
      timestamp: Date.now(),
      is_read: false,
    };
    
    // Add message to UI immediately
    setMessages(prev => [optimisticMessage, ...prev]);

    return new Promise<void>((resolve, reject) => {
      sendBlockchainMessage(
        recipientAddress,
        content,
        (result) => {
          // Update the optimistic message with real ID
          setMessages(prev => prev.map(msg => 
            msg.id === optimisticMessage.id 
              ? { ...msg, id: result.digest || msg.id }
              : msg
          ));
          
          // Fetch latest messages after successful send
          setTimeout(() => fetchMessages(0), 500);
          resolve();
        },
        (error) => {
          // Remove optimistic message on error
          setMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id));
          reject(error);
        }
      );
    });
  }, [recipientAddress, currentAccount?.address, sendBlockchainMessage, fetchMessages]);

  // Load messages from localStorage on mount for instant display
  useEffect(() => {
    if (recipientAddress && currentAccount?.address) {
      // Load cached messages immediately
      const cacheKey = `messages_${currentAccount.address}_${recipientAddress}`;
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        try {
          const cachedMessages = JSON.parse(cached);
          setMessages(cachedMessages);
        } catch (e) {
          console.error('Failed to parse cached messages:', e);
        }
      }
      
      // Then fetch fresh data
      refresh();
      
      // Set up more aggressive polling for new messages
      const interval = setInterval(() => {
        fetchMessages(0);
      }, 2000); // Poll every 2 seconds instead of 5

      return () => clearInterval(interval);
    }
  }, [recipientAddress, currentAccount?.address]);

  // Cache messages in localStorage whenever they change
  useEffect(() => {
    if (messages.length > 0 && recipientAddress && currentAccount?.address) {
      const cacheKey = `messages_${currentAccount.address}_${recipientAddress}`;
      localStorage.setItem(cacheKey, JSON.stringify(messages.slice(0, 50))); // Cache last 50 messages
    }
  }, [messages, recipientAddress, currentAccount?.address]);

  return {
    messages,
    loading,
    hasMore,
    loadMore,
    refresh,
    sendMessage
  };
}