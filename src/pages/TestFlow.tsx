import React, { useState, useEffect, useCallback } from 'react';
import { useAtomicYield } from '@/hooks/useAtomicYield';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { getExplorerTxUrl } from '@/lib/constants';
import { ExternalLink, RefreshCw } from 'lucide-react';

const DEV_MODE = import.meta.env.VITE_DEV_MODE === 'true';

const TEST_STAKE_SOL = 0.01;
const TEST_EPOCH_DAYS = 1;
const TEST_GOAL_TYPE = 0; // steps
const TEST_DAILY_TARGET = 10000;

function getOrCreateEpochId(): number {
  const key = 'atomic_yield_test_epoch_id';
  const stored = sessionStorage.getItem(key);
  if (stored) return parseInt(stored, 10);
  const id = Date.now();
  sessionStorage.setItem(key, id.toString());
  return id;
}

function StateRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="font-mono text-sm">{value}</span>
    </div>
  );
}

export default function TestFlow() {
  const { sdk, publicKey } = useAtomicYield();
  const { toast } = useToast();

  const [epochId] = useState(getOrCreateEpochId);
  const [balance, setBalance] = useState<number | null>(null);
  const [daysVerified, setDaysVerified] = useState<number | null>(null);
  const [isSettled, setIsSettled] = useState<boolean | null>(null);
  const [x402Fee, setX402Fee] = useState<string | null>(null);
  const [txLinks, setTxLinks] = useState<{ label: string; url: string }[]>([]);
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  const setLoadingKey = (key: string, val: boolean) =>
    setLoading((prev) => ({ ...prev, [key]: val }));

  const addTxLink = (label: string, sig: string) =>
    setTxLinks((prev) => [...prev, { label, url: getExplorerTxUrl(sig) }]);

  const refreshState = useCallback(async () => {
    if (!sdk || !publicKey) return;
    const [balResult, commitResult] = await Promise.all([
      sdk.fetchSolBalance(),
      sdk.fetchHabitCommitment(publicKey, epochId),
    ]);
    if (balResult.success && balResult.data !== undefined) setBalance(balResult.data);
    if (commitResult.success) {
      if (commitResult.data) {
        setDaysVerified(commitResult.data.daysVerified);
        setIsSettled(commitResult.data.isSettled);
      } else {
        setDaysVerified(null);
        setIsSettled(null);
      }
    }
  }, [sdk, publicKey, epochId]);

  useEffect(() => {
    refreshState();
  }, [refreshState]);

  const handleDeposit = async () => {
    if (!sdk || !publicKey) {
      toast({ title: 'Connect wallet first', variant: 'destructive' });
      return;
    }
    setLoadingKey('deposit', true);
    const result = await sdk.depositStake({
      goalType: TEST_GOAL_TYPE,
      dailyTarget: TEST_DAILY_TARGET,
      epochDays: TEST_EPOCH_DAYS,
      stakeAmountSol: TEST_STAKE_SOL,
      epochId,
    });
    setLoadingKey('deposit', false);
    if (result.success && result.data) {
      toast({ title: 'Deposit successful!' });
      addTxLink('Deposit', result.data.signature);
      refreshState();
    } else {
      toast({ title: 'Deposit failed', description: result.error, variant: 'destructive' });
    }
  };

  const handleVerify = async () => {
    if (!sdk || !publicKey) {
      toast({ title: 'Connect wallet first', variant: 'destructive' });
      return;
    }
    setLoadingKey('verify', true);
    const result = await sdk.verifyHabit(publicKey, epochId);
    setLoadingKey('verify', false);
    if (result.success && result.data) {
      toast({ title: 'Habit verified!' });
      addTxLink('Verify', result.data.signature);
      refreshState();
    } else {
      toast({ title: 'Verify failed', description: result.error, variant: 'destructive' });
    }
  };

  const handleSettle = async (force = false) => {
    if (!sdk || !publicKey) {
      toast({ title: 'Connect wallet first', variant: 'destructive' });
      return;
    }
    const key = force ? 'force' : 'settle';
    setLoadingKey(key, true);
    const result = await sdk.settleEpoch(publicKey, epochId);
    setLoadingKey(key, false);
    if (result.success && result.data) {
      setX402Fee(result.data.x402Fee);
      toast({
        title: 'Epoch settled!',
        description: `x402 fee routed: ${result.data.x402Fee}`,
      });
      addTxLink('Settle', result.data.signature);
      refreshState();
    } else {
      const isEpochNotComplete =
        result.error?.includes('EpochNotComplete') ||
        result.error?.includes('epoch_not_complete') ||
        result.error?.includes('6000');
      if (force && isEpochNotComplete) {
        toast({
          title: 'Epoch not yet complete',
          description:
            'The 1-day epoch window has not elapsed. Wait 24h from deposit time, then settle.',
          variant: 'destructive',
        });
      } else {
        toast({ title: 'Settle failed', description: result.error, variant: 'destructive' });
      }
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground pt-24 pb-12">
      <div className="container max-w-xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold font-display">
            <span className="text-primary">Atomic</span>Yield — Test Flow
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            End-to-end test: deposit → verify → settle on devnet.
          </p>
          {DEV_MODE && (
            <p className="mt-2 text-xs text-yellow-500 bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-3 py-2">
              DEV MODE — epoch is 1 day. Use "Force Settle" to test the{' '}
              <code>EpochNotComplete</code> error path, or wait 24h after deposit for a real
              settle.
            </p>
          )}
        </div>

        {/* Real-time state */}
        <div className="rounded-xl border border-border/50 bg-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Real-time state</span>
            <button
              onClick={refreshState}
              disabled={!sdk}
              className="text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
              aria-label="Refresh"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <StateRow
              label="Wallet balance"
              value={balance !== null ? `${balance.toFixed(4)} SOL` : '—'}
            />
            <StateRow label="Epoch ID (last 6)" value={epochId.toString().slice(-6)} />
            <StateRow
              label="Days verified"
              value={daysVerified !== null ? daysVerified.toString() : '—'}
            />
            <StateRow
              label="Settled"
              value={isSettled !== null ? (isSettled ? 'Yes' : 'No') : '—'}
            />
            <StateRow
              label="x402 fee paid"
              value={x402Fee ?? (isSettled ? '—' : 'pending')}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Button
            className="w-full"
            onClick={handleDeposit}
            disabled={!sdk || loading.deposit}
          >
            {loading.deposit
              ? 'Depositing…'
              : `Deposit ${TEST_STAKE_SOL} SOL  ·  ${TEST_EPOCH_DAYS}-day epoch  ·  steps`}
          </Button>

          <Button
            className="w-full"
            variant="secondary"
            onClick={handleVerify}
            disabled={!sdk || loading.verify}
          >
            {loading.verify ? 'Verifying…' : 'Verify habit (oracle = connected wallet)'}
          </Button>

          <Button
            className="w-full"
            variant="secondary"
            onClick={() => handleSettle(false)}
            disabled={!sdk || loading.settle}
          >
            {loading.settle ? 'Settling…' : 'Settle epoch'}
          </Button>

          {DEV_MODE && (
            <Button
              className="w-full"
              variant="outline"
              onClick={() => handleSettle(true)}
              disabled={!sdk || loading.force}
            >
              {loading.force ? 'Settling…' : 'Force Settle (shows EpochNotComplete gracefully)'}
            </Button>
          )}
        </div>

        {/* TX history */}
        {txLinks.length > 0 && (
          <div className="rounded-xl border border-border/50 bg-card p-5 space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Transactions</p>
            {txLinks.map((link, i) => (
              <a
                key={i}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-primary hover:underline"
              >
                <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                {link.label}
              </a>
            ))}
          </div>
        )}

        {!publicKey && (
          <p className="text-center text-sm text-muted-foreground">
            Connect your wallet to start testing.
          </p>
        )}
      </div>
    </div>
  );
}
