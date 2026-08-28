// app/lib/pi-sdk.ts
'use client';

export async function waitForPiSDK(maxRetries = 35, delayMs = 150): Promise<Window['Pi'] | null> {
  if (typeof window === 'undefined') return null;

  // 1. Immediate resolution
  if (window.Pi) return window.Pi;

  // 2. Extended backoff loop (~5.25 seconds total threshold for cold mobile WebViews)
  for (let i = 0; i < maxRetries; i++) {
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    if (window.Pi) {
      return window.Pi;
    }
  }

  // 3. Fallback check before declaring delayed status
  return window.Pi || null;
}