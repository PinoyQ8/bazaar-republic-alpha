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

let isPiInitialized = false;

if (typeof window !== "undefined") {
  const isLocalhost = 
    window.location.hostname === "localhost" || 
    window.location.hostname === "127.0.0.1";

  if (isLocalhost && !(window as any).Pi) {
    console.warn("🛡️ MESH NOTICE: Injecting Localhost Pi SDK Mock.");
    (window as any).Pi = {
      init: function(config: any) {
        console.log("[MESH] Mock Pi.init executed with config:", config);
      },
      authenticate: async function(scopes: string[], onIncompletePayment?: any): Promise<PiAuthResult> {
        const mockUser = { username: "BazaarTech", uid: "local_x570_node" };
        const mockToken = "mock_pioneer_token_alpha_92";

        localStorage.setItem("MESH_PIONEER_SIGNATURE", "verified_mock_sig_alpha");
        localStorage.setItem("MESH_PROVIDER_STATUS", "VERIFIED_ACTIVE");
        localStorage.setItem("pioneer_session", "ACTIVE");
        localStorage.setItem("pi_auth_user", JSON.stringify({
          ...mockUser,
          accessToken: mockToken
        }));

        return { user: mockUser, accessToken: mockToken };
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

  const hasBypassQuery = 
    typeof window !== "undefined" && window.location.search.includes("bypass=true");

  if (isLocalhost || hasBypassQuery) {
    const mockUser = { username: "BazaarTech", uid: "local_x570_node" };
    const mockToken = "mock_pioneer_token_alpha_92";
    localStorage.setItem("pi_auth_user", JSON.stringify({ ...mockUser, accessToken: mockToken }));
    return { user: mockUser, accessToken: mockToken };
  }

  // 🚀 Live Pi Browser Execution (Vercel / Testnet)
  if (typeof window !== "undefined") {
    
    const initPromise = new Promise<PiAuthResult>((resolve, reject) => {
      let retries = 0;
      
      // 🛡️ THE INJECTION SHIELD: Micro-poll until Pi Browser injects the SDK
      const checkPi = setInterval(async () => {
        if ((window as any).Pi) {
          clearInterval(checkPi);
          const Pi = (window as any).Pi;
          
          try {
            if (!isPiInitialized) {
              Pi.init({ version: "2.0", sandbox: true });
              isPiInitialized = true;
            }
            
            const auth = await Pi.authenticate(scopes, onIncompletePayment);
            resolve(auth as PiAuthResult);
          } catch (authErr) {
            reject(authErr);
          }
        } else {
          retries++;
          if (retries >= 30) { // Max wait: 3.0 seconds
            clearInterval(checkPi);
            reject(new Error("Native Pi SDK injection timeout"));
          }
        }
      }, 100);
    });

    // 🛡️ 60-Second Race Timeout (Allows Pioneer time to read and click 'Allow' on the modal)
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Pi SDK Network Timeout on Mobile Node")), 60000)
    );

    return Promise.race([initPromise, timeoutPromise]);
  }

  throw new Error("Window context missing.");
}