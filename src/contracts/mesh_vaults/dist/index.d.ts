import { Buffer } from "buffer";
import { AssembledTransaction, Client as ContractClient, ClientOptions as ContractClientOptions, MethodOptions } from "@stellar/stellar-sdk/contract";
import type { u32, u64, i128 } from "@stellar/stellar-sdk/contract";
export * from "@stellar/stellar-sdk";
export * as contract from "@stellar/stellar-sdk/contract";
export * as rpc from "@stellar/stellar-sdk/rpc";
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
};
export type EscrowStatus = {
    tag: "Locked";
    values: void;
} | {
    tag: "Released";
    values: void;
} | {
    tag: "Disputed";
    values: void;
} | {
    tag: "Refunded";
    values: void;
};
export interface VaultEscrowRecord {
    amount: i128;
    consumer: string;
    expires_at: u64;
    protocol_version: u32;
    provider: string;
    status: EscrowStatus;
    token_contract: string;
}
export interface Client {
    /**
     * Construct and simulate a get_vault transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
     */
    get_vault: ({ escrow_id }: {
        escrow_id: string;
    }, options?: MethodOptions) => Promise<AssembledTransaction<VaultEscrowRecord>>;
    /**
     * Construct and simulate a init_admin transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
     */
    init_admin: ({ admin }: {
        admin: string;
    }, options?: MethodOptions) => Promise<AssembledTransaction<null>>;
    /**
     * Construct and simulate a lock_funds transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
     */
    lock_funds: ({ escrow_id, token_contract, consumer, provider, amount, duration_secs }: {
        escrow_id: string;
        token_contract: string;
        consumer: string;
        provider: string;
        amount: i128;
        duration_secs: u64;
    }, options?: MethodOptions) => Promise<AssembledTransaction<VaultEscrowRecord>>;
    /**
     * Construct and simulate a refund_funds transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
     */
    refund_funds: ({ escrow_id, initiator }: {
        escrow_id: string;
        initiator: string;
    }, options?: MethodOptions) => Promise<AssembledTransaction<VaultEscrowRecord>>;
    /**
     * Construct and simulate a release_funds transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
     */
    release_funds: ({ escrow_id, consumer }: {
        escrow_id: string;
        consumer: string;
    }, options?: MethodOptions) => Promise<AssembledTransaction<VaultEscrowRecord>>;
    /**
     * Construct and simulate a dispute_escrow transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
     */
    dispute_escrow: ({ escrow_id, caller }: {
        escrow_id: string;
        caller: string;
    }, options?: MethodOptions) => Promise<AssembledTransaction<VaultEscrowRecord>>;
    /**
     * Construct and simulate a resolve_dispute transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
     */
    resolve_dispute: ({ escrow_id, admin, payout_to }: {
        escrow_id: string;
        admin: string;
        payout_to: string;
    }, options?: MethodOptions) => Promise<AssembledTransaction<VaultEscrowRecord>>;
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
        get_vault: (json: string) => AssembledTransaction<VaultEscrowRecord>;
        init_admin: (json: string) => AssembledTransaction<null>;
        lock_funds: (json: string) => AssembledTransaction<VaultEscrowRecord>;
        refund_funds: (json: string) => AssembledTransaction<VaultEscrowRecord>;
        release_funds: (json: string) => AssembledTransaction<VaultEscrowRecord>;
        dispute_escrow: (json: string) => AssembledTransaction<VaultEscrowRecord>;
        resolve_dispute: (json: string) => AssembledTransaction<VaultEscrowRecord>;
    };
}
