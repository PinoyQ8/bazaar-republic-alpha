import { db } from '@/app/lib/db'; // Ensure exact path to your new Prisma singleton

export interface PioneerIdentity {
  uid: string;
  username: string;
  isReturning: boolean;
  genesisCompleted: boolean;
}

export async function verifyPioneerState(accessToken: string): Promise<PioneerIdentity> {
  const response = await fetch('/api/auth/pi-verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accessToken }),
  });

  if (!response.ok) {
    throw new Error('PI_AUTH_FAILED');
  }

  const { uid, username } = await response.json();

  // 🛡️ MESH PATCH: Updated to match PioneerNode in Schema v2.3
  const pioneerRecord = await db.pioneerNode.findUnique({
    where: { uid: uid },
  });

  if (!pioneerRecord) {
    return {
      uid,
      username,
      isReturning: false,
      genesisCompleted: false,
    };
  }

  // In Schema v2.3, node status 'ACTIVE' implies Genesis is done.
  const isGenesisCompleted = pioneerRecord.status === 'ACTIVE';

  return {
    uid,
    username,
    isReturning: isGenesisCompleted,
    genesisCompleted: isGenesisCompleted,
  };
}