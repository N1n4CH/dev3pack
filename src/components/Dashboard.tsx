import React, { useState } from 'react';
import {
  Flame,
  Calendar,
  Coins,
  CheckCircle,
  TrendingUp,
  Clock,
  Zap,
  Loader2,
  ExternalLink,
  Award,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import ProgressRing from './ProgressRing';
import { useWallet } from '@solana/wallet-adapter-react';
import { useToast } from '@/hooks/use-toast';
import { useAtomicYield } from '@/hooks/useAtomicYield';
import { getExplorerTxUrl } from '@/lib/constants';

interface ActiveHabit {
  id: string;
  habit: string;
  icon: React.ElementType;
  staked: number;
  daysCompleted: number;
  totalDays: number;
  streak: number;
  verified: boolean;
  status: 'active' | 'at_risk';
  apy: number;
  epochId: number;
}

const mockHabits: ActiveHabit[] = [
  {
    id: '1',
    habit: '10K Steps',
    icon: Flame,
    staked: 2.0,
    daysCompleted: 9,
    totalDays: 14,
    streak: 9,
    verified: true,
    status: 'active',
    apy: 18.4,
    epochId: 1001,
  },
  {
    id: '2',
    habit: 'Daily Workout',
    icon: Zap,
    staked: 1.5,
    daysCompleted: 4,
    totalDays: 7,
    streak: 4,
    verified: false,
    status: 'active',
    apy: 15.2,
    epochId: 1002,
  },
  {
    id: '3',
    habit: 'Cycling',
    icon: TrendingUp,
    staked: 5.0,
    daysCompleted: 22,
    totalDays: 30,
    streak: 22,
    verified: true,
    status: 'active',
    apy: 22.1,
    epochId: 1003,
  },
];

const overviewStats = [
  { label: 'Total Staked', value: '8.5 SOL', change: '+2.5', icon: Coins, color: 'primary' as const },
  { label: 'Active Streaks', value: '3', change: '+1', icon: Flame, color: 'secondary' as const },
  { label: 'Days Active', value: '22', change: null, icon: Calendar, color: 'accent' as const },
  { label: 'Est. Yield', value: '0.42 SOL', change: '+12%', icon: TrendingUp, color: 'primary' as const },
];

const colorClasses = {
  primary: {
    bg: 'bg-primary/10',
    text: 'text-primary',
    border: 'border-primary/20',
    glow: 'shadow-glow-purple-sm',
  },
  secondary: {
    bg: 'bg-secondary/10',
    text: 'text-secondary',
    border: 'border-secondary/20',
    glow: 'shadow-glow-purple-sm',
  },
  accent: {
    bg: 'bg-accent/10',
    text: 'text-accent',
    border: 'border-accent/20',
    glow: 'shadow-glow-amber-sm',
  },
};

const Dashboard: React.FC = () => {
  const { connected } = useWallet();
  const { sdk, publicKey } = useAtomicYield();
  const { toast } = useToast();

  const [habits, setHabits] = useState(mockHabits);
  const [loadingVerify, setLoadingVerify] = useState<string | null>(null);
  const [loadingSettle, setLoadingSettle] = useState<string | null>(null);

  const handleVerifyHabit = async (habitItem: ActiveHabit) => {
    if (!sdk || !publicKey) {
      toast({ title: 'Wallet not connected', variant: 'destructive' });
      return;
    }
    setLoadingVerify(habitItem.id);
    try {
      const result = await sdk.verifyHabit(publicKey, habitItem.epochId);
      if (result.success && result.data) {
        setHabits((prev) =>
          prev.map((h) =>
            h.id === habitItem.id
              ? { ...h, verified: true, daysCompleted: h.daysCompleted + 1, streak: h.streak + 1 }
              : h,
          ),
        );
        toast({
          title: 'Habit verified!',
          description: `Day ${habitItem.daysCompleted + 1} of ${habitItem.totalDays} confirmed.`,
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
        toast({ title: 'Verification failed', description: result.error, variant: 'destructive' });
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error?.message || 'Verification failed', variant: 'destructive' });
    } finally {
      setLoadingVerify(null);
    }
  };

  const handleSettleEpoch = async (habitItem: ActiveHabit) => {
    if (!sdk || !publicKey) {
      toast({ title: 'Wallet not connected', variant: 'destructive' });
      return;
    }
    setLoadingSettle(habitItem.id);
    try {
      const result = await sdk.settleEpoch(publicKey, habitItem.epochId);
      if (result.success && result.data) {
        setHabits((prev) => prev.filter((h) => h.id !== habitItem.id));
        toast({
          title: 'Epoch settled!',
          description: habitItem.daysCompleted >= habitItem.totalDays
            ? 'Congratulations! Stake + rewards returned.'
            : 'Epoch settled. Stake forfeited to pool.',
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
        toast({ title: 'Settlement failed', description: result.error, variant: 'destructive' });
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error?.message || 'Settlement failed', variant: 'destructive' });
    } finally {
      setLoadingSettle(null);
    }
  };

  return (
    <section id="dashboard" className="py-20 md:py-28 relative">
      <div className="container relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <h2 className="font-display text-3xl font-bold text-foreground sm:text-4xl">
            Your <span className="text-secondary">Dashboard</span>
          </h2>
          <p className="mt-3 text-muted-foreground max-w-lg mx-auto">
            Track your active habits, streaks, and staked amounts in real time.
          </p>
        </motion.div>

        {/* Overview Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10"
        >
          {overviewStats.map((stat) => {
            const cls = colorClasses[stat.color];
            return (
              <Card
                key={stat.label}
                className="border-border/50 bg-card/60 backdrop-blur-md transition-all duration-300"
              >
                <CardContent className="p-4 md:p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${cls.bg}`}>
                      <stat.icon className={`h-4 w-4 ${cls.text}`} />
                    </div>
                    <span className="text-xs text-muted-foreground">{stat.label}</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="font-display text-xl font-bold text-foreground md:text-2xl">
                      {stat.value}
                    </span>
                    {stat.change && (
                      <span className={`text-xs font-medium ${cls.text}`}>
                        {stat.change}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </motion.div>

        {/* Active Habits */}
        <div className="grid gap-6 lg:grid-cols-3">
          {habits.map((habitItem, index) => {
            const progress = Math.round((habitItem.daysCompleted / habitItem.totalDays) * 100);
            const daysLeft = habitItem.totalDays - habitItem.daysCompleted;
            const ringColor = habitItem.id === '1' ? 'green' : habitItem.id === '2' ? 'purple' : 'amber';
            const isEpochComplete = habitItem.daysCompleted >= habitItem.totalDays;

            return (
              <motion.div
                key={habitItem.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card
                  className={`group border-border/50 bg-card/60 backdrop-blur-md transition-all duration-300 overflow-hidden ${
                    ringColor === 'green'
                      ? 'card-glow-green'
                      : ringColor === 'purple'
                      ? 'card-glow-purple'
                      : 'card-glow-amber'
                  }`}
                >
                  {/* Top accent line */}
                  <div
                    className="h-0.5 w-full"
                    style={{
                      background:
                        ringColor === 'green'
                          ? 'var(--gradient-primary)'
                          : ringColor === 'purple'
                          ? 'var(--gradient-secondary)'
                          : 'var(--gradient-accent)',
                    }}
                  />
                  <CardContent className="p-6">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                            ringColor === 'green'
                              ? 'bg-primary/10'
                              : ringColor === 'purple'
                              ? 'bg-secondary/10'
                              : 'bg-accent/10'
                          }`}
                        >
                          <habitItem.icon
                            className={`h-5 w-5 ${
                              ringColor === 'green'
                                ? 'text-primary'
                                : ringColor === 'purple'
                                ? 'text-secondary'
                                : 'text-accent'
                            }`}
                          />
                        </div>
                        <div>
                          <h4 className="font-display text-sm font-bold text-foreground">
                            {habitItem.habit}
                          </h4>
                          <p className="text-xs text-muted-foreground">
                            {habitItem.staked} SOL staked
                          </p>
                        </div>
                      </div>
                      <div
                        className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
                          habitItem.verified
                            ? 'bg-success/10 text-success'
                            : 'bg-accent/10 text-accent'
                        }`}
                      >
                        {habitItem.verified ? (
                          <>
                            <CheckCircle className="h-3 w-3" />
                            Verified
                          </>
                        ) : (
                          <>
                            <Clock className="h-3 w-3" />
                            Pending
                          </>
                        )}
                      </div>
                    </div>

                    {/* Progress Ring */}
                    <div className="flex items-center justify-center mb-6">
                      <ProgressRing progress={progress} size={140} strokeWidth={10} color={ringColor}>
                        <div className="text-center">
                          <span className="font-display text-2xl font-bold text-foreground">
                            {habitItem.streak}
                          </span>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                            day streak
                          </p>
                        </div>
                      </ProgressRing>
                    </div>

                    {/* Stats row */}
                    <div className="grid grid-cols-3 gap-3 mb-5">
                      <div className="text-center rounded-lg bg-muted/30 py-2.5">
                        <p className="text-xs text-muted-foreground">Progress</p>
                        <p className="font-display text-sm font-bold text-foreground">{progress}%</p>
                      </div>
                      <div className="text-center rounded-lg bg-muted/30 py-2.5">
                        <p className="text-xs text-muted-foreground">Days Left</p>
                        <p className="font-display text-sm font-bold text-foreground">{daysLeft}</p>
                      </div>
                      <div className="text-center rounded-lg bg-muted/30 py-2.5">
                        <p className="text-xs text-muted-foreground">APY</p>
                        <p className="font-display text-sm font-bold text-primary">{habitItem.apy}%</p>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="space-y-2">
                      {!isEpochComplete && !habitItem.verified && connected && (
                        <Button
                          className="w-full h-10 text-sm font-semibold rounded-xl bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 transition-all"
                          disabled={loadingVerify === habitItem.id}
                          onClick={() => handleVerifyHabit(habitItem)}
                        >
                          {loadingVerify === habitItem.id ? (
                            <>
                              <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                              Verifying...
                            </>
                          ) : (
                            <>
                              <CheckCircle className="mr-2 h-3.5 w-3.5" />
                              Verify Today
                            </>
                          )}
                        </Button>
                      )}

                      {isEpochComplete && connected && (
                        <Button
                          className="w-full h-10 text-sm font-semibold rounded-xl bg-accent/10 text-accent hover:bg-accent/20 border border-accent/20 transition-all"
                          disabled={loadingSettle === habitItem.id}
                          onClick={() => handleSettleEpoch(habitItem)}
                        >
                          {loadingSettle === habitItem.id ? (
                            <>
                              <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                              Settling...
                            </>
                          ) : (
                            <>
                              <Award className="mr-2 h-3.5 w-3.5" />
                              Settle Epoch
                            </>
                          )}
                        </Button>
                      )}

                      {!isEpochComplete && habitItem.verified && (
                        <div className="flex items-center justify-center gap-2 rounded-xl border border-success/20 bg-success/5 px-4 py-2.5">
                          <CheckCircle className="h-4 w-4 text-success" />
                          <span className="text-sm text-success font-medium">Today verified</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Dashboard;
