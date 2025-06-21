'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { MatchedChatInterface } from '@/components/MatchedChatInterface';
import { useEffect } from 'react';

interface PageProps {
  params: {
    id: string;
  };
}

export default function MatchedChatPage({ params }: PageProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // Get profile data from search params (passed from swipe interface)
  const walletAddress = searchParams.get('walletAddress');
  
  // Don't redirect if we have an ID - use it as wallet address
  const profile = {
    id: params.id,
    name: searchParams.get('name') || 'Unknown',
    age: parseInt(searchParams.get('age') || '0'),
    bio: searchParams.get('bio') || '',
    location: searchParams.get('location') || '',
    images: searchParams.get('images')?.split(',').filter(img => img) || [],
    walletAddress: walletAddress || params.id // Always use ID as fallback
  };

  return <MatchedChatInterface matchedProfile={profile} />;
}