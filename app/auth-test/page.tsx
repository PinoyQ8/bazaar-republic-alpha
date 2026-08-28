"use client";

import { useState } from "react";
import Script from "next/script";

// TypeScript global declaration for Pi SDK
declare global {
  interface Window {
    Pi: {
      init: (config: { version: string; sandbox?: boolean }) => void;
      authenticate: (
        scopes: string[],
        onIncompletePaymentFound: (payment: any) => void
      ) => Promise<{
        accessToken: string;
        user: {
          uid: string;
          username: string;
        };
      }>;
    };
  }
}

export default function AuthTestPage() {
  const [uid, setUid] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [sdkReady, setSdkReady] = useState(false);

  const onLogin = async () => {
    try {
      if (!window.Pi) {
        alert("Pi SDK is not loaded yet. Open inside Pi Browser.");
        return;
      }

      // Initialize SDK (set sandbox: false when inside real Pi Browser)
      window.Pi.init({ version: "2.0", sandbox: false });

      const scopes = ["payments", "username", "wallet_address"];
      const auth = await window.Pi.authenticate(scopes, onIncompletePaymentFound);

      setUid(auth.user.uid);
      setUsername(auth.user.username);
      console.log("Authenticated UID:", auth.user.uid);
    } catch (error: any) {
      console.error("Authentication failed:", error);
      alert(`Auth failed: ${error?.message || "Check console"}`);
    }
  };

  const onIncompletePaymentFound = (payment: any) => {
    console.log("Incomplete payment found during login:", payment);
  };

  const handleCopy = async () => {
    if (!uid) return;
    try {
      await navigator.clipboard.writeText(uid);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older webviews
      const textArea = document.createElement("textarea");
      textArea.value = uid;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-950 text-white p-6">
      <Script
        src="https://sdk.minepi.com/pi-sdk.js"
        strategy="afterInteractive"
        onLoad={() => setSdkReady(true)}
      />

      <div className="max-w-md w-full bg-gray-900 rounded-xl shadow-lg p-8 border border-gray-800">
        <h1 className="text-2xl font-bold mb-2 text-center text-blue-400">
          A2U UID Extractor
        </h1>
        <p className="text-xs text-gray-400 text-center mb-6">
          Mesh Protocol Testnet Node Inspector
        </p>

        <button
          onClick={onLogin}
          disabled={!sdkReady}
          className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-gray-800 disabled:text-gray-600 text-white font-bold py-3 px-4 rounded-lg transition-colors cursor-pointer"
        >
          {sdkReady ? "Authenticate with Pi" : "Loading SDK..."}
        </button>

        {uid && (
          <div className="mt-8 space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
                Pioneer Username
              </label>
              <div className="bg-gray-950 p-3 rounded-lg font-mono text-green-400 border border-gray-800">
                @{username}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
                App-Scoped UID
              </label>
              <div className="bg-gray-950 p-3 rounded-lg font-mono text-green-400 break-all border border-gray-800 select-all">
                {uid}
              </div>
            </div>

            <button
              onClick={handleCopy}
              className={`w-full mt-4 py-2.5 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${
                copied
                  ? "bg-green-600 text-white"
                  : "bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700"
              }`}
            >
              {copied ? "✓ Copied UID to Clipboard" : "Copy UID"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}