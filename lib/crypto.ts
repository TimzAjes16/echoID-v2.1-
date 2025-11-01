import * as nacl from 'tweetnacl';
import { XChaCha20Poly1305 } from '@stablelib/xchacha20poly1305';
import { keccak256 } from 'js-sha3';
import * as SecureStore from 'expo-secure-store';

const DEVICE_KEY_PAIR_KEY = 'device_keypair_secret';

export interface KeyPair {
  publicKey: Uint8Array;
  secretKey: Uint8Array;
}

/**
 * Generate a device X25519 keypair using TweetNaCl
 */
export async function generateDeviceKeypair(): Promise<KeyPair> {
  const keyPair = nacl.box.keyPair();
  
  // Store secret key in SecureStore
  const secretKeyStr = Array.from(keyPair.secretKey, (byte) => String.fromCharCode(byte)).join('');
  const secretKeyBase64 = btoa(secretKeyStr);
  await SecureStore.setItemAsync(DEVICE_KEY_PAIR_KEY, secretKeyBase64);
  
  return keyPair;
}

/**
 * Retrieve or generate device keypair
 */
export async function getDeviceKeypair(): Promise<KeyPair> {
  try {
    const secretKeyBase64 = await SecureStore.getItemAsync(DEVICE_KEY_PAIR_KEY);
    if (secretKeyBase64) {
      const binaryString = atob(secretKeyBase64);
      const secretKey = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        secretKey[i] = binaryString.charCodeAt(i);
      }
      const publicKey = nacl.box.keyPair.fromSecretKey(secretKey).publicKey;
      return { publicKey, secretKey };
    }
  } catch (error) {
    console.warn('Failed to retrieve keypair, generating new one:', error);
  }
  
  return generateDeviceKeypair();
}

/**
 * Derive chat session key from both device pubkeys + consentId
 */
export function deriveChatKey(
  devicePubKey1: Uint8Array,
  devicePubKey2: Uint8Array,
  consentId: string
): Uint8Array {
  // Sort pubkeys for deterministic key derivation
  const sorted = [devicePubKey1, devicePubKey2].sort((a, b) => {
    for (let i = 0; i < Math.min(a.length, b.length); i++) {
      if (a[i] !== b[i]) return a[i] - b[i];
    }
    return a.length - b.length;
  });
  
  const combined = new Uint8Array([
    ...sorted[0],
    ...sorted[1],
    ...new TextEncoder().encode(consentId),
  ]);
  
  // Use keccak256 for key derivation
  const hash = keccak256.arrayBuffer(combined);
  return new Uint8Array(hash.slice(0, 32)); // XChaCha20 needs 32 bytes
}

/**
 * Encrypt bytes with XChaCha20-Poly1305
 */
export function encryptBytes(
  data: Uint8Array,
  key: Uint8Array,
  nonce?: Uint8Array
): { ciphertext: Uint8Array; nonce: Uint8Array } {
  const cipher = new XChaCha20Poly1305(key);
  
  if (!nonce) {
    nonce = new Uint8Array(24);
    crypto.getRandomValues(nonce);
  }
  
  const ciphertext = cipher.seal(nonce, data);
  
  return { ciphertext, nonce };
}

/**
 * Decrypt bytes with XChaCha20-Poly1305
 */
export function decryptBytes(
  ciphertext: Uint8Array,
  key: Uint8Array,
  nonce: Uint8Array
): Uint8Array {
  const cipher = new XChaCha20Poly1305(key);
  return cipher.open(nonce, ciphertext);
}

/**
 * Wrap symmetric key for multiple recipients (NaCl box)
 */
export function wrapKeyForRecipients(
  symKey: Uint8Array,
  recipientsPubKeys: Uint8Array[],
  senderSecretKey: Uint8Array
): Array<{ recipientPubKey: Uint8Array; encryptedKey: Uint8Array; nonce: Uint8Array }> {
  return recipientsPubKeys.map(recipientPubKey => {
    const nonce = nacl.randomBytes(24);
    const encryptedKey = nacl.box(symKey, nonce, recipientPubKey, senderSecretKey);
    return { recipientPubKey, encryptedKey, nonce };
  });
}

/**
 * Unwrap symmetric key for a recipient
 */
export function unwrapKeyForRecipient(
  encryptedKey: Uint8Array,
  nonce: Uint8Array,
  senderPubKey: Uint8Array,
  recipientSecretKey: Uint8Array
): Uint8Array | null {
  const decrypted = nacl.box.open(encryptedKey, nonce, senderPubKey, recipientSecretKey);
  return decrypted;
}

/**
 * Hash bytes with keccak256
 */
export function keccak(bytes: Uint8Array | string): string {
  if (typeof bytes === 'string') {
    return keccak256(bytes);
  }
  return keccak256(bytes);
}

/**
 * Hash bytes to Uint8Array
 */
export function keccakBytes(bytes: Uint8Array | string): Uint8Array {
  if (typeof bytes === 'string') {
    return new Uint8Array(keccak256.arrayBuffer(bytes));
  }
  return new Uint8Array(keccak256.arrayBuffer(bytes));
}

/**
 * Compute device hash from public key
 */
export function computeDeviceHash(publicKey: Uint8Array): string {
  return keccak(publicKey);
}

/**
 * Compute voice hash from audio bytes
 */
export function computeVoiceHash(audioBytes: Uint8Array): string {
  return keccak(audioBytes);
}

/**
 * Compute face hash (deterministic placeholder)
 */
export function computeFaceHash(imageBytes: Uint8Array): string {
  // Placeholder: deterministic hash of image
  return keccak(imageBytes);
}

