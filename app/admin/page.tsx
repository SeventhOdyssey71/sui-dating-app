'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { WalletConnect } from '@/components/WalletConnect';
import { Activity, Users, DollarSign, AlertCircle, TrendingUp, TrendingDown } from 'lucide-react';

// Admin addresses - replace with actual admin addresses
const ADMIN_ADDRESSES = [
  '0xabc123...', // Replace with actual admin address
];

export default function AdminDashboard() {
  const { isConnected, address } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const isAdmin = address && ADMIN_ADDRESSES.includes(address);

  useEffect(() => {
    if (isAdmin) {
      fetchStats();
      const interval = setInterval(fetchStats, 30000); // Refresh every 30s
      return () => clearInterval(interval);
    }
  }, [isAdmin]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      // Fetch various stats
      const [diceStats, triviaStats] = await Promise.all([
        fetch('/api/games/dice/stats').then(r => r.json()),
        fetch('/api/games/trivia/current').then(r => r.json()),
      ]);

      setStats({
        dice: diceStats.stats,
        trivia: triviaStats.stats,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <main className="min-h-screen bg-gradient-subtle">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Admin Access Required</h2>
            <p className="text-muted-foreground mb-6">
              Please connect your admin wallet to access the dashboard
            </p>
            <WalletConnect />
          </div>
        </div>
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main className="min-h-screen bg-gradient-subtle">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Access Denied</h2>
            <p className="text-muted-foreground">
              You don't have permission to access this page
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-subtle">
      <nav className="border-b bg-background/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Activity className="w-6 h-6" />
              Admin Dashboard
            </h1>
            <WalletConnect />
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="card p-6 animate-pulse">
                <div className="h-4 bg-muted rounded w-1/2 mb-2" />
                <div className="h-8 bg-muted rounded w-3/4" />
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* Dice Game Stats */}
            <h2 className="text-2xl font-semibold mb-6">Dice Game</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="card p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-muted-foreground">House Balance</p>
                  <DollarSign className="w-4 h-4 text-muted-foreground" />
                </div>
                <p className="text-2xl font-bold">
                  {stats?.dice?.balance ? (parseInt(stats.dice.balance) / 1e9).toFixed(2) : '0'} SUI
                </p>
              </div>

              <div className="card p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-muted-foreground">Total Games</p>
                  <Activity className="w-4 h-4 text-muted-foreground" />
                </div>
                <p className="text-2xl font-bold">{stats?.dice?.totalGames || '0'}</p>
              </div>

              <div className="card p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-muted-foreground">Win Rate</p>
                  {stats?.dice?.winRate > 16.67 ? (
                    <TrendingUp className="w-4 h-4 text-destructive" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-primary" />
                  )}
                </div>
                <p className="text-2xl font-bold">{stats?.dice?.winRate || '0'}%</p>
              </div>

              <div className="card p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Activity className="w-4 h-4 text-muted-foreground" />
                </div>
                <p className="text-2xl font-bold">
                  {stats?.dice?.paused ? 'Paused' : 'Active'}
                </p>
              </div>
            </div>

            {/* Trivia Game Stats */}
            <h2 className="text-2xl font-semibold mb-6">Trivia Game</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="card p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-muted-foreground">Prize Pool</p>
                  <DollarSign className="w-4 h-4 text-muted-foreground" />
                </div>
                <p className="text-2xl font-bold">
                  {stats?.trivia?.balance ? (parseInt(stats.trivia.balance) / 1e9).toFixed(2) : '0'} SUI
                </p>
              </div>

              <div className="card p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-muted-foreground">Questions Answered</p>
                  <Users className="w-4 h-4 text-muted-foreground" />
                </div>
                <p className="text-2xl font-bold">
                  {stats?.trivia?.totalQuestionsAnswered || '0'}
                </p>
              </div>

              <div className="card p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Activity className="w-4 h-4 text-muted-foreground" />
                </div>
                <p className="text-2xl font-bold">
                  {stats?.trivia?.paused ? 'Paused' : 'Active'}
                </p>
              </div>

              <div className="card p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-muted-foreground">Active Question</p>
                  <Activity className="w-4 h-4 text-muted-foreground" />
                </div>
                <p className="text-2xl font-bold">
                  {stats?.hasActiveQuestion ? 'Yes' : 'No'}
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <h2 className="text-2xl font-semibold mb-6">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <button className="card p-6 hover:shadow-lg transition-shadow text-left">
                <h3 className="font-semibold mb-2">Fund Dice Game</h3>
                <p className="text-sm text-muted-foreground">
                  Add more SUI to the dice game house
                </p>
              </button>

              <button className="card p-6 hover:shadow-lg transition-shadow text-left">
                <h3 className="font-semibold mb-2">Activate Trivia Question</h3>
                <p className="text-sm text-muted-foreground">
                  Start a new trivia round
                </p>
              </button>

              <button className="card p-6 hover:shadow-lg transition-shadow text-left">
                <h3 className="font-semibold mb-2">Export Analytics</h3>
                <p className="text-sm text-muted-foreground">
                  Download usage statistics
                </p>
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}