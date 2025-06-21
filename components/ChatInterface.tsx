'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Send, Clock, Check, CheckCheck, Reply, Loader2, Package, Image as ImageIcon, Users, MessageSquare } from 'lucide-react';
import { subscribeToMessages } from '@/lib/sui-client';
import { NFTSelector } from './NFTSelector';
import { NFTMinter } from './NFTMinter';
import { useTransactionExecution } from '@/hooks/useTransactionExecution';

interface Message {
  id: string;
  sender: string;
  recipient: string;
  content: string;
  timestamp: number;
  isRead: boolean;
  replyTo?: string;
  nfts?: Array<{
    id: string;
    name: string;
    url: string;
  }>;
}

interface ChatInterfaceProps {
  recipientAddress: string;
  recipientName?: string;
  onMessageSent?: () => void;
}

export function ChatInterface({ recipientAddress, recipientName, onMessageSent }: ChatInterfaceProps) {
  const { currentAccount } = useAuth();
  const { sendMessage: sendOnChainMessage, sendMessageWithNFTs } = useTransactionExecution();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [attachedNFTs, setAttachedNFTs] = useState<Array<{ id: string; name: string; url: string }>>([]);
  const [showNFTSelector, setShowNFTSelector] = useState(false);
  const [showNFTMinter, setShowNFTMinter] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Removed automatic read marking to prevent multiple transaction popups
  // Messages will remain unread until user manually marks them

  useEffect(() => {
    if (!currentAccount) return;

    fetchMessages();
    const interval = setInterval(fetchMessages, 3000); // Poll every 3 seconds for better real-time feel

    // Subscribe to real-time events
    let unsubscribe: (() => void) | null = null;
    
    unsubscribe = subscribeToMessages(currentAccount, (event) => {
      console.log('Message event received in ChatInterface:', event);
      // Invalidate cache to ensure fresh data
      if ((window as any).blockchainCache) {
        (window as any).blockchainCache.invalidate(`messages:${currentAccount}`);
        // Also invalidate the other party's cache
        const eventData = event.parsedJson;
        if (eventData) {
          const otherParty = eventData.sender === currentAccount ? eventData.recipient : eventData.sender;
          (window as any).blockchainCache.invalidate(`messages:${otherParty}`);
        }
      }
      fetchMessages(); // Refresh on new message
    });

    return () => {
      clearInterval(interval);
      if (unsubscribe && typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [currentAccount, recipientAddress]);

  const fetchMessages = async () => {
    if (!currentAccount) return;

    try {
      const response = await fetch(`/api/messages/list?address=${currentAccount}`);
      const data = await response.json();

      if (data.success) {
        // Filter messages for this conversation
        const conversationMessages = data.messages.filter(
          (msg: Message) => 
            (msg.sender === recipientAddress && msg.recipient === currentAccount) ||
            (msg.sender === currentAccount && msg.recipient === recipientAddress)
        );
        setMessages(conversationMessages);
        onMessageSent?.(); // Update conversation list when new messages arrive
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if ((!newMessage.trim() && attachedNFTs.length === 0) || !currentAccount || sending) return;

    setSending(true);
    
    try {
      // Create message content with NFT info
      const messageContent = attachedNFTs.length > 0
        ? `${newMessage}${newMessage ? '\n\n' : ''}🎁 Attached ${attachedNFTs.length} NFT${attachedNFTs.length > 1 ? 's' : ''}: ${attachedNFTs.map(nft => nft.name).join(', ')}`
        : newMessage;

      await new Promise<void>((resolve, reject) => {
        // Use combined function if NFTs are attached, otherwise use regular send
        if (attachedNFTs.length > 0) {
          sendMessageWithNFTs(
            recipientAddress,
            messageContent,
            attachedNFTs.map(nft => nft.id),
            () => {
              setNewMessage('');
              setReplyingTo(null);
              setAttachedNFTs([]);
              
              // Invalidate cache for both sender and recipient
              if ((window as any).blockchainCache) {
                (window as any).blockchainCache.invalidate(`messages:${currentAccount}`);
                (window as any).blockchainCache.invalidate(`messages:${recipientAddress}`);
              }
              
              fetchMessages();
              onMessageSent?.();
              resolve();
            },
            (error) => {
              if (error.message?.includes('gas budget')) {
                alert('Transaction failed due to insufficient gas. The app will use a higher gas budget. Please try again.');
              } else {
                alert('Failed to send message: ' + error.message);
              }
              reject(error);
            }
          );
        } else {
          sendOnChainMessage(
            recipientAddress,
            messageContent,
            () => {
              setNewMessage('');
              setReplyingTo(null);
              setAttachedNFTs([]);
              
              // Invalidate cache for both sender and recipient
              if ((window as any).blockchainCache) {
                (window as any).blockchainCache.invalidate(`messages:${currentAccount}`);
                (window as any).blockchainCache.invalidate(`messages:${recipientAddress}`);
              }
              
              fetchMessages();
              onMessageSent?.();
              resolve();
            },
            (error) => {
              if (error.message?.includes('gas budget')) {
                alert('Transaction failed due to insufficient gas. The app will use a higher gas budget. Please try again.');
              } else {
                alert('Failed to send message: ' + error.message);
              }
              reject(error);
            }
          );
        }
      });
    } catch (error: any) {
      console.error('Error in message flow:', error);
      alert('Failed to complete transaction: ' + error.message);
    } finally {
      setSending(false);
    }
  };

  // Removed markAsRead function to prevent automatic transaction signing
  // In the future, we can implement manual or batch read marking

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col glass m-4 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="glass border-b border-white/10 p-6">
        <div className="flex items-center justify-between">
          {/* Left: Avatar and user info */}
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-xl">
                {recipientName || formatAddress(recipientAddress)}
              </h3>
              <p className="text-sm text-muted-foreground font-mono">{recipientAddress}</p>
            </div>
          </div>
          {/* Right: Placeholder for future actions */}
          <div />
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-4">
              <div className="inline-flex p-3 rounded-xl glass">
                <MessageSquare className="w-12 h-12 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">No messages yet. Start a conversation!</p>
            </div>
          </div>
        ) : (
          messages.map((message) => {
            const isSent = message.sender === currentAccount;

            return (
              <div
                key={message.id}
                className={`flex ${isSent ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] rounded-2xl px-5 py-3 ${
                    isSent
                      ? 'bg-gradient-to-br from-primary to-primary/80 text-white shadow-lg shadow-primary/20'
                      : 'glass border border-white/10'
                  }`}
                >
                  {message.replyTo && (
                    <div className="text-xs opacity-70 mb-1 italic">
                      Replying to message
                    </div>
                  )}
                  <p className="break-words">{message.content}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs opacity-70">
                      {formatTime(message.timestamp)}
                    </span>
                    {isSent && (
                      <span className="text-xs opacity-70">
                        {message.isRead ? (
                          <CheckCheck className="w-3 h-3 inline" />
                        ) : (
                          <Check className="w-3 h-3 inline" />
                        )}
                      </span>
                    )}
                  </div>
                  {!isSent && (
                    <button
                      onClick={() => {
                        setReplyingTo(message);
                        inputRef.current?.focus();
                      }}
                      className="text-xs opacity-70 hover:opacity-100 mt-1"
                    >
                      <Reply className="w-3 h-3 inline mr-1" />
                      Reply
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Reply indicator */}
      {replyingTo && (
        <div className="mx-6 mb-2 p-3 glass rounded-xl flex items-center justify-between animate-in fade-in slide-in-from-bottom-2">
          <div className="text-sm flex items-center gap-2">
            <Reply className="w-4 h-4 text-primary" />
            <span className="text-muted-foreground">Replying to: </span>
            <span className="text-foreground">
              {replyingTo.content.slice(0, 50)}
              {replyingTo.content.length > 50 && '...'}
            </span>
          </div>
          <button
            onClick={() => setReplyingTo(null)}
            className="w-6 h-6 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors"
          >
            <span className="text-lg">×</span>
          </button>
        </div>
      )}

      {/* Input */}
      <div className="glass border-t border-white/10 p-6">
        {/* Attached NFTs */}
        {attachedNFTs.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            {attachedNFTs.map((nft) => (
              <div
                key={nft.id}
                className="flex items-center gap-2 glass px-3 py-1.5 rounded-xl text-sm border border-primary/20"
              >
                {nft.url ? (
                  <img src={nft.url} alt={nft.name} className="w-6 h-6 rounded-lg object-cover" />
                ) : (
                  <ImageIcon className="w-5 h-5 text-primary" />
                )}
                <span className="font-medium">{nft.name}</span>
                <button
                  onClick={() => setAttachedNFTs(attachedNFTs.filter(n => n.id !== nft.id))}
                  className="w-5 h-5 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
                >
                  <span className="text-sm">×</span>
                </button>
              </div>
            ))}
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage();
          }}
          className="flex gap-3"
        >
          <button
            type="button"
            onClick={() => setShowNFTSelector(true)}
            className="w-12 h-12 rounded-xl glass border border-white/10 flex items-center justify-center hover:bg-white/5 transition-all hover:scale-105"
            disabled={!currentAccount}
          >
            <Package className="w-5 h-5 text-primary" />
          </button>
          <input
            ref={inputRef}
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            disabled={sending || !currentAccount}
            className="flex-1 px-5 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 transition-all"
          />
          <button
            type="submit"
            disabled={sending || (!newMessage.trim() && attachedNFTs.length === 0) || !currentAccount}
            className="btn-primary px-6 disabled:opacity-50 group"
          >
            {sending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
            )}
          </button>
        </form>
      </div>

      {/* NFT Selector Modal */}
      {showNFTSelector && (
        <NFTSelector
          onClose={() => setShowNFTSelector(false)}
          onSelect={(nfts) => {
            setAttachedNFTs([...attachedNFTs, ...nfts.map(nft => ({
              id: nft.id,
              name: nft.name,
              url: nft.url,
            }))]);
          }}
          multiple={true}
        />
      )}

      {/* NFT Minter Modal */}
      {showNFTMinter && (
        <NFTMinter
          onClose={() => setShowNFTMinter(false)}
          onMinted={() => {
            // Refresh NFTs if needed
          }}
        />
      )}
    </div>
  );
}