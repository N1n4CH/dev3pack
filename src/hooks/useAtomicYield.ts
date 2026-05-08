import { useMemo } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { AnchorProvider } from '@coral-xyz/anchor';
import { AtomicYieldSDK } from '@/lib/atomicYield';

/**
 * Hook that creates an AnchorProvider + AtomicYieldSDK instance
 * from the current wallet and connection context.
 */
export function useAtomicYield() {
  const { connection } = useConnection();
  const { publicKey, signTransaction, signAllTransactions } = useWallet();

  const provider = useMemo(() => {
    if (!publicKey || !signTransaction || !signAllTransactions) return null;
    return new AnchorProvider(
      connection,
      { publicKey, signTransaction, signAllTransactions } as any,
      { commitment: 'confirmed' },
    );
  }, [connection, publicKey, signTransaction, signAllTransactions]);

  const sdk = useMemo(() => {
    if (!provider) return null;
    return new AtomicYieldSDK(provider);
  }, [provider]);

  return { sdk, provider, publicKey };
}
