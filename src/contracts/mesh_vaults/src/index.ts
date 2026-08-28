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




export const VaultError = {
  1: {message:"NotFound"},
  2: {message:"Unauthorized"},
  3: {message:"InvalidState"},
  4: {message:"TimelockActive"},
  5: {message:"InvalidAmount"},
  6: {message:"Expired"}
}

export type EscrowStatus = {tag: "Locked", values: void} | {tag: "Released", values: void} | {tag: "Disputed", values: void} | {tag: "Refunded", values: void};


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
  get_vault: ({escrow_id}: {escrow_id: string}, options?: MethodOptions) => Promise<AssembledTransaction<VaultEscrowRecord>>

  /**
   * Construct and simulate a init_admin transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  init_admin: ({admin}: {admin: string}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a lock_funds transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  lock_funds: ({escrow_id, token_contract, consumer, provider, amount, duration_secs}: {escrow_id: string, token_contract: string, consumer: string, provider: string, amount: i128, duration_secs: u64}, options?: MethodOptions) => Promise<AssembledTransaction<VaultEscrowRecord>>

  /**
   * Construct and simulate a refund_funds transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  refund_funds: ({escrow_id, initiator}: {escrow_id: string, initiator: string}, options?: MethodOptions) => Promise<AssembledTransaction<VaultEscrowRecord>>

  /**
   * Construct and simulate a release_funds transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  release_funds: ({escrow_id, consumer}: {escrow_id: string, consumer: string}, options?: MethodOptions) => Promise<AssembledTransaction<VaultEscrowRecord>>

  /**
   * Construct and simulate a dispute_escrow transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  dispute_escrow: ({escrow_id, caller}: {escrow_id: string, caller: string}, options?: MethodOptions) => Promise<AssembledTransaction<VaultEscrowRecord>>

  /**
   * Construct and simulate a resolve_dispute transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  resolve_dispute: ({escrow_id, admin, payout_to}: {escrow_id: string, admin: string, payout_to: string}, options?: MethodOptions) => Promise<AssembledTransaction<VaultEscrowRecord>>

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
      new ContractSpec([ "AAAAAAAAAAAAAAAJZ2V0X3ZhdWx0AAAAAAAAAQAAAAAAAAAJZXNjcm93X2lkAAAAAAAAEQAAAAEAAAfQAAAAEVZhdWx0RXNjcm93UmVjb3JkAAAA",
        "AAAAAAAAAAAAAAAKaW5pdF9hZG1pbgAAAAAAAQAAAAAAAAAFYWRtaW4AAAAAAAATAAAAAA==",
        "AAAAAAAAAAAAAAAKbG9ja19mdW5kcwAAAAAABgAAAAAAAAAJZXNjcm93X2lkAAAAAAAAEQAAAAAAAAAOdG9rZW5fY29udHJhY3QAAAAAABMAAAAAAAAACGNvbnN1bWVyAAAAEwAAAAAAAAAIcHJvdmlkZXIAAAATAAAAAAAAAAZhbW91bnQAAAAAAAsAAAAAAAAADWR1cmF0aW9uX3NlY3MAAAAAAAAGAAAAAQAAB9AAAAARVmF1bHRFc2Nyb3dSZWNvcmQAAAA=",
        "AAAAAAAAAAAAAAAMcmVmdW5kX2Z1bmRzAAAAAgAAAAAAAAAJZXNjcm93X2lkAAAAAAAAEQAAAAAAAAAJaW5pdGlhdG9yAAAAAAAAEwAAAAEAAAfQAAAAEVZhdWx0RXNjcm93UmVjb3JkAAAA",
        "AAAABAAAAAAAAAAAAAAAClZhdWx0RXJyb3IAAAAAAAYAAAAAAAAACE5vdEZvdW5kAAAAAQAAAAAAAAAMVW5hdXRob3JpemVkAAAAAgAAAAAAAAAMSW52YWxpZFN0YXRlAAAAAwAAAAAAAAAOVGltZWxvY2tBY3RpdmUAAAAAAAQAAAAAAAAADUludmFsaWRBbW91bnQAAAAAAAAFAAAAAAAAAAdFeHBpcmVkAAAAAAY=",
        "AAAAAAAAAAAAAAANcmVsZWFzZV9mdW5kcwAAAAAAAAIAAAAAAAAACWVzY3Jvd19pZAAAAAAAABEAAAAAAAAACGNvbnN1bWVyAAAAEwAAAAEAAAfQAAAAEVZhdWx0RXNjcm93UmVjb3JkAAAA",
        "AAAAAAAAAAAAAAAOZGlzcHV0ZV9lc2Nyb3cAAAAAAAIAAAAAAAAACWVzY3Jvd19pZAAAAAAAABEAAAAAAAAABmNhbGxlcgAAAAAAEwAAAAEAAAfQAAAAEVZhdWx0RXNjcm93UmVjb3JkAAAA",
        "AAAAAgAAAAAAAAAAAAAADEVzY3Jvd1N0YXR1cwAAAAQAAAAAAAAAAAAAAAZMb2NrZWQAAAAAAAAAAAAAAAAACFJlbGVhc2VkAAAAAAAAAAAAAAAIRGlzcHV0ZWQAAAAAAAAAAAAAAAhSZWZ1bmRlZA==",
        "AAAAAAAAAAAAAAAPcmVzb2x2ZV9kaXNwdXRlAAAAAAMAAAAAAAAACWVzY3Jvd19pZAAAAAAAABEAAAAAAAAABWFkbWluAAAAAAAAEwAAAAAAAAAJcGF5b3V0X3RvAAAAAAAAEwAAAAEAAAfQAAAAEVZhdWx0RXNjcm93UmVjb3JkAAAA",
        "AAAAAQAAAAAAAAAAAAAAEVZhdWx0RXNjcm93UmVjb3JkAAAAAAAABwAAAAAAAAAGYW1vdW50AAAAAAALAAAAAAAAAAhjb25zdW1lcgAAABMAAAAAAAAACmV4cGlyZXNfYXQAAAAAAAYAAAAAAAAAEHByb3RvY29sX3ZlcnNpb24AAAAEAAAAAAAAAAhwcm92aWRlcgAAABMAAAAAAAAABnN0YXR1cwAAAAAH0AAAAAxFc2Nyb3dTdGF0dXMAAAAAAAAADnRva2VuX2NvbnRyYWN0AAAAAAAT" ]),
      options
    )
  }
  public readonly fromJSON = {
    get_vault: this.txFromJSON<VaultEscrowRecord>,
        init_admin: this.txFromJSON<null>,
        lock_funds: this.txFromJSON<VaultEscrowRecord>,
        refund_funds: this.txFromJSON<VaultEscrowRecord>,
        release_funds: this.txFromJSON<VaultEscrowRecord>,
        dispute_escrow: this.txFromJSON<VaultEscrowRecord>,
        resolve_dispute: this.txFromJSON<VaultEscrowRecord>
  }
}