import React, { useState } from "react";

interface PiShareButtonProps {
  /**
   * The relative path or object URL of the file to share.
   * Can be a local blob, private cache file, or dynamic ZK proof.
   */
  filePath?: string;
  /**
   * The customized filename that will display in the native OS share sheet.
   */
  filename?: string;
  /**
   * The official MIME type of the file.
   */
  mimeType?: string;
  /**
   * The display text for the interactive viewport button.
   */
  buttonText?: string;
}

/**
 * PiShareButton (v1.0.0)
 * 
 * A Next.js/React component designed to interact with the newly released
 * Pi Core Team (PCT) Native File & Video Sharing API (`Pi.shareFile`).
 * Fallbacks cleanly when rendered outside the Pi Browser or during SSR.
 */
export const PiShareButton: React.FC<PiShareButtonProps> = ({
  filePath = "/cache/disputes/ESC-TEST-8131-proof.pdf",
  filename = "Bazaar-Dispute-Proof-ESC-8131.pdf",
  mimeType = "application/pdf",
  buttonText = "Share Dispute Evidence"
}) => {
  const [status, setStatus] = useState<"idle" | "sharing" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleShareFile = async () => {
    // 1. Guard against SSR environment executions
    if (typeof window === "undefined") return;

    setStatus("sharing");
    setErrorMessage(null);

    try {
      const piSDK = (window as any).Pi;

      // 2. Verify Pi SDK bootstrap exists
      if (!piSDK) {
        throw new Error(
          "Pi SDK not detected. Please load this viewport inside the Pi Browser " +
          "or check your window.Pi binding configuration."
        );
      }

      // 3. Verify the new shareFile method is supported by the client browser instance
      if (typeof piSDK.shareFile !== "function") {
        throw new Error(
          "The 'Pi.shareFile' method is not supported in this Pi Browser container. " +
          "Please update your mobile application to verify the newest PCT API features."
        );
      }

      console.log(`[Bazaar-PiShare] Invoking native sharing for: ${filename} (${mimeType})`);

      // 4. Fire the native OS sharing sheet (launches Android Intent / iOS sharing tray)
      await piSDK.shareFile({
        path: filePath,
        name: filename,
        mimeType: mimeType,
      });

      setStatus("success");
      console.log("[Bazaar-PiShare] Native sharing sheet executed successfully.");
    } catch (error: any) {
      console.error("[Bazaar-PiShare] Error executing native shareFile:", error);
      setStatus("error");
      setErrorMessage(error.message || "An unexpected transaction sharing error occurred.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 border border-dashed border-slate-700 rounded-xl bg-slate-950/40 backdrop-blur-sm max-w-sm mx-auto">
      <div className="mb-4 text-center">
        <h4 className="text-sm font-semibold text-slate-200">
          PCT Native Sharing Bridge
        </h4>
        <p className="text-xs text-slate-500 mt-1">
          {filename}
        </p>
      </div>

      <button
        onClick={handleShareFile}
        disabled={status === "sharing"}
        className={`w-full py-2.5 px-4 rounded-lg font-semibold text-xs tracking-wider uppercase transition-all duration-200 shadow-lg ${
          status === "sharing"
            ? "bg-amber-600/40 text-slate-400 cursor-not-allowed border border-amber-500/20"
            : "bg-amber-500 hover:bg-amber-600 text-slate-950 hover:shadow-amber-500/10 active:scale-[0.98]"
        }`}
      >
        {status === "sharing" ? "Opening Native Share..." : buttonText}
      </button>

      {/* Live State Telemetry Markers */}
      {status === "success" && (
        <div className="mt-3 flex items-center space-x-1.5 text-green-400 text-xs animate-fade-in">
          <span>✓</span>
          <span>Share sheet triggered successfully!</span>
        </div>
      )}

      {status === "error" && (
        <div className="mt-3 text-red-400 text-xs text-center leading-relaxed animate-fade-in max-w-70">
          <span className="font-semibold block mb-0.5">⚠️ Bridge Failed</span>
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
};
