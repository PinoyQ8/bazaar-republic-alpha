export {};

declare global {
  interface Window {
    Pi: {
      init: (options: { version: string; sandbox?: boolean }) => Promise<any>;
      authenticate: (
        scopes: string[],
        onIncompletePaymentFound?: (payment: any) => void
      ) => Promise<any>;
      createPayment: (
        paymentData: any,
        callbacks: {
          onReadyForServerApproval: (paymentId: string) => void;
          onReadyForServerConfirmation: (paymentId: string) => void;
          onCancelled: (paymentId: string) => void;
          onError: (error: Error, payment?: any) => void;
        }
      ) => void;
    };
  }
}