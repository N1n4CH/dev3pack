/**
 * ╔═══════════════════════════════════════════════════════════════════╗
 * ║  AtomicYield Oracle Agent                                       ║
 * ║                                                                 ║
 * ║  Automated daily cron that:                                     ║
 * ║  1. Fetches all active HabitCommitments from the program        ║
 * ║  2. Checks wearable data for each user (mock → Health Connect)  ║
 * ║  3. Verifies completed habits on-chain                          ║
 * ║  4. Settles epochs that have reached their end date             ║
 * ║                                                                 ║
 * ║  Target: Solana devnet                                          ║
 * ║  Run:    cd agent && npm start                                  ║
 * ╚═══════════════════════════════════════════════════════════════════╝
 */

import 'dotenv/config';
import { AnchorProvider, BN, Program } from '@coral-xyz/anchor';
import { Connection, Keypair, PublicKey, clusterApiUrl } from '@solana/web3.js';
import cron from 'node-cron';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { checkHabitCompletion } from './tools/checkHabitCompletion.js';
import { verifyHabitOnchain } from './tools/verifyHabitOnchain.js';
import { settleEpochOnchain } from './tools/settleEpochOnchain.js';

// ── Configuration ──────────────────────────────────────────────────

const RPC_URL = process.env.RPC_URL || clusterApiUrl('devnet');
const PROGRAM_ID = new PublicKey(
  process.env.PROGRAM_ID || '77NnA7iRfthT8wcdWxNsrueXbF7o251BzdBBDnDW4znf',
);
const CRON_SCHEDULE = process.env.CRON_SCHEDULE || '5 0 * * *';

// ── Helpers ────────────────────────────────────────────────────────

function timestamp() {
  return new Date().toISOString().replace('T', ' ').slice(0, 19);
}

async function loadOracleKeypair() {
  const privateKey = process.env.ORACLE_PRIVATE_KEY;
  if (!privateKey) {
    console.error('✗ ORACLE_PRIVATE_KEY not set in .env');
    process.exit(1);
  }

  try {
    const bs58Module = await import('bs58');
    const bs58 = bs58Module.default ?? bs58Module;
    const decoded = bs58.decode(privateKey);
    return Keypair.fromSecretKey(decoded);
  } catch {
    try {
      const arr = JSON.parse(privateKey);
      return Keypair.fromSecretKey(Uint8Array.from(arr));
    } catch {
      console.error('✗ Invalid ORACLE_PRIVATE_KEY format. Use base58 or JSON array.');
      process.exit(1);
    }
  }
  throw new Error('Failed to load keypair');
}

function loadIDL() {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const idlPath = path.resolve(__dirname, '..', 'src', 'idl', 'workspaceIDL.json');

  if (fs.existsSync(idlPath)) {
    return JSON.parse(fs.readFileSync(idlPath, 'utf-8'));
  }
  const fallback = path.resolve(__dirname, '..', 'contracts', 'target', 'idl', 'workspace.json');
  if (fs.existsSync(fallback)) {
    return JSON.parse(fs.readFileSync(fallback, 'utf-8'));
  }
  console.error(`✗ IDL not found at ${idlPath} or ${fallback}`);
  process.exit(1);
}

// ── Oracle context factory ─────────────────────────────────────────

async function createOracleContext() {
  const oracleKeypair = await loadOracleKeypair();
  const connection = new Connection(RPC_URL, 'confirmed');

  const wallet = {
    publicKey: oracleKeypair.publicKey,
    signTransaction: async (tx) => {
      tx.partialSign(oracleKeypair);
      return tx;
    },
    signAllTransactions: async (txs) => {
      txs.forEach((tx) => tx.partialSign(oracleKeypair));
      return txs;
    },
  };

  const provider = new AnchorProvider(connection, wallet, {
    commitment: 'confirmed',
  });

  const idl = loadIDL();
  const program = new Program(idl, provider);

  console.log(`  Oracle pubkey : ${oracleKeypair.publicKey.toString()}`);
  console.log(`  Program ID    : ${program.programId.toString()}`);
  console.log(`  RPC           : ${RPC_URL}`);

  return { program, oracleKeypair, connection };
}

// ── Daily run logic ──────────────────────────────────────────���─────

