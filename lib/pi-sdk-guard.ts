/**
 * Project Bazaar - MESH Pi SDK Guard
 * Copyright (c) 2026 Bazaar Republic / PinoyQ8 - Founder & Co-Pioneer
 */

export interface PiUserSession {
  uid: string;
  username: string;
  accessToken: string;
}

export const isPiBrowser = (): boolean => {
  if (typeof window === 'undefined') return false;
  const userAgent = window.navigator.userAgent || '';
  return userAgent.includes('PiBrowser') || Boolean((window as any).Pi);
};

export const safeAuthenticatePi = async (): Promise<PiUserSession> => {
  // 1. DESKTOP LOCALHOST DEV SHIELD
  if (!isPiBrowser() && process.env.NODE_ENV === 'development') {
    console.warn('[MESH-GUARD] Localhost context detected. Bypassing native Pi Browser postMessage handshake.');
    return {
      uid: 'test-pioneer-s23-001',
      username: 'S23_Tester_Pioneer',
      accessToken: 'mock_mesh_l2_access_token_dev_mode',
    };
  }

  // 2. NATIVE PI BROWSER HANDSHAKE
  try {
    const Pi = (window as any).Pi;
    if (!Pi) throw new Error('Pi SDK script not loaded in window context.');

    const authResult = await Pi.authenticate(
      ['username', 'payments', 'wallet_address'],
      (payment: any) => console.log('[Pi SDK] Incomplete payment found:', payment)
    );

    return {
      uid: authResult.user.uid,
      username: authResult.user.username,
      accessToken: authResult.accessToken,
    };
  } catch (err: any) {
    console.error('[MESH-GUARD] Pi Auth Failed:', err);
    throw err;
  }
};