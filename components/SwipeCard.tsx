'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, useMotionValue, useTransform, useAnimation } from 'framer-motion';
import { Heart, X, Star, MapPin, Calendar } from 'lucide-react';
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
  const cardRef = useRef<HTMLDivElement>(null);
  const controls = useAnimation();
  
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  const rotateZ = useTransform(x, [-300, 300], [-30, 30]);
  const opacity = useTransform(x, [-300, -100, 0, 100, 300], [0, 1, 1, 1, 0]);
  
  // Color overlays for swipe feedback
  const likeOpacity = useTransform(x, [0, 100], [0, 1]);
  const nopeOpacity = useTransform(x, [-100, 0], [1, 0]);
  const superLikeOpacity = useTransform(y, [-100, 0], [1, 0]);

  const handleDragEnd = async (event: any, info: any) => {
    const threshold = 100;
    
    if (Math.abs(info.offset.x) > threshold) {
      const direction = info.offset.x > 0 ? 'right' : 'left';
      
      // Animate card flying off screen
      await controls.start({
        x: info.offset.x > 0 ? window.innerWidth : -window.innerWidth,
        opacity: 0,
        transition: { duration: 0.3 }
      });
      
      onSwipe(direction);
    } else if (info.offset.y < -threshold) {
      // Super like
      await controls.start({
        y: -window.innerHeight,
        opacity: 0,
        transition: { duration: 0.3 }
      });
      
      onSwipe('super');
    } else {
      // Snap back to center
      controls.start({
        x: 0,
        y: 0,
        transition: { type: 'spring', stiffness: 300, damping: 20 }
      });
    }
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % profile.images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + profile.images.length) % profile.images.length);
  };

  if (!isActive) return null;

  return (
    <motion.div
      ref={cardRef}
      className="absolute inset-0 cursor-grab active:cursor-grabbing"
      style={{ x, y, rotateZ, opacity }}
      drag
      dragElastic={0.9}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      onDragEnd={handleDragEnd}
      animate={controls}
      whileTap={{ scale: 0.95 }}
    >
      <div className="relative h-full w-full max-w-md mx-auto">
        {/* Card */}
        <div className="relative h-full rounded-3xl overflow-hidden bg-white shadow-2xl">
          {/* Image */}
          <div className="relative h-full">
            {profile.images.length > 0 ? (
              <Image
                src={profile.images[currentImageIndex]}
                alt={profile.name}
                fill
                className="object-cover"
                priority
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20" />
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
            
            {/* Like/Nope/Super Like indicators */}
            <motion.div
              className="absolute inset-0 bg-green-500/30 flex items-center justify-center"
              style={{ opacity: likeOpacity }}
            >
              <div className="transform rotate-12">
                <Heart className="w-32 h-32 text-green-500 fill-green-500" />
              </div>
            </motion.div>
            
            <motion.div
              className="absolute inset-0 bg-red-500/30 flex items-center justify-center"
              style={{ opacity: nopeOpacity }}
            >
              <div className="transform -rotate-12">
                <X className="w-32 h-32 text-red-500" strokeWidth={4} />
              </div>
            </motion.div>
            
            <motion.div
              className="absolute inset-0 bg-blue-500/30 flex items-center justify-center"
              style={{ opacity: superLikeOpacity }}
            >
              <Star className="w-32 h-32 text-blue-500 fill-blue-500" />
            </motion.div>
            
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
        </div>
      </div>
    </motion.div>
  );
}