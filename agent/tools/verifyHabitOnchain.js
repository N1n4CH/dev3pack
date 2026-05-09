/**
 * verify_habit_onchain
 *
 * Signs and submits the verify_habit Anchor instruction using the
 * oracle keypair. The oracle must match staking_pool.authority.
 */

import { BN } from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';

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

/**
 * Submits verify_habit on-chain for a specific HabitCommitment.
 *
 * @param {object}    ctx           - OracleContext { program, oracleKeypair, connection }
 * @param {PublicKey}  ownerPubkey  - The commitment owner's public key
 * @param {BN}        epochId      - The epoch ID
 * @returns {Promise<{signature: string, owner: string, epochId: string, daysVerified: number}>}
 */
export async function verifyHabitOnchain(ctx, ownerPubkey, epochId) {
  const { program } = ctx;

  const epochBN = epochId instanceof BN ? epochId : new BN(epochId.toString());

  const [habitCommitment] = getHabitCommitmentPDA(
    ownerPubkey,
    epochBN,
    program.programId,
  );
  const [stakingPool] = getStakingPoolPDA(program.programId);

  console.log(
    `  [verify] Submitting verify_habit for ${ownerPubkey.toString().slice(0, 8)}... epoch=${epochBN.toString()}`,
  );

  const tx = await program.methods
    .verifyHabit(epochBN)
    .accounts({
      habitCommitment,
      stakingPool,
      oracle: ctx.oracleKeypair.publicKey,
    })
    .signers([ctx.oracleKeypair])
    .rpc({ commitment: 'confirmed' });

  const updated = await program.account.habitCommitment.fetch(habitCommitment);

  console.log(`  [verify] TX confirmed: ${tx}`);
  console.log(
    `  [verify]   days_verified=${updated.daysVerified}, streak=${updated.streakCount}`,
  );

  return {
    signature: tx,
    owner: ownerPubkey.toString(),
    epochId: epochBN.toString(),
    daysVerified: updated.daysVerified,
  };
}
