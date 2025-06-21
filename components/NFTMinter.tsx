'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Plus, X } from 'lucide-react';
import { useNFTTransactions } from '@/hooks/useNFTTransactions';

interface NFTMinterProps {
  onClose: () => void;
  onMinted?: () => void;
}

export function NFTMinter({ onClose, onMinted }: NFTMinterProps) {
  const { currentAccount } = useAuth();
  const { mintNFT } = useNFTTransactions();
  const [minting, setMinting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    url: '',
    attributes: [] as Array<{ trait_type: string; value: string }>,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentAccount || minting) return;

    setMinting(true);
    
    mintNFT(
      formData.name,
      formData.description,
      formData.url,
      formData.attributes,
      currentAccount,
      (result) => {
        alert('NFT minted successfully!');
        onMinted?.();
        onClose();
        setMinting(false);
      },
      (error) => {
        alert('Failed to mint NFT: ' + error.message);
        setMinting(false);
      }
    );
  };

  const addAttribute = () => {
    setFormData({
      ...formData,
      attributes: [...formData.attributes, { trait_type: '', value: '' }],
    });
  };

  const removeAttribute = (index: number) => {
    setFormData({
      ...formData,
      attributes: formData.attributes.filter((_, i) => i !== index),
    });
  };

  const updateAttribute = (index: number, field: 'trait_type' | 'value', value: string) => {
    const newAttributes = [...formData.attributes];
    newAttributes[index][field] = value;
    setFormData({ ...formData, attributes: newAttributes });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="glass w-full max-w-md p-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Mint Test NFT</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-3 text-muted-foreground uppercase tracking-wider">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              placeholder="My Awesome NFT"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-3 text-muted-foreground uppercase tracking-wider">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              placeholder="A unique digital collectible"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-3 text-muted-foreground uppercase tracking-wider">Image URL</label>
            <input
              type="url"
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              required
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              placeholder="https://example.com/image.png"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Attributes (Optional)</label>
              <button
                type="button"
                onClick={addAttribute}
                className="text-sm text-primary hover:text-primary/80 flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                Add
              </button>
            </div>
            {formData.attributes.map((attr, index) => (
              <div key={index} className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={attr.trait_type}
                  onChange={(e) => updateAttribute(index, 'trait_type', e.target.value)}
                  placeholder="Trait"
                  className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm transition-all"
                />
                <input
                  type="text"
                  value={attr.value}
                  onChange={(e) => updateAttribute(index, 'value', e.target.value)}
                  placeholder="Value"
                  className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm transition-all"
                />
                <button
                  type="button"
                  onClick={() => removeAttribute(index)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-destructive/20 transition-colors"
                >
                  <X className="w-4 h-4 text-destructive" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 btn-secondary"
              disabled={minting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={minting || !currentAccount}
              className="flex-1 btn-primary flex items-center justify-center"
            >
              {minting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Minting...
                </>
              ) : (
                'Mint NFT'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}