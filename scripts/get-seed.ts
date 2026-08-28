import * as bip39 from 'bip39';
import { Keypair } from '@stellar/stellar-sdk';

// Replace with your 24-word testnet passphrase
const mnemonic = 'word1 word2 word3 ... word24';

async function deriveStellarSeed(passphrase: string) {
  const seed = await bip39.mnemonicToSeed(passphrase.trim());
  // Pi Network uses the standard Stellar BIP-44 path: m/44'/314159'/0' or raw seed slice (first 32 bytes)
  const rawSeed = seed.subarray(0, 32);
  const keypair = Keypair.fromRawEd25519Seed(rawSeed);

  console.log('--- WALLET CREDENTIALS ---');
  console.log('Public Key (G...): ', keypair.publicKey());
  console.log('Secret Seed (S...):', keypair.secret());
}

deriveStellarSeed(mnemonic);