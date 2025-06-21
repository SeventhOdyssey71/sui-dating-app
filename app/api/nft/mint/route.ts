import { NextRequest, NextResponse } from 'next/server';
import { mintNFT } from '@/lib/nft-client';
import { getKeypairFromPrivateKey } from '@/lib/sui-utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, url, attributes, recipient, minterPrivateKey } = body;

    if (!name || !description || !url || !recipient || !minterPrivateKey) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create keypair from private key
    const keypair = getKeypairFromPrivateKey(minterPrivateKey);

    // Mint NFT
    const result = await mintNFT({
      name,
      description,
      url,
      attributes,
      recipient,
      minterKeypair: keypair,
    });

    // Extract NFT ID from events
    let nftId = null;
    if (result.events) {
      for (const event of result.events) {
        if (event.type.includes('NFTMinted')) {
          nftId = event.parsedJson?.object_id;
          break;
        }
      }
    }

    return NextResponse.json({
      success: true,
      transactionDigest: result.digest,
      nftId,
    });
  } catch (error: any) {
    console.error('Error minting NFT:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to mint NFT' },
      { status: 500 }
    );
  }
}