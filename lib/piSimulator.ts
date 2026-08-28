// 🛡️ MESH-BRIDGE: Pi SDK Simulator
export const initPiSimulator = () => {
  if (typeof window !== "undefined" && !window.Pi) {
    console.warn("[MESH-SIMULATOR] Injecting Mock SDK...");
    (window as any).Pi = {
      authenticate: async (scopes: string[], onReady: () => void) => {
        console.log("[MESH-SIMULATOR] Auth initiated. Mocking success.");
        return { user: { uid: "SIMULATED_PIONEER_001" } };
      },
      openTransferDialog: (payment: any, callbacks: any) => {
        console.log("[MESH-SIMULATOR] Transfer dialog intercepted.", payment);
        callbacks.onReady && callbacks.onReady();
      }
    };
  }
};