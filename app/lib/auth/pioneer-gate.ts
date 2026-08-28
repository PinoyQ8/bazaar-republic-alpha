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
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || 'PI_AUTH_FAILED');
  }

  return response.json();
}