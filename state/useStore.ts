import { create } from 'zustand';
import type { SessionTypes } from '@walletconnect/types';
import { connectWallet, disconnectWallet, initWalletConnect } from '../lib/walletconnect';
import { fetchRemoteConfig, type RemoteConfig } from '../lib/sdk';
import * as SecureStore from 'expo-secure-store';
import { getDeviceKeypair } from '../lib/crypto';
import { getLocalWallet, createLocalWallet, type Address } from '../lib/wallet';
import { getStoredThemeMode, setStoredThemeMode } from '../lib/theme';

export interface Consent {
  id: string;
  consentId: bigint;
  counterparty: string;
  counterpartyHandle?: string;
  template: string;
  createdAt: number;
  lockedUntil: number; // timestamp
  unlockRequested: boolean;
  unlockApproved: boolean;
  isUnlocked: boolean;
  voiceHash: string;
  faceHash: string;
  deviceHash: string;
  geoHash: string;
  utcHash: string;
  coercionLevel: number;
  status: 'pending' | 'accepted' | 'rejected' | 'active';
}

export interface ConsentRequest {
  id: string;
  fromHandle: string;
  fromAddress: string;
  template: string;
  requestedAt: number;
  consentData: any; // Full consent creation data
}

export interface WalletState {
  session: SessionTypes.Structured | null;
  address: string | null;
  chainId: number | null;
  isLocal: boolean; // true if using local wallet, false if WalletConnect
}

export interface Profile {
  handle: string | null;
  devicePubKey: string | null;
}

export type ThemeMode = 'light' | 'dark' | 'auto';

interface AppState {
  // Wallet
  wallet: WalletState;
  connectWallet: () => Promise<void>;
  connectLocalWallet: () => Promise<void>;
  disconnectWallet: () => Promise<void>;
  loadWallet: () => Promise<void>;
  
  // Config
  config: RemoteConfig | null;
  loadConfig: () => Promise<void>;
  
  // Profile
  profile: Profile;
  setProfile: (profile: Partial<Profile>) => Promise<void>;
  loadProfile: () => Promise<void>;
  
  // Consents
  consents: Consent[];
  addConsent: (consent: Consent) => void;
  updateConsent: (id: string, updates: Partial<Consent>) => void;
  getConsent: (id: string) => Consent | undefined;
  
  // Consent Requests (pending requests from others)
  consentRequests: ConsentRequest[];
  addConsentRequest: (request: ConsentRequest) => void;
  removeConsentRequest: (id: string) => void;
  getConsentRequest: (id: string) => ConsentRequest | undefined;
  
  // Device keypair
  deviceKeypair: { publicKey: Uint8Array; secretKey: Uint8Array } | null;
  loadDeviceKeypair: () => Promise<void>;
  
  // Theme
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  loadThemeMode: () => Promise<void>;
}

const PROFILE_STORAGE_KEY = 'profile';
const CONSENT_REQUESTS_STORAGE_KEY = 'consent_requests';

