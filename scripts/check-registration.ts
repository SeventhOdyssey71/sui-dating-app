import { suiClient } from '@/lib/sui-client';

const USER_REGISTRY_ID = '0x35958e4cf122a0cb7c0626b53509257540f4e08b83ef60ebbeb04cc004cc2428';

export async function checkUserRegistration(userAddress: string): Promise<boolean> {
  try {
    const registry = await suiClient.getObject({
      id: USER_REGISTRY_ID,
      options: {
        showContent: true,
      },
    });

    if (registry.data?.content?.dataType === 'moveObject') {
      const fields = registry.data.content.fields as any;
      console.log('Registry fields:', fields);
      
      // The users field is a Table, we need to check if the address exists
      // This is complex with tables, so we'll use transaction simulation
      return false;
    }
    
    return false;
  } catch (error) {
    console.error('Error checking registration:', error);
    return false;
  }
}

// Alternative: Try to register with a dry run to check if already registered
export async function checkRegistrationViaDryRun(userAddress: string): Promise<boolean> {
  try {
    const { Transaction } = await import('@mysten/sui/transactions');
    const tx = new Transaction();
    
    tx.moveCall({
      target: '0xbc4755164aecf28506c260516e2239ab911b3ba699ba62a7a316d675cede4eb5::dating_platform::register_user',
      arguments: [
        tx.object(USER_REGISTRY_ID),
        tx.pure.string('Test'),
        tx.pure.string('Test bio'),
        tx.pure.u8(25),
        tx.pure.string('Test Location'),
        tx.object('0x6'),
      ],
    });

    // Try dry run
    const result = await suiClient.dryRunTransactionBlock({
      transactionBlock: await tx.serialize(),
    });

    // If dry run fails with E_ALREADY_REGISTERED, user is registered
    const error = result.effects.status.error;
    if (error && error.includes('MoveAbort') && error.includes(', 1)')) {
      return true; // User is already registered
    }
    
    return false; // User is not registered
  } catch (error) {
    console.error('Error in dry run:', error);
    return false;
  }
}