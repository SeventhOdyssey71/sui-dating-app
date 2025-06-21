import { useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { SUI_CONTRACTS, SUI_CLOCK_OBJECT_ID, GAS_BUDGET } from '@/lib/sui-config';

// @ts-ignore - Transaction type conflict between versions
const { Transaction } = require('@mysten/sui/transactions');

export function useTransactionExecution() {
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();

  const sendMessage = async (
    recipient: string, 
    content: string,
    onSuccess?: (result: any) => void,
    onError?: (error: any) => void
  ) => {
    console.log('Sending message with:', {
      packageId: SUI_CONTRACTS.packageId,
      messageHubId: SUI_CONTRACTS.messageHubId,
      recipient,
      contentLength: content.length
    });
    
    const tx = new Transaction();
    
    // Set gas budget with a buffer for safety
    tx.setGasBudget(GAS_BUDGET.MESSAGE);
    
    // Convert content to bytes
    const contentBytes = Array.from(new TextEncoder().encode(content));
    
    tx.moveCall({
      target: `${SUI_CONTRACTS.packageId}::messaging::send_message`,
      arguments: [
        tx.object(SUI_CONTRACTS.messageHubId),
        tx.pure.address(recipient),
        tx.pure.vector('u8', contentBytes),
        tx.object(SUI_CLOCK_OBJECT_ID),
      ],
    });

    signAndExecute(
      {
        transaction: tx,
      },
      {
        onSuccess: (result) => {
          console.log('Message sent successfully:', result);
          onSuccess?.(result);
        },
        onError: (error) => {
          console.error('Failed to send message:', error);
          
          // Check if it's a gas budget error and provide helpful message
          if (error.message?.toLowerCase().includes('gas') || error.message?.toLowerCase().includes('budget')) {
            console.error('Gas budget insufficient. Current budget:', GAS_BUDGET.MESSAGE);
            onError?.(new Error('Transaction failed due to insufficient gas budget. Please try again or contact support.'));
          } else {
            onError?.(error);
          }
        },
      }
    );
  };

  const markMessageAsRead = async (
    messageId: string,
    onSuccess?: (result: any) => void,
    onError?: (error: any) => void
  ) => {
    const tx = new Transaction();
    
    // Set gas budget
    tx.setGasBudget(GAS_BUDGET.DEFAULT);
    
    tx.moveCall({
      target: `${SUI_CONTRACTS.packageId}::messaging::mark_as_read`,
      arguments: [
        tx.object(messageId),
        tx.object(SUI_CLOCK_OBJECT_ID),
      ],
    });

    signAndExecute(
      {
        transaction: tx,
      },
      {
        onSuccess: (result) => {
          console.log('Message marked as read:', result);
          onSuccess?.(result);
        },
        onError: (error) => {
          console.error('Failed to mark message as read:', error);
          if (error.message?.toLowerCase().includes('gas') || error.message?.toLowerCase().includes('budget')) {
            onError?.(new Error('Transaction failed due to insufficient gas budget.'));
          } else {
            onError?.(error);
          }
        },
      }
    );
  };

  const transferNFT = async (
    nftId: string,
    recipient: string,
    onSuccess?: (result: any) => void,
    onError?: (error: any) => void
  ) => {
    const tx = new Transaction();
    
    // Set gas budget
    tx.setGasBudget(GAS_BUDGET.NFT_TRANSFER);
    
    tx.moveCall({
      target: `${process.env.NEXT_PUBLIC_NFT_PACKAGE_ID}::nft::transfer_nft`,
      arguments: [
        tx.object(nftId),
        tx.pure.address(recipient),
      ],
    });

    signAndExecute(
      {
        transaction: tx,
      },
      {
        onSuccess: (result) => {
          console.log('NFT transferred successfully:', result);
          onSuccess?.(result);
        },
        onError: (error) => {
          console.error('Failed to transfer NFT:', error);
          if (error.message?.toLowerCase().includes('gas') || error.message?.toLowerCase().includes('budget')) {
            onError?.(new Error('Transaction failed due to insufficient gas budget.'));
          } else {
            onError?.(error);
          }
        },
      }
    );
  };

  const batchTransferNFTs = async (
    nftIds: string[],
    recipient: string,
    onSuccess?: (result: any) => void,
    onError?: (error: any) => void
  ) => {
    const tx = new Transaction();
    
    // Set gas budget - scale with number of NFTs plus base amount
    const gasBudget = Math.max(GAS_BUDGET.NFT_TRANSFER * nftIds.length, 100_000_000);
    tx.setGasBudget(gasBudget);
    
    // Create vector of NFT objects
    const nftObjects = nftIds.map(id => tx.object(id));
    
    tx.moveCall({
      target: `${process.env.NEXT_PUBLIC_NFT_PACKAGE_ID}::nft::batch_transfer_nfts`,
      arguments: [
        tx.makeMoveVec({ objects: nftObjects }),
        tx.pure.address(recipient),
      ],
    });

    signAndExecute(
      {
        transaction: tx,
      },
      {
        onSuccess: (result) => {
          console.log('NFTs transferred successfully:', result);
          onSuccess?.(result);
        },
        onError: (error) => {
          console.error('Failed to transfer NFTs:', error);
          if (error.message?.toLowerCase().includes('gas') || error.message?.toLowerCase().includes('budget')) {
            onError?.(new Error('Transaction failed due to insufficient gas budget.'));
          } else {
            onError?.(error);
          }
        },
      }
    );
  };

  const sendMessageWithNFTs = async (
    recipient: string,
    content: string,
    nftIds: string[],
    onSuccess?: (result: any) => void,
    onError?: (error: any) => void
  ) => {
    console.log('Sending message with NFTs:', {
      recipient,
      contentLength: content.length,
      nftCount: nftIds.length
    });
    
    const tx = new Transaction();
    
    // Calculate gas budget based on message and NFT transfers
    const gasBudget = GAS_BUDGET.MESSAGE + (nftIds.length > 0 ? GAS_BUDGET.NFT_TRANSFER * nftIds.length : 0);
    tx.setGasBudget(Math.max(gasBudget, 150_000_000));
    
    // First, transfer NFTs if any
    if (nftIds.length > 0) {
      const nftObjects = nftIds.map(id => tx.object(id));
      
      tx.moveCall({
        target: `${process.env.NEXT_PUBLIC_NFT_PACKAGE_ID}::nft::batch_transfer_nfts`,
        arguments: [
          tx.makeMoveVec({ objects: nftObjects }),
          tx.pure.address(recipient),
        ],
      });
    }
    
    // Then send the message
    const contentBytes = Array.from(new TextEncoder().encode(content));
    
    tx.moveCall({
      target: `${SUI_CONTRACTS.packageId}::messaging::send_message`,
      arguments: [
        tx.object(SUI_CONTRACTS.messageHubId),
        tx.pure.address(recipient),
        tx.pure.vector('u8', contentBytes),
        tx.object(SUI_CLOCK_OBJECT_ID),
      ],
    });

    signAndExecute(
      {
        transaction: tx,
      },
      {
        onSuccess: (result) => {
          console.log('Message with NFTs sent successfully:', result);
          onSuccess?.(result);
        },
        onError: (error) => {
          console.error('Failed to send message with NFTs:', error);
          
          if (error.message?.toLowerCase().includes('gas') || error.message?.toLowerCase().includes('budget')) {
            console.error('Gas budget insufficient. Current budget:', gasBudget);
            onError?.(new Error('Transaction failed due to insufficient gas budget. Please try again.'));
          } else {
            onError?.(error);
          }
        },
      }
    );
  };

  return {
    sendMessage,
    markMessageAsRead,
    transferNFT,
    batchTransferNFTs,
    sendMessageWithNFTs,
  };
}