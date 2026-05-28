import { connectToDatabase } from "@/lib/db";
import AuditLog from "@/models/AuditLog";

/**
 * 🛡️ MESH-LOGGER: Immutable Event Injection
 * Records system events into the AuditLog for post-mortem analysis.
 */
export async function logEvent(
  pioneerId: string, 
  event: string, 
  status: 'INFO' | 'WARN' | 'ERROR', 
  metadata: object
) {
  try {
    await connectToDatabase();
    
    await AuditLog.create({ 
      pioneerId, 
      event, 
      status, 
      metadata,
      timestamp: new Date()
    });
    
    console.log(`[AUDIT-COMMIT] ${status}: ${event} for ${pioneerId}`);
  } catch (err) {
    // 🛑 FAIL-SAFE: If the logger fails, we log to the console 
    // to prevent cascading failures in the API route.
    console.error("[CRITICAL-FAIL] Could not commit to AuditLog:", err);
  }
}