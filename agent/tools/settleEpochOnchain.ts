/**
 * settle_epoch_onchain
 *
 * Submits settle_epoch when a commitment's days_verified === epoch_days
 * (winner) or the epoch period has elapsed (loser). Callable by anyone,
 * but the oracle runs it automatically so users don't have to.
 */

import { Program } from '@coral-xyz/anchor';
import BN from 'bn.js';
import { PublicKey, SystemProgram } from '@solana/web3.js';

import type { OracleContext } from '../index.js';

function getHabitCommitmentPDA(
  owner: PublicKey,
  epochId: BN,
  programId: PublicKey,
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from('habit'),
      owner.toBuffer(),
      epochId.toArrayLike(Buffer, 'le', 8),
    ],
    programId,
  );
}

function getStakingPoolPDA(programId: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('staking_pool')],
    programId,
  );
}

function getVaultPDA(programId: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('vault')],
    programId,
  );
}

export interface SettleResult {
  signature: string;
  owner: string;
  epochId: string;
  isWinner: boolean;
  rewardLamports: string;
}

/**
 * Settles a completed epoch on-chain.
 *
 * @param ctx         - OracleContext
 * @param ownerPubkey - Commitment owner
 * @param epochId     - Epoch ID (BN)
 * @param daysVerified - Current days verified (from account)
 * @param epochDays    - Total epoch days required
 * @returns SettleResult
 */
export async function settleEpochOnchain(
  ctx: OracleContext,
  ownerPubkey: PublicKey,
  epochId: BN,
  daysVerified: number,
  epochDays: number,
): Promise<SettleResult> {
  const { program } = ctx;

  const [habitCommitment] = getHabitCommitmentPDA(
    ownerPubkey,
    epochId,
    program.programId,
  );
  const [stakingPool] = getStakingPoolPDA(program.programId);
  const [vault] = getVaultPDA(program.programId);

  const isWinner = daysVerified >= epochDays;

  console.log(
    `  [settle] Submitting settle_epoch for ${ownerPubkey.toString().slice(0, 8)}… ` +
    `epoch=${epochId.toString()} (${isWinner ? 'WINNER' : 'FORFEIT'}: ${daysVerified}/${epochDays} days)`,
  );

  const tx = await program.methods
    .settleEpoch(epochId)
    .accounts({
      habitCommitment,
      stakingPool,
      vault,
      owner: ownerPubkey,
      systemProgram: SystemProgram.programId,
    })
    .signers([ctx.oracleKeypair])
    .rpc({ commitment: 'confirmed' });

  // Fetch to confirm settlement
  const settled = await program.account.habitCommitment.fetch(habitCommitment);
  const stakeAmount = (settled as any).stakeAmount as BN;

  let rewardLamports = '0';
  if (isWinner) {
    // reward = stake + (stake * 18 * epoch_days) / 36500
    const yieldAmount = stakeAmount
      .mul(new BN(18))
      .mul(new BN(epochDays))
      .div(new BN(36500));
    rewardLamports = stakeAmount.add(yieldAmount).toString();
  }

  console.log(
    `  [settle] ✓ TX confirmed: ${tx}`,
  );
  console.log(
    `  [settle]   is_settled=${(settled as any).isSettled}, ` +
    `result=${isWinner ? `WINNER → ${rewardLamports} lamports returned` : 'FORFEITED → stake stays in pool'}`,
  );

  return {
    signature: tx,
    owner: ownerPubkey.toString(),
    epochId: epochId.toString(),
    isWinner,
    rewardLamports,
  };
}
