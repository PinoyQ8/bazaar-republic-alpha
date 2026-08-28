// Location: lib/pi/a2u.ts

export interface A2UPaymentRequest {
  uid: string;
  amount: number;
  memo: string;
  metadata?: Record<string, any>;
  timeoutMs?: number;
}

export interface A2UPaymentResponse {
  success: boolean;
  payment?: any;
  error?: string;
  code?: string;
  details?: any;
  status?: number;
}

/**
 * Universal Pi Network App-to-User (A2U) Settlement Dispatcher
 */
export async function sendA2UPayment({
  uid,
  amount,
  memo,
  metadata = {},
  timeoutMs = 8000,
}: A2UPaymentRequest): Promise<A2UPaymentResponse> {
  const apiKey = process.env.PI_API_KEY;
  if (!apiKey) {
    return {
      success: false,
      error: "PI_API_KEY is not defined in server environment",
      code: "MISSING_API_KEY",
      status: 500,
    };
  }

  if (!uid || isNaN(amount) || amount <= 0) {
    return {
      success: false,
      error: "Invalid A2U payout parameters: UID and positive amount required",
      code: "INVALID_PARAMETERS",
      status: 400,
    };
  }

  const endpoint =
    process.env.NEXT_PUBLIC_PI_SANDBOX === "true"
      ? "https://api.testnet.minepi.com/v2/payments"
      : "https://api.minepi.com/v2/payments";

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Key ${apiKey}`,
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(timeoutMs),
      body: JSON.stringify({
        payment: {
          amount,
          memo,
          metadata: {
            appId: process.env.PI_APP_ID,
            ...metadata,
          },
          uid,
        },
      }),
    });

    const paymentData = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: paymentData.message || "Pi Platform API rejected payment",
        details: paymentData,
        status: response.status,
      };
    }

    return {
      success: true,
      payment: paymentData,
      status: 200,
    };
  } catch (error: any) {
    return {
      success: false,
      error: `Network failure contacting Pi Platform API: ${error.message}`,
      code: "PI_API_NETWORK_FAILURE",
      status: 502,
    };
  }
}