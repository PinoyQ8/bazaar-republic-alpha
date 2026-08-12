use soroban_sdk::{contractimpl, Env, Address, Symbol};

pub struct EscrowDecayContract;

#[contractimpl]
impl EscrowDecayContract {
    /// Calculates current active escrow allocation with accelerated time decay
    pub fn get_decayed_allocation(
        env: Env, 
        initial_allocation: i128, 
        start_timestamp: u64, 
        target_decay_hours: u64,
        acceleration_factor: u64 // e.g., 2x or 4x speedup
    ) -> i128 {
        let current_time = env.ledger().timestamp();
        let elapsed_seconds = current_time.saturating_sub(start_timestamp);
        
        // Convert target hours into effective accelerated seconds
        let total_decay_seconds = (target_decay_hours * 3600) / acceleration_factor.max(1);
        
        if elapsed_seconds >= total_decay_seconds {
            return 0; // Fully decayed / returned to community pool
        }
        
        // Linear accelerated decay calculation
        let remaining_ratio = total_decay_seconds.saturating_sub(elapsed_seconds) as i128;
        (initial_allocation * remaining_ratio) / (total_decay_seconds as i128)
    }
}