'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Bug, Users, Heart, X } from 'lucide-react';

export function DatingDebugPanel() {
  const { currentAccount } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [stats, setStats] = useState<any>({});

  useEffect(() => {
    if (isOpen) {
      fetchStats();
    }
  }, [isOpen]);

  const fetchStats = async () => {
    try {
      const { suiClient } = await import('@/lib/sui-client');
      
      // Get registry stats
      const registry = await suiClient.getObject({
        id: '0x35958e4cf122a0cb7c0626b53509257540f4e08b83ef60ebbeb04cc004cc2428',
        options: { showContent: true },
      });

      // Get recent events
      const [userEvents, swipeEvents, matchEvents] = await Promise.all([
        suiClient.queryEvents({
          query: { MoveEventType: '0xbc4755164aecf28506c260516e2239ab911b3ba699ba62a7a316d675cede4eb5::dating_platform::UserRegistered' },
          limit: 10,
        }),
        suiClient.queryEvents({
          query: { MoveEventType: '0xbc4755164aecf28506c260516e2239ab911b3ba699ba62a7a316d675cede4eb5::dating_platform::SwipeEvent' },
          limit: 20,
        }),
        suiClient.queryEvents({
          query: { MoveEventType: '0xbc4755164aecf28506c260516e2239ab911b3ba699ba62a7a316d675cede4eb5::dating_platform::MatchCreated' },
          limit: 10,
        }),
      ]);

      setStats({
        totalUsers: registry.data?.content?.fields?.total_users || 0,
        recentUsers: userEvents.data.length,
        recentSwipes: swipeEvents.data.length,
        recentMatches: matchEvents.data.length,
        userEvents: userEvents.data,
        swipeEvents: swipeEvents.data,
        matchEvents: matchEvents.data,
      });
    } catch (error) {
      console.error('Error fetching debug stats:', error);
    }
  };

  if (process.env.NODE_ENV !== 'development') return null;

  return (
    <>
      {/* Debug Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-20 right-4 p-2 bg-purple-500 text-white rounded-full shadow-lg hover:bg-purple-600 transition-colors"
        title="Debug Panel"
      >
        <Bug className="w-5 h-5" />
      </button>

      {/* Debug Panel */}
      {isOpen && (
        <div className="fixed bottom-32 right-4 w-96 bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-4 max-h-96 overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg">Dating Debug Panel</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-4">
            {/* Current User */}
            <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded">
              <p className="text-sm font-medium">Current Account</p>
              <p className="text-xs font-mono truncate">{currentAccount}</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
                <Users className="w-4 h-4 text-blue-500 mb-1" />
                <p className="text-sm font-medium">{stats.totalUsers || 0}</p>
                <p className="text-xs text-gray-500">Total Users</p>
              </div>
              <div className="p-3 bg-pink-50 dark:bg-pink-900/20 rounded">
                <Heart className="w-4 h-4 text-pink-500 mb-1" />
                <p className="text-sm font-medium">{stats.recentMatches || 0}</p>
                <p className="text-xs text-gray-500">Recent Matches</p>
              </div>
            </div>

            {/* Recent Activity */}
            <div>
              <h4 className="font-medium text-sm mb-2">Recent Activity</h4>
              <div className="space-y-2 text-xs">
                {stats.userEvents?.slice(0, 3).map((event: any, i: number) => (
                  <div key={i} className="p-2 bg-gray-50 dark:bg-gray-700 rounded">
                    <p className="font-medium">New User Registered</p>
                    <p className="font-mono truncate">{event.parsedJson?.user}</p>
                  </div>
                ))}
                {stats.matchEvents?.slice(0, 2).map((event: any, i: number) => (
                  <div key={i} className="p-2 bg-pink-50 dark:bg-pink-900/20 rounded">
                    <p className="font-medium text-pink-600">Match Created! 💕</p>
                    <p className="font-mono truncate text-xs">
                      {event.parsedJson?.user1?.slice(0, 8)}... ↔ {event.parsedJson?.user2?.slice(0, 8)}...
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="pt-2 border-t">
              <button
                onClick={() => {
                  if (currentAccount) {
                    localStorage.removeItem(`registered_${currentAccount}`);
                    localStorage.removeItem(`blockchain_registered_${currentAccount}`);
                    window.location.reload();
                  }
                }}
                className="w-full py-2 px-3 bg-red-500 text-white rounded text-sm hover:bg-red-600"
              >
                Reset Registration Status
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}