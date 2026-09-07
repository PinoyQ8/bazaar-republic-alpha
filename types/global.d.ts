// types/global.d.ts
export {};

export interface PiUser {
  uid: string;
  username: string;
  wallet_address?: string;
  roles?: string[];
}

export interface PiAuthResult {
  user: PiUser;
  accessToken: string;
}

export interface PiPayment {
  amount: number;
  memo: string;
  metadata: Record<string, any>;
  uid?: string;
  identifier?: string;
}

export interface PiPaymentCallbacks {
  onReadyForServerApproval: (paymentId: string) => void | Promise<void>;
  onReadyForServerCompletion: (paymentId: string, txid: string) => void | Promise<void>;
  onCancel: (paymentId: string) => void | Promise<void>;
  onError: (error: Error, payment?: any) => void | Promise<void>;
}

export interface PiSDK {
  init: (options: { version: string; sandbox?: boolean }) => Promise<void> | void;
  authenticate: (
    scopes: string[],
    onIncompletePaymentFound?: (payment: any) => void
  ) => Promise<PiAuthResult>;
  createPayment: (
    paymentData: PiPayment,
    callbacks: PiPaymentCallbacks
  ) => void;
  openShareDialog?: (title: string, message: string) => void;
  nativeFeaturesList?: () => Promise<string[]>;
}

declare global {
  interface Window {
    Pi?: PiSDK;
  }
}