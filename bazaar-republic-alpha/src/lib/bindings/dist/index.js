import { Buffer } from "buffer";
import { Client as ContractClient, Spec as ContractSpec, } from "@stellar/stellar-sdk/contract";
export * from "@stellar/stellar-sdk";
export * as contract from "@stellar/stellar-sdk/contract";
export * as rpc from "@stellar/stellar-sdk/rpc";
if (typeof window !== "undefined") {
    //@ts-ignore Buffer exists
    window.Buffer = window.Buffer || Buffer;
}
export const networks = {
    testnet: {
        networkPassphrase: "Test SDF Network ; September 2015",
        contractId: "CDD6Y35PFWW4AQU7QJG4HJQJWDECQMACN77QEF4MYUV6H5YI7FUMY44O",
    }
};
export class Client extends ContractClient {
    options;
    static async deploy(
    /** Options for initializing a Client as well as for calling a method, with extras specific to deploying. */
    options) {
        return ContractClient.deploy(null, options);
    }
    constructor(options) {
        super(new ContractSpec(["AAAABQAAAAAAAAAAAAAAElN5bmNBY3RpdmF0ZWRFdmVudAAAAAAAAQAAABRzeW5jX2FjdGl2YXRlZF9ldmVudAAAAAEAAAAAAAAAB3Bpb25lZXIAAAAAEwAAAAEAAAAC",
            "AAAAAAAAAAAAAAAJaW5pdF9tZXNoAAAAAAAAAQAAAAAAAAAHZm91bmRlcgAAAAATAAAAAA==",
            "AAAAAAAAAAAAAAAMZXhlY3V0ZV9zeW5jAAAAAQAAAAAAAAAHcGlvbmVlcgAAAAATAAAAAA=="]), options);
        this.options = options;
    }
    fromJSON = {
        init_mesh: (this.txFromJSON),
        execute_sync: (this.txFromJSON)
    };
}
