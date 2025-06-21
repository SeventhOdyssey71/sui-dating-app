'use client';

import { useState, useEffect } from 'react';
import { Users } from 'lucide-react';

export function RegistrationStats() {
  const [totalUsers, setTotalUsers] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const { suiClient } = await import('@/lib/sui-client');
      
      // Get the UserRegistry object to check total users
      const registry = await suiClient.getObject({
        id: '0x35958e4cf122a0cb7c0626b53509257540f4e08b83ef60ebbeb04cc004cc2428',
        options: {
          showContent: true,
        },
      });

      if (registry.data?.content?.dataType === 'moveObject') {
        const fields = registry.data.content.fields as any;
        setTotalUsers(parseInt(fields.total_users || '0'));
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return null;

  return (
    <div className="absolute top-4 right-4 bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2 flex items-center gap-2">
      <Users className="w-4 h-4 text-primary" />
      <span className="text-sm font-medium">
        {totalUsers} {totalUsers === 1 ? 'person' : 'people'} registered
      </span>
    </div>
  );
}