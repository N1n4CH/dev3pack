use anchor_lang::prelude::*;

declare_id!("77NnA7iRfthT8wcdWxNsrueXbF7o251BzdBBDnDW4znf");

#[program]
pub mod workspace {
    use super::*;

    // authority: Pubkey, Program authority derived from signer, wallet pubkey
    pub fn initialize_config(ctx: Context<InitializeConfig>) -> Result<()> {
        let config = &mut ctx.accounts.config;
        config.bump = ctx.bumps.config;
        config.authority = ctx.accounts.authority.key();
        config.is_active = true;
        config.is_paused = false;
        config.version = 1;
        Ok(())
    }

    pub fn initialize_pool(ctx: Context<InitializePool>) -> Result<()> {
        let pool = &mut ctx.accounts.staking_pool;
        pool.total_staked = 0;
        pool.total_yield_accumulated = 0;
        pool.epoch_count = 0;
        pool.authority = ctx.accounts.authority.key();
        pool.bump = ctx.bumps.staking_pool;
        Ok(())
    }

    pub fn deposit_stake(
        ctx: Context<DepositStake>,
        goal_type: u8,
        daily_target: u32,
        epoch_days: u8,
        stake_amount: u64,
        epoch_id: u64,
    ) -> Result<()> {
        require!(goal_type <= 3, ErrorCode::InvalidGoalType);
        require!(epoch_days > 0 && epoch_days <= 90, ErrorCode::InvalidEpochDays);
        require!(stake_amount > 0, ErrorCode::InsufficientStake);

        anchor_lang::system_program::transfer(
            CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                anchor_lang::system_program::Transfer {
                    from: ctx.accounts.user.to_account_info(),
                    to: ctx.accounts.vault.to_account_info(),
                },
            ),
            stake_amount,
        )?;

        let commitment = &mut ctx.accounts.habit_commitment;
        commitment.owner = ctx.accounts.user.key();
        commitment.goal_type = goal_type;
        commitment.daily_target = daily_target;
        commitment.stake_amount = stake_amount;
        commitment.epoch_days = epoch_days;
        commitment.days_verified = 0;
        commitment.streak_count = 0;
        commitment.is_settled = false;
        commitment.created_at = Clock::get()?.unix_timestamp;
        commitment.epoch_id = epoch_id;
        commitment.bump = ctx.bumps.habit_commitment;

        let pool = &mut ctx.accounts.staking_pool;
        pool.total_staked = pool
            .total_staked
            .checked_add(stake_amount)
            .ok_or(ErrorCode::MathOverflow)?;
        pool.epoch_count = pool
            .epoch_count
            .checked_add(1)
            .ok_or(ErrorCode::MathOverflow)?;

