pub fn calculate_escrow_decay(env: Env, initial_alloc: i128, start_time: u64, total_hours: u64) -> i128 {
    let current_time = env.ledger().timestamp();
    let elapsed = current_time.saturating_sub(start_time);

    // ⚡ MOCK TESTING OVERRIDE: 1 hour = 1 second during stress tests
    #[cfg(feature = "testutils")]
    let total_seconds = total_hours; // 12 hours becomes 12 seconds
    
    #[cfg(not(feature = "testutils"))]
    let total_seconds = total_hours * 3600; // Production mode: 12 hours = 43,200 seconds

    if elapsed >= total_seconds {
        return 0;
    }

    let remaining_time = total_seconds - elapsed;
    (initial_alloc * remaining_time as i128) / (total_seconds as i128)
}