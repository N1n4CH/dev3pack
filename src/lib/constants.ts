import { PublicKey } from '@solana/web3.js';

export const PROGRAM_ID = new PublicKey('GoaMsjPkq4o6NvCRduKMA4W7EcF5wWM8mXgZbLM65y9K');

// Oracle public key — a trusted backend keypair that signs verify_habit instructions.
// For devnet testing, the connected wallet acts as oracle (verifyHabit passes
// this.provider.publicKey as the oracle signer — no separate keypair needed).
// In production, set VITE_ORACLE_PUBKEY to your backend oracle wallet address.
export const ORACLE_PUBKEY = new PublicKey(
  import.meta.env.VITE_ORACLE_PUBKEY ?? '11111111111111111111111111111111',
);

export const DEVNET_RPC = import.meta.env.VITE_RPC_URL ?? 'https://api.devnet.solana.com';

export const EXPLORER_URL = 'https://explorer.solana.com';

export const getExplorerTxUrl = (signature: string): string =>
  `${EXPLORER_URL}/tx/${signature}?cluster=devnet`;
