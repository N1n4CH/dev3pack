import { PublicKey } from '@solana/web3.js';

export const PROGRAM_ID = new PublicKey('77NnA7iRfthT8wcdWxNsrueXbF7o251BzdBBDnDW4znf');

// Oracle public key — in production this would be a trusted backend keypair.
// For devnet testing, the connected wallet acts as both oracle and user.
export const ORACLE_PUBKEY = new PublicKey('77NnA7iRfthT8wcdWxNsrueXbF7o251BzdBBDnDW4znf');

export const DEVNET_RPC = 'https://api.devnet.solana.com';

export const EXPLORER_URL = 'https://explorer.solana.com';

export const getExplorerTxUrl = (signature: string): string =>
  `${EXPLORER_URL}/tx/${signature}?cluster=devnet`;
