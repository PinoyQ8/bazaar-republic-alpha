// types/pi.d.ts
export interface PiUser {
  uid: string;
  username: string;
  roles?: string[];
  wallet_address?: string;
}

export interface PiAuthResult {
  accessToken: string;
  user: PiUser;
}

export interface PiPaymentCallbacks {
  onReadyForServerApproval: (paymentId: string) => void | Promise<void>;
  onReadyForServerCompletion: (paymentId: string, txid: string) => void | Promise<void>;
  onCancel: (paymentId: string) => void | Promise<void>;
  onError: (error: Error, payment?: any) => void | Promise<void>;
}

export interface PiPaymentData {
  amount: number;
  memo: string;
  metadata: Record<string, any>;
}

export interface PiSDK {
  init: (config: { version: string; sandbox?: boolean }) => void;
  authenticate: (
    scopes: string[],
    onIncompletePaymentFound?: (payment: any) => void
  ) => Promise<PiAuthResult>;
  createPayment: (
    paymentData: PiPaymentData,
    callbacks: PiPaymentCallbacks
  ) => Promise<any>;
  openShareDialog?: (title: string, message: string) => void;
}

declare global {
  interface Window {
    Pi?: PiSDK;
  }
}

export {};