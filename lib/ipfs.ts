import { encryptBytes } from './crypto';

/**
 * Upload encrypted content to IPFS via web3.storage
 * Note: web3.storage client is deprecated, but we'll use fetch API as fallback
 */

const WEB3_STORAGE_TOKEN = process.env.EXPO_PUBLIC_WEB3_STORAGE_TOKEN || '';

/**
 * Upload encrypted file to IPFS
 */
export async function uploadToIPFS(
  encryptedData: Uint8Array,
  filename: string = 'encrypted.bin'
): Promise<string> {
  if (!WEB3_STORAGE_TOKEN) {
    throw new Error('Web3.Storage token not configured');
  }

  const formData = new FormData();
  const blob = new Blob([encryptedData], { type: 'application/octet-stream' });
  formData.append('file', blob, filename);

  const response = await fetch('https://api.web3.storage/upload', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${WEB3_STORAGE_TOKEN}`,
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Failed to upload to IPFS: ${response.statusText}`);
  }

  const data = await response.json();
  return data.cid; // IPFS CID
}

/**
 * Upload encrypted attachment (encrypts first, then uploads)
 */
export async function uploadEncryptedAttachment(
  data: Uint8Array,
  encryptionKey: Uint8Array,
  filename: string = 'attachment.bin'
): Promise<{ cid: string; nonce: Uint8Array }> {
  const { ciphertext, nonce } = encryptBytes(data, encryptionKey);
  const cid = await uploadToIPFS(ciphertext, filename);
  return { cid, nonce };
}

/**
 * Fetch content from IPFS
 */
export async function fetchFromIPFS(cid: string): Promise<Uint8Array> {
  const response = await fetch(`https://${cid}.ipfs.w3s.link/`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch from IPFS: ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return new Uint8Array(arrayBuffer);
}

/**
 * Fetch and decrypt attachment
 */
export async function fetchAndDecryptAttachment(
  cid: string,
  encryptionKey: Uint8Array,
  nonce: Uint8Array
): Promise<Uint8Array> {
  const encryptedData = await fetchFromIPFS(cid);
  const { decryptBytes } = await import('./crypto');
  return decryptBytes(encryptedData, encryptionKey, nonce);
}

