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

// 🛡️ THE GLOBAL INIT SHIELD: Prevents React from obliterating the Pi SDK iframe bridge
let isPiInitialized = false;

if (typeof window !== "undefined") {
  const isLocalhost = 
    window.location.hostname === "localhost" || 
    window.location.hostname === "127.0.0.1";

  // 🛡️ Inject window.Pi mock if running on localhost without Pi Browser SDK
  if (isLocalhost && !(window as any).Pi) {
    console.warn("🛡️ MESH NOTICE: Injecting Localhost Pi SDK Mock.");
    (window as any).Pi = {
      init: function(config: any) {
        console.log("[MESH] Mock Pi.init executed with config:", config);
      },
      authenticate: async function(scopes: string[], onIncompletePayment?: any): Promise<PiAuthResult> {
        console.warn("🛡️ MESH NOTICE: Bypassing Pi SDK postMessage bridge via local mock.");
        
        const mockUser = { username: "BazaarTech", uid: "local_x570_node" };
        const mockToken = "mock_pioneer_token_alpha_92";

        localStorage.setItem("MESH_PIONEER_SIGNATURE", "verified_mock_sig_alpha");
        localStorage.setItem("MESH_PROVIDER_STATUS", "VERIFIED_ACTIVE");
        localStorage.setItem("pioneer_session", "ACTIVE");
        localStorage.setItem("pi_auth_user", JSON.stringify({
          ...mockUser,
          accessToken: mockToken
        }));

        return {
          user: mockUser,
          accessToken: mockToken
        };
      }
    };
  }
}

export async function safePiAuthenticate(
  scopes: string[], 
  onIncompletePayment?: (payment: any) => void
): Promise<PiAuthResult> {
  const isLocalhost = 
    typeof window !== "undefined" && 
    (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");

  // 🛑 FIX: Removed "FORCE_SYNC" from bypass query so it doesn't break production cache clears
  const hasBypassQuery = 
    typeof window !== "undefined" && 
    window.location.search.includes("bypass=true");

  if (isLocalhost || hasBypassQuery) {
    if (hasBypassQuery) {
      console.warn("🛡️ MESH NOTICE: Force bypass query detected. Seeding mock Pioneer session.");
    }

    const mockUser = { username: "BazaarTech", uid: "local_x570_node" };
    const mockToken = "mock_pioneer_token_alpha_92";

    localStorage.setItem("MESH_PIONEER_SIGNATURE", "verified_mock_sig_alpha");
    localStorage.setItem("MESH_PROVIDER_STATUS", "VERIFIED_ACTIVE");
    localStorage.setItem("pioneer_session", "ACTIVE");
    localStorage.setItem("pi_auth_user", JSON.stringify({
      ...mockUser,
      accessToken: mockToken
    }));

    return {
      user: mockUser,
      accessToken: mockToken
    };
  }

  // 🚀 Live Pi Browser Execution (Vercel / Testnet)
  if (typeof window !== "undefined" && (window as any).Pi) {
    const Pi = (window as any).Pi;

    const initPromise = new Promise<PiAuthResult>(async (resolve, reject) => {
      try {
        // 🛡️ CRITICAL FIX: Only call Pi.init once per session
        if (!isPiInitialized) {
          Pi.init({ version: "2.0", sandbox: true });
          isPiInitialized = true;
        }

        const auth = await Pi.authenticate(scopes, onIncompletePayment);
        resolve(auth as PiAuthResult);
      } catch (err) {
        reject(err);
      }
    });

    // 5-second race timeout guard against mobile network latency
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Pi SDK Network Timeout on Mobile Node")), 5000)
    );

    return Promise.race([initPromise, timeoutPromise]);
  }

  throw new Error("Pi SDK not initialized in window scope.");
}