        Ok(())
    }

    pub fn verify_habit(ctx: Context<VerifyHabit>, _epoch_id: u64) -> Result<()> {
        let pool = &ctx.accounts.staking_pool;
        require!(
            ctx.accounts.oracle.key() == pool.authority,
            ErrorCode::UnauthorizedOracle
        );

        let commitment = &mut ctx.accounts.habit_commitment;
        require!(!commitment.is_settled, ErrorCode::AlreadySettled);

        commitment.days_verified = commitment
            .days_verified
            .checked_add(1)
            .ok_or(ErrorCode::MathOverflow)?;
        commitment.streak_count = commitment
            .streak_count
            .checked_add(1)
            .ok_or(ErrorCode::MathOverflow)?;

        emit!(HabitVerified {
            owner: commitment.owner,
            epoch_id: commitment.epoch_id,
            days_verified: commitment.days_verified,
            streak_count: commitment.streak_count,
        });

        Ok(())
    }

    pub fn settle_epoch(ctx: Context<SettleEpoch>, _epoch_id: u64) -> Result<()> {
        let commitment = &ctx.accounts.habit_commitment;
        require!(!commitment.is_settled, ErrorCode::AlreadySettled);

        let now = Clock::get()?.unix_timestamp;
        let elapsed_seconds = now
            .checked_sub(commitment.created_at)
            .ok_or(ErrorCode::MathOverflow)?;
        let elapsed_days = elapsed_seconds / 86400;
        require!(
            elapsed_days >= commitment.epoch_days as i64,
            ErrorCode::EpochNotComplete
        );

        let is_winner = commitment.days_verified == commitment.epoch_days;
        let mut reward_amount: u64 = 0;

        if is_winner {
            reward_amount = commitment.stake_amount;

            let vault_bump = [ctx.bumps.vault];
            let vault_seeds = &[b"vault" as &[u8], &vault_bump];
            let signer_seeds: &[&[&[u8]]] = &[vault_seeds];

            **ctx
                .accounts
                .vault
                .to_account_info()
                .try_borrow_mut_lamports()? -= reward_amount;
            **ctx
                .accounts
                .owner
                .to_account_info()
                .try_borrow_mut_lamports()? += reward_amount;

            let _ = signer_seeds;

            let pool = &mut ctx.accounts.staking_pool;
            pool.total_staked = pool
                .total_staked
                .checked_sub(reward_amount)
                .ok_or(ErrorCode::MathOverflow)?;
        }

        let commitment = &mut ctx.accounts.habit_commitment;
        commitment.is_settled = true;

        emit!(EpochSettled {
            owner: commitment.owner,
            epoch_id: commitment.epoch_id,
            is_winner,
            reward_amount,
        });

        Ok(())
    }

    pub fn claim_nft_badge(
        ctx: Context<ClaimNftBadge>,
        streak_milestone: u8,
        _epoch_id: u64,
    ) -> Result<()> {
        require!(
            streak_milestone == 7
                || streak_milestone == 14
                || streak_milestone == 30
                || streak_milestone == 60,
            ErrorCode::InvalidMilestone
        );

        let commitment = &ctx.accounts.habit_commitment;
        require!(
            commitment.streak_count >= streak_milestone,
            ErrorCode::InsufficientStreak
        );

        emit!(BadgeClaimed {
            owner: commitment.owner,
            milestone: streak_milestone,
        });

        Ok(())
    }
}

// ── Config ──────────────────────────────────────────────────────────────

#[account]
pub struct Config {
    pub bump: u8,
    pub authority: Pubkey,
    pub is_active: bool,
    pub is_paused: bool,
    pub version: u8,
}

impl Config {
    pub const LEN: usize = 1 + 32 + 1 + 1 + 1;
}

#[derive(Accounts)]
pub struct InitializeConfig<'info> {
    #[account(
        init,
        seeds = [b"config", authority.key().as_ref()],
        bump,
        payer = authority,
        space = 8 + Config::LEN
    )]
    pub config: Account<'info, Config>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

// ── StakingPool ─────────────────────────────────────────────────────────

#[account]
pub struct StakingPool {
    pub total_staked: u64,
    pub total_yield_accumulated: u64,
    pub epoch_count: u64,
    pub authority: Pubkey,
    pub bump: u8,
}

impl StakingPool {
    pub const LEN: usize = 8 + 8 + 8 + 32 + 1;
}

#[derive(Accounts)]
pub struct InitializePool<'info> {
    #[account(
        init,
        seeds = [b"staking_pool"],
        bump,
        payer = authority,
        space = 8 + StakingPool::LEN
    )]
    pub staking_pool: Account<'info, StakingPool>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

// ── HabitCommitment ─────────────────────────────────────────────────────

#[account]
pub struct HabitCommitment {
    pub owner: Pubkey,
    pub goal_type: u8,
    pub daily_target: u32,
    pub stake_amount: u64,
    pub epoch_days: u8,
    pub days_verified: u8,
    pub streak_count: u8,
    pub is_settled: bool,
    pub created_at: i64,
    pub epoch_id: u64,
    pub bump: u8,
}

impl HabitCommitment {
    pub const LEN: usize = 32 + 1 + 4 + 8 + 1 + 1 + 1 + 1 + 8 + 8 + 1;
}

