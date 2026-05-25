// 🛡️ MESH GOVERNANCE GATEWAY [5-Tier Matrix Active]
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { connectToLedger } from '@/lib/mongodb'; 
import { PioneerNode } from '@/lib/models/PioneerNode';
import { Proposal } from '@/lib/models/Proposal';
import { evaluateConstitution } from '@/lib/adjudicator/semanticFilter';

export async function POST(request: NextRequest) {
  try {
    const { title, description, targetContract } = await request.json();
    
    // 1. IDENTITY ADJUDICATION
    const pioneerUid = request.headers.get('x-mesh-pioneer-uid');
    const pioneerRole = request.headers.get('x-mesh-pioneer-role') || 'CITIZEN';

    if (!pioneerUid) {
      return NextResponse.json({ error: "UNAUTHORIZED_IDENTITY" }, { status: 403 });
    }

    // 🛡️ UPLINK: Initiating secure handshake with Telemetry Vault
    await connectToLedger();
    
    // 2. THE TIME-LOCK PROTOCOL (Frequency Enforcement)
    if (pioneerRole !== 'FOUNDER' && pioneerRole !== 'ELDER') {
      const lastProposal = await Proposal.findOne({ proposerUid: pioneerUid })
        .sort({ createdAt: -1 })
        .select('createdAt')
        .lean();

      if (lastProposal) {
        const now = Date.now();
        const lastTime = new Date(lastProposal.createdAt).getTime();
        const hoursSinceLast = (now - lastTime) / (1000 * 60 * 60);

        // Tier Cooldown Matrix
        let cooldownHours = 720; // Tier 5: Citizen (30 Days)
        if (pioneerRole === 'MERCHANT') cooldownHours = 168; // Tier 3 (7 Days)
        if (pioneerRole === 'PROVIDER') cooldownHours = 336; // Tier 4 (14 Days)

        if (hoursSinceLast < cooldownHours) {
          console.log(`[ADJUDICATOR] Time-Lock rejected proposal from UID: ${pioneerUid}.`);
          return NextResponse.json({ 
            error: "TIME_LOCK_ACTIVE", 
            message: `Tier frequency limit reached. Cooldown remaining: ${Math.ceil(cooldownHours - hoursSinceLast)} hours.` 
          }, { status: 429 });
        }
      }
    }

    // 🛡️ THE CONSTITUTIONAL FIREWALL (Semantic Intercept)
    // The Adjudicator scans the payload before it ever reaches the registry bypass or the Vault.
    const firewallCheck = evaluateConstitution(title, description);
    
    if (!firewallCheck.aligned) {
      console.warn(`[ADJUDICATOR] Firewall intercepted fracture attempt from UID: ${pioneerUid}. Reason: ${firewallCheck.reason}`);
      return NextResponse.json({ 
        error: "CONSTITUTION_VIOLATION", 
        message: firewallCheck.reason 
      }, { status: 406 }); // 406 Not Acceptable
    }

    // 3. THE FOUNDER BYPASS (Local Test Environment)
    let nodeData;
    if (pioneerUid === 'GENESIS-ANCHOR' && pioneerRole === 'FOUNDER') {
      console.log("[ADJUDICATOR] Genesis Anchor detected. Bypassing node registry check.");
      nodeData = { uid: pioneerUid, role: 'FOUNDER' };
    } else {
      nodeData = await PioneerNode.findOne({ uid: pioneerUid }).lean();
      if (!nodeData) {
        return NextResponse.json({ error: "NODE_NOT_FOUND_IN_REGISTRY" }, { status: 404 });
      }
    }

    // 4. THE LIVE CENSUS (Temporal Snapshot)
    // Counting eligible, unfrozen nodes for the 80% quorum denominator
    const [elderCount, merchantCount, providerCount, citizenCount] = await Promise.all([
      PioneerNode.countDocuments({ role: 'ELDER', isFrozen: false }),
      PioneerNode.countDocuments({ role: 'MERCHANT', isFrozen: false }),
      PioneerNode.countDocuments({ role: 'PROVIDER', isFrozen: false }),
      PioneerNode.countDocuments({ role: 'CITIZEN', isFrozen: false })
    ]);

    // 🛡️ THE TWO-STAGE CLOCK INITIALIZATION
    const TIER_MAP: Record<string, string> = {
      'FOUNDER': 'founder',
      'ELDER': 'circleOfElders',
      'MERCHANT': 'merchant',
      'PROVIDER': 'serviceProvider',
      'CITIZEN': 'citizen'
    };
    
    const schemaTier = TIER_MAP[pioneerRole] || 'citizen';
    
    // High Command (Founder/Elders) bypass the Tier Floor and go straight to the Republic Floor
    const isHighCommand = (pioneerRole === 'FOUNDER' || pioneerRole === 'ELDER');
    const initialStage = isHighCommand ? 'REPUBLIC_FLOOR' : 'TIER_FLOOR';

    const deadline = new Date();
    deadline.setDate(deadline.getDate() + 14);

    // 5. LEDGER PERSISTENCE (Cryptographic Bind)
    const newProposal = await Proposal.create({
      title,
      description,
      targetContract,
      proposerUid: pioneerUid,
      currentStage: initialStage,
      proposerTier: schemaTier,
      currentDeadline: deadline,
      tierMetrics: {
        founder: { totalEligibleNodes: 1 }, 
        circleOfElders: { totalEligibleNodes: elderCount || 0 },
        merchant: { totalEligibleNodes: merchantCount || 0 },
        serviceProvider: { totalEligibleNodes: providerCount || 0 },
        citizen: { totalEligibleNodes: citizenCount || 0 }
      }
    });

    console.log(`[MESH-GOVERNANCE] 5-Tier Proposal Logged: ${newProposal._id}`);

    return NextResponse.json({
      success: true,
      message: "Proposal cryptographically bound to ledger.",
      proposalId: newProposal._id
    });

  } catch (error) {
    console.error("[MESH-GOVERNANCE ERROR]:", error);
    return NextResponse.json({ success: false, error: "Proposal Engine Panic" }, { status: 500 });
  }
}