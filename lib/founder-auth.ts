// lib/founder-auth.ts (Server-only)
export function isVerifiedFounderUid(uid: string): boolean {
  const normalizedUid = uid.trim();
  if (!normalizedUid) return false;

  const founderUid = process.env.FOUNDER_PI_UID?.trim();
  const circleUids = (process.env.GENESIS_SECURITY_CIRCLE_UIDS || "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);

  return normalizedUid === founderUid || circleUids.includes(normalizedUid);
}

export async function verifyPiTokenAndFounder(accessToken: string) {
  const res = await fetch("https://api.minepi.com/v2/me", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    signal: AbortSignal.timeout(8000),
  });

  if (!res.ok) {
    return { ok: false as const, status: res.status };
  }

  const data = await res.json();
  const uid = typeof data?.uid === "string" ? data.uid.trim() : "";
  const username = typeof data?.username === "string" ? data.username.trim() : "";

  if (!uid || !username) {
    return { ok: false as const, status: 502 };
  }

  return {
    ok: true as const,
    uid,
    username,
    isFounder: isVerifiedFounderUid(uid),
  };
}