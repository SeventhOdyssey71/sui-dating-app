'use client';

import { WalletConnect } from '@/components/WalletConnect';
import { useAuth } from '@/contexts/AuthContext';
import { Heart, Sparkles, Shield, MessageCircle, Users, Star, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useRef } from 'react';

export default function Home() {
  const { isConnected } = useAuth();
  const featuresRef = useRef<HTMLDivElement>(null);

  useEffect(() => {

    // Intersection observer for scroll animations
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.1 }
    );

    const elements = document.querySelectorAll('.scroll-fade-in');
    elements.forEach((el) => observer.observe(el));

    return () => {
      elements.forEach((el) => observer.unobserve(el));
    };
  }, []);

  return (
    <main className="min-h-screen bg-white overflow-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 glass-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center">
                <Heart className="w-5 h-5 text-white" fill="white" />
              </div>
              <h1 className="text-2xl font-bold">Discoveer</h1>
            </div>
            <div className="flex items-center gap-6">
              <Link href="/about" className="hidden md:block text-gray-600 hover:text-black transition-colors">
                About
              </Link>
              <Link href="/features" className="hidden md:block text-gray-600 hover:text-black transition-colors">
                Features
              </Link>
              <WalletConnect />
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center pt-20">
        {/* Background blur elements */}
        <div className="blur-circle w-96 h-96 bg-gray-200 -top-48 -left-48" />
        <div className="blur-circle w-96 h-96 bg-gray-100 -bottom-48 -right-48" />

        <div className="relative z-10 max-w-6xl mx-auto px-6 text-center">
          <div className="animate-fade-in">
           
            <h1 className="heading-1 mb-6">
              Find Your Perfect
              <br />
              <span className="text-gradient-black">Match on Web3</span>
            </h1>
            
            <p className="body-large max-w-2xl mx-auto mb-12 text-gray-600">
              Experience dating reimagined with blockchain verification, 
              encrypted messaging, and authentic connections.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {isConnected ? (
                <>
                  <Link href="/swipe" className="btn-primary group">
                    Start Matching
                    <Heart className="w-5 h-5 ml-2 group-hover:scale-110 transition-transform" />
                  </Link>
                  <Link href="/matches" className="btn-glass">
                    View Matches
                  </Link>
                </>
              ) : (
                <>
                  <WalletConnect />
                  <button className="btn-secondary">
                    How It Works
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 mt-20 animate-slide-up">
            <div className="text-center">
              <p className="text-4xl font-bold">15K+</p>
              <p className="text-gray-600 mt-1">Active Matches</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold">98%</p>
              <p className="text-gray-600 mt-1">Match Rate</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold">4.9★</p>
              <p className="text-gray-600 mt-1">User Rating</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section ref={featuresRef} className="section-padding relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16 scroll-fade-in">
            <h2 className="heading-2 mb-4">
              Dating Made <span className="text-gradient-black">Better</span>
            </h2>
            <p className="body-large text-gray-600 max-w-2xl mx-auto">
              Discover features designed for meaningful connections
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="card-glass card-hover scroll-fade-in">
              <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center mb-6">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h3 className="heading-3 mb-4">Verified Profiles</h3>
              <p className="text-gray-600 mb-6">
                Every profile is verified on the blockchain, ensuring authentic connections and eliminating fake accounts.
              </p>
              <Link href="/swipe" className="inline-flex items-center font-medium group">
                Learn More 
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            <div className="card-glass card-hover scroll-fade-in" style={{ transitionDelay: '200ms' }}>
              <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center mb-6">
                <MessageCircle className="w-8 h-8 text-white" />
              </div>
              <h3 className="heading-3 mb-4">Encrypted Chat</h3>
              <p className="text-gray-600 mb-6">
                Your conversations are secured with end-to-end encryption, giving you privacy and peace of mind.
              </p>
              <Link href="/chat" className="inline-flex items-center font-medium group">
                Start Chatting 
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            <div className="card-glass card-hover scroll-fade-in" style={{ transitionDelay: '400ms' }}>
              <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center mb-6">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h3 className="heading-3 mb-4">Ice Breakers</h3>
              <p className="text-gray-600 mb-6">
                Play fun mini-games together to break the ice and earn rewards while getting to know each other.
              </p>
              <Link href="/games" className="inline-flex items-center font-medium group">
                Play Games 
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="section-padding bg-gray-50 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16 scroll-fade-in">
            <h2 className="heading-2 mb-4">How It Works</h2>
            <p className="body-large text-gray-600 max-w-2xl mx-auto">
              Get started in minutes
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { step: '01', title: 'Connect Wallet', desc: 'Link your Web3 wallet to get started' },
              { step: '02', title: 'Create Profile', desc: 'Set up your verified blockchain profile' },
              { step: '03', title: 'Start Swiping', desc: 'Discover potential matches nearby' },
              { step: '04', title: 'Match & Chat', desc: 'Connect and chat with your matches' },
            ].map((item, idx) => (
              <div key={idx} className="text-center scroll-fade-in" style={{ transitionDelay: `${idx * 100}ms` }}>
                <div className="w-20 h-20 mx-auto mb-6 glass-black rounded-full flex items-center justify-center">
                  <span className="text-2xl font-bold">{item.step}</span>
                </div>
                <h3 className="font-bold text-xl mb-2">{item.title}</h3>
                <p className="text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="section-padding relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16 scroll-fade-in">
            <h2 className="heading-2 mb-4">Success Stories</h2>
            <p className="body-large text-gray-600 max-w-2xl mx-auto">
              Real connections, real people
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { name: 'Sarah & Mike', time: '3 months ago', text: 'We matched through our mutual love for DeFi and haven\'t looked back since!' },
              { name: 'Alex & Jordan', time: '6 months ago', text: 'The blockchain verification gave us confidence we were talking to real people.' },
              { name: 'Emma & Chris', time: '1 year ago', text: 'Playing games together was the perfect ice breaker. Now we\'re engaged!' },
            ].map((story, idx) => (
              <div key={idx} className="card-glass scroll-fade-in" style={{ transitionDelay: `${idx * 100}ms` }}>
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-black" />
                  ))}
                </div>
                <p className="text-gray-600 mb-4">"{story.text}"</p>
                <div className="flex items-center justify-between">
                  <p className="font-bold">{story.name}</p>
                  <p className="text-sm text-gray-500">{story.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-padding relative">
        <div className="max-w-4xl mx-auto px-6">
          <div className="card-glass text-center py-16 scroll-fade-in">
            <h2 className="heading-2 mb-6">
              Ready to Find Your Match?
            </h2>
            <p className="body-large text-gray-600 mb-8 max-w-2xl mx-auto">
              Join thousands of verified users finding meaningful connections on the blockchain.
            </p>
            {!isConnected ? (
              <WalletConnect />
            ) : (
              <Link href="/swipe" className="btn-primary inline-flex items-center">
                Start Matching
                <Heart className="w-5 h-5 ml-2" />
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black text-white py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-3 mb-4 md:mb-0">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                <Heart className="w-5 h-5 text-black" fill="black" />
              </div>
              <h3 className="text-xl font-bold">Discoveer</h3>
            </div>
            <div className="flex gap-6">
              <Link href="/privacy" className="text-gray-400 hover:text-white transition-colors">Privacy</Link>
              <Link href="/terms" className="text-gray-400 hover:text-white transition-colors">Terms</Link>
              <Link href="/help" className="text-gray-400 hover:text-white transition-colors">Help</Link>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-center text-gray-400">
            <p>&copy; 2025 Discoveer. Built with love on Sui blockchain.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}