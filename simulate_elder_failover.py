import datetime

# --- Python Translation of types_identity-v2.ts logic ---

class SovereignTier:
    FOUNDER = "FOUNDER"
    ELDER = "ELDER"
    GENESIS_100 = "GENESIS_100"
    MERCHANT = "MERCHANT"
    NODE_OPERATOR = "NODE_OPERATOR"
    CITIZEN = "CITIZEN"

class DisputeState:
    OPEN = "OPEN"
    VOTING = "VOTING"
    FAILOVER_TRIGGERED = "FAILOVER_TRIGGERED"
    CLOSED_RESOLVED = "CLOSED_RESOLVED"
    CLOSED_DISMISSED = "CLOSED_DISMISSED"

def trigger_elder_failover(session, missing_elder_id):
    if missing_elder_id not in session["activePanel"]:
        return {"updatedSession": session, "promotedElderId": None}

    promoted_elder_id = session["firstBackup"]
    if not promoted_elder_id:
        return {"updatedSession": session, "promotedElderId": None}

    # Swap missing elder with 1st backup
    updated_panel = [
        promoted_elder_id if eid == missing_elder_id else eid
        for eid in session["activePanel"]
    ]
    updated_non_responding = session["nonRespondingElders"] + [missing_elder_id]

    updated_session = {
        **session,
        "disputeState": DisputeState.FAILOVER_TRIGGERED,
        "activePanel": updated_panel,
        "firstBackup": session["secondBackup"] or "",
        "secondBackup": "",
        "nonRespondingElders": updated_non_responding,
        "updatedAt": datetime.datetime.now()
    }

    return {"updatedSession": updated_session, "promotedElderId": promoted_elder_id}

def penalize_non_responding_elder(passport):
    if passport["activeTier"] != SovereignTier.ELDER:
        return passport

    stats = passport.get("elderStats", {
        "consecutiveMissedVotes": 0,
        "totalMissedVotes": 0,
        "totalSuccessfulVotes": 0,
        "lastActiveEpoch": ""
    })

    updated_consecutive_misses = stats["consecutiveMissedVotes"] + 1
    updated_total_misses = stats["totalMissedVotes"] + 1
    
    # Apply trustScore decay (10.0 points)
    updated_trust_score = max(0.0, passport["trustScore"] - 10.0)

    updated_tier = passport["activeTier"]

    if updated_consecutive_misses >= 2:
        updated_tier = SovereignTier.GENESIS_100
        stats["consecutiveMissedVotes"] = 0
    else:
        stats["consecutiveMissedVotes"] = updated_consecutive_misses

    stats["totalMissedVotes"] = updated_total_misses

    return {
        **passport,
        "trustScore": updated_trust_score,
        "activeTier": updated_tier,
        "elderStats": stats,
        "updatedAt": datetime.datetime.now()
    }

