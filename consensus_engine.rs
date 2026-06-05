#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Env, Symbol, Address};

// 🛡️ NEO PROTOCOL: Hard-Coded Validation Thresholds
const LOCAL_CONSENSUS_TARGET: f64 = 0.80; // 80% Local Agreement Required
const GLOBAL_CONSENSUS_TARGET: u32 = 4;   // 4 out of 5 Tiers Required (80% Global Edge)

// 🛡️ THE ASYMMETRIC QUORUM MATRIX
// Index 0 = Tier 1 (Citizens), Index 4 = Tier 5 (Founder)
const QUORUM_THRESHOLDS: [f64; 5] = [
    0.20, // Tier 1: 20% (Filters out the passive majority)
    0.33, // Tier 2: 33% (Merchants/Service Providers)
    0.51, // Tier 3: 51% (Genesis Group)
    0.75, // Tier 4: 75% (Security Circle)
    1.00, // Tier 5: 100% (The Founder: Absolute Unification)
];

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum Tier {
    Citizen = 0,
    Merchant = 1,
    Genesis = 2,
    SecurityCircle = 3,
    Founder = 4,
}

#[contracttype]
#[derive(Clone, Default)]
pub struct TierTally {
    pub total_registered_active: u32, // Dynamic Denominator (Excludes Stasis Nodes)
    pub total_votes_cast: u32,
    pub votes_for: u32,
    pub votes_against: u32,
}

#[contract]
pub struct BazaarConsensusEngine;

#[contractimpl]
impl BazaarConsensusEngine {

    /// 🛰️ GATE 1: THE DYNAMIC QUORUM CHECK
    /// Verifies if a specific tier met its required participation threshold.
    pub fn verify_quorum(env: Env, tier: Tier, tally: TierTally) -> bool {
        if tally.total_registered_active == 0 {
            return false; // Prevent divide-by-zero fracture
        }

        let participation_rate = (tally.total_votes_cast as f64) / (tally.total_registered_active as f64);
        let required_quorum = QUORUM_THRESHOLDS[tier.clone() as usize];

        // If participation is lower than the threshold, the tier's vote is instantly voided.
        participation_rate >= required_quorum
    }

    /// 🛰️ GATE 2: THE 80% LOCAL CONSENSUS CHECK
    /// Evaluates if the participating Pioneers within the tier achieved the 80% agreement barrier.
    pub fn verify_local_consensus(env: Env, tally: TierTally) -> bool {
        if tally.total_votes_cast == 0 {
            return false;
        }

        let approval_rate = (tally.votes_for as f64) / (tally.total_votes_cast as f64);
        
        approval_rate >= LOCAL_CONSENSUS_TARGET
    }

    /// 🛰️ GATE 3: THE GLOBAL EDGE AGGREGATION
    /// The final execution gate. Compiles the 5 isolated tiers into a unified 80% global decision.
    pub fn execute_global_edge(
        env: Env, 
        tier1: TierTally, 
        tier2: TierTally, 
        tier3: TierTally, 
        tier4: TierTally, 
        tier5: TierTally
    ) -> bool {
        
        let mut passing_tiers: u32 = 0;

        // TIER 1 EVALUATION
        if Self::verify_quorum(env.clone(), Tier::Citizen, tier1.clone()) && 
           Self::verify_local_consensus(env.clone(), tier1) {
            passing_tiers += 1;
        }

        // TIER 2 EVALUATION
        if Self::verify_quorum(env.clone(), Tier::Merchant, tier2.clone()) && 
           Self::verify_local_consensus(env.clone(), tier2) {
            passing_tiers += 1;
        }

        // TIER 3 EVALUATION
        if Self::verify_quorum(env.clone(), Tier::Genesis, tier3.clone()) && 
           Self::verify_local_consensus(env.clone(), tier3) {
            passing_tiers += 1;
        }

        // TIER 4 EVALUATION
        if Self::verify_quorum(env.clone(), Tier::SecurityCircle, tier4.clone()) && 
           Self::verify_local_consensus(env.clone(), tier4) {
            passing_tiers += 1;
        }

        // TIER 5 EVALUATION
        if Self::verify_quorum(env.clone(), Tier::Founder, tier5.clone()) && 
           Self::verify_local_consensus(env.clone(), tier5) {
            passing_tiers += 1;
        }

        // 🛡️ THE FINAL DECISION: Must hit 4 out of 5 (80% Global Target)
        passing_tiers >= GLOBAL_CONSENSUS_TARGET
    }
}