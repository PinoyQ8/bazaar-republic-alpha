// Location: lib/rbac/guard.ts
import { prisma } from "@/lib/prisma";
import { Permission, ROLE_PERMISSIONS } from "./permissions";

export interface RbacEvaluation {
  authorized: boolean;
  reason?: string;
  quarantined?: boolean;
  remedialModule?: string;
}

const TIER_ROLE_MAP: Record<string, string> = {
  CITIZEN: "CADET_INITIATE",
  NOVICE: "ECO_DEVELOPER",
  ACADEMY_CORE: "DEFI_ARBITRAGEUR",
  MESH_GUARDIAN: "MESH_VALIDATOR",
  GENESIS: "GENESIS_ELDER",
  GENESIS_100: "GENESIS_ELDER",
  BAZAAR_FOUNDER: "BAZAAR_FOUNDER",
};

export async function verifyNodeExecution(
  pioneerUid: string,
  requiredPermission: Permission
): Promise<RbacEvaluation> {
  const node = await prisma.pioneerNode.findUnique({
    where: { uid: pioneerUid },
  });

  if (!node) {
    return { authorized: false, reason: "UNREGISTERED_NODE_IDENTITY" };
  }

  // 1. Hard Quarantine & Circuit Breakers (Schema v2.7.2)
  if (node.isFrozen || node.status === "SUSPENDED" || node.quarantineStatus === "QUARANTINED") {
    return {
      authorized: false,
      quarantined: true,
      reason: "NODE_QUARANTINED_REMEDIAL_REQUIRED",
      remedialModule: "01",
    };
  }

  // 2. Telemetry SLA Circuit Breaker (< 85% drops write permissions)
  if (node.uptimeShield < 85.0) {
    await prisma.pioneerNode.update({
      where: { uid: pioneerUid },
      data: { status: "SUSPENDED", quarantineStatus: "QUARANTINED" },
    });
    return {
      authorized: false,
      quarantined: true,
      reason: "UPTIME_BELOW_CONSTITUTIONAL_THRESHOLD",
      remedialModule: "01",
    };
  }

  // 3. Bitwise Capability Check
  const effectiveRole = TIER_ROLE_MAP[node.tier] || node.tier;
  const userPermissions = ROLE_PERMISSIONS[effectiveRole] ?? 0;
  const hasAccess = (userPermissions & requiredPermission) === requiredPermission;

  if (!hasAccess) {
    return {
      authorized: false,
      quarantined: false,
      reason: "INSUFFICIENT_SOVEREIGN_TIER_CLEAR_MODULES_IN_ACADEMY",
      remedialModule: "01",
    };
  }

  return { authorized: true };
}