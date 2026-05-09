# AtomicYield

Gamified fitness staking on Solana. Users commit to daily health goals (steps, workouts, cycling) by locking SOL into an on-chain vault. A trusted oracle verifies habit completion via wearable data. Complete your epoch and get your full stake back plus a share of forfeited deposits from users who quit. Fail, and your stake is redistributed to winners. Streak milestones unlock compressed NFT badges. Real DeFi yield via Kamino is planned for a future release.

## Live Demo

**[dev3pack-lake.vercel.app](https://dev3pack-lake.vercel.app)** — Solana devnet

## Devnet Contract

| | |
|---|---|
| **Program ID** | `GoaMsjPkq4o6NvCRduKMA4W7EcF5wWM8mXgZbLM65y9K` |
| **Explorer** | [View on Solana Explorer](https://explorer.solana.com/address/GoaMsjPkq4o6NvCRduKMA4W7EcF5wWM8mXgZbLM65y9K?cluster=devnet) |
| **Deploy TX** | `54jDp6kc92dAQK2xmrjWhH4eaBReiEdTW7GqRWenH3re1FrdZcDqaoQgegPdbY1ifgAr6xnF54X91aK8PFLkVbHo` |
| **Cluster** | Devnet |

## Local Setup

```bash
npm install
cp .env.example .env
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). Connect a devnet-funded Phantom or Solflare wallet.

> **First run:** `initialize_pool` must be called once before any deposits will work.
> The frontend does this automatically on first wallet connect (guarded by localStorage).

## Deploy — Frontend (Vercel)

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) → **Add New Project** → import the repo
3. Vercel auto-detects Vite. Leave build settings as-is (`vercel.json` handles them)
4. Add environment variables in the Vercel dashboard:

   | Variable | Value |
   |---|---|
   | `VITE_DEV_MODE` | `false` |
   | `VITE_RPC_URL` | `https://api.devnet.solana.com` |
   | `VITE_PROGRAM_ID` | `GoaMsjPkq4o6NvCRduKMA4W7EcF5wWM8mXgZbLM65y9K` |
   | `VITE_ORACLE_PUBKEY` | your oracle wallet address |

5. Click **Deploy**. Vercel will rebuild on every push to `main`.

## Deploy — Oracle Agent (Railway)

The oracle agent runs as a persistent Node.js service with a daily cron.

1. Go to [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo**
2. Select this repo, set **Root Directory** to `agent/`
3. Railway auto-detects Node.js via nixpacks. `agent/railway.toml` sets the start command
4. Add environment variables as **secrets** in the Railway dashboard:

   | Variable | Notes |
   |---|---|
   | `ORACLE_PRIVATE_KEY` | Base58-encoded private key of your oracle wallet. **Never commit this.** |
   | `RPC_URL` | `https://api.devnet.solana.com` (or a paid RPC for production) |
   | `PROGRAM_ID` | `GoaMsjPkq4o6NvCRduKMA4W7EcF5wWM8mXgZbLM65y9K` |
   | `CRON_SCHEDULE` | `5 0 * * *` (daily at 00:05 UTC) |

5. Click **Deploy**. The agent runs immediately on start, then on the cron schedule.

**Generating an oracle keypair:**
```bash
solana-keygen new --outfile oracle.json
# Fund it on devnet:
solana airdrop 2 $(solana-keygen pubkey oracle.json) --url devnet
# Get base58 private key for Railway:
cat oracle.json | node -e "const bs58=require('bs58');process.stdin.on('data',d=>console.log(bs58.encode(Buffer.from(JSON.parse(d)))))"
```

### Local oracle agent

```bash
cd agent
cp .env.example .env   # add ORACLE_PRIVATE_KEY
npm install
npm start              # runs once + starts daily cron
```

## Tech Stack

- **Smart Contract** — Anchor (Rust), Solana Program Library
- **Frontend** — React 18, TypeScript, Vite, Tailwind CSS, Framer Motion
- **Wallet** — Solana Wallet Adapter (Phantom, Solflare)
- **UI** — shadcn/ui (Radix), Lucide icons
- **Oracle Agent** — Node.js, node-cron, @coral-xyz/anchor
- **Hosting** — Vercel (frontend), Railway (oracle agent)

## Program Instructions

| Instruction | Description |
|---|---|
| `initialize_pool` | Creates the global StakingPool PDA — must be called once before deposits |
| `deposit_stake` | Locks SOL and creates a HabitCommitment |
| `verify_habit` | Oracle confirms daily habit completion |
| `settle_epoch` | Returns stake to winners, forfeits losers |
| `claim_nft_badge` | Emits badge event for streak milestones |

## Architecture

```
src/
├── components/       # React UI components
├── hooks/            # useAtomicYield, useToast
├── idl/              # Anchor IDL (auto-generated)
├── lib/              # SDK, constants, utilities
└── pages/            # Route pages (/, /test)

agent/
├── index.ts          # Cron scheduler + orchestrator
├── railway.toml      # Railway deploy config
└── tools/            # check, verify, settle functions

contracts/
└── programs/workspace/src/lib.rs   # Anchor program
```

## x402 Micropayment Routing

AtomicYield implements on-chain x402 micropayment routing in `settle_epoch`.
When a winner settles their epoch, **50 bps (0.5%)** of their stake is automatically
routed to an `x402_facilitator` account before the remainder is returned — demonstrating
the [x402 payment protocol](https://x402.org) directly on Solana.

| | |
|---|---|
| **Fee** | 50 bps (0.5%) of stake |
| **Recipient** | `x402_facilitator` account (set in SDK call) |
| **Devnet default** | Connected wallet acts as facilitator |
| **Event emitted** | `EpochSettled { reward_amount, x402_fee }` |

### Redeploy after x402 changes

`settle_epoch` now requires a new `x402_facilitator` account — this is a breaking change.
After merging, redeploy the program to devnet:

```bash
cd contracts
anchor build
anchor upgrade target/deploy/workspace.so \
  --program-id GoaMsjPkq4o6NvCRduKMA4W7EcF5wWM8mXgZbLM65y9K \
  --provider.cluster devnet \
  --provider.wallet ~/.config/solana/id.json
```

Then copy the regenerated IDL:
```bash
cp target/idl/workspace.json ../src/idl/workspaceIDL.json
```

## Dev / Test

With `VITE_DEV_MODE=true` in `.env`, a **Test** link appears in the nav pointing to `/test`.
The test page lets you run Deposit → Verify → Settle end-to-end against devnet with a single
connected wallet acting as both user and oracle.

> Note: `settle_epoch` checks `elapsed_days >= epoch_days` on-chain using real clock time.
> For a 1-day test epoch, you must wait ~24h after deposit before settle succeeds.
> Use the **Force Settle** button to test the `EpochNotComplete` error path immediately.
