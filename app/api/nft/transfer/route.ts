import { NextRequest, NextResponse } from 'next/server';
import { transferNFT, batchTransferNFTs } from '@/lib/nft-client';
import { getKeypairFromPrivateKey } from '@/lib/sui-utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nftId, nftIds, recipient, senderPrivateKey } = body;

    if (!recipient || !senderPrivateKey) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!nftId && (!nftIds || nftIds.length === 0)) {
      return NextResponse.json(
        { error: 'Either nftId or nftIds must be provided' },
        { status: 400 }
      );
    }

    // Create keypair from private key
    const keypair = getKeypairFromPrivateKey(senderPrivateKey);

    let result;
    
    if (nftIds && nftIds.length > 0) {
      // Batch transfer
      result = await batchTransferNFTs(nftIds, recipient, keypair);
    } else {
      // Single transfer
      result = await transferNFT({
        nftId,
        recipient,
        senderKeypair: keypair,
      });
    }

    // Extract transfer events
    const transferEvents = [];
    if (result.events) {
      for (const event of result.events) {
        if (event.type.includes('NFTTransferred')) {
          transferEvents.push(event.parsedJson);
        }
      }
    }

    return NextResponse.json({
      success: true,
      transactionDigest: result.digest,
      transferEvents,
    });
  } catch (error: any) {
    console.error('Error transferring NFT:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to transfer NFT' },
      { status: 500 }
    );
  }
}