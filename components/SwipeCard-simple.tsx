'use client';

import { useState, useRef } from 'react';
import { Heart, X, Star, MapPin } from 'lucide-react';
import Image from 'next/image';

interface UserProfile {
  id: string;
  name: string;
  age: number;
  bio: string;
  location: string;
  images: string[];
  interests: string[];
}

interface SwipeCardProps {
  profile: UserProfile;
  onSwipe: (direction: 'left' | 'right' | 'super') => void;
  isActive: boolean;
}

export function SwipeCard({ profile, onSwipe, isActive }: SwipeCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  if (!isActive) return null;

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % profile.images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + profile.images.length) % profile.images.length);
  };

  return (
    <div className="absolute inset-0">
      <div className="relative h-full w-full max-w-md mx-auto">
        {/* Card */}
        <div className="relative h-full rounded-3xl overflow-hidden bg-white shadow-2xl">
          {/* Image */}
          <div className="relative h-full">
            {profile.images.length > 0 ? (
              <div className="relative h-full w-full bg-gray-200">
                <img
                  src={profile.images[currentImageIndex]}
                  alt={profile.name}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    // Fallback to avatar if image fails to load
                    e.currentTarget.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.id}`;
                  }}
                />
              </div>
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                <img
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.id}`}
                  alt={profile.name}
                  className="h-2/3 w-2/3 object-contain"
                />
              </div>
            )}
            
            {/* Image navigation */}
            {profile.images.length > 1 && (
              <>
                <div className="absolute top-4 left-0 right-0 flex justify-center gap-1 z-10">
                  {profile.images.map((_, index) => (
                    <div
                      key={index}
                      className={`h-1 rounded-full transition-all ${
                        index === currentImageIndex
                          ? 'w-8 bg-white'
                          : 'w-4 bg-white/50'
                      }`}
                    />
                  ))}
                </div>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    prevImage();
                  }}
                  className="absolute left-0 top-0 w-1/2 h-full"
                  aria-label="Previous image"
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    nextImage();
                  }}
                  className="absolute right-0 top-0 w-1/2 h-full"
                  aria-label="Next image"
                />
              </>
            )}
            
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
            
            {/* Profile info */}
            <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
              <div className="flex items-baseline gap-2 mb-2">
                <h2 className="text-3xl font-bold">{profile.name}</h2>
                <span className="text-2xl">{profile.age}</span>
              </div>
              
              <div className="flex items-center gap-2 mb-3">
                <MapPin className="w-4 h-4" />
                <span className="text-sm">{profile.location}</span>
              </div>
              
              <p className="text-sm opacity-90 line-clamp-2">{profile.bio}</p>
              
              {profile.interests.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {profile.interests.slice(0, 3).map((interest, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs"
                    >
                      {interest}
                    </span>
                  ))}
                  {profile.interests.length > 3 && (
                    <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs">
                      +{profile.interests.length - 3} more
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
          
          {/* Action buttons */}
          <div className="absolute bottom-24 left-0 right-0 flex justify-center gap-4 px-6">
            <button
              onClick={() => onSwipe('left')}
              className="w-14 h-14 rounded-full bg-white shadow-lg flex items-center justify-center hover:shadow-xl transition-shadow"
            >
              <X className="w-7 h-7 text-red-500" />
            </button>
            
            <button
              onClick={() => onSwipe('super')}
              className="w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center hover:shadow-xl transition-shadow"
            >
              <Star className="w-6 h-6 text-blue-500" />
            </button>
            
            <button
              onClick={() => onSwipe('right')}
              className="w-14 h-14 rounded-full bg-white shadow-lg flex items-center justify-center hover:shadow-xl transition-shadow"
            >
              <Heart className="w-7 h-7 text-green-500" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}