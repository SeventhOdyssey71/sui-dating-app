'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { X, Loader2, Package, Image as ImageIcon, CheckCircle } from 'lucide-react';

interface NFT {
  id: string;
  name: string;
  description: string;
  url: string;
  creator: string;
  collection: string;
  attributes: Array<{
    trait_type: string;
    value: string;
  }>;
}

interface NFTSelectorProps {
  onClose: () => void;
  onSelect: (nfts: NFT[]) => void;
  multiple?: boolean;
}

export function NFTSelector({ onClose, onSelect, multiple = false }: NFTSelectorProps) {
  const { currentAccount } = useAuth();
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNfts, setSelectedNfts] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (currentAccount) {
      fetchNFTs();
    }
  }, [currentAccount]);

  const fetchNFTs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/nft/list?address=${currentAccount}`);
      const data = await response.json();
      
      if (data.success) {
        setNfts(data.nfts);
      } else {
        setError(data.error || 'Failed to fetch NFTs');
      }
    } catch (error) {
      console.error('Error fetching NFTs:', error);
      setError('Failed to fetch NFTs');
    } finally {
      setLoading(false);
    }
  };

  const toggleSelection = (nftId: string) => {
    if (multiple) {
      const newSelection = new Set(selectedNfts);
      if (newSelection.has(nftId)) {
        newSelection.delete(nftId);
      } else {
        newSelection.add(nftId);
      }
      setSelectedNfts(newSelection);
    } else {
      setSelectedNfts(new Set([nftId]));
    }
  };

  const handleConfirm = () => {
    const selected = nfts.filter(nft => selectedNfts.has(nft.id));
    onSelect(selected);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="glass w-full max-w-4xl max-h-[80vh] overflow-hidden flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-2xl font-bold">Select NFT{multiple ? 's' : ''}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="space-y-4 text-center">
                <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
                <p className="text-muted-foreground">Loading your NFT collection...</p>
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-20">
              <div className="inline-flex p-4 rounded-2xl glass mb-4">
                <Package className="w-12 h-12 text-destructive" />
              </div>
              <p className="text-destructive mb-4">{error}</p>
              <button onClick={fetchNFTs} className="btn-secondary">
                Retry
              </button>
            </div>
          ) : nfts.length === 0 ? (
            <div className="text-center py-20">
              <div className="inline-flex p-4 rounded-2xl glass mb-4">
                <Package className="w-16 h-16 text-muted-foreground" />
              </div>
              <p className="text-lg mb-2">No NFTs found in your wallet</p>
              <p className="text-muted-foreground">
                Mint some NFTs to get started!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {nfts.map((nft) => (
                <button
                  key={nft.id}
                  onClick={() => toggleSelection(nft.id)}
                  className={`group glass p-4 rounded-2xl border transition-all duration-300 hover:scale-105 ${
                    selectedNfts.has(nft.id) 
                      ? 'border-primary/50 bg-primary/10' 
                      : 'border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="relative aspect-square mb-3 rounded-xl overflow-hidden bg-white/5">
                    {nft.url ? (
                      <img
                        src={nft.url}
                        alt={nft.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        onError={(e) => {
                          e.currentTarget.src = '';
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="w-10 h-10 text-muted-foreground" />
                      </div>
                    )}
                    {selectedNfts.has(nft.id) && (
                      <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                        <div className="bg-primary rounded-full p-2">
                          <CheckCircle className="w-6 h-6 text-white" />
                        </div>
                      </div>
                    )}
                  </div>
                  <h3 className="font-semibold text-sm mb-1 truncate">{nft.name}</h3>
                  <p className="text-xs text-muted-foreground truncate">
                    {nft.collection}
                  </p>
                  {nft.attributes.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {nft.attributes.slice(0, 2).map((attr, idx) => (
                        <span
                          key={idx}
                          className="text-xs glass px-2 py-1 rounded-lg"
                        >
                          {attr.value}
                        </span>
                      ))}
                      {nft.attributes.length > 2 && (
                        <span className="text-xs text-muted-foreground">
                          +{nft.attributes.length - 2}
                        </span>
                      )}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {nfts.length > 0 && !loading && !error && (
          <div className="p-6 border-t border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-primary" />
              <p className="text-sm">
                <span className="font-semibold text-primary">{selectedNfts.size}</span>
                <span className="text-muted-foreground"> NFT{selectedNfts.size !== 1 ? 's' : ''} selected</span>
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={onClose} className="btn-secondary">
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={selectedNfts.size === 0}
                className="btn-primary"
              >
                Attach NFT{selectedNfts.size > 1 ? 's' : ''}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}