// Location: app/actions/paymentActions.ts
"use server";

export type PaymentResult = {
  success: boolean;
  payment?: any;
  error?: string;
  details?: any;
};

// Purged 'metadata: any' to prevent silent Next.js serialization crashes
export async function approvePayment(paymentId: string): Promise<PaymentResult> {
  console.log(`\n[MESH-SCAN] 🚨 U2A Approval Triggered for PaymentID: ${paymentId}`);
  
  try {
    const apiKey = process.env.PI_API_KEY;
    if (!apiKey) {
      console.error('[MESH-SCAN] ❌ FATAL: PI_API_KEY missing.');
      return { success: false, error: 'Vault Key missing' };
    }

    console.log(`[MESH-SCAN] 🟢 Vault Key loaded. Dispatching to api.minepi.com...`);

    const piResponse = await fetch(`https://api.minepi.com/v2/payments/${paymentId}/approve`, {
      method: 'POST',
      headers: {
        'Authorization': `Key ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!piResponse.ok) {
      const errorText = await piResponse.text();
      console.error(`[MESH-SCAN] ❌ Pi Platform Rejected Approval:`, piResponse.status, errorText);
      return { success: false, error: 'Approval rejected by Pi Platform', details: errorText };
    }

    const paymentData = await piResponse.json();
    console.log(`[MESH-SCAN] 🛡️ Approval Successful! Escrow locked.`);
    return { success: true, payment: paymentData };

  } catch (error: any) {
    console.error('[MESH-SCAN] ❌ FATAL SERVER EXCEPTION:', error);
    return { success: false, error: error?.message || 'Unhandled approval fracture' };
  }
}

export async function completePayment(paymentId: string, txid: string): Promise<PaymentResult> {
  // Your existing completePayment logic remains the same.
  // ...
  try {
    const apiKey = process.env.PI_API_KEY;
    if (!apiKey) {
      return { success: false, error: 'Vault Key missing' };
    }

    const piResponse = await fetch(`https://api.minepi.com/v2/payments/${paymentId}/complete`, {
      method: 'POST',
      headers: {
        'Authorization': `Key ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ txid }),
    });

    if (!piResponse.ok) {
      return { success: false, error: 'Completion rejected by Pi Platform' };
    }

    const paymentData = await piResponse.json();
    
    // Prisma Audit Log can be hard-coded here later
    
    return { success: true, payment: paymentData };

  } catch (error: any) {
    console.error('[MESH U2A COMPLETE ERROR]', error);
    return { success: false, error: error?.message || 'Unhandled completion fracture' };
  }
}