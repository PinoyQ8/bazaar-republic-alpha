import { Buffer } from "buffer";
import { AssembledTransaction, Client as ContractClient, ClientOptions as ContractClientOptions, MethodOptions, Result } from "@stellar/stellar-sdk/contract";
import type { u64, i128, Option } from "@stellar/stellar-sdk/contract";
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
    tag: "TotalLocked";
    values: void;
} | {
    tag: "UserVault";
    values: readonly [string];
};
export declare const VaultError: {
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
export interface VaultRecord {
    claimed: boolean;
    deposited_at: u64;
    lock_duration_sec: u64;
    principal: i128;
    unlock_timestamp: u64;
}
export interface Client {
    /**
     * Construct and simulate a ping transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
     * Read-only connectivity check
     */
    ping: (options?: MethodOptions) => Promise<AssembledTransaction<string>>;
    /**
     * Construct and simulate a deposit transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
     * Lock tokens into a user-isolated vault for a given duration (seconds)
     */
    deposit: ({ from, amount, lock_duration_sec }: {
        from: string;
        amount: i128;
        lock_duration_sec: u64;
    }, options?: MethodOptions) => Promise<AssembledTransaction<Result<VaultRecord>>>;
    /**
     * Construct and simulate a withdraw transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
     * Withdraw unlocked principal back to the user address
     */
    withdraw: ({ to }: {
        to: string;
    }, options?: MethodOptions) => Promise<AssembledTransaction<Result<i128>>>;
    /**
     * Construct and simulate a get_vault transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
     * Read-only: Get user vault record
     */
    get_vault: ({ user }: {
        user: string;
    }, options?: MethodOptions) => Promise<AssembledTransaction<Option<VaultRecord>>>;
    /**
     * Construct and simulate a initialize transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
     * Initialize the Vault contract with an admin and token asset address
     */
    initialize: ({ admin, token_address }: {
        admin: string;
        token_address: string;
    }, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>;
    /**
     * Construct and simulate a get_total_locked transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
     * Read-only: Total locked in contract
     */
    get_total_locked: (options?: MethodOptions) => Promise<AssembledTransaction<i128>>;
    /**
     * Construct and simulate a get_token_address transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
     * Read-only: Token asset address
     */
    get_token_address: (options?: MethodOptions) => Promise<AssembledTransaction<Option<string>>>;
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
        deposit: (json: string) => AssembledTransaction<Result<VaultRecord, import("@stellar/stellar-sdk/contract").ErrorMessage>>;
        withdraw: (json: string) => AssembledTransaction<Result<bigint, import("@stellar/stellar-sdk/contract").ErrorMessage>>;
        get_vault: (json: string) => AssembledTransaction<Option<VaultRecord>>;
        initialize: (json: string) => AssembledTransaction<Result<void, import("@stellar/stellar-sdk/contract").ErrorMessage>>;
        get_total_locked: (json: string) => AssembledTransaction<bigint>;
        get_token_address: (json: string) => AssembledTransaction<Option<string>>;
    };
}
