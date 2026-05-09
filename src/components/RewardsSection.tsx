import React from 'react';
import {
  Trophy,
  Gift,
  Star,
  ArrowUpRight,
  Sparkles,
  Award,
  Shield,
  Zap,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface EpochOutcome {
  id: string;
  epoch: string;
  habit: string;
  status: 'completed' | 'failed';
  staked: number;
  returned: number;
  forfeitShare: number;
}

interface NFTBadge {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  streakRequired: number;
  earned: boolean;
}

const epochOutcomes: EpochOutcome[] = [
  {
    id: '1',
    epoch: 'Epoch #47',
    habit: '10K Steps',
    status: 'completed',
    staked: 2.0,
    returned: 2.0,
    forfeitShare: 0.35,
  },
  {
    id: '2',
    epoch: 'Epoch #46',
    habit: 'Daily Workout',
    status: 'completed',
    staked: 1.0,
    returned: 1.0,
    forfeitShare: 0.18,
  },
  {
    id: '3',
    epoch: 'Epoch #45',
    habit: 'Cycling',
    status: 'failed',
    staked: 3.0,
    returned: 0,
    forfeitShare: 0,
  },
];

const nftBadges: NFTBadge[] = [
  {
    id: '1',
    name: 'Iron Will',
    description: '7-day streak',
    icon: Shield,
    rarity: 'common',
    streakRequired: 7,
    earned: true,
  },
  {
    id: '2',
    name: 'Burning Bright',
    description: '14-day streak',
    icon: Zap,
    rarity: 'rare',
    streakRequired: 14,
    earned: true,
  },
  {
    id: '3',
    name: 'Unstoppable',
    description: '30-day streak',
    icon: Star,
    rarity: 'epic',
    streakRequired: 30,
    earned: false,
  },
  {
    id: '4',
    name: 'Legend',
    description: '60-day streak',
    icon: Trophy,
    rarity: 'legendary',
    streakRequired: 60,
    earned: false,
  },
];

const rarityStyles: Record<string, { border: string; bg: string; text: string; glow: string; badgeBg: string }> = {
  common: {
    border: 'border-muted-foreground/30',
    bg: 'bg-muted/20',
    text: 'text-muted-foreground',
    glow: '',
    badgeBg: 'bg-muted-foreground/10',
  },
  rare: {
    border: 'border-secondary/30',
    bg: 'bg-secondary/5',
    text: 'text-secondary',
    glow: 'shadow-glow-purple-sm',
    badgeBg: 'bg-secondary/10',
  },
  epic: {
    border: 'border-accent/30',
    bg: 'bg-accent/5',
    text: 'text-accent',
    glow: 'shadow-glow-amber-sm',
    badgeBg: 'bg-accent/10',
  },
  legendary: {
    border: 'border-primary/30',
    bg: 'bg-primary/5',
    text: 'text-primary',
    glow: 'shadow-glow-green-sm',
    badgeBg: 'bg-primary/10',
  },
};

const RewardsSection: React.FC = () => {
  const totalClaimable = epochOutcomes
    .filter((e) => e.status === 'completed')
    .reduce((sum, e) => sum + e.forfeitShare, 0);

  return (
    <section id="rewards" className="py-20 md:py-28 relative">
      <div
        className="absolute inset-0 opacity-30"
        style={{ background: 'var(--gradient-mesh)' }}
      />
      <div className="container relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <h2 className="font-display text-3xl font-bold text-foreground sm:text-4xl">
            Rewards & <span className="text-accent">Achievements</span>
          </h2>
          <p className="mt-3 text-muted-foreground max-w-lg mx-auto">
            Claim your stake returns, review epoch outcomes, and collect cNFT badges for your achievements.
          </p>
        </motion.div>

        {/* Claimable Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-10"
        >
          <Card className="border-primary/20 bg-primary/5 backdrop-blur-md overflow-hidden">
            <CardContent className="p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 shadow-glow-purple-sm neon-pulse">
                  <Gift className="h-7 w-7 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Claimable Rewards</p>
                  <div className="flex items-baseline gap-2">
                    <span className="font-display text-3xl font-bold text-primary">
                      {totalClaimable.toFixed(2)}
                    </span>
                    <span className="text-sm text-primary/70 font-medium">SOL</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Stake returned + forfeit pool share (Kamino yield coming soon)
                  </p>
                </div>
              </div>
              <Button
                className="h-12 px-8 font-display font-semibold text-primary-foreground bg-primary hover:bg-primary/90 shadow-glow-purple-sm hover:shadow-glow-purple-md transition-all duration-300 rounded-xl"
              >
                <Sparkles className="mr-2 h-4 w-4" />
                Claim All Rewards
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Epoch Outcomes */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <h3 className="font-display text-lg font-bold text-foreground mb-5 flex items-center gap-2">
              <Award className="h-5 w-5 text-secondary" />
              Epoch History
            </h3>
            <div className="space-y-3">
              {epochOutcomes.map((outcome) => (
                <Card
                  key={outcome.id}
                  className="border-border/50 bg-card/60 backdrop-blur-md transition-all duration-300 hover:bg-card/80"
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-foreground">
                            {outcome.epoch}
                          </span>
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                              outcome.status === 'completed'
                                ? 'bg-primary/10 text-primary'
                                : 'bg-destructive/10 text-destructive'
                            }`}
                          >
                            {outcome.status === 'completed' ? (
                              <Trophy className="h-3 w-3" />
                            ) : (
                              <Star className="h-3 w-3" />
                            )}
                            {outcome.status === 'completed' ? 'Completed' : 'Forfeited'}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{outcome.habit}</p>
                      </div>
                      <span className="text-sm font-semibold text-foreground">
                        {outcome.staked} SOL
                      </span>
                    </div>

                    {outcome.status === 'completed' ? (
                      <div className="grid grid-cols-2 gap-2">
                        <div className="rounded-lg bg-muted/30 px-3 py-2 text-center">
                          <p className="text-[10px] text-muted-foreground uppercase">Stake Returned</p>
                          <p className="text-xs font-bold text-foreground">{outcome.returned} SOL</p>
                        </div>
                        <div className="rounded-lg bg-accent/5 px-3 py-2 text-center">
                          <p className="text-[10px] text-accent/70 uppercase">Forfeit Pool Share</p>
                          <p className="text-xs font-bold text-accent">+{outcome.forfeitShare} SOL</p>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-lg bg-destructive/5 px-3 py-2.5 text-center">
                        <p className="text-xs text-destructive">
                          Stake forfeited and redistributed to successful participants
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.div>

          {/* NFT Badges */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <h3 className="font-display text-lg font-bold text-foreground mb-5 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-accent" />
              cNFT Badges
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {nftBadges.map((badge) => {
                const style = rarityStyles[badge.rarity];
                return (
                  <Card
                    key={badge.id}
                    className={`relative overflow-hidden transition-all duration-300 ${
                      badge.earned
                        ? `${style.border} ${style.bg} ${style.glow}`
                        : 'border-border/30 bg-card/30 opacity-60'
                    }`}
                  >
                    <CardContent className="p-5 flex flex-col items-center text-center">
                      {/* Badge Icon */}
                      <div
                        className={`flex h-16 w-16 items-center justify-center rounded-2xl mb-3 ${
                          badge.earned ? style.badgeBg : 'bg-muted/20'
                        } ${badge.earned ? 'neon-pulse' : ''}`}
                      >
                        <badge.icon
                          className={`h-8 w-8 ${badge.earned ? style.text : 'text-muted-foreground/50'}`}
                        />
                      </div>

                      <h4
                        className={`font-display text-sm font-bold ${
                          badge.earned ? 'text-foreground' : 'text-muted-foreground'
                        }`}
                      >
                        {badge.name}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-1">{badge.description}</p>

                      {/* Rarity label */}
                      <span
                        className={`mt-3 inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                          badge.earned
                            ? `${style.badgeBg} ${style.text}`
                            : 'bg-muted/20 text-muted-foreground/50'
                        }`}
                      >
                        {badge.rarity}
                      </span>

                      {!badge.earned && (
                        <p className="text-[10px] text-muted-foreground mt-2">
                          {badge.streakRequired}-day streak required
                        </p>
                      )}

                      {badge.earned && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`mt-3 h-7 text-xs ${style.text} hover:${style.bg}`}
                        >
                          View
                          <ArrowUpRight className="ml-1 h-3 w-3" />
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default RewardsSection;