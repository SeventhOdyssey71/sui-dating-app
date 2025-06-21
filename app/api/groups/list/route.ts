import { NextRequest, NextResponse } from 'next/server';
import { suiClient } from '@/lib/sui-client';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userAddress = searchParams.get('address');

    const client = suiClient;

    // Get GroupRegistry object
    const registry = await client.getObject({
      id: process.env.NEXT_PUBLIC_GROUP_REGISTRY_ID!,
      options: {
        showContent: true,
      },
    });

    if (!registry.data?.content || registry.data.content.dataType !== 'moveObject') {
      return NextResponse.json(
        { success: false, error: 'Failed to fetch group registry' },
        { status: 500 }
      );
    }

    const fields = registry.data.content.fields as any;

    // Get user's groups if address provided
    let userGroups: string[] = [];
    if (userAddress && fields.user_groups) {
      // This would need to be implemented with dynamic field access
      // For now, returning empty array
      userGroups = [];
    }

    return NextResponse.json({
      success: true,
      totalGroups: fields.total_groups,
      totalMessages: fields.total_messages,
      userGroups,
    });
  } catch (error: any) {
    console.error('Error fetching groups:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch groups' },
      { status: 500 }
    );
  }
}