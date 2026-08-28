/**
 * @file route.ts (api/auth/register)
 * @package Bazaar Republic Layer-2 DePIN Infrastructure
 * @version 1.0.0
 * @summary Production-ready Next.js Server-Side App Router POST Handler (/api/auth/register).
 * Integrates the Pi Network official server handshake to securely verify client-side 
 * authentication tokens, then creates a new Sovereign Passport defaulting strictly to 
 * SovereignTier.OBSERVER (Tier 0) with 0% voting weights and sandboxed permissions.
 */

import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "bzr-db"; // Custom type-safe prisma client
import { 
  SovereignTier, 
  SovereignPassport,
  validateSecurityCircle 
} from "./types_identity-v4";

const prisma = new PrismaClient();

// The authoritative Pi Core Team API endpoint for user verification
const PI_API_ME_URL = "https://api.minepi.com/v2/me";

interface RegisterRequestBody {
  accessToken: string;
  walletAddress: string;
  preferredCurrency?: string;
}

/**
 * POST /api/auth/register
 * Handles client-side accessToken verification with Pi API and initial 
 * Tier-0 Observer passport provisioning.
 */
export async function POST(req: NextRequest) {
  try {
    const body: RegisterRequestBody = await req.json();
    const { accessToken, walletAddress, preferredCurrency = "PHP" } = body;

    // 1. Validate incoming request parameters
    if (!accessToken) {
      return NextResponse.json(
        { error: "Validation Failed: Pi Access Token is required." },
        { status: 400 }
      );
    }

    if (!walletAddress) {
      return NextResponse.json(
        { error: "Validation Failed: L1 Stellar wallet address is required." },
        { status: 400 }
      );
    }

    // 2. Perform server-to-server handshake to the Pi Core Team Platform API
    console.log(`[AUTH-HANDSHAKE] Querying Pi API at ${PI_API_ME_URL} to verify session...`);
    const piResponse = await fetch(PI_API_ME_URL, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!piResponse.ok) {
      const errorText = await piResponse.text();
      console.error(`[AUTH-ERROR] Pi API rejected token. Status: ${piResponse.status}, Response: ${errorText}`);
      return NextResponse.json(
        { error: "Unauthorized: Invalid or expired Pi Network access token." },
        { status: 401 }
      );
    }

    // Handshake successful: Extract app-scoped UID and username
    const piUser = await piResponse.json();
    const { uid: piUid, username: piUsername } = piUser;
    console.log(`[AUTH-SUCCESS] Verified Pi User: @${piUsername} (UID: ${piUid})`);

    // 3. Database Check: Check if a Sovereign Passport or node registration already exists
    const existingNode = await prisma.pioneerNode.findFirst({
      where: {
        OR: [
          { pioneerUid: piUid },
          { walletAddress: walletAddress }
        ]
      }
    });

    if (existingNode) {
      // WARM SESSION BYPASS: If account already exists, do not duplicate.
      // Return their existing profile directly so the client can bypass onboarding screens in ~3ms.
      console.log(`[WARM-SESSION] Account found for UID: ${piUid}. Executing rapid onboarding bypass...`);
      return NextResponse.json({
        message: "Session Resumed: Existing sovereign credentials recognized.",
        warmSessionBypass: true,
        passport: {
          id: existingNode.id,
          piUsername: existingNode.pioneerUid, // Bound to secure app-scoped identity
          kycCountryAnchor: existingNode.countryCode,
          preferredLocalCurrency: preferredCurrency,
          primaryPublicKey: existingNode.walletAddress,
          activeTier: existingNode.status === "ACTIVE" ? SovereignTier.GUARDIAN : SovereignTier.OBSERVER,
          trustScore: existingNode.trustScore,
          isSuspended: existingNode.status === "QUARANTINED",
          isPiKYCVerified: existingNode.trustScore >= 85.0, // KYC tied to high reputation
          isAcademyGraduate: existingNode.status === "ACTIVE",
          mbzrBalanceFormatted: existingNode.mbzrBalanceFormatted,
        }
      });
    }

    // 4. Provision New Sovereign Passport: Default strictly to SovereignTier.OBSERVER (Tier 0)
    console.log(`[PROVISION-INIT] No existing profile. Creating new Tier-0 Observer Passport for @${piUsername}...`);

    // Construct a starting empty Security Circle matching social recovery schemas (size: 0 for now)
    const initialSecurityCircle = {
      ownerPassportId: `pass_${piUid}`,
      trustedMembers: [],
      recoveryThreshold: 0
    };

    // Default parameters for Tier 0 Observers
    const defaultObserverPassport: SovereignPassport = {
      id: `pass_${piUid}`,
      piUsername: piUsername,
      kycCountryAnchor: "PH", // Default fallback anchor until KYC is fetched
      preferredLocalCurrency: preferredCurrency,
      primaryPublicKey: walletAddress,
      activeTier: SovereignTier.OBSERVER, // HARD-CODED SECURITY GATING
      passkeyCredentials: [], // Registered WebAuthn authenticators will be added post-academy
      securityCircle: initialSecurityCircle,
      trustScore: 50.0, // Starting score for un-KYC'ed guest observers
      isSuspended: false,
      isPiKYCVerified: false,    // STRICTLY FALSE: Blocks mainnet Soroban interactions
      isAcademyGraduate: false,  // STRICTLY FALSE: Confines user to Testnet2 Academy Sandbox
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // 5. Write to 'bzr-db' MongoDB database replica set via Prisma
    const newNode = await prisma.pioneerNode.create({
      data: {
        walletAddress: walletAddress,
        pioneerUid: piUid,
        mbzrBalanceSubunits: "0", // 0.0000000 mBZR starting sandbox balance
        mbzrBalanceFormatted: "0.0000000",
        cpuUsage: 0.0,
        ramUsage: 0.0,
        ssdLatency: "N/A (Observer Staging)",
        accumulatedDowntime: 0.0,
        trustScore: 50.0,
        status: "SYNCING", // Sandbox Syncing Status
        countryCode: "PH",
        phonePrefix: "+63",
        pppMultiplier: 1.0, // Balanced baseline multiplier until graded
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    });

    console.log(`[PROVISION-SUCCESS] Database registered. New node ID: ${newNode.id}. Sovereign Passport: TIER 0.`);

    // 6. Return response to client with the initialized Sandbox state
    return NextResponse.json({
      message: "Registration Successful: Sovereign Passport created under Sandbox isolation.",
      warmSessionBypass: false,
      passport: defaultObserverPassport
    }, { status: 201 });

  } catch (error: any) {
    console.error("[CRITICAL-FATAL] Unhandled registration exception:", error);
    return NextResponse.json(
      { error: "Internal Server Error: Secure passport creation failed.", details: error.message },
      { status: 500 }
    );
  }
}
