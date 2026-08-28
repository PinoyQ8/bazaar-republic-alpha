import { Buffer } from "buffer";
import { Client as ContractClient, Spec as ContractSpec, } from "@stellar/stellar-sdk/contract";
export * from "@stellar/stellar-sdk";
export * as contract from "@stellar/stellar-sdk/contract";
export * as rpc from "@stellar/stellar-sdk/rpc";
if (typeof window !== "undefined") {
    //@ts-ignore Buffer exists
    window.Buffer = window.Buffer || Buffer;
}
export const VaultError = {
    1: { message: "NotFound" },
    2: { message: "Unauthorized" },
    3: { message: "InvalidState" },
    4: { message: "TimelockActive" },
    5: { message: "InvalidAmount" },
    6: { message: "Expired" }
};
export class Client extends ContractClient {
    options;
    static async deploy(
    /** Options for initializing a Client as well as for calling a method, with extras specific to deploying. */
    options) {
        return ContractClient.deploy(null, options);
    }
    constructor(options) {
        super(new ContractSpec(["AAAAAAAAAAAAAAAJZ2V0X3ZhdWx0AAAAAAAAAQAAAAAAAAAJZXNjcm93X2lkAAAAAAAAEQAAAAEAAAfQAAAAEVZhdWx0RXNjcm93UmVjb3JkAAAA",
            "AAAAAAAAAAAAAAAKaW5pdF9hZG1pbgAAAAAAAQAAAAAAAAAFYWRtaW4AAAAAAAATAAAAAA==",
            "AAAAAAAAAAAAAAAKbG9ja19mdW5kcwAAAAAABgAAAAAAAAAJZXNjcm93X2lkAAAAAAAAEQAAAAAAAAAOdG9rZW5fY29udHJhY3QAAAAAABMAAAAAAAAACGNvbnN1bWVyAAAAEwAAAAAAAAAIcHJvdmlkZXIAAAATAAAAAAAAAAZhbW91bnQAAAAAAAsAAAAAAAAADWR1cmF0aW9uX3NlY3MAAAAAAAAGAAAAAQAAB9AAAAARVmF1bHRFc2Nyb3dSZWNvcmQAAAA=",
            "AAAAAAAAAAAAAAAMcmVmdW5kX2Z1bmRzAAAAAgAAAAAAAAAJZXNjcm93X2lkAAAAAAAAEQAAAAAAAAAJaW5pdGlhdG9yAAAAAAAAEwAAAAEAAAfQAAAAEVZhdWx0RXNjcm93UmVjb3JkAAAA",
            "AAAABAAAAAAAAAAAAAAAClZhdWx0RXJyb3IAAAAAAAYAAAAAAAAACE5vdEZvdW5kAAAAAQAAAAAAAAAMVW5hdXRob3JpemVkAAAAAgAAAAAAAAAMSW52YWxpZFN0YXRlAAAAAwAAAAAAAAAOVGltZWxvY2tBY3RpdmUAAAAAAAQAAAAAAAAADUludmFsaWRBbW91bnQAAAAAAAAFAAAAAAAAAAdFeHBpcmVkAAAAAAY=",
            "AAAAAAAAAAAAAAANcmVsZWFzZV9mdW5kcwAAAAAAAAIAAAAAAAAACWVzY3Jvd19pZAAAAAAAABEAAAAAAAAACGNvbnN1bWVyAAAAEwAAAAEAAAfQAAAAEVZhdWx0RXNjcm93UmVjb3JkAAAA",
            "AAAAAAAAAAAAAAAOZGlzcHV0ZV9lc2Nyb3cAAAAAAAIAAAAAAAAACWVzY3Jvd19pZAAAAAAAABEAAAAAAAAABmNhbGxlcgAAAAAAEwAAAAEAAAfQAAAAEVZhdWx0RXNjcm93UmVjb3JkAAAA",
            "AAAAAgAAAAAAAAAAAAAADEVzY3Jvd1N0YXR1cwAAAAQAAAAAAAAAAAAAAAZMb2NrZWQAAAAAAAAAAAAAAAAACFJlbGVhc2VkAAAAAAAAAAAAAAAIRGlzcHV0ZWQAAAAAAAAAAAAAAAhSZWZ1bmRlZA==",
            "AAAAAAAAAAAAAAAPcmVzb2x2ZV9kaXNwdXRlAAAAAAMAAAAAAAAACWVzY3Jvd19pZAAAAAAAABEAAAAAAAAABWFkbWluAAAAAAAAEwAAAAAAAAAJcGF5b3V0X3RvAAAAAAAAEwAAAAEAAAfQAAAAEVZhdWx0RXNjcm93UmVjb3JkAAAA",
            "AAAAAQAAAAAAAAAAAAAAEVZhdWx0RXNjcm93UmVjb3JkAAAAAAAABwAAAAAAAAAGYW1vdW50AAAAAAALAAAAAAAAAAhjb25zdW1lcgAAABMAAAAAAAAACmV4cGlyZXNfYXQAAAAAAAYAAAAAAAAAEHByb3RvY29sX3ZlcnNpb24AAAAEAAAAAAAAAAhwcm92aWRlcgAAABMAAAAAAAAABnN0YXR1cwAAAAAH0AAAAAxFc2Nyb3dTdGF0dXMAAAAAAAAADnRva2VuX2NvbnRyYWN0AAAAAAAT"]), options);
        this.options = options;
    }
    fromJSON = {
        get_vault: (this.txFromJSON),
        init_admin: (this.txFromJSON),
        lock_funds: (this.txFromJSON),
        refund_funds: (this.txFromJSON),
        release_funds: (this.txFromJSON),
        dispute_escrow: (this.txFromJSON),
        resolve_dispute: (this.txFromJSON)
    };
}
