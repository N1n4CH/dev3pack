/**
 * verify_habit_onchain
 *
 * Signs and submits the verify_habit Anchor instruction using the
 * oracle keypair. The oracle must match staking_pool.authority.
 */

import { BN, Program } from '@coral-xyz/anchor';
import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
} from '@solana/web3.js';

import type { OracleContext } from '../index.js';

/**
 * Derive the HabitCommitment PDA for a given owner + epoch_id.
 */
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

export interface VerifyResult {
  signature: string;
  owner: string;
  epochId: string;
  daysVerified: number;
}

/**
 * Submits verify_habit on-chain for a specific HabitCommitment.
 *
 * @param ctx             - OracleContext (program, oracle keypair)
 * @param ownerPubkey     - The commitment owner's public key
 * @param epochId         - The epoch ID (BN)
 * @returns VerifyResult with tx signature
 */
export async function verifyHabitOnchain(
  ctx: OracleContext,
  ownerPubkey: PublicKey,
  epochId: BN,
): Promise<VerifyResult> {
  const { program } = ctx;

  const [habitCommitment] = getHabitCommitmentPDA(
    ownerPubkey,
    epochId,
    program.programId,
  );
  const [stakingPool] = getStakingPoolPDA(program.programId);

  console.log(
    `  [verify] Submitting verify_habit for ${ownerPubkey.toString().slice(0, 8)}… epoch=${epochId.toString()}`,
  );

  const tx = await program.methods
    .verifyHabit(epochId)
    .accounts({
      habitCommitment,
      stakingPool,
      oracle: ctx.oracleKeypair.publicKey,
    })
    .signers([ctx.oracleKeypair])
    .rpc({ commitment: 'confirmed' });

  // Fetch updated account to log days_verified
  const updated = await program.account.habitCommitment.fetch(habitCommitment);

  console.log(
    `  [verify] ✓ TX confirmed: ${tx}`,
  );
  console.log(
    `  [verify]   days_verified=${(updated as any).daysVerified}, streak=${(updated as any).streakCount}`,
  );

  return {
    signature: tx,
    owner: ownerPubkey.toString(),
    epochId: epochId.toString(),
    daysVerified: (updated as any).daysVerified,
  };
}
