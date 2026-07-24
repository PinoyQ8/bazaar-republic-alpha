// app/utils/safePi.ts

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
      authenticate: async function(scopes: string[], onIncompletePayment?: any) {
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

export async function safePiAuthenticate(scopes: string[], onIncompletePayment?: (payment: any) => void) {
  const isLocalhost = 
    typeof window !== "undefined" && 
    (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");

  if (isLocalhost) {
    console.warn("🛡️ MESH NOTICE: Localhost environment detected. Seeding all MESH session keys.");
    
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

    // 🛡️ CRITICAL FIX: Ensure SDK initialization is executed first
    try {
      await Pi.init({ version: "2.0", sandbox: true });
    } catch (initErr) {
      console.warn("[MESH] Pi.init notice:", initErr);
    }

    return await Pi.authenticate(scopes, onIncompletePayment);
  }

  throw new Error("Pi SDK not initialized in window scope.");
}