# AtomicYield

Gamified fitness staking on Solana. Users commit to daily health goals (steps, workouts, cycling) by locking SOL into an on-chain vault. A trusted oracle verifies habit completion via wearable data. Complete your epoch and get your full stake back plus a share of forfeited deposits from users who quit. Fail, and your stake is redistributed to winners. Streak milestones unlock compressed NFT badges. Real DeFi yield via Kamino is planned for a future release.

## Devnet Contract

| | |
|---|---|
| **Program ID** | `GoaMsjPkq4o6NvCRduKMA4W7EcF5wWM8mXgZbLM65y9K` |
| **Explorer** | [View on Solana Explorer](https://explorer.solana.com/address/GoaMsjPkq4o6NvCRduKMA4W7EcF5wWM8mXgZbLM65y9K?cluster=devnet) |
| **Cluster** | Devnet |

## Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The app connects to Solana devnet by default. Use a devnet-funded Phantom or Solflare wallet.

### Oracle Agent (optional)

```bash
cd agent
cp .env.example .env   # add ORACLE_PRIVATE_KEY
npm install
npx tsx index.js        # runs once + daily cron at 00:05 UTC
```

## Tech Stack

- **Smart Contract** — Anchor (Rust), Solana Program Library
- **Frontend** — React 18, TypeScript, Vite, Tailwind CSS, Framer Motion
- **Wallet** — Solana Wallet Adapter (Phantom, Solflare)
- **UI** — shadcn/ui (Radix), Lucide icons
- **Oracle Agent** — Node.js, node-cron, @coral-xyz/anchor
- **Deployment** — Solana devnet

## Program Instructions

| Instruction | Description |
|---|---|
| `initialize_pool` | Creates the global StakingPool PDA |
| `deposit_stake` | Locks SOL and creates a HabitCommitment |
| `verify_habit` | Oracle confirms daily habit completion |
| `settle_epoch` | Returns stake to winners, forfeits losers |
| `claim_nft_badge` | Emits badge event for streak milestones |

## Architecture

```
src/
├── components/       # React UI components
├── hooks/            # useAtomicYield, useToast
���── idl/              # Anchor IDL (auto-generated)
├── lib/              # SDK, constants, utilities
└── pages/            # Route pages

agent/
├── index.js          # Cron scheduler + orchestrator
└── tools/            # check, verify, settle functions

contracts/
└── programs/workspace/src/lib.rs   # Anchor program
```
