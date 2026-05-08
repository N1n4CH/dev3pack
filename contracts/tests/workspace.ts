import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Workspace } from "../target/types/workspace";
import { expect } from "chai";
import {
  PublicKey,
  SystemProgram,
  Keypair,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";

describe("atomic_yield", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.Workspace as Program<Workspace>;

  let authority: Keypair;
  let user: Keypair;
  let user2: Keypair;
  let configPDA: PublicKey;
  let stakingPoolPDA: PublicKey;
  let vaultPDA: PublicKey;
  let vaultBump: number;

  const epochId = new BN(1);
  const epochId2 = new BN(2);
  const stakeAmount = new BN(1 * LAMPORTS_PER_SOL);

  function getHabitPDA(userKey: PublicKey, eid: BN): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("habit"), userKey.toBuffer(), eid.toArrayLike(Buffer, "le", 8)],
      program.programId
    );
  }

  before(async () => {
    authority = Keypair.generate();
    user = Keypair.generate();
    user2 = Keypair.generate();

    // Fund all accounts
    for (const kp of [authority, user, user2]) {
      await provider.connection.confirmTransaction(
        await provider.connection.requestAirdrop(kp.publicKey, 100 * LAMPORTS_PER_SOL)
      );
    }

    [configPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("config"), authority.publicKey.toBuffer()],
      program.programId
    );

    [stakingPoolPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("staking_pool")],
      program.programId
    );

    [vaultPDA, vaultBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("vault")],
      program.programId
    );
  });

  // ── INITIAL / CORE TESTS (MUST PASS) ──────────────────────────────

  it("1. Initialize Config", async () => {
    await program.methods
      .initializeConfig()
      .accounts({
        config: configPDA,
        authority: authority.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([authority])
      .rpc();

    const config = await program.account.config.fetch(configPDA);
    expect(config.authority.toBase58()).to.equal(authority.publicKey.toBase58());
    expect(config.isActive).to.be.true;
    expect(config.isPaused).to.be.false;
    expect(config.version).to.equal(1);
  });

  it("2. Initialize Staking Pool", async () => {
    await program.methods
      .initializePool()
      .accounts({
        stakingPool: stakingPoolPDA,
        authority: authority.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([authority])
      .rpc();

    const pool = await program.account.stakingPool.fetch(stakingPoolPDA);
    expect(pool.authority.toBase58()).to.equal(authority.publicKey.toBase58());
    expect(Number(pool.totalStaked.toString())).to.equal(0);
    expect(Number(pool.totalYieldAccumulated.toString())).to.equal(0);
    expect(Number(pool.epochCount.toString())).to.equal(0);
  });

  it("3. Deposit Stake - creates HabitCommitment", async () => {
    const [habitPDA] = getHabitPDA(user.publicKey, epochId);

    const vaultBefore = await provider.connection.getBalance(vaultPDA);

    await program.methods
      .depositStake(0, 10000, 7, stakeAmount, epochId)
      .accounts({
        habitCommitment: habitPDA,
        stakingPool: stakingPoolPDA,
        vault: vaultPDA,
        user: user.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([user])
      .rpc();

    const commitment = await program.account.habitCommitment.fetch(habitPDA);
    expect(commitment.owner.toBase58()).to.equal(user.publicKey.toBase58());
    expect(commitment.goalType).to.equal(0);
    expect(commitment.dailyTarget).to.equal(10000);
    expect(Number(commitment.stakeAmount.toString())).to.equal(Number(stakeAmount.toString()));
    expect(commitment.epochDays).to.equal(7);
    expect(commitment.daysVerified).to.equal(0);
    expect(commitment.streakCount).to.equal(0);
    expect(commitment.isSettled).to.be.false;

    const vaultAfter = await provider.connection.getBalance(vaultPDA);
    expect(vaultAfter - vaultBefore).to.equal(Number(stakeAmount.toString()));

    const pool = await program.account.stakingPool.fetch(stakingPoolPDA);
    expect(Number(pool.totalStaked.toString())).to.equal(Number(stakeAmount.toString()));
    expect(Number(pool.epochCount.toString())).to.equal(1);
  });

  it("4. Verify Habit - oracle increments days_verified", async () => {
    const [habitPDA] = getHabitPDA(user.publicKey, epochId);

    await program.methods
      .verifyHabit(epochId)
      .accounts({
        habitCommitment: habitPDA,
        stakingPool: stakingPoolPDA,
        oracle: authority.publicKey,
      })
      .signers([authority])
      .rpc();

    const commitment = await program.account.habitCommitment.fetch(habitPDA);
    expect(commitment.daysVerified).to.equal(1);
    expect(commitment.streakCount).to.equal(1);
  });

  it("5. Verify Habit - multiple verifications", async () => {
    const [habitPDA] = getHabitPDA(user.publicKey, epochId);

    // Verify 6 more times to reach 7 total
    for (let i = 0; i < 6; i++) {
      await program.methods
        .verifyHabit(epochId)
        .accounts({
          habitCommitment: habitPDA,
          stakingPool: stakingPoolPDA,
          oracle: authority.publicKey,
        })
        .signers([authority])
        .rpc();
    }

    const commitment = await program.account.habitCommitment.fetch(habitPDA);
    expect(commitment.daysVerified).to.equal(7);
    expect(commitment.streakCount).to.equal(7);
  });

  // ── ADDITIONAL TESTS ──────────────────────────────────────────────

  it("6. Verify Habit - unauthorized oracle fails", async () => {
    const [habitPDA] = getHabitPDA(user.publicKey, epochId);

    try {
      await program.methods
        .verifyHabit(epochId)
        .accounts({
          habitCommitment: habitPDA,
          stakingPool: stakingPoolPDA,
          oracle: user.publicKey,
        })
        .signers([user])
        .rpc();
      expect.fail("Should have thrown UnauthorizedOracle");
    } catch (error: any) {
      expect(error.message).to.include("Unauthorized oracle");
    }
  });

  it("7. Deposit Stake - invalid goal type fails", async () => {
    const badEpochId = new BN(99);
    const [habitPDA] = getHabitPDA(user.publicKey, badEpochId);

    try {
      await program.methods
        .depositStake(5, 10000, 7, stakeAmount, badEpochId)
        .accounts({
          habitCommitment: habitPDA,
          stakingPool: stakingPoolPDA,
          vault: vaultPDA,
          user: user.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([user])
        .rpc();
      expect.fail("Should have thrown InvalidGoalType");
    } catch (error: any) {
      expect(error.message).to.include("Invalid goal type");
    }
  });

  it("8. Deposit Stake - invalid epoch days fails", async () => {
    const badEpochId = new BN(98);
    const [habitPDA] = getHabitPDA(user.publicKey, badEpochId);

    try {
      await program.methods
        .depositStake(0, 10000, 0, stakeAmount, badEpochId)
        .accounts({
          habitCommitment: habitPDA,
          stakingPool: stakingPoolPDA,
          vault: vaultPDA,
          user: user.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([user])
        .rpc();
      expect.fail("Should have thrown InvalidEpochDays");
    } catch (error: any) {
      expect(error.message).to.include("Invalid epoch days");
    }
  });

  it("9. Deposit Stake - zero stake fails", async () => {
    const badEpochId = new BN(97);
    const [habitPDA] = getHabitPDA(user.publicKey, badEpochId);

    try {
      await program.methods
        .depositStake(0, 10000, 7, new BN(0), badEpochId)
        .accounts({
          habitCommitment: habitPDA,
          stakingPool: stakingPoolPDA,
          vault: vaultPDA,
          user: user.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([user])
        .rpc();
      expect.fail("Should have thrown InsufficientStake");
    } catch (error: any) {
      expect(error.message).to.include("Insufficient stake");
    }
  });

  it("10. Claim NFT Badge - streak milestone 7", async () => {
    const [habitPDA] = getHabitPDA(user.publicKey, epochId);

    await program.methods
      .claimNftBadge(7, epochId)
      .accounts({
        habitCommitment: habitPDA,
        user: user.publicKey,
      })
      .signers([user])
      .rpc();
    // If no error, badge claimed successfully
  });

  it("11. Claim NFT Badge - invalid milestone fails", async () => {
    const [habitPDA] = getHabitPDA(user.publicKey, epochId);

    try {
      await program.methods
        .claimNftBadge(10, epochId)
        .accounts({
          habitCommitment: habitPDA,
          user: user.publicKey,
        })
        .signers([user])
        .rpc();
      expect.fail("Should have thrown InvalidMilestone");
    } catch (error: any) {
      expect(error.message).to.include("Invalid milestone");
    }
  });

  it("12. Claim NFT Badge - insufficient streak fails", async () => {
    const [habitPDA] = getHabitPDA(user.publicKey, epochId);

    try {
      await program.methods
        .claimNftBadge(14, epochId)
        .accounts({
          habitCommitment: habitPDA,
          user: user.publicKey,
        })
        .signers([user])
        .rpc();
      expect.fail("Should have thrown InsufficientStreak");
    } catch (error: any) {
      expect(error.message).to.include("Insufficient streak");
    }
  });

  it("13. Settle Epoch - epoch not complete fails (fresh commitment)", async () => {
    // Create a new commitment with epoch_days=30 so it won't be complete
    const freshEpochId = new BN(50);
    const [habitPDA] = getHabitPDA(user2.publicKey, freshEpochId);

    await program.methods
      .depositStake(1, 5000, 30, new BN(0.5 * LAMPORTS_PER_SOL), freshEpochId)
      .accounts({
        habitCommitment: habitPDA,
        stakingPool: stakingPoolPDA,
        vault: vaultPDA,
        user: user2.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([user2])
      .rpc();

    try {
      await program.methods
        .settleEpoch(freshEpochId)
        .accounts({
          habitCommitment: habitPDA,
          stakingPool: stakingPoolPDA,
          vault: vaultPDA,
          owner: user2.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([])
        .rpc();
      expect.fail("Should have thrown EpochNotComplete");
    } catch (error: any) {
      expect(error.message).to.include("Epoch not yet complete");
    }
  });

  it("14. Deposit Stake - different goal types", async () => {
    // Test cycling goal type (2)
    const cyclingEpochId = new BN(100);
    const [habitPDA] = getHabitPDA(user2.publicKey, cyclingEpochId);

    await program.methods
      .depositStake(2, 20, 14, new BN(0.25 * LAMPORTS_PER_SOL), cyclingEpochId)
      .accounts({
        habitCommitment: habitPDA,
        stakingPool: stakingPoolPDA,
        vault: vaultPDA,
        user: user2.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([user2])
      .rpc();

    const commitment = await program.account.habitCommitment.fetch(habitPDA);
    expect(commitment.goalType).to.equal(2);
    expect(commitment.dailyTarget).to.equal(20);
    expect(commitment.epochDays).to.equal(14);
  });

  it("15. Deposit Stake - custom goal type (3)", async () => {
    const customEpochId = new BN(101);
    const [habitPDA] = getHabitPDA(user2.publicKey, customEpochId);

    await program.methods
      .depositStake(3, 1, 7, new BN(0.1 * LAMPORTS_PER_SOL), customEpochId)
      .accounts({
        habitCommitment: habitPDA,
        stakingPool: stakingPoolPDA,
        vault: vaultPDA,
        user: user2.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([user2])
      .rpc();

    const commitment = await program.account.habitCommitment.fetch(habitPDA);
    expect(commitment.goalType).to.equal(3);
  });

  it("16. Pool state tracks multiple deposits correctly", async () => {
    const pool = await program.account.stakingPool.fetch(stakingPoolPDA);
    // We've deposited: 1 SOL (test 3) + 0.5 SOL (test 13) + 0.25 SOL (test 14) + 0.1 SOL (test 15)
    const expectedTotal = 1 * LAMPORTS_PER_SOL + 0.5 * LAMPORTS_PER_SOL + 0.25 * LAMPORTS_PER_SOL + 0.1 * LAMPORTS_PER_SOL;
    expect(Number(pool.totalStaked.toString())).to.equal(expectedTotal);
    expect(Number(pool.epochCount.toString())).to.equal(4);
  });
});