async function runDailyCycle(ctx) {
  const { program } = ctx;

  console.log(`\n${'═'.repeat(65)}`);
  console.log(`  AtomicYield Oracle — Daily Cycle`);
  console.log(`  ${timestamp()}`);
  console.log(`${'═'.repeat(65)}\n`);

  // Step 1: Fetch all HabitCommitments
  console.log('[1/3] Fetching all active HabitCommitments…');

  let allCommitments;
  try {
    allCommitments = await program.account.habitCommitment.all();
  } catch (err) {
    console.log('  No commitments found or fetch error:', err?.message);
    return;
  }

  if (!allCommitments.length) {
    console.log('  No active commitments. Nothing to do.');
    return;
  }

  const active = allCommitments.filter((c) => !c.account.isSettled);
  const settled = allCommitments.filter((c) => c.account.isSettled);
  console.log(
    `  Found ${allCommitments.length} total (${active.length} active, ${settled.length} settled)`,
  );

  if (!active.length) {
    console.log('  All commitments already settled. Nothing to do.');
    return;
  }

  // Step 2: Check wearables & verify habits
  console.log(`\n[2/3] Checking wearable data & verifying habits…`);

  let verifiedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (const commitment of active) {
    const acct = commitment.account;
    const owner = acct.owner;
    const epochId = acct.epochId;
    const goalType = acct.goalType;
    const dailyTarget = acct.dailyTarget;
    const daysVerified = acct.daysVerified;
    const epochDays = acct.epochDays;

    if (daysVerified >= epochDays) {
      console.log(
        `  [skip] ${owner.toString().slice(0, 8)}… epoch=${epochId.toString()} — ` +
        `already fully verified (${daysVerified}/${epochDays})`,
      );
      skippedCount++;
      continue;
    }

    try {
      const wearable = await checkHabitCompletion(
        owner.toString(),
        goalType,
        dailyTarget,
      );

      if (wearable.completed) {
        await verifyHabitOnchain(ctx, owner, epochId);
        verifiedCount++;
      } else {
        console.log(
          `  [skip] ${owner.toString().slice(0, 8)}… — habit not completed today (${wearable.value}/${wearable.goal})`,
        );
        skippedCount++;
      }
    } catch (err) {
      console.error(
        `  [error] verify failed for ${owner.toString().slice(0, 8)}…: ${err?.message}`,
      );
      errorCount++;
    }
  }

  console.log(
    `\n  Summary: ${verifiedCount} verified, ${skippedCount} skipped, ${errorCount} errors`,
  );

  // Step 3: Settle completed epochs
  console.log(`\n[3/3] Settling completed epochs…`);

  let refreshed;
  try {
    refreshed = await program.account.habitCommitment.all();
  } catch {
    refreshed = allCommitments;
  }

  const needsSettlement = refreshed.filter((c) => {
    const acct = c.account;
    if (acct.isSettled) return false;
    const createdAt = new BN(acct.createdAt).toNumber() * 1000;
    const epochEndMs = createdAt + acct.epochDays * 24 * 60 * 60 * 1000;
    return Date.now() >= epochEndMs;
  });

  if (!needsSettlement.length) {
    console.log('  No epochs ready for settlement.');
  } else {
    console.log(`  ${needsSettlement.length} epoch(s) ready for settlement.`);
  }

  let settledCount = 0;
  let settleErrors = 0;

  for (const commitment of needsSettlement) {
    const acct = commitment.account;
    try {
      await settleEpochOnchain(
        ctx,
        acct.owner,
        acct.epochId,
        acct.daysVerified,
        acct.epochDays,
      );
      settledCount++;
    } catch (err) {
      console.error(
        `  [error] settle failed for ${acct.owner.toString().slice(0, 8)}…: ${err?.message}`,
      );
      settleErrors++;
    }
  }

  if (needsSettlement.length) {
    console.log(
      `\n  Settlement summary: ${settledCount} settled, ${settleErrors} errors`,
    );
  }

  console.log(`\n${'─'.repeat(65)}`);
  console.log(`  Cycle complete at ${timestamp()}`);
  console.log(`${'─'.repeat(65)}\n`);
}

// ── Main ───────────────────────────────────────────────────────────

async function main() {
  console.log(`
  ╔═══════════════════════════════════════════════════╗
  ║          AtomicYield Oracle Agent v1.0            ║
  ║          Solana Devnet · Daily CRON               ║
  ╚═══════════════════════════════════════════════════╝
  `);

  const ctx = await createOracleContext();

  const balance = await ctx.connection.getBalance(ctx.oracleKeypair.publicKey);
  const balSol = (balance / 1e9).toFixed(4);
  console.log(`  Oracle balance: ${balSol} SOL`);

  if (balance < 0.01 * 1e9) {
    console.warn(
      '  ⚠ Low oracle balance. Run: solana airdrop 2 ' +
      ctx.oracleKeypair.publicKey.toString(),
    );
  }

  console.log(`\n  Running initial cycle…`);
  await runDailyCycle(ctx);

  console.log(`  Cron scheduled: "${CRON_SCHEDULE}"`);
  cron.schedule(CRON_SCHEDULE, async () => {
    try {
      await runDailyCycle(ctx);
    } catch (err) {
      console.error(`  [cron] Unhandled error in daily cycle:`, err?.message);
    }
  });

  console.log(`  Agent is running. Press Ctrl+C to stop.\n`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
