'use client';

import { useState, useEffect, Suspense } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { WalletConnect } from '@/components/WalletConnect';
import { ChatInterface } from '@/components/ChatInterface';
import { MatchedChatInterface } from '@/components/MatchedChatInterface';
import { MessageSquare, Plus, Users, Heart } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useConversations } from '@/hooks/useConversations';
import { subscribeToMessages } from '@/lib/sui-client';
import { useDatingPlatform } from '@/hooks/useDatingPlatform';

function ChatPageContent() {
  const { isConnected, currentAccount } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { getMatches } = useDatingPlatform();
  
  const [recipientAddress, setRecipientAddress] = useState('');
  const [showNewChat, setShowNewChat] = useState(false);
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [matches, setMatches] = useState<Set<string>>(new Set());
  const [matchProfiles, setMatchProfiles] = useState<Map<string, any>>(new Map());
  const { conversations, refreshConversations } = useConversations();

  // Check for URL parameters on mount
  useEffect(() => {
    const recipient = searchParams.get('recipient');
    const callType = searchParams.get('call');
    
    if (recipient) {
      setActiveChat(recipient);
    }
  }, [searchParams]);

  // Load matches
  useEffect(() => {
    if (isConnected && currentAccount) {
      loadMatches();
    }
  }, [isConnected, currentAccount]);

  const loadMatches = async () => {
    try {
      const matchedProfiles = await getMatches();
      const matchAddresses = new Set(matchedProfiles.map(p => p.id));
      const profileMap = new Map();
      
      matchedProfiles.forEach(profile => {
        profileMap.set(profile.id, profile);
      });
      
      setMatches(matchAddresses);
      setMatchProfiles(profileMap);
    } catch (error) {
      console.error('Error loading matches:', error);
    }
  };

  // Refresh conversations when a new chat is opened
  useEffect(() => {
    if (activeChat) {
      refreshConversations();
    }
  }, [activeChat]);

  // Subscribe to messages to update conversation list in real-time
  useEffect(() => {
    if (!currentAccount) return;

    const unsubscribe = subscribeToMessages(currentAccount, (message) => {
      console.log('New message received in chat page:', message);
      refreshConversations();
    });

    return () => {
      unsubscribe();
    };
  }, [currentAccount]);

  const startNewChat = () => {
    if (!recipientAddress.trim()) return;
    
    setActiveChat(recipientAddress);
    setShowNewChat(false);
    setRecipientAddress('');
  };

  if (!isConnected) {
    return (
      <main className="min-h-screen bg-background overflow-hidden">
        {/* Background Effects */}
        <div className="fixed inset-0 hero-gradient" />
        <div className="fixed inset-0">
          <div className="absolute top-20 left-20 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse animation-delay-2000" />
        </div>

        <nav className="relative z-10 border-b border-white/10 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-20">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => router.push('/')}
                  className="flex items-center gap-3 group"
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center group-hover:scale-110 transition-transform">
                    <MessageSquare className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-2xl font-bold">Chat</span>
                </button>
              </div>
              <WalletConnect />
            </div>
          </div>
        </nav>

        <div className="relative z-10 flex items-center justify-center h-[calc(100vh-5rem)]">
          <div className="text-center space-y-6">
            <div className="inline-flex p-4 rounded-2xl glass">
              <MessageSquare className="w-20 h-20 text-primary pulse-glow" />
            </div>
            <h2 className="text-3xl font-bold">Connect to Chat</h2>
            <p className="text-lg text-muted-foreground max-w-md">
              Connect your wallet to start secure messaging on the blockchain
            </p>
            <div className="pt-4">
              <WalletConnect />
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 hero-gradient opacity-50" />
      
      <nav className="relative z-10 border-b border-white/10 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/')}
                className="flex items-center gap-3 group"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center group-hover:scale-110 transition-transform">
                  <MessageSquare className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-bold">Chat</span>
              </button>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/matches')}
                className="btn-outline flex items-center gap-2"
              >
                <Heart className="w-5 h-5" />
                Matches
              </button>
              <WalletConnect />
            </div>
          </div>
        </div>
      </nav>

      <div className="relative z-10 flex h-[calc(100vh-5rem)]">
        {/* Sidebar */}
        <div className="w-80 glass border-r border-white/10">
          <div className="p-4 border-b border-white/10">
            <button
              onClick={() => setShowNewChat(true)}
              className="w-full btn-primary flex items-center justify-center gap-2 group"
            >
              <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
              New Chat
            </button>
          </div>

          <div className="overflow-y-auto">
            <div className="p-3">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-3">
                Recent Chats
              </h3>
              {conversations.length === 0 ? (
                <div className="text-center py-8 px-4">
                  <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                  <p className="text-sm text-muted-foreground">No conversations yet</p>
                  <p className="text-xs text-muted-foreground mt-1">Start a new chat to begin</p>
                </div>
              ) : (
                conversations.map((conv) => (
                  <button
                    key={conv.address}
                    onClick={() => setActiveChat(conv.address)}
                    className={`w-full text-left p-3 mb-2 rounded-xl transition-all duration-300 group ${
                      activeChat === conv.address 
                        ? 'bg-primary/10 border border-primary/20' 
                        : 'hover:bg-white/5 border border-transparent hover:border-white/10'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="relative">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Users className="w-6 h-6 text-primary" />
                        </div>
                        {conv.unread > 0 && (
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center text-xs font-bold text-white">
                            {conv.unread}
                          </div>
                        )}
                        {matches.has(conv.address) && (
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-gradient-to-br from-pink-500 to-rose-500 rounded-full flex items-center justify-center">
                            <Heart className="w-3 h-3 text-white" fill="currentColor" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline">
                          <p className="font-semibold">{conv.name}</p>
                          <span className="text-xs text-muted-foreground">
                            {conv.time}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground truncate mt-1">
                          {conv.lastMessage}
                        </p>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex">
          {activeChat ? (
            matches.has(activeChat) ? (
              <MatchedChatInterface
                matchedProfile={{
                  id: activeChat,
                  name: conversations.find(c => c.address === activeChat)?.name || matchProfiles.get(activeChat)?.name || 'Unknown',
                  age: matchProfiles.get(activeChat)?.age || 25,
                  bio: matchProfiles.get(activeChat)?.bio || '',
                  location: matchProfiles.get(activeChat)?.location || 'Unknown',
                  images: matchProfiles.get(activeChat)?.images || [],
                  walletAddress: activeChat
                }}
              />
            ) : (
              <ChatInterface 
                recipientAddress={activeChat}
                recipientName={conversations.find(c => c.address === activeChat)?.name}
                onMessageSent={refreshConversations}
              />
            )
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center space-y-6">
                <div className="inline-flex p-4 rounded-2xl glass">
                  <MessageSquare className="w-20 h-20 text-muted-foreground" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold">Select a chat</h2>
                  <p className="text-muted-foreground">
                    Choose a conversation or start a new one
                  </p>
                </div>
                <button
                  onClick={() => setShowNewChat(true)}
                  className="btn-secondary"
                >
                  Start New Chat
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* New Chat Modal */}
      {showNewChat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="glass w-full max-w-md p-8 space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">New Chat</h2>
              <button
                onClick={() => {
                  setShowNewChat(false);
                  setRecipientAddress('');
                }}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors"
              >
                <span className="text-xl">×</span>
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-3 text-muted-foreground uppercase tracking-wider">
                  Recipient Address
                </label>
                <input
                  type="text"
                  value={recipientAddress}
                  onChange={(e) => setRecipientAddress(e.target.value)}
                  placeholder="0x..."
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowNewChat(false);
                    setRecipientAddress('');
                  }}
                  className="flex-1 btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={startNewChat}
                  disabled={!recipientAddress.trim()}
                  className="flex-1 btn-primary"
                >
                  Start Chat
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading chat...</p>
        </div>
      </div>
    }>
      <ChatPageContent />
    </Suspense>
  );
}