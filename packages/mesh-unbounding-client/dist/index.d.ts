import { Buffer } from "buffer";
import { AssembledTransaction, Client as ContractClient, ClientOptions as ContractClientOptions, MethodOptions, Result } from "@stellar/stellar-sdk/contract";
import type { u64, i128 } from "@stellar/stellar-sdk/contract";
export * from "@stellar/stellar-sdk";
export * as contract from "@stellar/stellar-sdk/contract";
export * as rpc from "@stellar/stellar-sdk/rpc";
export type DataKey = {
    tag: "Admin";
    values: void;
} | {
    tag: "TokenAddress";
    values: void;
} | {
    tag: "VaultContract";
    values: void;
} | {
    tag: "NextRequestId";
    values: void;
} | {
    tag: "TotalUnbonding";
    values: void;
} | {
    tag: "UserQueue";
    values: readonly [string];
};
export declare const UnbondingError: {
    1: {
        message: string;
    };
    2: {
        message: string;
    };
    3: {
        message: string;
    };
    4: {
        message: string;
    };
    5: {
        message: string;
    };
    6: {
        message: string;
    };
    7: {
        message: string;
    };
    8: {
        message: string;
    };
};
export interface UnbondingRequest {
    amount: i128;
    claimed: boolean;
    id: u64;
    requested_at: u64;
    unlock_timestamp: u64;
}
export interface Client {
    /**
     * Construct and simulate a ping transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
     * Read-only connectivity check
     */
    ping: (options?: MethodOptions) => Promise<AssembledTransaction<string>>;
    /**
     * Construct and simulate a initialize transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
     * Initialize the unbonding manager with Admin, Token Asset, and Vault addresses
     */
    initialize: ({ admin, token_address, vault_contract }: {
        admin: string;
        token_address: string;
        vault_contract: string;
    }, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>;
    /**
     * Construct and simulate a claim_matured transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
     * Claim all matured/eligible requests in the user's queue in a single transaction
     */
    claim_matured: ({ to }: {
        to: string;
    }, options?: MethodOptions) => Promise<AssembledTransaction<Result<i128>>>;
    /**
     * Construct and simulate a get_user_queue transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
     * Read-only: Get all requests for a user
     */
    get_user_queue: ({ user }: {
        user: string;
    }, options?: MethodOptions) => Promise<AssembledTransaction<Array<UnbondingRequest>>>;
    /**
     * Construct and simulate a start_unbonding transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
     * Queue tokens for unbonding with a designated cooldown period (seconds)
     */
    start_unbonding: ({ from, amount, cooldown_sec }: {
        from: string;
        amount: i128;
        cooldown_sec: u64;
    }, options?: MethodOptions) => Promise<AssembledTransaction<Result<UnbondingRequest>>>;
    /**
     * Construct and simulate a get_matured_amount transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
     * Read-only: Get sum of matured tokens ready to claim right now
     */
    get_matured_amount: ({ user }: {
        user: string;
    }, options?: MethodOptions) => Promise<AssembledTransaction<i128>>;
    /**
     * Construct and simulate a get_total_unbonding transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
     * Read-only: Total tokens currently in unbonding state
     */
    get_total_unbonding: (options?: MethodOptions) => Promise<AssembledTransaction<i128>>;
}
export declare class Client extends ContractClient {
    readonly options: ContractClientOptions;
    static deploy<T = Client>(
    /** Options for initializing a Client as well as for calling a method, with extras specific to deploying. */
    options: MethodOptions & Omit<ContractClientOptions, "contractId"> & {
        /** The hash of the Wasm blob, which must already be installed on-chain. */
        wasmHash: Buffer | string;
        /** Salt used to generate the contract's ID. Passed through to {@link Operation.createCustomContract}. Default: random. */
        salt?: Buffer | Uint8Array;
        /** The format used to decode `wasmHash`, if it's provided as a string. */
        format?: "hex" | "base64";
    }): Promise<AssembledTransaction<T>>;
    constructor(options: ContractClientOptions);
    readonly fromJSON: {
        ping: (json: string) => AssembledTransaction<string>;
        initialize: (json: string) => AssembledTransaction<Result<void, import("@stellar/stellar-sdk/contract").ErrorMessage>>;
        claim_matured: (json: string) => AssembledTransaction<Result<bigint, import("@stellar/stellar-sdk/contract").ErrorMessage>>;
        get_user_queue: (json: string) => AssembledTransaction<UnbondingRequest[]>;
        start_unbonding: (json: string) => AssembledTransaction<Result<UnbondingRequest, import("@stellar/stellar-sdk/contract").ErrorMessage>>;
        get_matured_amount: (json: string) => AssembledTransaction<bigint>;
        get_total_unbonding: (json: string) => AssembledTransaction<bigint>;
    };
}