export const useStore = create<AppState>((set, get) => ({
  // Initial state
  wallet: {
    session: null,
    address: null,
    chainId: null,
    isLocal: false,
  },
  config: null,
  profile: {
    handle: null,
    devicePubKey: null,
  },
  consents: [],
  consentRequests: [],
  deviceKeypair: null,

  // Wallet actions
  connectLocalWallet: async () => {
    try {
      let wallet = await getLocalWallet();
      if (!wallet) {
        wallet = await createLocalWallet();
      }
      
      set({
        wallet: {
          session: null,
          address: wallet.address,
          chainId: 8453, // Base
          isLocal: true,
        },
      });
    } catch (error) {
      console.error('Failed to connect local wallet:', error);
      throw error;
    }
  },

  loadWallet: async () => {
    try {
      const wallet = await getLocalWallet();
      if (wallet) {
        set({
          wallet: {
            session: null,
            address: wallet.address,
            chainId: 8453, // Base
            isLocal: true,
          },
        });
      }
    } catch (error) {
      console.error('Failed to load wallet:', error);
    }
  },

  connectWallet: async () => {
    try {
      await initWalletConnect();
      const session = await connectWallet();
      const address = session.namespaces.eip155.accounts[0].split(':')[2];
      const chainId = parseInt(session.namespaces.eip155.chains[0].split(':')[1]);
      
      set({
        wallet: {
          session,
          address,
          chainId,
          isLocal: false,
        },
      });
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      throw error;
    }
  },

  disconnectWallet: async () => {
    const { wallet } = get();
    
    // Disconnect WalletConnect session if exists
    if (wallet.session) {
      try {
        const { disconnectWallet: disconnectWC } = await import('../lib/walletconnect');
        await disconnectWC(wallet.session);
      } catch (error) {
        console.error('Error disconnecting WalletConnect:', error);
      }
    }
    
    // Clear local wallet if it's a local wallet
    if (wallet.isLocal) {
      try {
        await SecureStore.deleteItemAsync('local_wallet_private_key');
      } catch (error) {
        console.error('Error clearing local wallet:', error);
      }
    }
    
    // Clear profile from SecureStore
    try {
      await SecureStore.deleteItemAsync(PROFILE_STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing profile:', error);
    }
    
    // Reset state
    set({
      wallet: {
        session: null,
        address: null,
        chainId: null,
        isLocal: false,
      },
      profile: {
        handle: null,
        devicePubKey: null,
      },
      consents: [],
      consentRequests: [],
    });
  },

  // Config actions
  loadConfig: async () => {
    try {
      const config = await fetchRemoteConfig();
      set({ config });
    } catch (error) {
      console.error('Failed to load config:', error);
    }
  },

  // Profile actions
  setProfile: async (profile: Partial<Profile>) => {
    const newProfile = { ...get().profile, ...profile };
    set({ profile: newProfile });
    
    // Persist to SecureStore
    try {
      await SecureStore.setItemAsync(
        PROFILE_STORAGE_KEY,
        JSON.stringify(newProfile)
      );
    } catch (error) {
      console.error('Failed to save profile:', error);
    }
  },

  loadProfile: async () => {
    try {
      const stored = await SecureStore.getItemAsync(PROFILE_STORAGE_KEY);
      if (stored) {
        const profile = JSON.parse(stored) as Profile;
        set({ profile });
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
    }
  },

  // Consent actions
  addConsent: (consent: Consent) => {
    set((state) => ({
      consents: [...state.consents, consent],
    }));
  },

  updateConsent: (id: string, updates: Partial<Consent>) => {
    set((state) => ({
      consents: state.consents.map((c) =>
        c.id === id ? { ...c, ...updates } : c
      ),
    }));
  },

  getConsent: (id: string) => {
    return get().consents.find((c) => c.id === id);
  },

  // Consent Request actions
  addConsentRequest: async (request: ConsentRequest) => {
    const newRequests = [...get().consentRequests, request];
    set({ consentRequests: newRequests });
    
    // Persist to SecureStore
    try {
      await SecureStore.setItemAsync(
        CONSENT_REQUESTS_STORAGE_KEY,
        JSON.stringify(newRequests)
      );
      console.log(`[Store] Consent request persisted: ${request.id} (to @${request.consentData?.counterpartyHandle || 'unknown'})`);
    } catch (error) {
      console.error('[Store] Failed to persist consent requests:', error);
    }
  },

  removeConsentRequest: async (id: string) => {
    const newRequests = get().consentRequests.filter((r) => r.id !== id);
    set({ consentRequests: newRequests });
    
    // Persist to SecureStore
    try {
      await SecureStore.setItemAsync(
        CONSENT_REQUESTS_STORAGE_KEY,
        JSON.stringify(newRequests)
      );
      console.log(`[Store] Consent request removed and persisted: ${id}`);
    } catch (error) {
      console.error('[Store] Failed to persist consent requests:', error);
    }
  },

  getConsentRequest: (id: string) => {
    return get().consentRequests.find((r) => r.id === id);
  },
  
  loadConsentRequests: async () => {
    try {
      const stored = await SecureStore.getItemAsync(CONSENT_REQUESTS_STORAGE_KEY);
      if (stored) {
        const requests = JSON.parse(stored) as ConsentRequest[];
        set({ consentRequests: requests });
        console.log(`[Store] Loaded ${requests.length} consent requests from storage`);
        return requests;
      }
    } catch (error) {
      console.error('[Store] Failed to load consent requests:', error);
    }
    return [];
  },

  // Device keypair
  loadDeviceKeypair: async () => {
    try {
      const keypair = await getDeviceKeypair();
      set({ deviceKeypair: keypair });
    } catch (error) {
      console.error('Failed to load device keypair:', error);
    }
  },

  // Theme actions
  setThemeMode: async (mode: ThemeMode) => {
    await setStoredThemeMode(mode);
    set({ themeMode: mode });
  },

  loadThemeMode: async () => {
    try {
      const mode = await getStoredThemeMode();
      set({ themeMode: mode });
    } catch (error) {
      console.error('Failed to load theme mode:', error);
    }
  },
}));


