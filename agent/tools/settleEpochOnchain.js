/**
 * settle_epoch_onchain
 *
 * Submits settle_epoch when a commitment's days_verified === epoch_days
 * (winner) or the epoch period has elapsed (loser). Callable by anyone,
 * but the oracle runs it automatically so users don't have to.
 */

import { BN } from '@coral-xyz/anchor';
import { PublicKey, SystemProgram } from '@solana/web3.js';

function getHabitCommitmentPDA(owner, epochId, programId) {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from('habit'),
      owner.toBuffer(),
      epochId.toArrayLike(Buffer, 'le', 8),
    ],
    programId,
  );
}

function getStakingPoolPDA(programId) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('staking_pool')],
    programId,
  );
}

function getVaultPDA(programId) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('vault')],
    programId,
  );
}

/**
 * Settles a completed epoch on-chain.
 *
 * @param {object}    ctx           - OracleContext
 * @param {PublicKey}  ownerPubkey  - Commitment owner
 * @param {BN}        epochId      - Epoch ID
 * @param {number}    daysVerified - Current days verified
 * @param {number}    epochDays    - Total epoch days required
 * @returns {Promise<{signature: string, owner: string, epochId: string, isWinner: boolean, rewardLamports: string}>}
 */
export async function settleEpochOnchain(ctx, ownerPubkey, epochId, daysVerified, epochDays) {
  const { program } = ctx;

  const epochBN = epochId instanceof BN ? epochId : new BN(epochId.toString());

  const [habitCommitment] = getHabitCommitmentPDA(
    ownerPubkey,
    epochBN,
    program.programId,
  );
  const [stakingPool] = getStakingPoolPDA(program.programId);
  const [vault] = getVaultPDA(program.programId);

  const isWinner = daysVerified >= epochDays;

  console.log(
    `  [settle] Submitting settle_epoch for ${ownerPubkey.toString().slice(0, 8)}... ` +
    `epoch=${epochBN.toString()} (${isWinner ? 'WINNER' : 'FORFEIT'}: ${daysVerified}/${epochDays} days)`,
  );

  const tx = await program.methods
    .settleEpoch(epochBN)
    .accounts({
      habitCommitment,
      stakingPool,
      vault,
      owner: ownerPubkey,
      systemProgram: SystemProgram.programId,
    })
    .signers([ctx.oracleKeypair])
    .rpc({ commitment: 'confirmed' });

  const settled = await program.account.habitCommitment.fetch(habitCommitment);
  const stakeAmount = new BN(settled.stakeAmount);

  let rewardLamports = '0';
  if (isWinner) {
    // Winners get their exact stake back (no yield for now — Kamino yield TBD)
    rewardLamports = stakeAmount.toString();
  }

  console.log(`  [settle] TX confirmed: ${tx}`);
  console.log(
    `  [settle]   is_settled=${settled.isSettled}, ` +
    `result=${isWinner ? `WINNER -> ${rewardLamports} lamports returned` : 'FORFEITED -> stake stays in pool'}`,
  );

  return {
    signature: tx,
    owner: ownerPubkey.toString(),
    epochId: epochBN.toString(),
    isWinner,
    rewardLamports,
  };
}