import SignClient from '@walletconnect/sign-client';
import { SessionTypes } from '@walletconnect/types';

const PROJECT_ID = process.env.EXPO_PUBLIC_WALLETCONNECT_PROJECT_ID || '';

let signClient: SignClient | null = null;

/**
 * Initialize WalletConnect SignClient
 */
export async function initWalletConnect(): Promise<SignClient> {
  if (signClient) {
    return signClient;
  }

  signClient = await SignClient.init({
    projectId: PROJECT_ID,
    metadata: {
      name: 'EchoID',
      description: 'Consent Verification Protocol',
      url: 'https://echoid.xyz',
      icons: ['https://echoid.xyz/icon.png'],
    },
  });

  return signClient;
}

/**
 * Get or initialize SignClient
 */
export async function getSignClient(): Promise<SignClient> {
  if (!signClient) {
    return initWalletConnect();
  }
  return signClient;
}

/**
 * Connect wallet via WalletConnect
 */
export async function connectWallet(): Promise<SessionTypes.Structured> {
  const client = await getSignClient();

  const { uri, approval } = await client.connect({
    requiredNamespaces: {
      eip155: {
        methods: ['eth_sendTransaction', 'eth_sign', 'personal_sign'],
        chains: ['eip155:8453', 'eip155:420', 'eip155:1101'], // Base, Base Nova, Polygon zkEVM
        events: ['chainChanged', 'accountsChanged'],
      },
    },
  });

  // In a real app, display the QR code or deep link here
  if (uri) {
    console.log('WalletConnect URI:', uri);
    // You would typically show this as a QR code or deep link
  }

  const session = await approval();
  return session;
}

/**
 * Send transaction via WalletConnect
 */
export async function sendTransaction(
  session: SessionTypes.Structured,
  transaction: {
    from: string;
    to: string;
    value: string;
    data: string;
    gas?: string;
    gasPrice?: string;
  }
): Promise<string> {
  const client = await getSignClient();

  const txHash = await client.request({
    topic: session.topic,
    chainId: `eip155:${session.namespaces.eip155.chains[0].split(':')[1]}`,
    request: {
      method: 'eth_sendTransaction',
      params: [transaction],
    },
  });

  return txHash as string;
}

/**
 * Sign message via WalletConnect
 */
export async function signMessage(
  session: SessionTypes.Structured,
  message: string
): Promise<string> {
  const client = await getSignClient();

  const signature = await client.request({
    topic: session.topic,
    chainId: `eip155:${session.namespaces.eip155.chains[0].split(':')[1]}`,
    request: {
      method: 'personal_sign',
      params: [message, session.namespaces.eip155.accounts[0].split(':')[2]],
    },
  });

  return signature as string;
}

/**
 * Disconnect wallet
 */
export async function disconnectWallet(session: SessionTypes.Structured): Promise<void> {
  const client = await getSignClient();
  await client.disconnect({
    topic: session.topic,
    reason: {
      code: 6000,
      message: 'User disconnected',
    },
  });
}

