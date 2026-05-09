/**
 * AtomicYield SDK
 *
 * Production-ready TypeScript SDK for interacting with the AtomicYield
 * gamified fitness staking program on Solana.
 */

import { BN, Program, Provider } from '@coral-xyz/anchor';
import {
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
} from '@solana/web3.js';
import IDL from '../idl/workspaceIDL.json';

// ── Type definitions ───────────────────────────────────────────────

export interface StakingPoolData {
  totalStaked: BN;
  totalYieldAccumulated: BN;
  epochCount: BN;
  authority: PublicKey;
  bump: number;
}

export interface HabitCommitmentData {
  owner: PublicKey;
  goalType: number;
  dailyTarget: number;
  stakeAmount: BN;
  epochDays: number;
  daysVerified: number;
  streakCount: number;
  isSettled: boolean;
  createdAt: BN;
  epochId: BN;
  bump: number;
}

export interface SDKResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface DepositStakeParams {
  goalType: number;     // 0=steps,1=workout,2=cycling,3=custom
  dailyTarget: number;
  epochDays: number;    // 7,14,30,60
  stakeAmountSol: number;
  epochId: number;
}

// ── SDK ────────────────────────────────────────────────────────────

export class AtomicYieldSDK {
  private readonly provider: Provider;
  private readonly program: Program<any>;

  constructor(provider: Provider) {
    this.provider = provider;
    this.program = new Program(IDL as any, this.provider);
  }

  // ── helpers ──────────────────────────────────────────────────────

  private safeBN(value: any, defaultValue: number | string = 0): BN {
    if (value === null || value === undefined) return new BN(defaultValue);
    if (value instanceof BN) return value;
    if (typeof value === 'number') {
      if (isNaN(value) || !isFinite(value)) return new BN(defaultValue);
      return new BN(Math.floor(value).toString());
    }
    if (typeof value === 'string') {
      const n = parseFloat(value);
      if (isNaN(n)) return new BN(defaultValue);
      return new BN(Math.floor(n).toString());
    }
    return new BN(defaultValue);
  }

  private solToLamports(sol: number): BN {
    return this.safeBN(Math.floor(sol * LAMPORTS_PER_SOL));
  }

  private bnToSeedBuffer(value: BN, bytes = 8): Buffer {
    return value.toArrayLike(Buffer, 'le', bytes);
  }

  private async getPDA(
    seeds: (string | PublicKey | Buffer | Uint8Array)[],
    programId?: PublicKey,
  ): Promise<[PublicKey, number]> {
    const buffers = seeds.map((s) => {
      if (typeof s === 'string') return Buffer.from(s, 'utf8');
      if (s instanceof PublicKey) return s.toBuffer();
      if (s instanceof Uint8Array) return Buffer.from(s);
      return s;
    });
    return PublicKey.findProgramAddressSync(buffers, programId || this.program.programId);
  }

  private async testConnection(): Promise<boolean> {
    try {
      if (!this.provider?.connection) return false;
      const { value } = await this.provider.connection.getLatestBlockhashAndContext('finalized');
      return !!(value && value.blockhash);
    } catch {
      return false;
    }
  }

  // ── PDA derivations ──────────────────────────────────────────────

  async getStakingPoolPDA(): Promise<[PublicKey, number]> {
    return this.getPDA(['staking_pool']);
  }

  async getVaultPDA(): Promise<[PublicKey, number]> {
    return this.getPDA(['vault']);
  }

  async getHabitCommitmentPDA(
    user: PublicKey,
    epochId: number,
  ): Promise<[PublicKey, number]> {
    const epochBN = this.safeBN(epochId);
    return this.getPDA(['habit', user, this.bnToSeedBuffer(epochBN)]);
  }

  async getConfigPDA(authority: PublicKey): Promise<[PublicKey, number]> {
    return this.getPDA(['config', authority]);
  }

  // ── instructions ─────────────────────────────────────────────────

