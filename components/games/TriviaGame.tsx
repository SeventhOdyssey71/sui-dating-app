'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Brain, Clock, Trophy, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useGameTransactions } from '@/hooks/useGameTransactions';

interface Question {
  id: string;
  question: string;
  options: string[];
  rewardPool: string;
  activeUntil: string;
  totalAttempts: string;
  correctAttempts: string;
  timeRemaining: number;
}

interface LeaderboardEntry {
  player: string;
  correctAnswers: string;
  totalAttempts: string;
  accuracy: string;
  totalEarnings: string;
  currentStreak: string;
  bestStreak: string;
}

export function TriviaGame() {
  const { currentAccount } = useAuth();
  const { answerTrivia } = useGameTransactions();
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswering, setIsAnswering] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    fetchCurrentQuestion();
    fetchLeaderboard();
    const interval = setInterval(() => {
      fetchCurrentQuestion();
      fetchLeaderboard();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (currentQuestion && currentQuestion.timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1000) {
            fetchCurrentQuestion();
            return 0;
          }
          return prev - 1000;
        });
      }, 1000);
      setTimeLeft(currentQuestion.timeRemaining);
      return () => clearInterval(timer);
    }
  }, [currentQuestion]);

  const fetchCurrentQuestion = async () => {
    try {
      const response = await fetch('/api/games/trivia/current');
      const data = await response.json();
      if (data.success) {
        if (data.hasActiveQuestion) {
          setCurrentQuestion(data.question);
          setSelectedAnswer(null);
          setLastResult(null);
        } else {
          setCurrentQuestion(null);
        }
      }
    } catch (error) {
      console.error('Error fetching question:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const response = await fetch('/api/games/trivia/leaderboard');
      const data = await response.json();
      if (data.success) {
        setLeaderboard(data.leaderboard);
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    }
  };

  const submitAnswer = async () => {
    if (selectedAnswer === null || !currentAccount) return;

    setIsAnswering(true);
    
    answerTrivia(
      selectedAnswer,
      (result) => {
        if (result.answerResult) {
          setLastResult(result.answerResult);
          setTimeout(() => {
            fetchCurrentQuestion();
            fetchLeaderboard();
          }, 3000);
        }
        setIsAnswering(false);
      },
      (error) => {
        console.error('Error submitting answer:', error);
        alert('Failed to submit answer: ' + error.message);
        setIsAnswering(false);
      }
    );
  };

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatSUI = (amount: string) => {
    return (parseInt(amount) / 1_000_000_000).toFixed(3);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Game Area */}
      <div className="grid md:grid-cols-3 gap-8">
        {/* Question Area */}
        <div className="md:col-span-2 card">
          <div className="card-header">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Brain className="w-8 h-8" />
                Trivia Challenge
              </h2>
              {currentQuestion && (
                <div className="flex items-center gap-2 text-lg">
                  <Clock className="w-5 h-5" />
                  <span className="font-mono font-bold">
                    {formatTime(timeLeft)}
                  </span>
                </div>
              )}
            </div>
          </div>
          <div className="card-content">
            {loading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : currentQuestion ? (
              <div className="space-y-6">
                {/* Reward Pool */}
                <div className="flex items-center justify-between p-4 rounded-lg bg-primary/10 border border-primary/20">
                  <span className="font-medium">Reward Pool</span>
                  <span className="text-2xl font-bold text-primary">
                    {formatSUI(currentQuestion.rewardPool)} SUI
                  </span>
                </div>

                {/* Question */}
                <div>
                  <h3 className="text-xl font-semibold mb-4">
                    {currentQuestion.question}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Entry fee: 0.05 SUI | {currentQuestion.totalAttempts} attempts
                  </p>
                </div>

                {/* Options */}
                <div className="space-y-3">
                  {currentQuestion.options.map((option, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedAnswer(index)}
                      disabled={isAnswering || lastResult !== null}
                      className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                        selectedAnswer === index
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/50'
                      } ${
                        lastResult && lastResult.answer === index
                          ? lastResult.correct
                            ? 'border-green-500 bg-green-500/10'
                            : 'border-red-500 bg-red-500/10'
                          : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{option}</span>
                        {lastResult && lastResult.answer === index && (
                          lastResult.correct ? (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-500" />
                          )
                        )}
                      </div>
                    </button>
                  ))}
                </div>

                {/* Submit Button */}
                {!lastResult && (
                  <button
                    onClick={submitAnswer}
                    disabled={selectedAnswer === null || !currentAccount || isAnswering}
                    className="btn-primary w-full"
                  >
                    {isAnswering ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      'Submit Answer (0.05 SUI)'
                    )}
                  </button>
                )}

                {/* Result */}
                {lastResult && (
                  <div className={`p-4 rounded-lg border ${
                    lastResult.correct
                      ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'
                      : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
                  }`}>
                    <p className="font-semibold text-lg">
                      {lastResult.correct ? 'Correct!' : 'Incorrect'}
                    </p>
                    {lastResult.correct && lastResult.reward > 0 && (
                      <p className="text-green-600 dark:text-green-400 font-bold">
                        You won {formatSUI(lastResult.reward)} SUI!
                      </p>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-16">
                <Brain className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg font-medium mb-2">No Active Question</p>
                <p className="text-muted-foreground">
                  Please wait for the next question to be activated.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Leaderboard */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              Leaderboard
            </h3>
          </div>
          <div className="card-content">
            {leaderboard.length > 0 ? (
              <div className="space-y-3">
                {leaderboard.slice(0, 10).map((entry, index) => (
                  <div
                    key={entry.player}
                    className={`p-3 rounded-lg ${
                      index === 0
                        ? 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800'
                        : 'bg-secondary/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm">#{index + 1}</span>
                        <span className="font-medium text-sm">
                          {formatAddress(entry.player)}
                        </span>
                      </div>
                      {index === 0 && <Trophy className="w-4 h-4 text-yellow-500" />}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-muted-foreground">Accuracy:</span>{' '}
                        <span className="font-medium">{entry.accuracy}%</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Streak:</span>{' '}
                        <span className="font-medium">{entry.currentStreak}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-muted-foreground">Earnings:</span>{' '}
                        <span className="font-medium text-primary">
                          {formatSUI(entry.totalEarnings)} SUI
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No players yet. Be the first!
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}