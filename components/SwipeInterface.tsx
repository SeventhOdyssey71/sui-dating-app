'use client';

import { useState, useEffect } from 'react';
import { SwipeCard } from './SwipeCard';
import { motion } from 'framer-motion';
import { Heart, X, Star, RefreshCw, MessageCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useDatingPlatform } from '@/hooks/useDatingPlatform';

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
  const { swipe, getProfiles, loading } = useDatingPlatform();
  
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProfiles();
  }, [currentAccount]);

  const loadProfiles = async () => {
    setIsLoading(true);
    try {
      const newProfiles = await getProfiles();
      setProfiles(newProfiles);
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
      await swipe(profile.id, isLike);
      
      // Move to next profile
      setTimeout(() => {
        setCurrentIndex((prev) => prev + 1);
        
        // Load more profiles if running low
        if (currentIndex >= profiles.length - 3) {
          loadProfiles();
        }
      }, 300);
    } catch (error) {
      console.error('Error swiping:', error);
    }
  };

  const handleActionButton = (action: 'left' | 'right' | 'super') => {
    handleSwipe(action);
  };

  const currentProfile = profiles[currentIndex];
  const hasMoreProfiles = currentIndex < profiles.length;

  return (
    <div className="relative h-full w-full flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between p-4 md:p-6 bg-white dark:bg-gray-800 shadow-sm">
        <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
          Discoveer
        </h1>
        <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
          <MessageCircle className="w-6 h-6" />
        </button>
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
                onClick={loadProfiles}
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
              {profiles.slice(currentIndex, currentIndex + 3).reverse().map((profile, index) => (
                <div
                  key={profile.id}
                  className="absolute inset-0"
                  style={{
                    zIndex: 3 - index,
                    transform: `scale(${1 - index * 0.05}) translateY(${index * 10}px)`,
                    opacity: index === 0 ? 1 : 0.5,
                  }}
                >
                  <SwipeCard
                    profile={profile}
                    onSwipe={handleSwipe}
                    isActive={index === 0}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      {hasMoreProfiles && !isLoading && (
        <div className="p-6 bg-white dark:bg-gray-800">
          <div className="flex items-center justify-center gap-4 md:gap-8">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => handleActionButton('left')}
              className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-white dark:bg-gray-700 shadow-lg flex items-center justify-center hover:shadow-xl transition-shadow"
            >
              <X className="w-7 h-7 md:w-8 md:h-8 text-red-500" />
            </motion.button>
            
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => handleActionButton('super')}
              className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-white dark:bg-gray-700 shadow-lg flex items-center justify-center hover:shadow-xl transition-shadow"
            >
              <Star className="w-6 h-6 md:w-7 md:h-7 text-blue-500" />
            </motion.button>
            
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => handleActionButton('right')}
              className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-white dark:bg-gray-700 shadow-lg flex items-center justify-center hover:shadow-xl transition-shadow"
            >
              <Heart className="w-7 h-7 md:w-8 md:h-8 text-green-500" />
            </motion.button>
          </div>
        </div>
      )}
    </div>
  );
}