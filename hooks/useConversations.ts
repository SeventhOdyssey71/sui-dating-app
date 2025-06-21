import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getMessages } from '@/lib/sui-client';

interface Conversation {
  address: string;
  name: string;
  lastMessage: string;
  time: string;
  unread: number;
  timestamp: number;
}

export function useConversations() {
  const { currentAccount } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchConversations = async () => {
    if (!currentAccount) {
      setConversations([]);
      setLoading(false);
      return;
    }

    try {
      // Fetch all messages for the current user
      const messages = await getMessages(currentAccount);
      
      // Group messages by conversation partner
      const conversationMap = new Map<string, any>();
      
      messages.forEach(message => {
        const partner = message.sender === currentAccount ? message.recipient : message.sender;
        
        if (!conversationMap.has(partner) || message.timestamp > conversationMap.get(partner).timestamp) {
          conversationMap.set(partner, {
            address: partner,
            name: `${partner.slice(0, 6)}...${partner.slice(-4)}`, // Shortened address as name
            lastMessage: message.content,
            timestamp: message.timestamp,
            unread: message.sender !== currentAccount && !message.is_read ? 1 : 0,
            time: formatTime(message.timestamp)
          });
        } else if (message.sender !== currentAccount && !message.is_read) {
          // Increment unread count
          const conv = conversationMap.get(partner);
          conv.unread += 1;
          conversationMap.set(partner, conv);
        }
      });
      
      // Convert map to array and sort by timestamp (most recent first)
      const conversationList = Array.from(conversationMap.values())
        .sort((a, b) => b.timestamp - a.timestamp);
      
      setConversations(conversationList);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  // Format timestamp to display time
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  useEffect(() => {
    fetchConversations();
    
    // Set up polling interval to check for new messages
    const interval = setInterval(fetchConversations, 5000); // Check every 5 seconds
    
    return () => clearInterval(interval);
  }, [currentAccount]);

  return { conversations, loading, refreshConversations: fetchConversations };
}