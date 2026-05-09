import { useMemo, useEffect } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { AnchorProvider } from '@coral-xyz/anchor';
import { AtomicYieldSDK } from '@/lib/atomicYield';
import { useToast } from '@/hooks/use-toast';

const POOL_INIT_KEY = 'atomic_yield_pool_initialized';

/**
 * Hook that creates an AnchorProvider + AtomicYieldSDK instance
 * from the current wallet and connection context.
 *
 * On first load (once per browser), checks whether the StakingPool PDA exists
 * and calls initializePool() if it doesn't, guarded by localStorage.
 */
export function useAtomicYield() {
  const { connection } = useConnection();
  const { publicKey, signTransaction, signAllTransactions } = useWallet();
  const { toast } = useToast();

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

  useEffect(() => {
    if (!sdk || localStorage.getItem(POOL_INIT_KEY)) return;

    let cancelled = false;

    (async () => {
      const poolResult = await sdk.fetchStakingPool();
      if (cancelled) return;

      if (poolResult.success && poolResult.data) {
        // Pool already exists — mark so we skip on future loads
        localStorage.setItem(POOL_INIT_KEY, 'true');
        return;
      }

      if (poolResult.success && !poolResult.data) {
        toast({ title: 'Initializing protocol…' });
        const initResult = await sdk.initializePool();
        if (cancelled) return;
        if (initResult.success) {
          localStorage.setItem(POOL_INIT_KEY, 'true');
          toast({ title: 'Protocol initialized ✓' });
        } else {
          toast({
            title: 'Pool init failed',
            description: initResult.error,
            variant: 'destructive',
          });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [sdk]);

  return { sdk, provider, publicKey };
}
