// app/utils/safePi.ts

if (typeof window !== "undefined") {
  const isLocalhost = 
    window.location.hostname === "localhost" || 
    window.location.hostname === "127.0.0.1";

  if (isLocalhost && !(window as any).Pi) {
    console.warn("🛡️ MESH NOTICE: Injecting Localhost Pi SDK Mock.");
    (window as any).Pi = {
      init: function(config: any) {
        console.log("Mock Pi.init executed with config:", config);
      },
      authenticate: async function(scopes: string[], onIncompletePayment?: any) {
        console.warn("🛡️ MESH NOTICE: Bypassing Pi SDK postMessage bridge via local mock.");
        
        localStorage.setItem("MESH_PIONEER_SIGNATURE", "verified_mock_sig_alpha");
        localStorage.setItem("MESH_PROVIDER_STATUS", "VERIFIED_ACTIVE");
        localStorage.setItem("pi_auth_user", JSON.stringify({
          username: "BazaarTech",
          uid: "local_x570_node",
          accessToken: "mock_pioneer_token_alpha_92"
        }));

        return {
          user: { username: "BazaarTech", uid: "local_x570_node" },
          accessToken: "mock_pioneer_token_alpha_92"
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
    
    // Seed all keys required by PioneerAuthGate and downstream security checks
    localStorage.setItem("MESH_PIONEER_SIGNATURE", "verified_mock_sig_alpha");
    localStorage.setItem("MESH_PROVIDER_STATUS", "VERIFIED_ACTIVE");
    localStorage.setItem("pioneer_session", "ACTIVE");
    localStorage.setItem("pi_auth_user", JSON.stringify({
      username: "BazaarTech",
      uid: "local_x570_node",
      accessToken: "mock_pioneer_token_alpha_92"
    }));

    return {
      user: { username: "BazaarTech", uid: "local_x570_node" },
      accessToken: "mock_pioneer_token_alpha_92"
    };
  }

  // Production Execution for Vercel / Live Pi Browser
  if (typeof window !== "undefined" && (window as any).Pi) {
    return await (window as any).Pi.authenticate(scopes, onIncompletePayment);
  }

  throw new Error("Pi SDK not initialized.");
}