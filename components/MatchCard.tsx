'use client';

import { Heart, MessageCircle, MapPin, Calendar } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';

interface MatchCardProps {
  match: {
    id: string;
    name: string;
    age: number;
    bio: string;
    location: string;
    images: string[];
    interests: string[];
    matchedAt?: number;
  };
  onStartChat?: (address: string) => void;
  onStartCall?: (address: string, type: 'audio' | 'video') => void;
}

export function MatchCard({ match, onStartChat, onStartCall }: MatchCardProps) {
  const router = useRouter();

  const handleStartChat = () => {
    if (onStartChat) {
      onStartChat(match.id);
    } else {
      // Navigate to matched chat with profile data
      const params = new URLSearchParams({
        name: match.name,
        age: match.age.toString(),
        bio: match.bio,
        location: match.location,
        images: match.images.join(','),
        walletAddress: match.id // Using ID as wallet address
      });
      router.push(`/chat/match/${match.id}?${params.toString()}`);
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="card card-hover overflow-hidden group">
      {/* Image */}
      <div className="relative h-64 overflow-hidden bg-gray-100">
        <img
          src={match.images[0] || `https://api.dicebear.com/7.x/avataaars/svg?seed=${match.id}`}
          alt={match.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        
        {/* Match badge */}
        <div className="absolute top-4 right-4 bg-gradient-to-r from-pink-500 to-rose-500 text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1 shadow-lg">
          <Heart className="w-4 h-4" fill="currentColor" />
          Match!
        </div>
        
        {/* Name and age */}
        <div className="absolute bottom-4 left-4 text-white">
          <h3 className="text-2xl font-bold">{match.name}, {match.age}</h3>
          <div className="flex items-center gap-2 text-sm opacity-90">
            <MapPin className="w-4 h-4" />
            <span>{match.location}</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-4">
        {/* Bio */}
        <p className="text-muted-foreground line-clamp-2">{match.bio}</p>

        {/* Interests */}
        {match.interests.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {match.interests.slice(0, 3).map((interest, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm"
              >
                {interest}
              </span>
            ))}
            {match.interests.length > 3 && (
              <span className="px-3 py-1 bg-muted text-muted-foreground rounded-full text-sm">
                +{match.interests.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Match info */}
        {match.matchedAt && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span>Matched {formatDistanceToNow(new Date(match.matchedAt))} ago</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <button
            onClick={handleStartChat}
            className="w-full btn-primary flex items-center justify-center gap-2"
          >
            <MessageCircle className="w-5 h-5" />
            Start Chatting
          </button>
        </div>

        {/* Address (for debugging) */}
        <p className="text-xs text-muted-foreground font-mono text-center">
          {formatAddress(match.id)}
        </p>
      </div>
    </div>
  );
}