// @ts-nocheck - Type conflicts between @mysten/sui versions
import { SuiClient } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { getSuiRpcUrl, SUI_CONTRACTS, SUI_CLOCK_OBJECT_ID } from './sui-config';
import { blockchainCache, CACHE_KEYS } from './cache/blockchain-cache';

export const suiClient = new SuiClient({ url: getSuiRpcUrl() });

export interface SendMessageParams {
  senderKeypair?: Ed25519Keypair;
  recipient: string;
  content: string;
}

export interface Message {
  id: string;
  sender: string;
  recipient: string;
  content: string;
  timestamp: number;
  is_read: boolean;
  replyTo?: string;
}

export async function sendMessage({
  senderKeypair,
  recipient,
  content,
}: SendMessageParams) {
  if (!senderKeypair) {
    throw new Error('Sender keypair is required');
  }

  const tx = new Transaction();
  
  // Convert content to bytes
  const contentBytes = Array.from(new TextEncoder().encode(content));
  
  tx.moveCall({
    target: `${SUI_CONTRACTS.packageId}::messaging::send_message`,
    arguments: [
      tx.object(SUI_CONTRACTS.messageHubId),
      tx.pure.address(recipient),
      tx.pure(contentBytes, 'vector<u8>'),
      tx.object(SUI_CLOCK_OBJECT_ID),
    ],
  });

  const result = await suiClient.signAndExecuteTransaction({
    signer: senderKeypair,
    transactionBlock: tx,
    options: {
      showEffects: true,
      showEvents: true,
    },
  });

  // Clear message cache for both sender and recipient
  const senderAddress = senderKeypair.getPublicKey().toSuiAddress();
  blockchainCache.clear(CACHE_KEYS.MESSAGES(senderAddress));
  blockchainCache.clear(CACHE_KEYS.MESSAGES(recipient));

  return result;
}

export async function getMessages(address: string): Promise<Message[]> {
  try {
    // Use cache with getOrFetch
    const cacheKey = CACHE_KEYS.MESSAGES(address);
    
    return await blockchainCache.getOrFetch(
      cacheKey,
      async () => {
        console.log('Fetching messages for address:', address);
        console.log('Using package ID:', SUI_CONTRACTS.packageId);
        
        // Query events instead of owned objects to get all messages
        const sentEvents = await suiClient.queryEvents({
          query: {
            MoveEventType: `${SUI_CONTRACTS.packageId}::messaging::MessageSent`,
          },
          limit: 100,
          order: 'descending',
        });
        
        console.log('Found events:', sentEvents.data.length);

        const messages: Message[] = [];
        const processedIds = new Set<string>();

        // Process events to extract messages
        for (const event of sentEvents.data) {
          if (event.parsedJson) {
            const eventData = event.parsedJson as any;
            
            console.log('Event data:', eventData);
            
            // Filter messages where user is either sender or recipient
            if (eventData.sender === address || eventData.recipient === address) {
              const messageId = eventData.message_id;
              
              // Avoid duplicates
              if (processedIds.has(messageId)) continue;
              processedIds.add(messageId);
              
              // Decode content from bytes if it's an array
              let content = '';
              if (Array.isArray(eventData.content)) {
                content = new TextDecoder().decode(new Uint8Array(eventData.content));
              } else if (typeof eventData.content === 'string') {
                content = eventData.content;
              }
              
              const message = {
                id: messageId,
                sender: eventData.sender,
                recipient: eventData.recipient,
                content,
                timestamp: parseInt(eventData.timestamp),
                isRead: false, // We'll need to check this separately
                replyTo: eventData.reply_to || null,
              };
              
              console.log('Adding message:', message);
              messages.push(message);
            }
          }
        }

        // Sort by timestamp (oldest first - chronological order)
        return messages.sort((a, b) => a.timestamp - b.timestamp);
      },
      10000 // Cache for 10 seconds for fresher messages
    );
  } catch (error) {
    console.error('Error fetching messages:', error);
    return [];
  }
}

export async function markMessageAsRead(
  messageId: string,
  readerKeypair: Ed25519Keypair
) {
  const tx = new Transaction();
  
  tx.moveCall({
    target: `${SUI_CONTRACTS.packageId}::messaging::mark_as_read`,
    arguments: [
      tx.object(messageId),
      tx.object(SUI_CLOCK_OBJECT_ID),
    ],
  });

  const result = await suiClient.signAndExecuteTransaction({
    signer: readerKeypair,
    transactionBlock: tx,
    options: {
      showEffects: true,
    },
  });

  return result;
}

export async function getConversationInfo(
  userAddress: string
): Promise<{ messageIds: string[]; lastMessageTime: number }> {
  try {
    const messageHub = await suiClient.getObject({
      id: SUI_CONTRACTS.messageHubId,
      options: {
        showContent: true,
      },
    });

    if (messageHub.data?.content?.dataType === 'moveObject') {
      const fields = messageHub.data.content.fields as any;
      const conversations = fields.conversations;
      
      // This would need proper table querying in production
      // For now, return empty as tables require special handling
      return { messageIds: [], lastMessageTime: 0 };
    }
  } catch (error) {
    console.error('Error fetching conversation info:', error);
  }

  return { messageIds: [], lastMessageTime: 0 };
}

// Subscribe to message events
export function subscribeToMessages(
  address: string,
  onMessage: (message: any) => void
): () => void {
  let unsubscribe: (() => void) | null = null;
  
  const setupSubscription = async () => {
    try {
      console.log('Setting up subscription for address:', address);
      console.log('Subscribing to event type:', `${SUI_CONTRACTS.packageId}::messaging::MessageSent`);
      
      unsubscribe = await suiClient.subscribeEvent({
        filter: {
          MoveEventType: `${SUI_CONTRACTS.packageId}::messaging::MessageSent`,
        },
        onMessage: (event) => {
          console.log('Received event:', event);
          const { sender, recipient } = event.parsedJson as any;
          if (sender === address || recipient === address) {
            console.log('Event matches user, triggering callback');
            onMessage(event);
          }
        },
      });
      console.log('Subscription successful');
    } catch (error) {
      console.error('Error subscribing to messages:', error);
    }
  };
  
  setupSubscription();
  
  // Return a cleanup function that safely handles the unsubscribe
  return () => {
    if (unsubscribe) {
      unsubscribe();
    }
  };
}