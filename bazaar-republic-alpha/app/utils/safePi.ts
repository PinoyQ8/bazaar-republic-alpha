// app/utils/safePi.ts

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
      authenticate: async function(scopes: string[], onIncompletePayment?: any) {
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

  // 🚀 Live Pi Browser Execution with Mobile Data Safeguard
  if (typeof window !== "undefined" && (window as any).Pi) {
    const Pi = (window as any).Pi;

    // Wrap initialization with a 5-second race timeout for mobile data stability
    const initPromise = new Promise(async (resolve, reject) => {
      try {
        await Pi.init({ version: "2.0", sandbox: true });
        const auth = await Pi.authenticate(scopes, onIncompletePayment);
        resolve(auth);
      } catch (err) {
        reject(err);
      }
    });

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Pi SDK Network Timeout on Mobile Node")), 5000)
    );

    return Promise.race([initPromise, timeoutPromise]);
  }

  throw new Error("Pi SDK not initialized in window scope.");
}