#[derive(Accounts)]
#[instruction(goal_type: u8, daily_target: u32, epoch_days: u8, stake_amount: u64, epoch_id: u64)]
pub struct DepositStake<'info> {
    #[account(
        init,
        seeds = [b"habit", user.key().as_ref(), &epoch_id.to_le_bytes()],
        bump,
        payer = user,
        space = 8 + HabitCommitment::LEN
    )]
    pub habit_commitment: Account<'info, HabitCommitment>,
    #[account(
        mut,
        seeds = [b"staking_pool"],
        bump = staking_pool.bump,
    )]
    pub staking_pool: Account<'info, StakingPool>,
    /// CHECK: Vault PDA that holds SOL deposits
    #[account(
        mut,
        seeds = [b"vault"],
        bump,
    )]
    pub vault: UncheckedAccount<'info>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(epoch_id: u64)]
pub struct VerifyHabit<'info> {
    #[account(
        mut,
        seeds = [b"habit", habit_commitment.owner.as_ref(), &epoch_id.to_le_bytes()],
        bump = habit_commitment.bump,
    )]
    pub habit_commitment: Account<'info, HabitCommitment>,
    #[account(
        seeds = [b"staking_pool"],
        bump = staking_pool.bump,
    )]
    pub staking_pool: Account<'info, StakingPool>,
    #[account(mut)]
    pub oracle: Signer<'info>,
}

#[derive(Accounts)]
#[instruction(epoch_id: u64)]
pub struct SettleEpoch<'info> {
    #[account(
        mut,
        seeds = [b"habit", habit_commitment.owner.as_ref(), &epoch_id.to_le_bytes()],
        bump = habit_commitment.bump,
    )]
    pub habit_commitment: Account<'info, HabitCommitment>,
    #[account(
        mut,
        seeds = [b"staking_pool"],
        bump = staking_pool.bump,
    )]
    pub staking_pool: Account<'info, StakingPool>,
    /// CHECK: Vault PDA that holds SOL deposits, verified by seeds
    #[account(
        mut,
        seeds = [b"vault"],
        bump,
    )]
    pub vault: UncheckedAccount<'info>,
    /// CHECK: Owner of the habit commitment, verified by constraint
    #[account(
        mut,
        constraint = owner.key() == habit_commitment.owner @ ErrorCode::UnauthorizedOracle
    )]
    pub owner: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(streak_milestone: u8, epoch_id: u64)]
pub struct ClaimNftBadge<'info> {
    #[account(
        seeds = [b"habit", habit_commitment.owner.as_ref(), &epoch_id.to_le_bytes()],
        bump = habit_commitment.bump,
    )]
    pub habit_commitment: Account<'info, HabitCommitment>,
    #[account(mut)]
    pub user: Signer<'info>,
}

// ── Events ──────────────────────────────────────────────────────────────

#[event]
pub struct HabitVerified {
    pub owner: Pubkey,
    pub epoch_id: u64,
    pub days_verified: u8,
    pub streak_count: u8,
}

#[event]
pub struct EpochSettled {
    pub owner: Pubkey,
    pub epoch_id: u64,
    pub is_winner: bool,
    pub reward_amount: u64,
}

#[event]
pub struct BadgeClaimed {
    pub owner: Pubkey,
    pub milestone: u8,
}

// ── Error Codes ─────────────────────────────────────────────────────────

#[error_code]
pub enum ErrorCode {
    #[msg("Invalid goal type")]
    InvalidGoalType,
    #[msg("Invalid epoch days")]
    InvalidEpochDays,
    #[msg("Insufficient stake amount")]
    InsufficientStake,
    #[msg("Epoch already settled")]
    AlreadySettled,
    #[msg("Epoch not yet complete")]
    EpochNotComplete,
    #[msg("Unauthorized oracle")]
    UnauthorizedOracle,
    #[msg("Invalid milestone")]
    InvalidMilestone,
    #[msg("Insufficient streak")]
    InsufficientStreak,
    #[msg("Math overflow")]
    MathOverflow,
}