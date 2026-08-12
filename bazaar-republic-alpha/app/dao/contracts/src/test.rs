#[test]
fn test_escrow_decay_fast_stress() {
    let env = Env::default();
    
    // Set initial start time (e.g., hour 0)
    env.ledger().set_timestamp(1_000_000);
    
    // 1. Initial State Check (100% allocation)
    let alloc_0 = contract.get_decayed_allocation(&env, ...);
    
    // ⚡ TIME SKIP: Advance clock by 12 hours (43,200 seconds) INSTANTLY
    env.ledger().set_timestamp(1_000_000 + 43_200);
    
    // 2. Mid-point Check (50% allocation)
    let alloc_12h = contract.get_decayed_allocation(&env, ...);
    
    // ⚡ TIME SKIP: Advance clock to 24 hours (86,400 seconds)
    env.ledger().set_timestamp(1_000_000 + 86_400);
    
    // 3. Terminal Check (0% allocation / fully decayed)
    let alloc_24h = contract.get_decayed_allocation(&env, ...);
    assert_eq!(alloc_24h, 0);
}