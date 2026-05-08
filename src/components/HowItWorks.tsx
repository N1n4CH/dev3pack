import React from 'react';
import { Target, Lock, CheckCircle, Coins } from 'lucide-react';
import { motion } from 'framer-motion';

const steps = [
  {
    icon: Target,
    title: 'Set Your Goal',
    description: 'Choose a fitness habit and commit to a daily routine with a defined epoch length.',
    color: 'primary' as const,
  },
  {
    icon: Lock,
    title: 'Stake SOL',
    description: 'Deposit SOL as collateral. Your stake is deposited into Kamino vaults to earn yield.',
    color: 'secondary' as const,
  },
  {
    icon: CheckCircle,
    title: 'Verify Daily',
    description: 'Complete and verify your daily habit. Maintain your streak throughout the full epoch.',
    color: 'accent' as const,
  },
  {
    icon: Coins,
    title: 'Earn Rewards',
    description: 'Complete the epoch to reclaim your stake plus Kamino yield and forfeited pool shares.',
    color: 'primary' as const,
  },
];

const colorClasses = {
  primary: {
    iconBg: 'bg-primary/10',
    iconText: 'text-primary',
    border: 'border-primary/20',
    line: 'bg-primary/20',
    number: 'text-primary',
  },
  secondary: {
    iconBg: 'bg-secondary/10',
    iconText: 'text-secondary',
    border: 'border-secondary/20',
    line: 'bg-secondary/20',
    number: 'text-secondary',
  },
  accent: {
    iconBg: 'bg-accent/10',
    iconText: 'text-accent',
    border: 'border-accent/20',
    line: 'bg-accent/20',
    number: 'text-accent',
  },
};

const HowItWorks: React.FC = () => {
  return (
    <section className="py-20 md:py-28 relative">
      <div className="container relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <h2 className="font-display text-3xl font-bold text-foreground sm:text-4xl">
            How <span className="text-primary">AtomicYield</span> Works
          </h2>
          <p className="mt-3 text-muted-foreground max-w-lg mx-auto">
            Four simple steps to turn your fitness goals into financial rewards.
          </p>
        </motion.div>

        <div className="mx-auto max-w-3xl">
          <div className="relative">
            {/* Vertical line connector (desktop) */}
            <div className="absolute left-[27px] top-10 bottom-10 w-px bg-border/50 hidden md:block" />

            <div className="space-y-8">
              {steps.map((step, index) => {
                const cls = colorClasses[step.color];
                return (
                  <motion.div
                    key={step.title}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="flex gap-5 items-start"
                  >
                    <div className="relative flex-shrink-0">
                      <div
                        className={`flex h-14 w-14 items-center justify-center rounded-2xl ${cls.iconBg} border ${cls.border}`}
                      >
                        <step.icon className={`h-6 w-6 ${cls.iconText}`} />
                      </div>
                      <span
                        className={`absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-card text-[10px] font-bold ${cls.number} border ${cls.border}`}
                      >
                        {index + 1}
                      </span>
                    </div>
                    <div className="pt-2">
                      <h3 className="font-display text-base font-bold text-foreground">{step.title}</h3>
                      <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;