'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { WalletConnect } from '@/components/WalletConnect';
import { Users, Plus, Lock, ArrowLeft, MessageSquare, Crown } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useGameTransactions } from '@/hooks/useGameTransactions';

export default function GroupsPage() {
  const { isConnected } = useAuth();
  const router = useRouter();
  const { createGroup } = useGameTransactions();
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [groupStats, setGroupStats] = useState<any>(null);
  const [creating, setCreating] = useState(false);
  const [groupForm, setGroupForm] = useState({
    name: '',
    description: '',
    isPublic: true,
    maxMembers: 100,
  });

  const mockGroups = [
    {
      id: '1',
      name: 'SUI Builders',
      description: 'A community for developers building on Sui',
      members: 245,
      isPublic: true,
      admin: '0x123...456',
      nftRequirements: [],
    },
    {
      id: '2',
      name: 'NFT Collectors',
      description: 'Exclusive group for NFT holders',
      members: 89,
      isPublic: false,
      admin: '0x789...012',
      nftRequirements: [{ collection: 'Cool Cats', minCount: 1 }],
    },
    {
      id: '3',
      name: 'DeFi Enthusiasts',
      description: 'Discuss DeFi strategies and opportunities',
      members: 512,
      isPublic: true,
      admin: '0xabc...def',
      nftRequirements: [],
    },
  ];

  useEffect(() => {
    fetchGroupStats();
  }, []);

  const fetchGroupStats = async () => {
    try {
      const response = await fetch('/api/groups/list');
      const data = await response.json();
      if (data.success) {
        setGroupStats(data);
      }
    } catch (error) {
      console.error('Error fetching group stats:', error);
    }
  };

  const handleCreateGroup = () => {
    if (!groupForm.name || !groupForm.description) {
      alert('Please fill in all fields');
      return;
    }

    setCreating(true);
    
    createGroup(
      groupForm.name,
      groupForm.description,
      groupForm.isPublic,
      groupForm.maxMembers,
      (result) => {
        alert(`Group created successfully! ID: ${result.groupId}`);
        setShowCreateGroup(false);
        setGroupForm({
          name: '',
          description: '',
          isPublic: true,
          maxMembers: 100,
        });
        fetchGroupStats();
        setCreating(false);
      },
      (error) => {
        alert('Failed to create group: ' + error.message);
        setCreating(false);
      }
    );
  };

  if (!isConnected) {
    return (
      <main className="min-h-screen bg-gradient-subtle">
        <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => router.push('/')}
                  className="btn-ghost"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <h1 className="text-xl font-bold flex items-center gap-2">
                  <Users className="w-6 h-6" />
                  Group Chats
                </h1>
              </div>
              <WalletConnect />
            </div>
          </div>
        </nav>

        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="text-center">
            <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Connect to Join Groups</h2>
            <p className="text-muted-foreground mb-6">
              Connect your wallet to join exclusive communities
            </p>
            <WalletConnect />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-subtle">
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/')}
                className="btn-ghost"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-xl font-bold flex items-center gap-2">
                <Users className="w-6 h-6" />
                Group Chats
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowCreateGroup(true)}
                className="btn-primary flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Create Group
              </button>
              <WalletConnect />
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        {groupStats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="card p-6">
              <p className="text-sm text-muted-foreground mb-1">Total Groups</p>
              <p className="text-2xl font-bold">{groupStats.totalGroups || '0'}</p>
            </div>
            <div className="card p-6">
              <p className="text-sm text-muted-foreground mb-1">Total Messages</p>
              <p className="text-2xl font-bold">{groupStats.totalMessages || '0'}</p>
            </div>
            <div className="card p-6">
              <p className="text-sm text-muted-foreground mb-1">Your Groups</p>
              <p className="text-2xl font-bold">{groupStats.userGroups?.length || '0'}</p>
            </div>
          </div>
        )}

        {/* Groups Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockGroups.map((group) => (
            <div
              key={group.id}
              className="card p-6 hover:shadow-lg transition-shadow cursor-pointer"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                {!group.isPublic && <Lock className="w-5 h-5 text-muted-foreground" />}
              </div>
              
              <h3 className="text-lg font-semibold mb-2">{group.name}</h3>
              <p className="text-sm text-muted-foreground mb-4">{group.description}</p>
              
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {group.members} members
                </span>
                {group.nftRequirements.length > 0 && (
                  <span className="badge-outline text-xs">
                    NFT Required
                  </span>
                )}
              </div>
              
              <div className="mt-4 pt-4 border-t">
                <button className="btn-secondary w-full">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Join Chat
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {mockGroups.length === 0 && (
          <div className="text-center py-16">
            <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium mb-2">No groups yet</p>
            <p className="text-muted-foreground mb-6">
              Be the first to create a group chat!
            </p>
            <button
              onClick={() => setShowCreateGroup(true)}
              className="btn-primary"
            >
              Create First Group
            </button>
          </div>
        )}
      </div>

      {/* Create Group Modal */}
      {showCreateGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-background rounded-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Create Group</h2>
              <button
                onClick={() => setShowCreateGroup(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="label mb-2">Group Name</label>
                <input
                  type="text"
                  placeholder="Enter group name"
                  className="input"
                  value={groupForm.name}
                  onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })}
                />
              </div>
              
              <div>
                <label className="label mb-2">Description</label>
                <textarea
                  placeholder="What is this group about?"
                  className="input min-h-[100px]"
                  value={groupForm.description}
                  onChange={(e) => setGroupForm({ ...groupForm, description: e.target.value })}
                />
              </div>
              
              <div>
                <label className="label mb-2">Privacy</label>
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    type="button"
                    onClick={() => setGroupForm({ ...groupForm, isPublic: true })}
                    className={`p-3 rounded-lg border-2 ${groupForm.isPublic ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'}`}
                  >
                    <Users className="w-5 h-5 mb-1" />
                    <p className="text-sm font-medium">Public</p>
                  </button>
                  <button 
                    type="button"
                    onClick={() => setGroupForm({ ...groupForm, isPublic: false })}
                    className={`p-3 rounded-lg border-2 ${!groupForm.isPublic ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'}`}
                  >
                    <Lock className="w-5 h-5 mb-1" />
                    <p className="text-sm font-medium">Private</p>
                  </button>
                </div>
              </div>
              
              <div>
                <label className="label mb-2">Max Members</label>
                <input
                  type="number"
                  placeholder="100"
                  className="input"
                  min="2"
                  max="100"
                  value={groupForm.maxMembers}
                  onChange={(e) => setGroupForm({ ...groupForm, maxMembers: parseInt(e.target.value) || 100 })}
                />
              </div>
              
              <button 
                className="btn-primary w-full"
                onClick={handleCreateGroup}
                disabled={creating}
              >
                {creating ? 'Creating...' : 'Create Group'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}