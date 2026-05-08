import React from 'react';
import AtomicIcon from './AtomicIcon';

const footerLinks = [
  {
    title: 'Product',
    links: ['Dashboard', 'Staking', 'Rewards', 'Leaderboard'],
  },
  {
    title: 'Resources',
    links: ['Documentation', 'API Reference', 'Status', 'Changelog'],
  },
  {
    title: 'Community',
    links: ['Discord', 'Twitter', 'GitHub', 'Forum'],
  },
];

const Footer: React.FC = () => {
  return (
    <footer className="border-t border-border/50 bg-surface/50 backdrop-blur-md">
      <div className="container py-12 md:py-16">
        <div className="grid gap-10 md:grid-cols-4">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
                <AtomicIcon className="text-primary" size={16} />
              </div>
              <span className="font-display text-base font-bold text-foreground">
                <span className="text-primary">Atomic</span><span className="text-foreground">Yield</span>
              </span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              Small habits. Massive yields. Gamified fitness staking on Solana.
            </p>
          </div>

          {/* Links */}
          {footerLinks.map((group) => (
            <div key={group.title}>
              <h4 className="text-sm font-semibold text-foreground mb-4">{group.title}</h4>
              <ul className="space-y-2.5">
                {group.links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="mt-12 flex flex-col md:flex-row items-center justify-between gap-4 border-t border-border/50 pt-8">
          <p className="text-xs text-muted-foreground">
            Built on Solana. Powered by Kamino Finance.
          </p>
          <p className="text-xs text-muted-foreground">
            AtomicYield &copy; 2025. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;