  /** Initialize global config (one-time by deployer). */
  async initializeConfig(): Promise<SDKResult<{ signature: string }>> {
    if (!this.provider.publicKey) return { success: false, error: 'Wallet not connected' };
    try {
      if (!(await this.testConnection())) return { success: false, error: 'Network unavailable' };
      const [configPDA] = await this.getConfigPDA(this.provider.publicKey);
      const tx = await this.program.methods
        .initializeConfig()
        .accounts({
          config: configPDA,
          authority: this.provider.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      return { success: true, data: { signature: tx } };
    } catch (error: any) {
      return { success: false, error: error?.message || 'Initialize config failed' };
    }
  }

  /** Initialize the staking pool (one-time by deployer). */
  async initializePool(): Promise<SDKResult<{ signature: string }>> {
    if (!this.provider.publicKey) return { success: false, error: 'Wallet not connected' };
    try {
      if (!(await this.testConnection())) return { success: false, error: 'Network unavailable' };
      const [stakingPool] = await this.getStakingPoolPDA();
      const tx = await this.program.methods
        .initializePool()
        .accounts({
          stakingPool,
          authority: this.provider.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      return { success: true, data: { signature: tx } };
    } catch (error: any) {
      return { success: false, error: error?.message || 'Initialize pool failed' };
    }
  }

  /** Deposit SOL and create a HabitCommitment. */
  async depositStake(
    params: DepositStakeParams,
  ): Promise<SDKResult<{ signature: string; commitmentAddress: string }>> {
    if (!this.provider.publicKey) return { success: false, error: 'Wallet not connected' };
    try {
      if (!(await this.testConnection())) return { success: false, error: 'Network unavailable' };
      if (params.stakeAmountSol <= 0) return { success: false, error: 'Stake must be > 0 SOL' };
      if (![0, 1, 2, 3].includes(params.goalType))
        return { success: false, error: 'Invalid goal type' };

      const epochIdBN = this.safeBN(params.epochId);
      const stakeLamports = this.solToLamports(params.stakeAmountSol);

      const [habitCommitment] = await this.getHabitCommitmentPDA(
        this.provider.publicKey,
        params.epochId,
      );
      const [stakingPool] = await this.getStakingPoolPDA();
      const [vault] = await this.getVaultPDA();

      const tx = await this.program.methods
        .depositStake(
          params.goalType,
          params.dailyTarget,
          params.epochDays,
          stakeLamports,
          epochIdBN,
        )
        .accounts({
          habitCommitment,
          stakingPool,
          vault,
          user: this.provider.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      return {
        success: true,
        data: { signature: tx, commitmentAddress: habitCommitment.toString() },
      };
    } catch (error: any) {
      return { success: false, error: error?.message || 'Deposit stake failed' };
    }
  }

  /** Verify a user's daily habit completion (oracle-only). */
  async verifyHabit(
    ownerPubkey: PublicKey,
    epochId: number,
  ): Promise<SDKResult<{ signature: string }>> {
    if (!this.provider.publicKey) return { success: false, error: 'Wallet not connected' };
    try {
      if (!(await this.testConnection())) return { success: false, error: 'Network unavailable' };
      const epochIdBN = this.safeBN(epochId);
      const [habitCommitment] = await this.getHabitCommitmentPDA(ownerPubkey, epochId);
      const [stakingPool] = await this.getStakingPoolPDA();

      const tx = await this.program.methods
        .verifyHabit(epochIdBN)
        .accounts({
          habitCommitment,
          stakingPool,
          oracle: this.provider.publicKey,
        })
        .rpc();

      return { success: true, data: { signature: tx } };
    } catch (error: any) {
      return { success: false, error: error?.message || 'Verify habit failed' };
    }
  }

  /** Settle an epoch after it ends. Anyone can call this.
   *  x402: 50 bps of the winner's stake is routed to `facilitatorPubkey`
   *  before release — implementing on-chain x402 micropayment routing.
   *  Defaults to the connected wallet on devnet (oracle = facilitator).
   */
  async settleEpoch(
    ownerPubkey: PublicKey,
    epochId: number,
    facilitatorPubkey?: PublicKey,
  ): Promise<SDKResult<{ signature: string; x402Fee: string }>> {
    if (!this.provider.publicKey) return { success: false, error: 'Wallet not connected' };
    try {
      if (!(await this.testConnection())) return { success: false, error: 'Network unavailable' };
      const epochIdBN = this.safeBN(epochId);
      const [habitCommitment] = await this.getHabitCommitmentPDA(ownerPubkey, epochId);
      const [stakingPool] = await this.getStakingPoolPDA();
      const [vault] = await this.getVaultPDA();
      const x402Facilitator = facilitatorPubkey ?? this.provider.publicKey;

      const tx = await this.program.methods
        .settleEpoch(epochIdBN)
        .accounts({
          habitCommitment,
          stakingPool,
          vault,
          owner: ownerPubkey,
          x402Facilitator,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      // Fetch the commitment to calculate the fee that was routed (50 bps)
      const commitResult = await this.fetchHabitCommitment(ownerPubkey, epochId);
      const stakeAmount = commitResult.data?.stakeAmount ?? this.safeBN(0);
      const feeLamports = stakeAmount.muln(50).divn(10000);

      return {
        success: true,
        data: {
          signature: tx,
          x402Fee: `${(feeLamports.toNumber() / 1e9).toFixed(6)} SOL`,
        },
      };
    } catch (error: any) {
      return { success: false, error: error?.message || 'Settle epoch failed' };
    }
  }

  /** Claim a cNFT badge for reaching a streak milestone. */
  async claimNftBadge(
    epochId: number,
    streakMilestone: number,
  ): Promise<SDKResult<{ signature: string }>> {
    if (!this.provider.publicKey) return { success: false, error: 'Wallet not connected' };
    try {
      if (!(await this.testConnection())) return { success: false, error: 'Network unavailable' };
      if (![7, 14, 30, 60].includes(streakMilestone))
        return { success: false, error: 'Invalid milestone (must be 7, 14, 30, or 60)' };

      const epochIdBN = this.safeBN(epochId);
      const [habitCommitment] = await this.getHabitCommitmentPDA(
        this.provider.publicKey,
        epochId,
      );

      const tx = await this.program.methods
        .claimNftBadge(streakMilestone, epochIdBN)
        .accounts({
          habitCommitment,
          user: this.provider.publicKey,
        })
        .rpc();

      return { success: true, data: { signature: tx } };
    } catch (error: any) {
      return { success: false, error: error?.message || 'Claim badge failed' };
    }
  }

  // ── account fetchers ─────────────────────────────────────────────

  /** Fetch the global StakingPool account. */
  async fetchStakingPool(): Promise<SDKResult<StakingPoolData>> {
    try {
      if (!(await this.testConnection())) return { success: false, error: 'Network unavailable' };
      const [stakingPool] = await this.getStakingPoolPDA();
      const account = await this.program.account.stakingPool.fetch(stakingPool);
      return { success: true, data: account as unknown as StakingPoolData };
    } catch (error: any) {
      if (error?.message?.includes('Account does not exist'))
        return { success: true, data: undefined };
      return { success: false, error: error?.message || 'Failed to fetch staking pool' };
    }
  }

  /** Fetch a specific HabitCommitment by owner + epoch. */
  async fetchHabitCommitment(
    owner: PublicKey,
    epochId: number,
  ): Promise<SDKResult<HabitCommitmentData>> {
    try {
      if (!(await this.testConnection())) return { success: false, error: 'Network unavailable' };
      const [pda] = await this.getHabitCommitmentPDA(owner, epochId);
      const account = await this.program.account.habitCommitment.fetch(pda);
      return { success: true, data: account as unknown as HabitCommitmentData };
    } catch (error: any) {
      if (error?.message?.includes('Account does not exist'))
        return { success: true, data: undefined };
      return { success: false, error: error?.message || 'Failed to fetch habit commitment' };
    }
  }

  /** Fetch all HabitCommitments for a given owner. */
  async fetchAllCommitmentsByOwner(
    owner: PublicKey,
  ): Promise<SDKResult<Array<{ publicKey: PublicKey; account: HabitCommitmentData }>>> {
    try {
      if (!(await this.testConnection())) return { success: false, error: 'Network unavailable' };
      const all = await this.program.account.habitCommitment.all();
      if (!all?.length) return { success: true, data: [] };
      const filtered = all.filter(
        (a: any) => a.account.owner?.toString() === owner.toString(),
      );
      return {
        success: true,
        data: filtered.map((a: any) => ({
          publicKey: a.publicKey,
          account: a.account as HabitCommitmentData,
        })),
      };
    } catch (error: any) {
      if (error?.message?.includes('Account does not exist'))
        return { success: true, data: [] };
      return { success: false, error: error?.message || 'Failed to fetch commitments' };
    }
  }

  /** Fetch SOL balance. */
  async fetchSolBalance(account?: PublicKey): Promise<SDKResult<number>> {
    const target = account || this.provider.publicKey;
    if (!target) return { success: false, error: 'No account provided' };
    try {
      const balance = await this.provider.connection.getBalance(target);
      return { success: true, data: balance / LAMPORTS_PER_SOL };
    } catch {
      return { success: false, error: 'Failed to fetch SOL balance' };
    }
  }

  /** Generate a unique epoch ID. */
  generateEpochId(): number {
    return Date.now();
  }
}
