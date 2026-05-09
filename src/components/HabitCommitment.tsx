import React, { useState } from 'react';
import { Dumbbell, Timer, Coins, ArrowRight, Flame, Footprints, Bike, Loader2, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useWallet } from '@solana/wallet-adapter-react';
import { useToast } from '@/hooks/use-toast';
import { useAtomicYield } from '@/hooks/useAtomicYield';
import { getExplorerTxUrl } from '@/lib/constants';

const habitTypes = [
  { id: 'steps', label: '10K Steps', icon: Footprints, desc: 'Walk 10,000 steps daily', goalType: 0, dailyTarget: 10000 },
  { id: 'workout', label: 'Daily Workout', icon: Dumbbell, desc: '30 min exercise session', goalType: 1, dailyTarget: 30 },
  { id: 'cycling', label: 'Cycling', icon: Bike, desc: '15km cycling daily', goalType: 2, dailyTarget: 15 },
  { id: 'streak', label: 'Habit Streak', icon: Flame, desc: 'Custom habit tracking', goalType: 3, dailyTarget: 1 },
];

const epochOptions = [
  { days: 7, label: '7 Days', multiplier: '1.2x' },
  { days: 14, label: '14 Days', multiplier: '1.5x' },
  { days: 30, label: '30 Days', multiplier: '2.0x' },
  { days: 60, label: '60 Days', multiplier: '3.0x' },
];

const stakeAmounts = [0.5, 1, 2, 5];

