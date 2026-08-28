'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldAlert, Loader2 } from 'lucide-react';

export default function SignInCallback() {
  const router = useRouter();
  const [status, setStatus] = useState('Intercepting OAuth payload...');
  const [error, setError] = useState<string | null>(null);
  const isProcessing = useRef(false);

  useEffect(() => {
    if (isProcessing.current) return;

    const processOAuth = async () => {
      isProcessing.current = true;
      try {
        // 1. Extract URL fragment parameters
        const hash = window.location.hash.substring(1);
        if (!hash) throw new Error('Missing OAuth token payload in URL fragment');

        const params = new URLSearchParams(hash);
        const accessToken = params.get('access_token');
        const returnedState = params.get('state');
        const oauthError = params.get('error');

        if (oauthError) throw new Error(`Authorization rejected: ${oauthError}`);

        // 2. Validate CSRF state
        const savedState = sessionStorage.getItem('pi_oauth_state');
        sessionStorage.removeItem('pi_oauth_state');

        if (!savedState || returnedState !== savedState) {
          throw new Error('CSRF state token validation mismatch');
        }

        if (!accessToken) throw new Error('No access token returned');

        setStatus('Verifying session with Pi Network...');

        // 3. Verify access token with server backend
        const res = await fetch('/api/auth/pi-verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ accessToken }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || data.message || 'Server validation failed');
        }

        // 4. Commit session, access token, and clearance state
        localStorage.setItem('pi_access_token', accessToken);
        localStorage.setItem('mesh_session_active', 'true');
        localStorage.setItem('mesh_pioneer_id', data.username);
        localStorage.setItem('mesh_pioneer_uid', data.uid);
        localStorage.setItem('mesh_genesis_cleared', String(Boolean(data.genesisCompleted)));
        localStorage.setItem('mesh_master_ts', Date.now().toString());

        // Scrub token from browser history
        window.history.replaceState(null, '', window.location.pathname);

        setStatus('Handshake complete. Redirecting...');
        setTimeout(() => router.push('/dashboard'), 800);
      } catch (err: any) {
        console.error('[OAUTH_CALLBACK_ERROR]', err);
        setError(err.message || 'OAuth authentication failed');
      }
    };

    processOAuth();
  }, [router]);

  if (error) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100 font-mono flex items-center justify-center p-4">
        <div className="max-w-sm w-full bg-slate-900 border border-red-900/50 p-6 rounded-xl text-center space-y-4">
          <ShieldAlert className="w-10 h-10 text-red-500 mx-auto animate-pulse" />
          <h2 className="text-sm font-bold text-red-400 uppercase">Authentication Denied</h2>
          <p className="text-xs text-slate-400">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-xs rounded uppercase font-bold transition-colors"
          >
            Return to Entrance
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 font-mono flex items-center justify-center p-4">
      <div className="max-w-sm w-full bg-slate-900 border border-slate-800 p-6 rounded-xl text-center space-y-4">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin mx-auto" />
        <h2 className="text-xs font-bold text-emerald-400 uppercase tracking-widest">{status}</h2>
      </div>
    </main>
  );
}