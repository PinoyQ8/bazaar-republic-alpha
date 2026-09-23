import { Buffer } from "buffer";
import { Address } from "@stellar/stellar-sdk";
import {
  AssembledTransaction,
  Client as ContractClient,
  ClientOptions as ContractClientOptions,
  MethodOptions,
  Result,
  Spec as ContractSpec,
} from "@stellar/stellar-sdk/contract";
import type {
  u32,
  i32,
  u64,
  i64,
  u128,
  i128,
  u256,
  i256,
  Option,
  Timepoint,
  Duration,
} from "@stellar/stellar-sdk/contract";
export * from "@stellar/stellar-sdk";
export * as contract from "@stellar/stellar-sdk/contract";
export * as rpc from "@stellar/stellar-sdk/rpc";

if (typeof window !== "undefined") {
  //@ts-ignore Buffer exists
  window.Buffer = window.Buffer || Buffer;
}




export type DataKey = {tag: "Admin", values: void} | {tag: "TokenAddress", values: void} | {tag: "TotalLocked", values: void} | {tag: "UserVault", values: readonly [string]};

export const VaultError = {
  1: {message:"NotInitialized"},
  2: {message:"AlreadyInitialized"},
  3: {message:"InvalidAmount"},
  4: {message:"InvalidLockDuration"},
  5: {message:"VaultStillLocked"},
  6: {message:"InsufficientVaultBalance"},
  7: {message:"Unauthorized"},
  8: {message:"ZeroAddress"}
}


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
  ping: (options?: MethodOptions) => Promise<AssembledTransaction<string>>

  /**
   * Construct and simulate a deposit transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Lock tokens into a user-isolated vault for a given duration (seconds)
   */
  deposit: ({from, amount, lock_duration_sec}: {from: string, amount: i128, lock_duration_sec: u64}, options?: MethodOptions) => Promise<AssembledTransaction<Result<VaultRecord>>>

  /**
   * Construct and simulate a withdraw transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Withdraw unlocked principal back to the user address
   */
  withdraw: ({to}: {to: string}, options?: MethodOptions) => Promise<AssembledTransaction<Result<i128>>>

  /**
   * Construct and simulate a get_vault transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Read-only: Get user vault record
   */
  get_vault: ({user}: {user: string}, options?: MethodOptions) => Promise<AssembledTransaction<Option<VaultRecord>>>

  /**
   * Construct and simulate a initialize transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Initialize the Vault contract with an admin and token asset address
   */
  initialize: ({admin, token_address}: {admin: string, token_address: string}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a get_total_locked transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Read-only: Total locked in contract
   */
  get_total_locked: (options?: MethodOptions) => Promise<AssembledTransaction<i128>>

  /**
   * Construct and simulate a get_token_address transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Read-only: Token asset address
   */
  get_token_address: (options?: MethodOptions) => Promise<AssembledTransaction<Option<string>>>

}
export class Client extends ContractClient {
  static async deploy<T = Client>(
    /** Options for initializing a Client as well as for calling a method, with extras specific to deploying. */
    options: MethodOptions &
      Omit<ContractClientOptions, "contractId"> & {
        /** The hash of the Wasm blob, which must already be installed on-chain. */
        wasmHash: Buffer | string;
        /** Salt used to generate the contract's ID. Passed through to {@link Operation.createCustomContract}. Default: random. */
        salt?: Buffer | Uint8Array;
        /** The format used to decode `wasmHash`, if it's provided as a string. */
        format?: "hex" | "base64";
      }
  ): Promise<AssembledTransaction<T>> {
    return ContractClient.deploy(null, options)
  }
  constructor(public readonly options: ContractClientOptions) {
    super(
      new ContractSpec([ "AAAAAAAAABxSZWFkLW9ubHkgY29ubmVjdGl2aXR5IGNoZWNrAAAABHBpbmcAAAAAAAAAAQAAABE=",
        "AAAAAAAAAEVMb2NrIHRva2VucyBpbnRvIGEgdXNlci1pc29sYXRlZCB2YXVsdCBmb3IgYSBnaXZlbiBkdXJhdGlvbiAoc2Vjb25kcykAAAAAAAAHZGVwb3NpdAAAAAADAAAAAAAAAARmcm9tAAAAEwAAAAAAAAAGYW1vdW50AAAAAAALAAAAAAAAABFsb2NrX2R1cmF0aW9uX3NlYwAAAAAAAAYAAAABAAAD6QAAB9AAAAALVmF1bHRSZWNvcmQAAAAH0AAAAApWYXVsdEVycm9yAAA=",
        "AAAAAAAAADRXaXRoZHJhdyB1bmxvY2tlZCBwcmluY2lwYWwgYmFjayB0byB0aGUgdXNlciBhZGRyZXNzAAAACHdpdGhkcmF3AAAAAQAAAAAAAAACdG8AAAAAABMAAAABAAAD6QAAAAsAAAfQAAAAClZhdWx0RXJyb3IAAA==",
        "AAAAAAAAACBSZWFkLW9ubHk6IEdldCB1c2VyIHZhdWx0IHJlY29yZAAAAAlnZXRfdmF1bHQAAAAAAAABAAAAAAAAAAR1c2VyAAAAEwAAAAEAAAPoAAAH0AAAAAtWYXVsdFJlY29yZAA=",
        "AAAAAgAAAAAAAAAAAAAAB0RhdGFLZXkAAAAABAAAAAAAAAAAAAAABUFkbWluAAAAAAAAAAAAAAAAAAAMVG9rZW5BZGRyZXNzAAAAAAAAAAAAAAALVG90YWxMb2NrZWQAAAAAAQAAAAAAAAAJVXNlclZhdWx0AAAAAAAAAQAAABM=",
        "AAAAAAAAAENJbml0aWFsaXplIHRoZSBWYXVsdCBjb250cmFjdCB3aXRoIGFuIGFkbWluIGFuZCB0b2tlbiBhc3NldCBhZGRyZXNzAAAAAAppbml0aWFsaXplAAAAAAACAAAAAAAAAAVhZG1pbgAAAAAAABMAAAAAAAAADXRva2VuX2FkZHJlc3MAAAAAAAATAAAAAQAAA+kAAAPtAAAAAAAAB9AAAAAKVmF1bHRFcnJvcgAA",
        "AAAABAAAAAAAAAAAAAAAClZhdWx0RXJyb3IAAAAAAAgAAAAAAAAADk5vdEluaXRpYWxpemVkAAAAAAABAAAAAAAAABJBbHJlYWR5SW5pdGlhbGl6ZWQAAAAAAAIAAAAAAAAADUludmFsaWRBbW91bnQAAAAAAAADAAAAAAAAABNJbnZhbGlkTG9ja0R1cmF0aW9uAAAAAAQAAAAAAAAAEFZhdWx0U3RpbGxMb2NrZWQAAAAFAAAAAAAAABhJbnN1ZmZpY2llbnRWYXVsdEJhbGFuY2UAAAAGAAAAAAAAAAxVbmF1dGhvcml6ZWQAAAAHAAAAAAAAAAtaZXJvQWRkcmVzcwAAAAAI",
        "AAAAAQAAAAAAAAAAAAAAC1ZhdWx0UmVjb3JkAAAAAAUAAAAAAAAAB2NsYWltZWQAAAAAAQAAAAAAAAAMZGVwb3NpdGVkX2F0AAAABgAAAAAAAAARbG9ja19kdXJhdGlvbl9zZWMAAAAAAAAGAAAAAAAAAAlwcmluY2lwYWwAAAAAAAALAAAAAAAAABB1bmxvY2tfdGltZXN0YW1wAAAABg==",
        "AAAAAAAAACNSZWFkLW9ubHk6IFRvdGFsIGxvY2tlZCBpbiBjb250cmFjdAAAAAAQZ2V0X3RvdGFsX2xvY2tlZAAAAAAAAAABAAAACw==",
        "AAAAAAAAAB5SZWFkLW9ubHk6IFRva2VuIGFzc2V0IGFkZHJlc3MAAAAAABFnZXRfdG9rZW5fYWRkcmVzcwAAAAAAAAAAAAABAAAD6AAAABM=" ]),
      options
    )
  }
  public readonly fromJSON = {
    ping: this.txFromJSON<string>,
        deposit: this.txFromJSON<Result<VaultRecord>>,
        withdraw: this.txFromJSON<Result<i128>>,
        get_vault: this.txFromJSON<Option<VaultRecord>>,
        initialize: this.txFromJSON<Result<void>>,
        get_total_locked: this.txFromJSON<i128>,
        get_token_address: this.txFromJSON<Option<string>>
  }
}