const HabitCommitment: React.FC = () => {
  const { connected } = useWallet();
  const { sdk, publicKey } = useAtomicYield();
  const { toast } = useToast();

  const [selectedHabit, setSelectedHabit] = useState<string>('steps');
  const [selectedEpoch, setSelectedEpoch] = useState<number>(14);
  const [stakeAmount, setStakeAmount] = useState<number>(1);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const currentEpoch = epochOptions.find((e) => e.days === selectedEpoch);
  const displayAmount = customAmount ? parseFloat(customAmount) || 0 : stakeAmount;
  const habit = habitTypes.find((h) => h.id === selectedHabit)!;

  const handleDepositStake = async () => {
    if (!sdk || !publicKey) {
      toast({ title: 'Wallet not connected', description: 'Please connect your wallet first.', variant: 'destructive' });
      return;
    }
    if (displayAmount <= 0) {
      toast({ title: 'Invalid amount', description: 'Stake must be greater than 0 SOL.', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    try {
      const epochId = sdk.generateEpochId();
      const result = await sdk.depositStake({
        goalType: habit.goalType,
        dailyTarget: habit.dailyTarget,
        epochDays: selectedEpoch,
        stakeAmountSol: displayAmount,
        epochId,
      });

      if (result.success && result.data) {
        toast({
          title: 'Stake committed!',
          description: `${displayAmount} SOL staked for ${selectedEpoch} days. View on Explorer.`,
          action: (
            <a
              href={getExplorerTxUrl(result.data.signature)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              View TX <ExternalLink className="h-3 w-3" />
            </a>
          ),
        });
      } else {
        toast({ title: 'Transaction failed', description: result.error || 'Unknown error', variant: 'destructive' });
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error?.message || 'Unexpected error occurred.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section id="stake" className="py-20 md:py-28 relative">
      <div
        className="absolute inset-0 opacity-50"
        style={{ background: 'var(--gradient-mesh)' }}
      />
      <div className="container relative z-10">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <h2 className="font-display text-3xl font-bold text-foreground sm:text-4xl">
            Commit to Your <span className="text-primary">Goals</span>
          </h2>
          <p className="mt-3 text-muted-foreground max-w-lg mx-auto">
            Choose your habit, lock your epoch, deposit your stake. Your commitment starts now.
          </p>
        </motion.div>

        <div className="mx-auto max-w-4xl">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Left: Selection */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-6"
            >
              {/* Habit Type */}
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-3">Select Habit</label>
                <div className="grid grid-cols-2 gap-3">
                  {habitTypes.map((h) => (
                    <button
                      key={h.id}
                      onClick={() => setSelectedHabit(h.id)}
                      className={`group relative flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition-all duration-300 ${
                        selectedHabit === h.id
                          ? 'border-primary/40 bg-primary/5 shadow-glow-purple-sm'
                          : 'border-border/50 bg-card/60 hover:border-border hover:bg-card/80'
                      }`}
                    >
                      <h.icon
                        className={`h-5 w-5 ${
                          selectedHabit === h.id ? 'text-primary' : 'text-muted-foreground'
                        }`}
                      />
                      <div>
                        <p className={`text-sm font-semibold ${selectedHabit === h.id ? 'text-foreground' : 'text-foreground/80'}`}>
                          {h.label}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">{h.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Epoch Length */}
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-3">
                  <Timer className="inline h-4 w-4 mr-1.5 -mt-0.5" />
                  Epoch Length
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {epochOptions.map((epoch) => (
                    <button
                      key={epoch.days}
                      onClick={() => setSelectedEpoch(epoch.days)}
                      className={`flex flex-col items-center gap-1 rounded-xl border p-3 transition-all duration-300 ${
                        selectedEpoch === epoch.days
                          ? 'border-secondary/40 bg-secondary/5 shadow-glow-purple-sm'
                          : 'border-border/50 bg-card/60 hover:border-border'
                      }`}
                    >
                      <span className={`text-sm font-bold ${selectedEpoch === epoch.days ? 'text-secondary' : 'text-foreground'}`}>
                        {epoch.label}
                      </span>
                      <span className={`text-xs ${selectedEpoch === epoch.days ? 'text-secondary/70' : 'text-muted-foreground'}`}>
                        {epoch.multiplier}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Stake Amount */}
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-3">
                  <Coins className="inline h-4 w-4 mr-1.5 -mt-0.5" />
                  Stake Amount (SOL)
                </label>
                <div className="grid grid-cols-4 gap-2 mb-3">
                  {stakeAmounts.map((amount) => (
                    <button
                      key={amount}
                      onClick={() => { setStakeAmount(amount); setCustomAmount(''); }}
                      className={`rounded-xl border py-2.5 text-sm font-semibold transition-all duration-300 ${
                        stakeAmount === amount && !customAmount
                          ? 'border-primary/40 bg-primary/10 text-primary shadow-glow-purple-sm'
                          : 'border-border/50 bg-card/60 text-foreground hover:border-border'
                      }`}
                    >
                      {amount} SOL
                    </button>
                  ))}
                </div>
                <div className="relative">
                  <input
                    type="number"
                    placeholder="Custom amount..."
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    className="w-full rounded-xl border border-border/50 bg-card/60 px-4 py-3 text-sm text-foreground placeholder-muted-foreground focus:border-primary/40 focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium">
                    SOL
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Right: Summary */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <Card className="border-border/50 bg-card/60 backdrop-blur-md shadow-elevated overflow-hidden h-full">
                <div className="h-1 w-full" style={{ background: 'var(--gradient-primary)' }} />
                <CardContent className="p-6 flex flex-col justify-between h-full">
                  <div>
                    <h3 className="font-display text-lg font-bold text-foreground mb-6">Commitment Summary</h3>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between rounded-xl bg-muted/30 px-4 py-3">
                        <span className="text-sm text-muted-foreground">Habit</span>
                        <span className="text-sm font-semibold text-foreground">{habit.label}</span>
                      </div>
                      <div className="flex items-center justify-between rounded-xl bg-muted/30 px-4 py-3">
                        <span className="text-sm text-muted-foreground">Epoch</span>
                        <span className="text-sm font-semibold text-secondary">{selectedEpoch} Days</span>
                      </div>
                      <div className="flex items-center justify-between rounded-xl bg-muted/30 px-4 py-3">
                        <span className="text-sm text-muted-foreground">Stake</span>
                        <span className="text-sm font-semibold text-primary">{displayAmount} SOL</span>
                      </div>
                      <div className="flex items-center justify-between rounded-xl bg-muted/30 px-4 py-3">
                        <span className="text-sm text-muted-foreground">Reward Multiplier</span>
                        <span className="text-sm font-semibold text-accent">{currentEpoch?.multiplier}</span>
                      </div>
                    </div>

                    {/* Potential rewards */}
                    <div className="mt-6 rounded-xl border border-primary/20 bg-primary/5 p-4">
                      <p className="text-xs text-muted-foreground mb-2">On Successful Completion</p>
                      <div className="flex items-baseline gap-2">
                        <span className="font-display text-2xl font-bold text-primary">
                          {displayAmount.toFixed(3)}
                        </span>
                        <span className="text-sm text-primary/70">SOL returned</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Stake returned + forfeit pool share (Kamino yield coming soon)
                      </p>
                    </div>
                  </div>

                  <Button
                    className="mt-6 w-full h-12 font-display font-semibold text-primary-foreground bg-primary hover:bg-primary/90 shadow-glow-purple-sm hover:shadow-glow-purple-md transition-all duration-300 rounded-xl"
                    disabled={!connected || isLoading || displayAmount <= 0}
                    onClick={handleDepositStake}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Confirming...
                      </>
                    ) : connected ? (
                      <>
                        Commit &amp; Stake
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    ) : (
                      'Connect Wallet to Stake'
                    )}
                  </Button>
                  {!connected && (
                    <p className="text-xs text-muted-foreground text-center mt-3">
                      Connect your Solana wallet to begin staking
                    </p>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HabitCommitment;