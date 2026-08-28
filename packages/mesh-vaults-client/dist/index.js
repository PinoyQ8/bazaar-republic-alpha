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
    1: { message: "NotInitialized" },
    2: { message: "AlreadyInitialized" },
    3: { message: "InvalidAmount" },
    4: { message: "InvalidLockDuration" },
    5: { message: "VaultStillLocked" },
    6: { message: "InsufficientVaultBalance" },
    7: { message: "Unauthorized" },
    8: { message: "ZeroAddress" }
};
export class Client extends ContractClient {
    options;
    static async deploy(
    /** Options for initializing a Client as well as for calling a method, with extras specific to deploying. */
    options) {
        return ContractClient.deploy(null, options);
    }
    constructor(options) {
        super(new ContractSpec(["AAAAAAAAABxSZWFkLW9ubHkgY29ubmVjdGl2aXR5IGNoZWNrAAAABHBpbmcAAAAAAAAAAQAAABE=",
            "AAAAAAAAAEVMb2NrIHRva2VucyBpbnRvIGEgdXNlci1pc29sYXRlZCB2YXVsdCBmb3IgYSBnaXZlbiBkdXJhdGlvbiAoc2Vjb25kcykAAAAAAAAHZGVwb3NpdAAAAAADAAAAAAAAAARmcm9tAAAAEwAAAAAAAAAGYW1vdW50AAAAAAALAAAAAAAAABFsb2NrX2R1cmF0aW9uX3NlYwAAAAAAAAYAAAABAAAD6QAAB9AAAAALVmF1bHRSZWNvcmQAAAAH0AAAAApWYXVsdEVycm9yAAA=",
            "AAAAAAAAADRXaXRoZHJhdyB1bmxvY2tlZCBwcmluY2lwYWwgYmFjayB0byB0aGUgdXNlciBhZGRyZXNzAAAACHdpdGhkcmF3AAAAAQAAAAAAAAACdG8AAAAAABMAAAABAAAD6QAAAAsAAAfQAAAAClZhdWx0RXJyb3IAAA==",
            "AAAAAAAAACBSZWFkLW9ubHk6IEdldCB1c2VyIHZhdWx0IHJlY29yZAAAAAlnZXRfdmF1bHQAAAAAAAABAAAAAAAAAAR1c2VyAAAAEwAAAAEAAAPoAAAH0AAAAAtWYXVsdFJlY29yZAA=",
            "AAAAAgAAAAAAAAAAAAAAB0RhdGFLZXkAAAAABAAAAAAAAAAAAAAABUFkbWluAAAAAAAAAAAAAAAAAAAMVG9rZW5BZGRyZXNzAAAAAAAAAAAAAAALVG90YWxMb2NrZWQAAAAAAQAAAAAAAAAJVXNlclZhdWx0AAAAAAAAAQAAABM=",
            "AAAAAAAAAENJbml0aWFsaXplIHRoZSBWYXVsdCBjb250cmFjdCB3aXRoIGFuIGFkbWluIGFuZCB0b2tlbiBhc3NldCBhZGRyZXNzAAAAAAppbml0aWFsaXplAAAAAAACAAAAAAAAAAVhZG1pbgAAAAAAABMAAAAAAAAADXRva2VuX2FkZHJlc3MAAAAAAAATAAAAAQAAA+kAAAPtAAAAAAAAB9AAAAAKVmF1bHRFcnJvcgAA",
            "AAAABAAAAAAAAAAAAAAAClZhdWx0RXJyb3IAAAAAAAgAAAAAAAAADk5vdEluaXRpYWxpemVkAAAAAAABAAAAAAAAABJBbHJlYWR5SW5pdGlhbGl6ZWQAAAAAAAIAAAAAAAAADUludmFsaWRBbW91bnQAAAAAAAADAAAAAAAAABNJbnZhbGlkTG9ja0R1cmF0aW9uAAAAAAQAAAAAAAAAEFZhdWx0U3RpbGxMb2NrZWQAAAAFAAAAAAAAABhJbnN1ZmZpY2llbnRWYXVsdEJhbGFuY2UAAAAGAAAAAAAAAAxVbmF1dGhvcml6ZWQAAAAHAAAAAAAAAAtaZXJvQWRkcmVzcwAAAAAI",
            "AAAAAQAAAAAAAAAAAAAAC1ZhdWx0UmVjb3JkAAAAAAUAAAAAAAAAB2NsYWltZWQAAAAAAQAAAAAAAAAMZGVwb3NpdGVkX2F0AAAABgAAAAAAAAARbG9ja19kdXJhdGlvbl9zZWMAAAAAAAAGAAAAAAAAAAlwcmluY2lwYWwAAAAAAAALAAAAAAAAABB1bmxvY2tfdGltZXN0YW1wAAAABg==",
            "AAAAAAAAACNSZWFkLW9ubHk6IFRvdGFsIGxvY2tlZCBpbiBjb250cmFjdAAAAAAQZ2V0X3RvdGFsX2xvY2tlZAAAAAAAAAABAAAACw==",
            "AAAAAAAAAB5SZWFkLW9ubHk6IFRva2VuIGFzc2V0IGFkZHJlc3MAAAAAABFnZXRfdG9rZW5fYWRkcmVzcwAAAAAAAAAAAAABAAAD6AAAABM="]), options);
        this.options = options;
    }
    fromJSON = {
        ping: (this.txFromJSON),
        deposit: (this.txFromJSON),
        withdraw: (this.txFromJSON),
        get_vault: (this.txFromJSON),
        initialize: (this.txFromJSON),
        get_total_locked: (this.txFromJSON),
        get_token_address: (this.txFromJSON)
    };
}
