#![no_std]
use soroban_sdk::{contract, contractevent, contractimpl, Address, Env, Symbol};

// 📡 E-NETWORK EVENT REGISTRY
// The v26 standard requires a strictly typed blueprint for all MESH events.
#[contractevent]
pub struct SyncActivatedEvent {
    #[topic]
    pub pioneer: Address,
}

#[contract]
pub struct PioneerAuthContract;

#[contractimpl]
impl PioneerAuthContract {
    
    // 🛡️ MESH INITIALIZATION
    pub fn init_mesh(env: Env, founder: Address) {
        founder.require_auth();
        env.storage().instance().set(&Symbol::new(&env, "FOUNDER"), &founder);
    }

    // 🚀 EXECUTE SYNC 
    pub fn execute_sync(env: Env, pioneer: Address) {
        pioneer.require_auth();
        
        // Execute the event using the new Protocol 26 macro payload
        SyncActivatedEvent {
            pioneer,
        }.publish(&env);
    }
}