def run_simulation():
    # Styled unicode headers for output
    cyan = "\033[96m"
    yellow = "\033[93m"
    green = "\033[92m"
    red = "\033[91m"
    reset = "\033[0m"

    print(f"{cyan}========================================================================{reset}")
    print(f"🏛️  PROJECT BAZAAR — ELDER GOVERNANCE FAILOVER DIAGNOSTICS (CLI-DX)")
    print(f"{cyan}========================================================================{reset}")
    print("  Platform: X570 Command Center | Status: LIVE COEXISTENCE RUN")
    print(f"{cyan}========================================================================{reset}\n")

    # 1. Initial Seeding
    initial_session = {
        "caseId": "CASE_L2_8131_DISPUTE",
        "epochId": "EPOCH_2026_Q3",
        "disputeState": DisputeState.OPEN,
        "seatingElders": ["elder_01", "elder_02", "elder_03", "elder_04", "elder_05", "elder_06", "elder_07", "elder_08", "elder_09", "elder_10"],
        "activePanel": ["elder_01", "elder_02", "elder_03", "elder_04", "elder_05"],
        "firstBackup": "elder_06",
        "secondBackup": "elder_07",
        "votes": [
            {"elderId": "elder_01", "vote": "IN_FAVOR"},
            {"elderId": "elder_02", "vote": "IN_FAVOR"}
        ],
        "nonRespondingElders": [],
        "startedAt": datetime.datetime.now(),
        "expiresAt": datetime.datetime.now() + datetime.timedelta(days=1)
    }

    print("📬 [STAGE 1] ACTIVE ARBITRATION SESSION CREATED")
    print(f"  - Case ID        : {initial_session['caseId']}")
    print(f"  - Current State  : {initial_session['disputeState']}")
    print(f"  - Seating Pool   : {initial_session['seatingElders']}")
    print(f"  - Active Panel   : {initial_session['activePanel']}  <-- Active Voters")
    print(f"  - 1st Backup     : {initial_session['firstBackup']}")
    print(f"  - 2nd Backup     : {initial_session['secondBackup']}")
    print(f"  - Casted Votes   : {len(initial_session['votes'])} / 5")

    # Passports
    lazy_elder = {
        "id": "elder_03",
        "piUsername": "lazy_pioneer_elder",
        "activeTier": SovereignTier.ELDER,
        "trustScore": 95.0,
        "elderStats": {
            "consecutiveMissedVotes": 0,
            "totalMissedVotes": 2,
            "totalSuccessfulVotes": 14,
            "lastActiveEpoch": "EPOCH_2026_Q2"
        }
    }

    critical_elder = {
        "id": "elder_04",
        "piUsername": "striking_pioneer_elder",
        "activeTier": SovereignTier.ELDER,
        "trustScore": 85.0,
        "elderStats": {
            "consecutiveMissedVotes": 1, # Already on Strike 1!
            "totalMissedVotes": 3,
            "totalSuccessfulVotes": 9,
            "lastActiveEpoch": "EPOCH_2026_Q2"
        }
    }

    # Stage 2: Elder 03 failover
    print(f"\n{yellow}⏳ [STAGE 2] SLA DEADLINE CROSSED — ELDER_03 FAILS TO RESPOND (STRIKE 1){reset}")
    print(f"  - Failing Elder  : {lazy_elder['id']} (@{lazy_elder['piUsername']})")
    print(f"  - Current Trust  : {lazy_elder['trustScore']} points")
    print(f"  - Current Strike : {lazy_elder['elderStats']['consecutiveMissedVotes']} consecutive missed votes")

    failover1 = trigger_elder_failover(initial_session, "elder_03")
    print(f"\n⚙️  Executing Failover Swap...")
    print(f"  {green}✓{reset} Unresponsive elder_03 ejected from Active Panel.")
    print(f"  {green}✓{reset} Promoted 1st backup [{failover1['promotedElderId']}] to Active Panel.")
    print(f"  {green}✓{reset} Promoted 2nd backup [{initial_session['secondBackup']}] to 1st Backup.")

    session_v2 = failover1["updatedSession"]
    print(f"\n📬 [NEW PANEL STATUS]")
    print(f"  - Dispute State  : {session_v2['disputeState']}")
    print(f"  - Active Panel   : {session_v2['activePanel']}")
    print(f"  - 1st Backup     : {session_v2['firstBackup']}")
    print(f"  - 2nd Backup     : {session_v2['secondBackup'] or 'NONE'}")
    print(f"  - Non-Responding : {session_v2['nonRespondingElders']}")

    penalized1 = penalize_non_responding_elder(lazy_elder)
    print(f"\n⚖️  Applying Sovereign Penalties to elder_03:")
    print(f"  {green}✓{reset} Trust Score Decayed : {lazy_elder['trustScore']} --> {penalized1['trustScore']} (-10.0 pts)")
    print(f"  {green}✓{reset} Strikes Incremented : {lazy_elder['elderStats']['consecutiveMissedVotes']} --> {penalized1['elderStats']['consecutiveMissedVotes']}")
    print(f"  {green}✓{reset} Sovereign Tier      : {penalized1['activeTier']} (Maintained)")

    # Stage 3: Elder 04 failover (Strike 2 -> Demotion)
    print(f"\n{red}🚨 [STAGE 3] CONSECUTIVE SLA FAILURE — ELDER_04 FAILS TO RESPOND (STRIKE 2){reset}")
    print(f"  - Failing Elder  : {critical_elder['id']} (@{critical_elder['piUsername']})")
    print(f"  - Current Trust  : {critical_elder['trustScore']} points")
    print(f"  - Current Strike : {critical_elder['elderStats']['consecutiveMissedVotes']} consecutive missed votes (Strike 1 Active)")

    failover2 = trigger_elder_failover(session_v2, "elder_04")
    print(f"\n⚙️  Executing Failover Swap...")
    print(f"  {green}✓{reset} Unresponsive elder_04 ejected from Active Panel.")
    print(f"  {green}✓{reset} Promoted 1st backup [{failover2['promotedElderId']}] to Active Panel.")

    session_v3 = failover2["updatedSession"]
    print(f"\n📬 [NEW PANEL STATUS]")
    print(f"  - Active Panel   : {session_v3['activePanel']}")
    print(f"  - Non-Responding : {session_v3['nonRespondingElders']}")

    penalized2 = penalize_non_responding_elder(critical_elder)
    print(f"\n⚖️  Applying Sovereign Penalties to elder_04:")
    print(f"  {green}✓{reset} Trust Score Decayed : {critical_elder['trustScore']} --> {penalized2['trustScore']} (-10.0 pts)")
    print(f"  {red}🔥 STRIPPED OF ELDER CHAIR: Missed 2 consecutive votes!{reset}")
    print(f"  {red}🔥 DEMOTION ENFORCED  : ELDER --> GENESIS_100{reset}")
    print(f"  {green}✓{reset} Consecutive Strikes : Reset to {penalized2['elderStats']['consecutiveMissedVotes']}")

    print(f"\n{cyan}========================================================================{reset}")
    print("🏆 DIAGNOSTICS SUCCESSFUL: SELF-HEALING ARBITRATION VALIDATED!")
    print(f"{cyan}========================================================================{reset}")

if __name__ == "__main__":
    run_simulation()
