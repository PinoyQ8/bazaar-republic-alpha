// @/app/vault-sync/page.tsx
'use client';

import { useState } from 'react';
import TransportWebUSB from '@ledgerhq/hw-transport-webusb';
import Str from '@ledgerhq/hw-app-str';
import * as StellarSdk from 'stellar-sdk'; 

export default function VaultSync() {
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('Vault Locked. Awaiting Handshake.');
  
  // MESH Logic: Hard-coded Pi Network SLIP-44 Derivation Path
  const PI_DERIVATION_PATH = "44'/314159'/0'"; 

  const connectLedger = async () => {
    try {
      setStatus('Initiating WebUSB Handshake...');
      const transport = await TransportWebUSB.create();
      const str = new Str(transport);
      
      setStatus('Extracting Public Key from Secure Enclave...');
      // PATCH: Removed the third boolean argument
      const result = await str.getPublicKey(PI_DERIVATION_PATH, true);
      
      // PATCH: Encoding the raw Buffer into an ed25519 string
      const encodedPublicKey = StellarSdk.StrKey.encodeEd25519PublicKey(result.rawPublicKey);
      
      setPublicKey(encodedPublicKey);
      setStatus('Handshake Complete. Cold Address Verified.');
    } catch (error: any) {
      console.error(error);
      setStatus(`Transport Error: ${error.message}. Ensure Stellar App is open on Ledger.`);
    }
  };

  const compileAndSignExtractionTest = async () => {
    if (!publicKey) return;
    
    try {
      setStatus('Compiling 0.01 Pi Extraction Payload...');
      
      // Architecture Bypass: Routing through public Pi Mainnet Horizon
      // PATCH: Route strictly through the Horizon namespace
      const server = new StellarSdk.Horizon.Server('https://api.mainnet.minepi.com');

      // 1. Fetch sequence number of the Ledger cold storage address
      const account = await server.loadAccount(publicKey);

      // 2. Hard-coded Republic Parameters
      const DESTINATION_HOT_WALLET = 'GCUFYY4XVGYEJVLNPUCVX37QLRBWBKPCVBAVHWDM5Y7YS7I3SFVVBPEJ';
      const AMOUNT_TO_SEND = '0.01'; // The test payload
      const BASE_FEE = '10000'; // 0.01 Pi base network fee represented in stroops
      
      // 3. Build the XDR Transaction
      const transaction = new StellarSdk.TransactionBuilder(account, {
        fee: BASE_FEE, 
        networkPassphrase: 'Pi Network Mainnet' // Force Pi Network injection
      })
      .addOperation(StellarSdk.Operation.payment({
        destination: DESTINATION_HOT_WALLET,
        asset: StellarSdk.Asset.native(),
        amount: AMOUNT_TO_SEND,
      }))
      .setTimeout(180)
      .build();

      setStatus('Awaiting Physical Signature on Ledger Device...');

      // 4. Push XDR to Ledger for ed25519 Signature
      const transport = await TransportWebUSB.create();
      const str = new Str(transport);
      const signature = await str.signTransaction(
        PI_DERIVATION_PATH,
        transaction.signatureBase()
      );

      // 5. Append Signature and Broadcast
      const keyPair = StellarSdk.Keypair.fromPublicKey(publicKey);
      const decoratedSignature = new StellarSdk.xdr.DecoratedSignature({
        hint: keyPair.signatureHint(),
        signature: signature.signature,
      });
      transaction.signatures.push(decoratedSignature);

      setStatus('Broadcasting to Pi Mainnet...');
      const response = await server.submitTransaction(transaction);
      
      setStatus(`Bidirectional Test Cleared. Hash: ${response.hash}`);

    } catch (error: any) {
      console.error(error);
      setStatus(`Execution Failed: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-black text-green-400 p-6 font-mono flex flex-col items-center">
      <h1 className="text-2xl font-bold mb-2">Bazaar Republic Vault</h1>
      <h2 className="text-xs text-gray-500 mb-8 border-b border-green-800 pb-2">X570 NODE // PROTOCOL: NEO-SYNC</h2>

      <div className="w-full max-w-md bg-gray-900 border border-green-600 p-4 rounded-lg shadow-lg">
        <p className="text-sm mb-4 animate-pulse">{status}</p>

        {!publicKey ? (
          <button 
            onClick={connectLedger}
            className="w-full bg-green-700 text-black font-bold py-3 rounded active:bg-green-500 transition-colors"
          >
            CONNECT HARDWARE VAULT
          </button>
        ) : (
          <div className="space-y-4">
            <div>
              <p className="text-xs text-gray-400">Cold Genesis Address (m/44'/314159'/0'):</p>
              <p className="text-xs break-all bg-black p-2 rounded border border-green-800 mt-1">{publicKey}</p>
            </div>

            <div className="bg-black p-3 rounded border border-red-900 mt-4">
              <p className="text-xs text-red-500 mb-2">CRITICAL: Execute 0.03 Pi Inbound Test before extraction.</p>
              <button 
                onClick={compileAndSignExtractionTest}
                className="w-full bg-red-800 text-white font-bold py-3 rounded active:bg-red-600 transition-colors"
              >
                COMPILE 0.01 Pi EXTRACTION TEST
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}