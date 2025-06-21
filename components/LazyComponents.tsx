import dynamic from 'next/dynamic';

// Lazy load game components
export const DiceGame = dynamic(
  () => import('./games/DiceGame').then(mod => mod.DiceGame),
  { 
    loading: () => <div className="animate-pulse h-96 bg-muted rounded-lg" />,
    ssr: false 
  }
);

export const TriviaGame = dynamic(
  () => import('./games/TriviaGame').then(mod => mod.TriviaGame),
  { 
    loading: () => <div className="animate-pulse h-96 bg-muted rounded-lg" />,
    ssr: false 
  }
);

// Lazy load heavy components
export const NFTGallery = dynamic(
  () => import('./NFTGallery'),
  { 
    loading: () => <div className="animate-pulse h-64 bg-muted rounded-lg" />,
    ssr: false 
  }
);

export const MessageList = dynamic(
  () => import('./MessageList'),
  { 
    loading: () => <div className="animate-pulse h-96 bg-muted rounded-lg" />,
    ssr: false 
  }
);