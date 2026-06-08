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

export interface PiPayment {
  identifier: string;
  amount: number;
  memo: string;
  metadata: Record<string, any>;
}

export interface PiPaymentCallbacks {
  onReadyForServerApproval: (paymentId: string) => void;
  onReadyForServerConfirmation: (paymentId: string) => void;
  onCancelled: (paymentId: string) => void;
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