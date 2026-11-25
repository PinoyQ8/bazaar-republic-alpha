'use client';

import Script from 'next/script';

export function PiSdkScript() {
  return (
    <Script
      src="https://sdk.minepi.com/pi-sdk.js"
      strategy="afterInteractive"
    />
  );
}