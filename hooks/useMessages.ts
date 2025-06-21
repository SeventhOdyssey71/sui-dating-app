import { useState, useEffect, useCallback } from 'react';
import { Message } from '@/lib/sui-client';

const PAGE_SIZE = 20;

export function useMessages(address: string | undefined) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);

  const fetchMessages = useCallback(async (pageNum: number) => {
    if (!address || loading) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/messages/list?address=${address}&page=${pageNum}&limit=${PAGE_SIZE}`);
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
  }, [address, loading]);

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

  useEffect(() => {
    if (address) {
      refresh();
    }
  }, [address]);

  return {
    messages,
    loading,
    hasMore,
    loadMore,
    refresh
  };
}