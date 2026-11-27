// Location: app/utils/webauthnSupport.ts
export interface WebAuthnEnvironmentStatus {
  supported: boolean;
  isEmbeddedFrame: boolean;
  reason?: string;
}

export function getWebAuthnEnvironmentStatus(): WebAuthnEnvironmentStatus {
  if (typeof window === "undefined") {
    return { supported: false, isEmbeddedFrame: false };
  }

  let isEmbeddedFrame = false;
  try {
    isEmbeddedFrame = window.self !== window.top;
  } catch {
    isEmbeddedFrame = true;
  }

  if (
    typeof window.PublicKeyCredential === "undefined" ||
    !navigator.credentials
  ) {
    return {
      supported: false,
      isEmbeddedFrame,
      reason: "WebAuthn is not available in this WebView.",
    };
  }

  const docWithPolicy = document as unknown as {
    permissionsPolicy?: { allowsFeature?: (feature: string) => boolean };
    featurePolicy?: { allowsFeature?: (feature: string) => boolean };
  };
  const policy = docWithPolicy.permissionsPolicy || docWithPolicy.featurePolicy;

  if (policy?.allowsFeature) {
    const canCreate = policy.allowsFeature("publickey-credentials-create");
    const canGet = policy.allowsFeature("publickey-credentials-get");
    if (!canCreate || !canGet) {
      return {
        supported: false,
        isEmbeddedFrame,
        reason: isEmbeddedFrame
          ? "Pi Developer Sandbox iframe blocks WebAuthn passkeys. Open your direct app URL in Pi Browser (top-level) to bind or unlock with biometrics."
          : "WebAuthn Permissions Policy is disabled in this document.",
      };
    }
  }

  if (isEmbeddedFrame) {
    return {
      supported: false,
      isEmbeddedFrame: true,
      reason:
        "Running inside Pi Developer Sandbox frame—biometric passkeys require opening your direct HTTPS app URL in Pi Browser.",
    };
  }

  return { supported: true, isEmbeddedFrame: false };
}