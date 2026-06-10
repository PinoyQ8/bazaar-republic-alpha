export {};

/**
 * 🛡️ MESH DEFINITIONS: Pi Network SDK Type Registry
 * Standardizing the SDK interface to prevent type-drift and runtime collisions.
 */

export interface PiUser {
  uid: string;
  username: string;
}

export interface PiAuthResult {
  user: PiUser;
  accessToken: string;
}

// 🛡️ ADJUDICATOR ALIGNMENT: Relaxed strict properties to match official SDK payloads
export interface PiPayment {
  amount: number;
  memo: string;
  metadata: Record<string, any>;
  uid?: string;
  identifier?: string; // Optional fallback for internal Node tracking
}

// 🛡️ ADJUDICATOR ALIGNMENT: Synced exactly to the native Pi Browser callbacks
export interface PiPaymentCallbacks {
  onReadyForServerApproval: (paymentId: string) => void;
  onReadyForServerCompletion: (paymentId: string, txid: string) => void;
  onCancel: (paymentId: string) => void;
  onError: (error: Error, payment?: any) => void;
}

export interface PiSDK {
  /**
   * Initializes the Pi SDK with the specified configuration.
   */
  init: (options: { version: string; sandbox?: boolean }) => Promise<void>;

  /**
   * Triggers the Pi Browser authentication handshake.
   */
  authenticate: (
    scopes: string[],
    onIncompletePaymentFound?: (payment: any) => void
  ) => Promise<PiAuthResult>;

  /**
   * Requests a payment transaction from the Pi Blockchain.
   */
  createPayment: (
    paymentData: PiPayment,
    callbacks: PiPaymentCallbacks
  ) => void;
}

declare global {
  interface Window {
    Pi: PiSDK;
  }
}