// 🛡️ MESH-OVERRIDE: Inert stub to prevent build-time evaluation.
// This prevents the MONGODB_URI check from executing during build.

export const connectToLedger = async () => {
    console.log("🚀 [MESH-SYNC] Ledger connection bypassed for Drizzle migration.");
    return null;
};

export const clientPromise = Promise.resolve(null);