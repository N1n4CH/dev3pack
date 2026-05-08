import React from 'react';
import { ArrowRight, Zap, Shield, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

const stats = [
  { label: 'Total Staked', value: '12,450 SOL', icon: Shield },
  { label: 'Active Epochs', value: '842', icon: Zap },
  { label: 'Avg. APY', value: '18.4%', icon: TrendingUp },
];

const HeroSection: React.FC = () => {
  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden pt-16">
      {/* Background Mesh */}
      <div
        className="absolute inset-0"
        style={{ background: 'var(--gradient-mesh)' }}
      />
      {/* Floating orbs */}
      <div className="absolute top-1/4 left-1/6 w-72 h-72 rounded-full bg-primary/5 blur-3xl animate-float" />
      <div className="absolute bottom-1/4 right-1/6 w-96 h-96 rounded-full bg-secondary/5 blur-3xl animate-float" style={{ animationDelay: '2s' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/3 blur-[100px]" />

      <div className="container relative z-10">
        <div className="mx-auto max-w-3xl text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 mb-8">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
              </span>
              <span className="text-xs font-medium text-primary">Live on Solana Devnet</span>
            </div>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-display text-4xl font-bold leading-tight tracking-tight sm:text-5xl md:text-6xl lg:text-7xl"
          >
            <span className="text-foreground">Stake Your</span>
            <br />
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: 'var(--gradient-primary)', backgroundSize: '200% auto' }}
            >
              Fitness Goals
            </span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mx-auto mt-6 max-w-xl text-base text-muted-foreground sm:text-lg leading-relaxed"
          >
            Small habits. Massive yields. Commit SOL to daily fitness habits, complete your streak to earn
            Kamino yield + forfeited stakes. Miss a day and your stake fuels others.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <a href="#stake">
              <Button
                size="lg"
                className="h-12 px-8 font-display font-semibold text-primary-foreground bg-primary hover:bg-primary/90 shadow-glow-purple-sm hover:shadow-glow-purple-md transition-all duration-300 rounded-xl text-sm"
              >
                Start Staking
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </a>
            <a href="#dashboard">
              <Button
                size="lg"
                variant="outline"
                className="h-12 px-8 font-display font-semibold border-border text-foreground hover:bg-muted/50 rounded-xl text-sm"
              >
                View Dashboard
              </Button>
            </a>
          </motion.div>
        </div>

        {/* Stats bar */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mx-auto mt-20 max-w-2xl"
        >
          <div className="grid grid-cols-3 gap-4 rounded-2xl border border-border/50 bg-card/60 backdrop-blur-md p-6 shadow-card">
            {stats.map((stat, i) => (
              <div
                key={stat.label}
                className={`flex flex-col items-center gap-2 ${
                  i < stats.length - 1 ? 'border-r border-border/50' : ''
                }`}
              >
                <stat.icon className="h-5 w-5 text-primary" />
                <span className="font-display text-lg font-bold text-foreground sm:text-xl">{stat.value}</span>
                <span className="text-xs text-muted-foreground">{stat.label}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;