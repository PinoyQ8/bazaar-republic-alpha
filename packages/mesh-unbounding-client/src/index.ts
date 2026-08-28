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




export type DataKey = {tag: "Admin", values: void} | {tag: "TokenAddress", values: void} | {tag: "VaultContract", values: void} | {tag: "NextRequestId", values: void} | {tag: "TotalUnbonding", values: void} | {tag: "UserQueue", values: readonly [string]};

export const UnbondingError = {
  1: {message:"NotInitialized"},
  2: {message:"AlreadyInitialized"},
  3: {message:"InvalidAmount"},
  4: {message:"InvalidCooldown"},
  5: {message:"NoMaturedRequests"},
  6: {message:"RequestNotFound"},
  7: {message:"Unauthorized"},
  8: {message:"ZeroAddress"}
}


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
  ping: (options?: MethodOptions) => Promise<AssembledTransaction<string>>

  /**
   * Construct and simulate a initialize transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Initialize the unbonding manager with Admin, Token Asset, and Vault addresses
   */
  initialize: ({admin, token_address, vault_contract}: {admin: string, token_address: string, vault_contract: string}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a claim_matured transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Claim all matured/eligible requests in the user's queue in a single transaction
   */
  claim_matured: ({to}: {to: string}, options?: MethodOptions) => Promise<AssembledTransaction<Result<i128>>>

  /**
   * Construct and simulate a get_user_queue transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Read-only: Get all requests for a user
   */
  get_user_queue: ({user}: {user: string}, options?: MethodOptions) => Promise<AssembledTransaction<Array<UnbondingRequest>>>

  /**
   * Construct and simulate a start_unbonding transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Queue tokens for unbonding with a designated cooldown period (seconds)
   */
  start_unbonding: ({from, amount, cooldown_sec}: {from: string, amount: i128, cooldown_sec: u64}, options?: MethodOptions) => Promise<AssembledTransaction<Result<UnbondingRequest>>>

  /**
   * Construct and simulate a get_matured_amount transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Read-only: Get sum of matured tokens ready to claim right now
   */
  get_matured_amount: ({user}: {user: string}, options?: MethodOptions) => Promise<AssembledTransaction<i128>>

  /**
   * Construct and simulate a get_total_unbonding transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Read-only: Total tokens currently in unbonding state
   */
  get_total_unbonding: (options?: MethodOptions) => Promise<AssembledTransaction<i128>>

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
      new ContractSpec([ "AAAAAgAAAAAAAAAAAAAAB0RhdGFLZXkAAAAABgAAAAAAAAAAAAAABUFkbWluAAAAAAAAAAAAAAAAAAAMVG9rZW5BZGRyZXNzAAAAAAAAAAAAAAANVmF1bHRDb250cmFjdAAAAAAAAAAAAAAAAAAADU5leHRSZXF1ZXN0SWQAAAAAAAAAAAAAAAAAAA5Ub3RhbFVuYm9uZGluZwAAAAAAAQAAAAAAAAAJVXNlclF1ZXVlAAAAAAAAAQAAABM=",
        "AAAABAAAAAAAAAAAAAAADlVuYm9uZGluZ0Vycm9yAAAAAAAIAAAAAAAAAA5Ob3RJbml0aWFsaXplZAAAAAAAAQAAAAAAAAASQWxyZWFkeUluaXRpYWxpemVkAAAAAAACAAAAAAAAAA1JbnZhbGlkQW1vdW50AAAAAAAAAwAAAAAAAAAPSW52YWxpZENvb2xkb3duAAAAAAQAAAAAAAAAEU5vTWF0dXJlZFJlcXVlc3RzAAAAAAAABQAAAAAAAAAPUmVxdWVzdE5vdEZvdW5kAAAAAAYAAAAAAAAADFVuYXV0aG9yaXplZAAAAAcAAAAAAAAAC1plcm9BZGRyZXNzAAAAAAg=",
        "AAAAAQAAAAAAAAAAAAAAEFVuYm9uZGluZ1JlcXVlc3QAAAAFAAAAAAAAAAZhbW91bnQAAAAAAAsAAAAAAAAAB2NsYWltZWQAAAAAAQAAAAAAAAACaWQAAAAAAAYAAAAAAAAADHJlcXVlc3RlZF9hdAAAAAYAAAAAAAAAEHVubG9ja190aW1lc3RhbXAAAAAG",
        "AAAAAAAAABxSZWFkLW9ubHkgY29ubmVjdGl2aXR5IGNoZWNrAAAABHBpbmcAAAAAAAAAAQAAABE=",
        "AAAAAAAAAE1Jbml0aWFsaXplIHRoZSB1bmJvbmRpbmcgbWFuYWdlciB3aXRoIEFkbWluLCBUb2tlbiBBc3NldCwgYW5kIFZhdWx0IGFkZHJlc3NlcwAAAAAAAAppbml0aWFsaXplAAAAAAADAAAAAAAAAAVhZG1pbgAAAAAAABMAAAAAAAAADXRva2VuX2FkZHJlc3MAAAAAAAATAAAAAAAAAA52YXVsdF9jb250cmFjdAAAAAAAEwAAAAEAAAPpAAAAAgAAB9AAAAAOVW5ib25kaW5nRXJyb3IAAA==",
        "AAAAAAAAAE9DbGFpbSBhbGwgbWF0dXJlZC9lbGlnaWJsZSByZXF1ZXN0cyBpbiB0aGUgdXNlcidzIHF1ZXVlIGluIGEgc2luZ2xlIHRyYW5zYWN0aW9uAAAAAA1jbGFpbV9tYXR1cmVkAAAAAAAAAQAAAAAAAAACdG8AAAAAABMAAAABAAAD6QAAAAsAAAfQAAAADlVuYm9uZGluZ0Vycm9yAAA=",
        "AAAAAAAAACZSZWFkLW9ubHk6IEdldCBhbGwgcmVxdWVzdHMgZm9yIGEgdXNlcgAAAAAADmdldF91c2VyX3F1ZXVlAAAAAAABAAAAAAAAAAR1c2VyAAAAEwAAAAEAAAPqAAAH0AAAABBVbmJvbmRpbmdSZXF1ZXN0",
        "AAAAAAAAAEZRdWV1ZSB0b2tlbnMgZm9yIHVuYm9uZGluZyB3aXRoIGEgZGVzaWduYXRlZCBjb29sZG93biBwZXJpb2QgKHNlY29uZHMpAAAAAAAPc3RhcnRfdW5ib25kaW5nAAAAAAMAAAAAAAAABGZyb20AAAATAAAAAAAAAAZhbW91bnQAAAAAAAsAAAAAAAAADGNvb2xkb3duX3NlYwAAAAYAAAABAAAD6QAAB9AAAAAQVW5ib25kaW5nUmVxdWVzdAAAB9AAAAAOVW5ib25kaW5nRXJyb3IAAA==",
        "AAAAAAAAAD1SZWFkLW9ubHk6IEdldCBzdW0gb2YgbWF0dXJlZCB0b2tlbnMgcmVhZHkgdG8gY2xhaW0gcmlnaHQgbm93AAAAAAAAEmdldF9tYXR1cmVkX2Ftb3VudAAAAAAAAQAAAAAAAAAEdXNlcgAAABMAAAABAAAACw==",
        "AAAAAAAAADRSZWFkLW9ubHk6IFRvdGFsIHRva2VucyBjdXJyZW50bHkgaW4gdW5ib25kaW5nIHN0YXRlAAAAE2dldF90b3RhbF91bmJvbmRpbmcAAAAAAAAAAAEAAAAL" ]),
      options
    )
  }
  public readonly fromJSON = {
    ping: this.txFromJSON<string>,
        initialize: this.txFromJSON<Result<void>>,
        claim_matured: this.txFromJSON<Result<i128>>,
        get_user_queue: this.txFromJSON<Array<UnbondingRequest>>,
        start_unbonding: this.txFromJSON<Result<UnbondingRequest>>,
        get_matured_amount: this.txFromJSON<i128>,
        get_total_unbonding: this.txFromJSON<i128>
  }
}