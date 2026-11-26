// Location: app/lib/governance/serverRbac.ts
import { prisma } from "@/lib/prisma";
import {
  canAccessSubSection,
  canPerformGovernanceAction,
  GOVERNANCE_TIER_META,
  GovernanceAction,
  GovernanceSubSectionKey,
  GovernanceTierLevel,
  isFounderSubject,
  normalizeTierLevel,
} from "@/app/lib/governance/tierRbac";

export interface ServerRbacContext {
  uid: string;
  tier: GovernanceTierLevel;
  role: string;
  status: string;
  isFrozen: boolean;
  hasRole: boolean;
  isFounder: boolean;
}

export type ServerGuardResult =
  | {
      ok: true;
      ctx: ServerRbacContext;
    }
  | {
      ok: false;
      httpStatus: 401 | 403;
      error: string;
      requiredTier?: GovernanceTierLevel;
    };

function extractUidFromRequest(
  req: Request,
  body?: Record<string, unknown> | null
): string {
  const headerUid =
    req.headers.get("x-pioneer-uid") || req.headers.get("x-actor-uid") || "";
  if (headerUid.trim()) return headerUid.trim();

  const bodyUid =
    body?.pioneerUid ||
    body?.consumerUid ||
    body?.voterUid ||
    body?.elderUid ||
    body?.founderUid ||
    body?.actorUid ||
    "";
  if (typeof bodyUid === "string" && bodyUid.trim()) {
    return bodyUid.trim();
  }

  try {
    const url = new URL(req.url);
    const queryUid =
      url.searchParams.get("uid") || url.searchParams.get("pioneerUid") || "";
    return queryUid.trim();
  } catch {
    return "";
  }
}

export async function resolveServerRbacContext(
  req: Request,
  body?: Record<string, unknown> | null
): Promise<ServerRbacContext | null> {
  const uid = extractUidFromRequest(req, body);
  if (!uid) return null;

  try {
    const node = await (prisma as any).pioneerNode?.findFirst?.({
      where: {
        OR: [{ uid }, { publicKey: uid }, { username: uid }],
      },
    });

    if (!node) return null;

    const rawStatus = String(node.status || "ACTIVE").toUpperCase();
    const isFrozen =
      rawStatus === "FROZEN" ||
      rawStatus === "QUARANTINED" ||
      rawStatus === "SUSPENDED" ||
      Boolean(node.isFrozen);

    const roleStr = String(node.role || node.tier || "CITIZEN").trim();
    const upperRole = roleStr.toUpperCase();
    const hasRole =
      Boolean(upperRole) && upperRole !== "NONE" && upperRole !== "GUEST";

    const tier = normalizeTierLevel(node.tier ?? roleStr ?? 1);
    const founder = isFounderSubject({
      role: roleStr,
      isFounder: Boolean(node.isFounder),
    });

    return {
      uid: String(node.uid || uid),
      tier,
      role: roleStr,
      status: rawStatus,
      isFrozen,
      hasRole,
      isFounder: founder,
    };
  } catch (err) {
    console.error("[SERVER_RBAC_LOOKUP_FAULT]:", err);
    return null;
  }
}

export async function authorizeServerAction(
  req: Request,
  action: GovernanceAction,
  body?: Record<string, unknown> | null
): Promise<ServerGuardResult> {
  const ctx = await resolveServerRbacContext(req, body);

  if (!ctx) {
    return {
      ok: false,
      httpStatus: 401,
      error: "Active Pioneer node session or UID is required.",
    };
  }

  const check = canPerformGovernanceAction(ctx.tier, action, {
    hasPassport: ctx.status === "ACTIVE",
    isFrozen: ctx.isFrozen,
    hasRole: ctx.hasRole,
  });

  if (!check.allowed) {
    return {
      ok: false,
      httpStatus: 403,
      error:
        check.reason ||
        `Action ${action} requires ${GOVERNANCE_TIER_META[check.requiredTier].label}.`,
      requiredTier: check.requiredTier,
    };
  }

  return { ok: true, ctx };
}

export async function authorizeServerSubSection(
  req: Request,
  subSection: GovernanceSubSectionKey,
  body?: Record<string, unknown> | null
): Promise<ServerGuardResult> {
  const ctx = await resolveServerRbacContext(req, body);

  if (!ctx) {
    return {
      ok: false,
      httpStatus: 401,
      error: "Active Pioneer node session or UID is required.",
    };
  }

  const check = canAccessSubSection(subSection, {
    tier: ctx.tier,
    hasRole: ctx.hasRole,
    hasPassport: ctx.status === "ACTIVE",
    isFrozen: ctx.isFrozen,
    isFounder: ctx.isFounder,
    role: ctx.role,
  });

  if (!check.allowed) {
    return {
      ok: false,
      httpStatus: 403,
      error:
        check.reason ||
        `Sub-section ${subSection} requires ${check.requiredTierLabel}.`,
      requiredTier: normalizeTierLevel(check.requiredTierLabel),
    };
  }

  return { ok: true, ctx };
}