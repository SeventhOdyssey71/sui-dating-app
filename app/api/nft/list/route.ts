import { NextRequest, NextResponse } from 'next/server';
import { getUserNFTs } from '@/lib/nft-client';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const address = searchParams.get('address');

    if (!address) {
      return NextResponse.json(
        { error: 'Address parameter is required' },
        { status: 400 }
      );
    }

    const nfts = await getUserNFTs(address);

    return NextResponse.json({
      success: true,
      nfts,
      count: nfts.length,
    });
  } catch (error: any) {
    console.error('Error fetching NFTs:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch NFTs' },
      { status: 500 }
    );
  }
}