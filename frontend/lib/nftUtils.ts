import { SuiClient } from '@mysten/sui/client';
import { ParsedNFTEvent } from './types';
import { PACKAGE_ID } from './config';

// Helper function to manually encode string to BCS format (bypass SDK bug)
export const encodeToBCS = (text: string): Uint8Array => {
  const textEncoder = new TextEncoder();
  const stringBytes = textEncoder.encode(text);
  const length = stringBytes.length;
  
  // Manually encode ULEB128 length prefix
  let lengthBytes: number[];
  if (length < 128) {
    lengthBytes = [length];
  } else if (length < 16384) {
    lengthBytes = [(length & 0x7f) | 0x80, (length >> 7) & 0x7f];
  } else {
    lengthBytes = [
      (length & 0x7f) | 0x80,
      ((length >> 7) & 0x7f) | 0x80,
      (length >> 14) & 0x7f
    ];
  }
  
  return new Uint8Array([...lengthBytes, ...stringBytes]);
};

// Function to parse NFTMinted events from transaction
export const parseNFTMintedEvents = async (
  suiClient: SuiClient,
  txDigest: string
): Promise<ParsedNFTEvent[]> => {
  try {
    const txDetails = await suiClient.getTransactionBlock({
      digest: txDigest,
      options: {
        showEvents: true,
        showEffects: true,
      },
    });

    console.log('Transaction Details:', txDetails);

    // Filter for NFTMinted events
    const events = txDetails.events || [];
    const nftMintedEvents = events.filter((event: any) => 
      event.type.includes('::nft::NFTMinted')
    );

    console.log('NFTMinted Events:', nftMintedEvents);

    // Parse and store the events
    const parsedEvents = nftMintedEvents.map((event: any) => ({
      objectId: event.parsedJson?.object_id,
      creator: event.parsedJson?.creator,
      name: event.parsedJson?.name,
      timestamp: new Date(event.timestampMs || Date.now()).toISOString(),
      txDigest: txDigest,
    }));

    return parsedEvents;
  } catch (error) {
    console.error('Error parsing NFT minted events:', error);
    return [];
  }
};

// Function to query all historical NFTMinted events from the contract
export const queryAllNFTMintedEvents = async (
  suiClient: SuiClient,
  packageId: string = PACKAGE_ID
): Promise<ParsedNFTEvent[]> => {
  try {
    console.log('=== Querying All NFT Minted Events ===');
    
    const eventType = `${packageId}::nft::NFTMinted`;
    console.log('Event Type:', eventType);

    let allEvents: any[] = [];
    let cursor = null;
    let hasNextPage = true;

    // Paginate through all events
    while (hasNextPage) {
      const response = await suiClient.queryEvents({
        query: { MoveEventType: eventType },
        cursor: cursor,
        limit: 50,
        order: 'descending', // Newest first
      });

      console.log('Query Response:', response);

      if (response.data && response.data.length > 0) {
        allEvents = [...allEvents, ...response.data];
      }

      hasNextPage = response.hasNextPage;
      cursor = response.nextCursor;

        // Safety break to avoid infinite loops
        if (allEvents.length > 1000) {
          console.warn('Reached 1000 events limit');
          break;
        }
    }

    console.log(`Found ${allEvents.length} total NFT minted events`);

    // Parse and format the events
    const parsedEvents = allEvents.map((event: any) => ({
      objectId: event.parsedJson?.object_id,
      creator: event.parsedJson?.creator,
      name: event.parsedJson?.name,
      timestamp: new Date(Number(event.timestampMs)).toISOString(),
      txDigest: event.id.txDigest,
      eventSeq: event.id.eventSeq,
    }));

    console.log('Parsed Events:', parsedEvents);
    
    return parsedEvents;
  } catch (error) {
    console.error('Error querying all NFT minted events:', error);
    throw error;
  }
};

// Function to fetch user's NFTs
export const fetchUserNFTs = async (
  suiClient: SuiClient,
  userAddress: string,
  packageId: string = PACKAGE_ID
) => {
  try {
    const objects = await suiClient.getOwnedObjects({
      owner: userAddress,
      filter: {
        StructType: `${packageId}::nft::NFT`,
      },
      options: {
        showContent: true,
        showDisplay: true,
      },
    });

    console.log('Owned NFTs:', objects);
    return objects.data;
  } catch (error) {
    console.error('Error fetching NFTs:', error);
    throw error;
  }
};

// Function to format timestamp for display
export const formatTimestamp = (timestamp: string): string => {
  return new Date(timestamp).toLocaleString();
};

// Function to generate explorer URL
export const getExplorerUrl = (txDigest: string): string => {
  return `https://testnet.suivision.xyz/txblock/${txDigest}`;
};

// Function to validate NFT form data
export const validateNFTFormData = (name: string, description: string, imageUrl: string): boolean => {
  return name.trim() !== '' && description.trim() !== '' && imageUrl.trim() !== '';
};

// Helper function to extract NFT fields from Sui object
export const extractNFTFields = (nft: any) => {
  const content = nft.data?.content;
  if (content?.dataType === 'moveObject') {
    const fields = content.fields as any;
    return {
      name: fields?.name || 'Unnamed NFT',
      description: fields?.description || 'No description',
      url: fields?.url || null
    };
  }
  return {
    name: 'Unnamed NFT',
    description: 'No description',
    url: null
  };
};
