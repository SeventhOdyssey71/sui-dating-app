import { useState } from 'react';
import { useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { useAuth } from '@/contexts/AuthContext';
import { SUI_CLOCK_OBJECT_ID } from '@/lib/sui-config';

// Dating platform contract addresses from deployed contract
const DATING_PACKAGE_ID = process.env.NEXT_PUBLIC_DATING_PACKAGE_ID || '0xbc4755164aecf28506c260516e2239ab911b3ba699ba62a7a316d675cede4eb5';
const USER_REGISTRY_ID = process.env.NEXT_PUBLIC_USER_REGISTRY_ID || '0x35958e4cf122a0cb7c0626b53509257540f4e08b83ef60ebbeb04cc004cc2428';
const MATCH_REGISTRY_ID = process.env.NEXT_PUBLIC_MATCH_REGISTRY_ID || '0xff1c359e49984d0a177f67c3da71920ea23686f45de99931b55ab7c1cd4d65e1';

interface UserProfile {
  id: string;
  name: string;
  age: number;
  bio: string;
  location: string;
  images: string[];
  interests: string[];
}

export function useDatingPlatform() {
  const { currentAccount } = useAuth();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const [loading, setLoading] = useState(false);

  const registerUser = async (
    name: string,
    bio: string,
    age: number,
    location: string,
    onSuccess?: () => void,
    onError?: (error: any) => void
  ) => {
    const tx = new Transaction();
    
    // Set gas budget to ensure transaction goes through
    tx.setGasBudget(100000000); // 0.1 SUI
    
    tx.moveCall({
      target: `${DATING_PACKAGE_ID}::dating_platform::register_user`,
      arguments: [
        tx.object(USER_REGISTRY_ID),
        tx.pure.string(name),
        tx.pure.string(bio),
        tx.pure.u8(age),
        tx.pure.string(location),
        tx.object(SUI_CLOCK_OBJECT_ID),
      ],
    });

    signAndExecute(
      {
        transaction: tx,
        options: {
          showEffects: true,
          showEvents: true,
        },
      },
      {
        onSuccess: (result) => {
          console.log('User registered successfully:', result);
          onSuccess?.();
        },
        onError: (error) => {
          console.error('Failed to register user:', error);
          // Check if it's an already registered error
          if (error.message && error.message.includes('MoveAbort') && error.message.includes(', 1)')) {
            onError?.(new Error('You are already registered on this platform.'));
          } else {
            onError?.(error);
          }
        },
      }
    );
  };

  const updateProfile = async (
    profileId: string,
    name: string,
    bio: string,
    age: number,
    location: string,
    onSuccess?: () => void,
    onError?: (error: any) => void
  ) => {
    const tx = new Transaction();
    
    tx.moveCall({
      target: `${DATING_PACKAGE_ID}::dating_platform::update_profile`,
      arguments: [
        tx.object(profileId),
        tx.pure.string(name),
        tx.pure.string(bio),
        tx.pure.u8(age),
        tx.pure.string(location),
        tx.object(SUI_CLOCK_OBJECT_ID),
      ],
    });

    signAndExecute(
      {
        transaction: tx,
        options: {
          showEffects: true,
        },
      },
      {
        onSuccess: (result) => {
          console.log('Profile updated successfully:', result);
          onSuccess?.();
        },
        onError: (error) => {
          console.error('Failed to update profile:', error);
          onError?.(error);
        },
      }
    );
  };

  const swipe = async (
    targetAddress: string,
    isLike: boolean,
    onSuccess?: (result?: any) => void,
    onError?: (error: any) => void
  ) => {
    const tx = new Transaction();
    
    // Set gas budget
    tx.setGasBudget(50000000); // 0.05 SUI
    
    tx.moveCall({
      target: `${DATING_PACKAGE_ID}::dating_platform::swipe`,
      arguments: [
        tx.object(USER_REGISTRY_ID),
        tx.object(MATCH_REGISTRY_ID),
        tx.pure.address(targetAddress),
        tx.pure.bool(isLike),
        tx.object(SUI_CLOCK_OBJECT_ID),
      ],
    });

    signAndExecute(
      {
        transaction: tx,
        options: {
          showEffects: true,
          showEvents: true,
        },
      },
      {
        onSuccess: (result) => {
          console.log('Swipe recorded:', result);
          // Check if it was a match
          if (result.events && result.events.length > 0) {
            const matchEvent = result.events.find((e: any) => 
              e.type.includes('MatchCreated')
            );
            if (matchEvent) {
              console.log('It\'s a match!', matchEvent);
            }
          }
          onSuccess?.(result);
        },
        onError: (error) => {
          console.error('Failed to swipe:', error);
          // Handle specific errors
          if (error.message && error.message.includes('E_NOT_REGISTERED')) {
            onError?.(new Error('You need to register first before swiping.'));
          } else if (error.message && error.message.includes('E_ALREADY_SWIPED')) {
            onError?.(new Error('You have already swiped on this person.'));
          } else {
            onError?.(error);
          }
        },
      }
    );
  };

  const startCall = async (
    matchId: string,
    calleeAddress: string,
    sessionType: 'audio' | 'video',
    onSuccess?: (sessionId: string) => void,
    onError?: (error: any) => void
  ) => {
    const tx = new Transaction();
    
    tx.moveCall({
      target: `${DATING_PACKAGE_ID}::dating_platform::start_call`,
      arguments: [
        tx.object(matchId),
        tx.pure.address(calleeAddress),
        tx.pure.u8(sessionType === 'audio' ? 0 : 1),
        tx.object(SUI_CLOCK_OBJECT_ID),
      ],
    });

    signAndExecute(
      {
        transaction: tx,
        options: {
          showEffects: true,
          showEvents: true,
        },
      },
      {
        onSuccess: (result) => {
          console.log('Call started:', result);
          // Extract session ID from events
          const sessionId = result.effects?.created?.[0]?.reference?.objectId || '';
          onSuccess?.(sessionId);
        },
        onError: (error) => {
          console.error('Failed to start call:', error);
          onError?.(error);
        },
      }
    );
  };

  const endCall = async (
    sessionId: string,
    onSuccess?: () => void,
    onError?: (error: any) => void
  ) => {
    const tx = new Transaction();
    
    tx.moveCall({
      target: `${DATING_PACKAGE_ID}::dating_platform::end_call`,
      arguments: [
        tx.object(sessionId),
        tx.object(SUI_CLOCK_OBJECT_ID),
      ],
    });

    signAndExecute(
      {
        transaction: tx,
        options: {
          showEffects: true,
          showEvents: true,
        },
      },
      {
        onSuccess: (result) => {
          console.log('Call ended:', result);
          onSuccess?.();
        },
        onError: (error) => {
          console.error('Failed to end call:', error);
          onError?.(error);
        },
      }
    );
  };

  // Get all registered user profiles from the blockchain
  const getProfiles = async (): Promise<UserProfile[]> => {
    setLoading(true);
    try {
      console.log('Fetching user profiles from blockchain...');
      
      const { suiClient } = await import('@/lib/sui-client');
      
      // Query all UserProfile objects created by the dating platform
      const profiles = await suiClient.queryEvents({
        query: {
          MoveEventType: `${DATING_PACKAGE_ID}::dating_platform::UserRegistered`,
        },
        limit: 50,
        order: 'descending',
      });

      console.log('Found registration events:', profiles.data.length);

      const userProfiles: UserProfile[] = [];
      const processedAddresses = new Set<string>();

      // Get profile details for each registered user
      for (const event of profiles.data) {
        if (event.parsedJson) {
          const eventData = event.parsedJson as any;
          const userAddress = eventData.user;
          const profileId = eventData.profile_id;
          
          // Skip if we already processed this user or if it's the current user
          if (processedAddresses.has(userAddress) || userAddress === currentAccount) {
            continue;
          }
          processedAddresses.add(userAddress);

          try {
            // Fetch the actual profile object
            const profileObj = await suiClient.getObject({
              id: profileId,
              options: {
                showContent: true,
              },
            });

            if (profileObj.data?.content?.dataType === 'moveObject') {
              const fields = profileObj.data.content.fields as any;
              
              // Only include active profiles
              if (fields.is_active) {
                userProfiles.push({
                  id: userAddress, // Use address as ID for swiping
                  name: fields.name,
                  age: parseInt(fields.age),
                  bio: fields.bio,
                  location: fields.location,
                  images: fields.profile_images.length > 0 
                    ? fields.profile_images 
                    : [`https://api.dicebear.com/7.x/avataaars/svg?seed=${userAddress}`], // Default avatar
                  interests: fields.interests || [],
                });
              }
            }
          } catch (error) {
            console.error('Error fetching profile:', profileId, error);
          }
        }
      }

      console.log('Loaded profiles:', userProfiles.length);

      // If no real profiles, add some demo profiles for testing
      if (userProfiles.length === 0) {
        console.log('No real profiles found, adding demo profiles...');
        return [
          {
            id: '0x0000000000000000000000000000000000000000000000000000000000000001',
            name: 'Demo Alice',
            age: 25,
            bio: 'This is a demo profile. Register to see real users!',
            location: 'Demo City',
            images: ['https://api.dicebear.com/7.x/avataaars/svg?seed=alice'],
            interests: ['Demo', 'Testing'],
          },
          {
            id: '0x0000000000000000000000000000000000000000000000000000000000000002',
            name: 'Demo Bob',
            age: 28,
            bio: 'Another demo profile. Real users will appear once they register!',
            location: 'Demo Town',
            images: ['https://api.dicebear.com/7.x/avataaars/svg?seed=bob'],
            interests: ['Demo', 'Placeholder'],
          },
        ];
      }
      
      return userProfiles;
    } catch (error) {
      console.error('Error fetching profiles:', error);
      // Return empty array on error
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Check if user is registered by querying the blockchain
  const checkRegistration = async (address: string): Promise<boolean> => {
    try {
      // First check local storage cache
      const cached = localStorage.getItem(`blockchain_registered_${address}`);
      if (cached === 'true') {
        return true;
      }

      // Query the blockchain to check if user exists in registry
      const { suiClient } = await import('@/lib/sui-client');
      
      // Get the UserRegistry object
      const registry = await suiClient.getObject({
        id: USER_REGISTRY_ID,
        options: {
          showContent: true,
        },
      });

      if (registry.data?.content?.dataType === 'moveObject') {
        const fields = registry.data.content.fields as any;
        // The registry contains a table of users, we need to check if the address exists
        // For now, we'll rely on the local storage check since table queries are complex
        return false;
      }
      
      return false;
    } catch (error) {
      console.error('Error checking registration:', error);
      return false;
    }
  };

  // Get swipe history for the current user
  const getSwipeHistory = async (): Promise<Set<string>> => {
    try {
      if (!currentAccount) return new Set();
      
      const { suiClient } = await import('@/lib/sui-client');
      
      // Query swipe events for current user
      const swipeEvents = await suiClient.queryEvents({
        query: {
          MoveEventType: `${DATING_PACKAGE_ID}::dating_platform::SwipeEvent`,
        },
        limit: 1000,
      });

      const swipedAddresses = new Set<string>();
      
      for (const event of swipeEvents.data) {
        if (event.parsedJson) {
          const eventData = event.parsedJson as any;
          if (eventData.swiper === currentAccount) {
            swipedAddresses.add(eventData.swiped);
          }
        }
      }
      
      return swipedAddresses;
    } catch (error) {
      console.error('Error fetching swipe history:', error);
      return new Set();
    }
  };

  // Get profiles excluding those already swiped
  const getUnswipedProfiles = async (): Promise<UserProfile[]> => {
    const [allProfiles, swipeHistory] = await Promise.all([
      getProfiles(),
      getSwipeHistory(),
    ]);
    
    // Filter out profiles that have been swiped
    const unswipedProfiles = allProfiles.filter(
      profile => !swipeHistory.has(profile.id)
    );
    
    console.log(`Found ${unswipedProfiles.length} unswiped profiles out of ${allProfiles.length} total`);
    return unswipedProfiles;
  };

  // Get all profiles including swiped ones (for refresh)
  const getAllProfiles = async (): Promise<UserProfile[]> => {
    return getProfiles();
  };

  // Get matches for the current user
  const getMatches = async (): Promise<UserProfile[]> => {
    if (!currentAccount) return [];
    
    try {
      const { suiClient } = await import('@/lib/sui-client');
      
      // Query match events
      const matchEvents = await suiClient.queryEvents({
        query: {
          MoveEventType: `${DATING_PACKAGE_ID}::dating_platform::MatchCreated`,
        },
        limit: 100,
        order: 'descending',
      });

      const matchedAddresses = new Set<string>();
      
      // Find all matches involving the current user
      for (const event of matchEvents.data) {
        if (event.parsedJson) {
          const eventData = event.parsedJson as any;
          if (eventData.user1 === currentAccount) {
            matchedAddresses.add(eventData.user2);
          } else if (eventData.user2 === currentAccount) {
            matchedAddresses.add(eventData.user1);
          }
        }
      }
      
      console.log('Found matches:', matchedAddresses.size);
      
      // Get profile details for each matched user
      const matchedProfiles: UserProfile[] = [];
      
      for (const address of matchedAddresses) {
        try {
          // Query for the user's profile
          const profiles = await suiClient.queryEvents({
            query: {
              MoveEventType: `${DATING_PACKAGE_ID}::dating_platform::UserRegistered`,
            },
            limit: 50,
          });
          
          for (const event of profiles.data) {
            if (event.parsedJson) {
              const eventData = event.parsedJson as any;
              if (eventData.user === address) {
                const profileId = eventData.profile_id;
                
                // Fetch the actual profile object
                const profileObj = await suiClient.getObject({
                  id: profileId,
                  options: {
                    showContent: true,
                  },
                });

                if (profileObj.data?.content?.dataType === 'moveObject') {
                  const fields = profileObj.data.content.fields as any;
                  
                  if (fields.is_active) {
                    matchedProfiles.push({
                      id: address,
                      name: fields.name,
                      age: parseInt(fields.age),
                      bio: fields.bio,
                      location: fields.location,
                      images: fields.profile_images.length > 0 
                        ? fields.profile_images 
                        : [`https://api.dicebear.com/7.x/avataaars/svg?seed=${address}`],
                      interests: fields.interests || [],
                    });
                  }
                }
                break;
              }
            }
          }
        } catch (error) {
          console.error('Error fetching matched profile:', address, error);
        }
      }
      
      return matchedProfiles;
    } catch (error) {
      console.error('Error fetching matches:', error);
      return [];
    }
  };

  return {
    registerUser,
    updateProfile,
    swipe,
    startCall,
    endCall,
    getProfiles,
    getUnswipedProfiles,
    getAllProfiles,
    getMatches,
    checkRegistration,
    loading,
  };
}