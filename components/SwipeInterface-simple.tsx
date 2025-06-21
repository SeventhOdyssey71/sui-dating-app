'use client';

import { useState, useEffect } from 'react';
import { SwipeCard } from './SwipeCard-simple';
import { Heart, X, Star, RefreshCw, MessageCircle, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useDatingPlatform } from '@/hooks/useDatingPlatform';
import { useRouter } from 'next/navigation';

interface UserProfile {
  id: string;
  name: string;
  age: number;
  bio: string;
  location: string;
  images: string[];
  interests: string[];
}

export function SwipeInterface() {
  const { currentAccount } = useAuth();
  const { swipe, getUnswipedProfiles, getAllProfiles, loading } = useDatingPlatform();
  const router = useRouter();
  
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showMatch, setShowMatch] = useState(false);
  const [matchedProfile, setMatchedProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    loadProfiles();
  }, [currentAccount]);

  const loadProfiles = async (includeAll = false) => {
    setIsLoading(true);
    try {
      const newProfiles = includeAll 
        ? await getAllProfiles()
        : await getUnswipedProfiles();
      setProfiles(newProfiles);
      setCurrentIndex(0); // Reset to first profile
    } catch (error) {
      console.error('Error loading profiles:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwipe = async (direction: 'left' | 'right' | 'super') => {
    if (!profiles[currentIndex]) return;
    
    const isLike = direction === 'right' || direction === 'super';
    const profile = profiles[currentIndex];
    
    try {
      let isMatch = false;
      
      await new Promise<void>((resolve, reject) => {
        swipe(
          profile.id,
          isLike,
          (result) => {
            // Check if this swipe resulted in a match
            if (result && result.events) {
              const matchEvent = result.events.find((e: any) => 
                e.type && e.type.includes('MatchCreated')
              );
              if (matchEvent) {
                isMatch = true;
                setMatchedProfile(profile);
                setShowMatch(true);
              }
            }
            resolve();
          },
          (error) => {
            console.error('Swipe error:', error);
            alert(`Failed to record swipe: ${error.message}`);
            reject(error);
          }
        );
      });
      
      // Move to next profile
      setCurrentIndex((prev) => prev + 1);
      
      // Load more profiles if running low
      if (currentIndex >= profiles.length - 3) {
        loadProfiles();
      }
    } catch (error) {
      console.error('Error swiping:', error);
    }
  };

  const currentProfile = profiles[currentIndex];
  const hasMoreProfiles = currentIndex < profiles.length;

  return (
    <div className="relative h-full w-full flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between p-4 md:p-6 bg-white dark:bg-gray-800 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
            Discoveer
          </h1>
          {profiles.length > 0 && (
            <p className="text-xs text-gray-500 mt-1">
              {currentIndex + 1} / {profiles.length} profiles
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => loadProfiles(true)}
            disabled={isLoading}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="Refresh profiles (includes all profiles)"
          >
            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button 
            onClick={() => router.push('/matches')}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="View matches"
          >
            <Heart className="w-6 h-6" />
          </button>
          <button 
            onClick={() => router.push('/chat')}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="Messages"
          >
            <MessageCircle className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Swipe Area */}
      <div className="flex-1 relative overflow-hidden">
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-gray-500">Finding people near you...</p>
            </div>
          </div>
        ) : !hasMoreProfiles ? (
          <div className="absolute inset-0 flex items-center justify-center p-8">
            <div className="text-center space-y-6 max-w-sm">
              <div className="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto">
                <RefreshCw className="w-12 h-12 text-gray-400" />
              </div>
              <h2 className="text-2xl font-bold">No more profiles</h2>
              <p className="text-gray-500">
                You've seen everyone in your area. Check back later for new people!
              </p>
              <button
                onClick={() => loadProfiles(true)}
                className="px-6 py-3 bg-gradient-to-r from-primary to-accent text-white rounded-xl font-semibold hover:shadow-lg transition-shadow"
              >
                Refresh Profiles
              </button>
            </div>
          </div>
        ) : (
          <div className="relative h-full p-4 md:p-8">
            <div className="relative h-full max-w-lg mx-auto">
              {/* Stack of cards */}
              {profiles.slice(currentIndex, currentIndex + 1).map((profile, index) => (
                <SwipeCard
                  key={profile.id}
                  profile={profile}
                  onSwipe={handleSwipe}
                  isActive={true}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Match Notification */}
      {showMatch && matchedProfile && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 max-w-sm mx-4 text-center space-y-6 animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
            <div className="relative">
              <div className="w-32 h-32 mx-auto rounded-full overflow-hidden ring-4 ring-pink-500 ring-offset-4 ring-offset-white dark:ring-offset-gray-800">
                <img
                  src={matchedProfile.images[0] || `https://api.dicebear.com/7.x/avataaars/svg?seed=${matchedProfile.id}`}
                  alt={matchedProfile.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -top-2 -right-2 w-12 h-12 bg-gradient-to-br from-pink-500 to-rose-500 rounded-full flex items-center justify-center animate-bounce">
                <Heart className="w-6 h-6 text-white" fill="currentColor" />
              </div>
            </div>
            
            <div className="space-y-2">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-pink-500 to-rose-500 bg-clip-text text-transparent">
                It's a Match!
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                You and {matchedProfile.name} liked each other
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowMatch(false);
                  // Navigate to matched chat with profile data
                  const params = new URLSearchParams({
                    name: matchedProfile.name,
                    age: matchedProfile.age.toString(),
                    bio: matchedProfile.bio,
                    location: matchedProfile.location,
                    images: matchedProfile.images.join(','),
                    walletAddress: matchedProfile.id // Using ID as wallet address for now
                  });
                  router.push(`/chat/match/${matchedProfile.id}?${params.toString()}`);
                }}
                className="flex-1 btn-primary flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-5 h-5" />
                Send Message
              </button>
              <button
                onClick={() => setShowMatch(false)}
                className="flex-1 btn-outline"
              >
                Keep Swiping
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}