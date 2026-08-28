import { Buffer } from "buffer";
import { Client as ContractClient, Spec as ContractSpec, } from "@stellar/stellar-sdk/contract";
export * from "@stellar/stellar-sdk";
export * as contract from "@stellar/stellar-sdk/contract";
export * as rpc from "@stellar/stellar-sdk/rpc";
if (typeof window !== "undefined") {
    //@ts-ignore Buffer exists
    window.Buffer = window.Buffer || Buffer;
}
export const UnbondingError = {
    1: { message: "NotInitialized" },
    2: { message: "AlreadyInitialized" },
    3: { message: "InvalidAmount" },
    4: { message: "InvalidCooldown" },
    5: { message: "NoMaturedRequests" },
    6: { message: "RequestNotFound" },
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
        super(new ContractSpec(["AAAAAgAAAAAAAAAAAAAAB0RhdGFLZXkAAAAABgAAAAAAAAAAAAAABUFkbWluAAAAAAAAAAAAAAAAAAAMVG9rZW5BZGRyZXNzAAAAAAAAAAAAAAANVmF1bHRDb250cmFjdAAAAAAAAAAAAAAAAAAADU5leHRSZXF1ZXN0SWQAAAAAAAAAAAAAAAAAAA5Ub3RhbFVuYm9uZGluZwAAAAAAAQAAAAAAAAAJVXNlclF1ZXVlAAAAAAAAAQAAABM=",
            "AAAABAAAAAAAAAAAAAAADlVuYm9uZGluZ0Vycm9yAAAAAAAIAAAAAAAAAA5Ob3RJbml0aWFsaXplZAAAAAAAAQAAAAAAAAASQWxyZWFkeUluaXRpYWxpemVkAAAAAAACAAAAAAAAAA1JbnZhbGlkQW1vdW50AAAAAAAAAwAAAAAAAAAPSW52YWxpZENvb2xkb3duAAAAAAQAAAAAAAAAEU5vTWF0dXJlZFJlcXVlc3RzAAAAAAAABQAAAAAAAAAPUmVxdWVzdE5vdEZvdW5kAAAAAAYAAAAAAAAADFVuYXV0aG9yaXplZAAAAAcAAAAAAAAAC1plcm9BZGRyZXNzAAAAAAg=",
            "AAAAAQAAAAAAAAAAAAAAEFVuYm9uZGluZ1JlcXVlc3QAAAAFAAAAAAAAAAZhbW91bnQAAAAAAAsAAAAAAAAAB2NsYWltZWQAAAAAAQAAAAAAAAACaWQAAAAAAAYAAAAAAAAADHJlcXVlc3RlZF9hdAAAAAYAAAAAAAAAEHVubG9ja190aW1lc3RhbXAAAAAG",
            "AAAAAAAAABxSZWFkLW9ubHkgY29ubmVjdGl2aXR5IGNoZWNrAAAABHBpbmcAAAAAAAAAAQAAABE=",
            "AAAAAAAAAE1Jbml0aWFsaXplIHRoZSB1bmJvbmRpbmcgbWFuYWdlciB3aXRoIEFkbWluLCBUb2tlbiBBc3NldCwgYW5kIFZhdWx0IGFkZHJlc3NlcwAAAAAAAAppbml0aWFsaXplAAAAAAADAAAAAAAAAAVhZG1pbgAAAAAAABMAAAAAAAAADXRva2VuX2FkZHJlc3MAAAAAAAATAAAAAAAAAA52YXVsdF9jb250cmFjdAAAAAAAEwAAAAEAAAPpAAAAAgAAB9AAAAAOVW5ib25kaW5nRXJyb3IAAA==",
            "AAAAAAAAAE9DbGFpbSBhbGwgbWF0dXJlZC9lbGlnaWJsZSByZXF1ZXN0cyBpbiB0aGUgdXNlcidzIHF1ZXVlIGluIGEgc2luZ2xlIHRyYW5zYWN0aW9uAAAAAA1jbGFpbV9tYXR1cmVkAAAAAAAAAQAAAAAAAAACdG8AAAAAABMAAAABAAAD6QAAAAsAAAfQAAAADlVuYm9uZGluZ0Vycm9yAAA=",
            "AAAAAAAAACZSZWFkLW9ubHk6IEdldCBhbGwgcmVxdWVzdHMgZm9yIGEgdXNlcgAAAAAADmdldF91c2VyX3F1ZXVlAAAAAAABAAAAAAAAAAR1c2VyAAAAEwAAAAEAAAPqAAAH0AAAABBVbmJvbmRpbmdSZXF1ZXN0",
            "AAAAAAAAAEZRdWV1ZSB0b2tlbnMgZm9yIHVuYm9uZGluZyB3aXRoIGEgZGVzaWduYXRlZCBjb29sZG93biBwZXJpb2QgKHNlY29uZHMpAAAAAAAPc3RhcnRfdW5ib25kaW5nAAAAAAMAAAAAAAAABGZyb20AAAATAAAAAAAAAAZhbW91bnQAAAAAAAsAAAAAAAAADGNvb2xkb3duX3NlYwAAAAYAAAABAAAD6QAAB9AAAAAQVW5ib25kaW5nUmVxdWVzdAAAB9AAAAAOVW5ib25kaW5nRXJyb3IAAA==",
            "AAAAAAAAAD1SZWFkLW9ubHk6IEdldCBzdW0gb2YgbWF0dXJlZCB0b2tlbnMgcmVhZHkgdG8gY2xhaW0gcmlnaHQgbm93AAAAAAAAEmdldF9tYXR1cmVkX2Ftb3VudAAAAAAAAQAAAAAAAAAEdXNlcgAAABMAAAABAAAACw==",
            "AAAAAAAAADRSZWFkLW9ubHk6IFRvdGFsIHRva2VucyBjdXJyZW50bHkgaW4gdW5ib25kaW5nIHN0YXRlAAAAE2dldF90b3RhbF91bmJvbmRpbmcAAAAAAAAAAAEAAAAL"]), options);
        this.options = options;
    }
    fromJSON = {
        ping: (this.txFromJSON),
        initialize: (this.txFromJSON),
        claim_matured: (this.txFromJSON),
        get_user_queue: (this.txFromJSON),
        start_unbonding: (this.txFromJSON),
        get_matured_amount: (this.txFromJSON),
        get_total_unbonding: (this.txFromJSON)
    };
}
