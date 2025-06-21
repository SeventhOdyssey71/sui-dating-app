'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Send, 
  Heart,
  MoreVertical,
  Image as ImageIcon,
  Paperclip,
  Gamepad2,
  Dices,
  Brain,
  X
} from 'lucide-react';
import { useMessages } from '@/hooks/useMessages';

interface MatchedProfile {
  id: string;
  name: string;
  age: number;
  bio: string;
  location: string;
  images: string[];
  walletAddress: string;
}

interface MatchedChatInterfaceProps {
  matchedProfile: MatchedProfile;
}

export function MatchedChatInterface({ matchedProfile }: MatchedChatInterfaceProps) {
  const router = useRouter();
  const { currentAccount } = useAuth();
  const { messages, sendMessage, loading: messagesLoading } = useMessages(matchedProfile?.walletAddress || '');
  
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showGameMenu, setShowGameMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Handle loading or missing profile
  if (!matchedProfile) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading match details...</p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!message.trim() || !currentAccount || isSending) return;

    setIsSending(true);
    try {
      // This will call the blockchain messaging contract
      await sendMessage(message.trim());
      setMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const handlePlayGame = (gameType: 'dice' | 'trivia') => {
    setShowGameMenu(false);
    // Navigate to game with match context
    const params = new URLSearchParams({
      matchId: matchedProfile.id,
      matchName: matchedProfile.name,
      returnTo: `/chat/match/${matchedProfile.id}`
    });
    router.push(`/games/${gameType}?${params.toString()}`);
  };

  return (
    <div className="flex flex-col h-screen bg-white relative">
      {/* Header */}
      <header className="glass-white border-b border-gray-100 px-2 sm:px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            <button
              onClick={() => router.back()}
              className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-full transition-colors shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              <div className="relative shrink-0">
                <img
                  src={matchedProfile.images[0] || `https://api.dicebear.com/7.x/avataaars/svg?seed=${matchedProfile.id}`}
                  alt={matchedProfile.name}
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover"
                />
                <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-green-500 rounded-full border-2 border-white" />
              </div>
              
              <div className="min-w-0 flex-1">
                <h2 className="font-semibold text-sm sm:text-base truncate">
                  {matchedProfile.name}, {matchedProfile.age}
                </h2>
                <p className="text-xs text-gray-500 truncate">Active now</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <button 
              onClick={() => setShowGameMenu(!showGameMenu)}
              className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-full transition-colors"
              title="Play games"
            >
              <Gamepad2 className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-full transition-colors md:hidden"
            >
              <MoreVertical className="w-5 h-5" />
            </button>
            <button 
              className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-full transition-colors hidden md:block"
            >
              <MoreVertical className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Game Menu Dropdown */}
      {showGameMenu && (
        <div className="absolute top-16 right-2 sm:right-4 z-50 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden animate-in slide-in-from-top-2 duration-200">
          <div className="p-2">
            <button
              onClick={() => handlePlayGame('dice')}
              className="flex items-center gap-3 w-full px-4 py-3 hover:bg-gray-50 rounded-xl transition-colors"
            >
              <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center">
                <Dices className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <p className="font-semibold">Dice Game</p>
                <p className="text-xs text-gray-500">Bet and win up to 6x</p>
              </div>
            </button>
            <button
              onClick={() => handlePlayGame('trivia')}
              className="flex items-center gap-3 w-full px-4 py-3 hover:bg-gray-50 rounded-xl transition-colors"
            >
              <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <p className="font-semibold">Trivia Challenge</p>
                <p className="text-xs text-gray-500">Test your knowledge</p>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Mobile Menu */}
      {showMobileMenu && (
        <div className="absolute top-16 right-2 z-50 bg-white rounded-2xl shadow-xl border border-gray-100 p-2 animate-in slide-in-from-top-2 duration-200 md:hidden">
          <button className="flex items-center gap-2 w-full px-4 py-2 hover:bg-gray-50 rounded-lg transition-colors">
            View Profile
          </button>
          <button className="flex items-center gap-2 w-full px-4 py-2 hover:bg-gray-50 rounded-lg transition-colors text-red-500">
            Unmatch
          </button>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4">
        {/* Match notification */}
        <div className="text-center py-6 sm:py-8">
          <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-pink-100 rounded-full mb-3 sm:mb-4">
            <Heart className="w-8 h-8 sm:w-10 sm:h-10 text-pink-500" fill="currentColor" />
          </div>
          <h3 className="text-lg sm:text-xl font-bold mb-2">It's a Match!</h3>
          <p className="text-sm sm:text-base text-gray-600">
            You and {matchedProfile.name} liked each other
          </p>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Start the conversation or play a game together!
          </p>
        </div>

        {/* Messages */}
        {messages.map((msg, index) => {
          const isOwn = msg.sender === currentAccount;
          return (
            <div
              key={index}
              className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] sm:max-w-[70%] px-3 sm:px-4 py-2 rounded-2xl ${
                  isOwn
                    ? 'bg-black text-white'
                    : 'glass-black text-black'
                }`}
              >
                <p className="text-sm break-words">{msg.content}</p>
                <p className="text-xs opacity-60 mt-1">
                  {new Date(msg.timestamp).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </p>
              </div>
            </div>
          );
        })}

        {/* Sending indicator */}
        {isSending && (
          <div className="flex justify-end">
            <div className="max-w-[85%] sm:max-w-[70%] px-3 sm:px-4 py-2 rounded-2xl bg-gray-100">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="glass-white border-t border-gray-100 p-3 sm:p-4">
        <div className="flex items-center gap-2">
          <button className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-full transition-colors hidden sm:block">
            <Paperclip className="w-5 h-5 text-gray-600" />
          </button>
          <button className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ImageIcon className="w-5 h-5 text-gray-600" />
          </button>
          
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Type a message..."
            disabled={isSending}
            className="flex-1 px-3 sm:px-4 py-2 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-black disabled:opacity-50"
          />
          
          <button
            onClick={handleSendMessage}
            disabled={!message.trim() || isSending}
            className="p-1.5 sm:p-2 bg-black text-white rounded-full hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        
        {/* Blockchain indicator */}
        <p className="text-xs text-gray-400 text-center mt-2">
          Messages are stored on the Sui blockchain
        </p>
      </div>
    </div>
  );
}