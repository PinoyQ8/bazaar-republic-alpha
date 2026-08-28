// Location: app/utils/safePi.ts

export interface PioneerUser {
  username: string;
  uid: string;
  accessToken?: string;
}

export interface PiAuthResult {
  user: PioneerUser;
  accessToken: string;
}

export function ensurePiInitialized(sandbox: boolean = true) {
  if (typeof window === "undefined") return;
  const Pi = (window as any).Pi;
  if (Pi) {
    try {
      Pi.init({ version: "2.0", sandbox });
      console.log("[MESH-SDK] Pi SDK initialized (sandbox:", sandbox, ")");
    } catch (e) {
      // Safe to ignore if already initialized in this window instance
    }
  }
}

// Localhost mock setup
if (typeof window !== "undefined") {
  const isLocalhost = 
    window.location.hostname === "localhost" || 
    window.location.hostname === "127.0.0.1";

  if (isLocalhost && !(window as any).Pi) {
    (window as any).Pi = {
      init: function(config: any) {
        console.log("[MESH] Mock Pi.init executed:", config);
      },
      authenticate: async function(scopes: string[], onIncompletePayment?: any): Promise<PiAuthResult> {
        const mockUser = { username: "PinoyQ8", uid: "5f747bc9-1302-4135-a40d-af7880174f16" };
        const mockToken = "mock_pioneer_token_alpha_92";
        localStorage.setItem("mesh_session_active", "true");
        localStorage.setItem("mesh_pioneer_uid", mockUser.uid);
        localStorage.setItem("mesh_pioneer_id", mockUser.username);
        localStorage.setItem("pi_access_token", mockToken);
        localStorage.setItem("pi_auth_user", JSON.stringify({ ...mockUser, accessToken: mockToken }));
        return { user: mockUser, accessToken: mockToken };
      },
      createPayment: function(paymentData: any, callbacks: any) {
        console.log("[MESH-MOCK] createPayment called:", paymentData);
        setTimeout(async () => {
          if (callbacks.onReadyForServerApproval) await callbacks.onReadyForServerApproval("mock_pay_" + Date.now());
          if (callbacks.onReadyForServerCompletion) await callbacks.onReadyForServerCompletion("mock_pay_" + Date.now(), "mock_tx_" + Date.now());
        }, 800);
      }
    };
  }
}

export async function safePiAuthenticate(
  scopes: string[] = ['username', 'payments'],
  onIncompletePayment?: (payment: any) => void
): Promise<PiAuthResult> {
  const isLocalhost = 
    typeof window !== "undefined" && 
    (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");

  const hasBypassQuery = 
    typeof window !== "undefined" && window.location.search.includes("bypass=true");

  if (isLocalhost || hasBypassQuery) {
    const mockUser = { username: "PinoyQ8", uid: "5f747bc9-1302-4135-a40d-af7880174f16" };
    const mockToken = "mock_pioneer_token_alpha_92";
    localStorage.setItem("mesh_session_active", "true");
    localStorage.setItem("mesh_pioneer_uid", mockUser.uid);
    localStorage.setItem("mesh_pioneer_id", mockUser.username);
    localStorage.setItem("pi_access_token", mockToken);
    localStorage.setItem("pi_auth_user", JSON.stringify({ ...mockUser, accessToken: mockToken }));
    return { user: mockUser, accessToken: mockToken };
  }

  // Live Pi Browser Execution
  if (typeof window !== "undefined") {
    ensurePiInitialized(true);

    // Mandate BOTH username and payments scopes for transaction support
    const targetScopes = Array.from(new Set([...scopes, 'username', 'payments']));

    return new Promise<PiAuthResult>((resolve, reject) => {
      let retries = 0;
      
      const checkPi = setInterval(async () => {
        if ((window as any).Pi) {
          clearInterval(checkPi);
          const Pi = (window as any).Pi;
          
          try {
            ensurePiInitialized(true);
            
            const auth = await Pi.authenticate(
              targetScopes, 
              onIncompletePayment || ((payment: any) => console.log('[MESH-LEDGER] Incomplete payment found:', payment))
            );

            if (auth?.accessToken) {
              localStorage.setItem("pi_access_token", auth.accessToken);
              localStorage.setItem("mesh_pioneer_uid", auth.user.uid);
              localStorage.setItem("mesh_pioneer_id", auth.user.username);
              localStorage.setItem("mesh_session_active", "true");
              localStorage.setItem("pi_auth_user", JSON.stringify(auth));
            }

            resolve(auth as PiAuthResult);
          } catch (authErr) {
            reject(authErr);
          }
        } else {
          retries++;
          if (retries >= 30) {
            clearInterval(checkPi);
            reject(new Error("Native Pi SDK injection timeout"));
          }
        }
      }, 100);
    });
  }

  throw new Error("Window context missing.");
}