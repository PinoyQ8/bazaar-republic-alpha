import { NextResponse } from 'next/server';
import {
  Horizon,
  Keypair,
  TransactionBuilder,
  Operation,
  Asset,
  TimeoutInfinite,
  StrKey,
} from '@stellar/stellar-sdk';
import prisma from '@/lib/prisma';

const HORIZON_URL = process.env.PI_HORIZON_URL || 'https://api.testnet.minepi.com';
const NETWORK_PASSPHRASE = process.env.PI_NETWORK_PASSPHRASE || 'Pi Testnet';
const SHIELD_FEE = '100000'; // 0.01 Pi (100,000 stroops)

const server = new Horizon.Server(HORIZON_URL);

function sanitizeKey(str?: string): string {
  if (!str) return '';
  return str.replace(/[\u200B-\u200D\uFEFF]/g, '').trim();
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const action = body.action;
    const compromisedSecret = sanitizeKey(body.compromisedSecret);
    const guardianSecret = sanitizeKey(body.guardianSecret);
    const vaultPublic = sanitizeKey(body.vaultPublic);
    const revokeMaster = Boolean(body.revokeMaster);

    console.log(`[API /api/guardian] Action: ${action} | Vault: "${vaultPublic}" (len: ${vaultPublic.length})`);

    if (!compromisedSecret) {
      return NextResponse.json({ error: 'Compromised Secret Key is required.' }, { status: 400 });
    }

    if (!StrKey.isValidEd25519SecretSeed(compromisedSecret)) {
      return NextResponse.json({ error: 'Invalid Compromised Secret Key seed format (must start with S).' }, { status: 400 });
    }

    const compromisedKeypair = Keypair.fromSecret(compromisedSecret);
    const compromisedPub = compromisedKeypair.publicKey();

    // ---------------------------------------------------------
    // ACTION: AUDIT
    // ---------------------------------------------------------
    if (action === 'AUDIT') {
      let account;
      try {
        account = await server.loadAccount(compromisedPub);
      } catch (err: any) {
        if (err?.response?.status === 404) {
          return NextResponse.json(
            { error: `Account ${compromisedPub} is not initialized or funded on Pi Testnet.` },
            { status: 404 }
          );
        }
        throw err;
      }

      const nativeBalance = account.balances.find((b: any) => b.asset_type === 'native');
      const balance = nativeBalance ? parseFloat(nativeBalance.balance) : 0;

      let guardianPub = '';
      if (guardianSecret && StrKey.isValidEd25519SecretSeed(guardianSecret)) {
        try {
          guardianPub = Keypair.fromSecret(guardianSecret).publicKey();
        } catch {
          // Non-fatal during audit
        }
      }

      const isArmed =
        account.thresholds.med_threshold >= 2 &&
        (guardianPub ? account.signers.some((s: any) => s.key === guardianPub && s.weight >= 1) : false);

      const isMasterRevoked = account.signers.some(
        (s: any) => s.key === compromisedPub && s.weight === 0
      );

      return NextResponse.json({
        balance,
        sequence: account.sequence,
        lastModifiedLedger: account.last_modified_ledger,
        thresholds: account.thresholds,
        signers: account.signers,
        isArmed,
        isMasterRevoked,
      });
    }

    // ---------------------------------------------------------
    // ACTION: EXECUTE_RECOVERY (Arm -> Sweep -> Revoke)
    // ---------------------------------------------------------
    if (action === 'EXECUTE') {
      if (!guardianSecret || !vaultPublic) {
        return NextResponse.json(
          { error: 'Guardian Secret and Cold Vault Public Key are required for execution.' },
          { status: 400 }
        );
      }

      if (!StrKey.isValidEd25519SecretSeed(guardianSecret)) {
        return NextResponse.json({ error: 'Invalid Guardian Secret Key format.' }, { status: 400 });
      }

      if (!StrKey.isValidEd25519PublicKey(vaultPublic)) {
        return NextResponse.json(
          { error: `Invalid Vault Public Key: "${vaultPublic}". Must be a valid 56-character Ed25519 Public Key starting with 'G'.` },
          { status: 400 }
        );
      }

      const guardianKeypair = Keypair.fromSecret(guardianSecret);
      const guardianPub = guardianKeypair.publicKey();
      const logs: string[] = [];
      const hashes: string[] = [];

      let account = await server.loadAccount(compromisedPub);

      // STEP 1: Shield Arming (if not already armed)
      const isArmed =
        account.thresholds.med_threshold >= 2 &&
        account.signers.some((s: any) => s.key === guardianPub && s.weight >= 1);

      let armTxHash: string | null = null;
      if (!isArmed) {
        logs.push('Arming shield: Escalating thresholds to 2-of-2 and attaching Guardian...');
        const armTx = new TransactionBuilder(account, {
          fee: SHIELD_FEE,
          networkPassphrase: NETWORK_PASSPHRASE,
        })
          .addOperation(
            Operation.setOptions({
              signer: {
                ed25519PublicKey: guardianPub,
                weight: 1,
              },
              masterWeight: 1,
              lowThreshold: 2,
              medThreshold: 2,
              highThreshold: 2,
            })
          )
          .setTimeout(TimeoutInfinite)
          .build();

        armTx.sign(compromisedKeypair);
        const armRes = await server.submitTransaction(armTx);
        armTxHash = armRes.hash;
        hashes.push(armRes.hash);
        logs.push(`✅ Shield Armed! Single-sig bots blocked. Hash: ${armRes.hash}`);
      } else {
        logs.push('ℹ️ Shield already active (2-of-2 thresholds enforced).');
      }

      // STEP 2: Atomic 2-of-2 Evacuation
      const refreshedAccount = await server.loadAccount(compromisedPub);
      const balance = parseFloat(
        refreshedAccount.balances.find((b: any) => b.asset_type === 'native')?.balance || '0'
      );
      
      const sweepAmount = (balance - 1.6).toFixed(6);
      let sweepTxHash: string | null = null;
      let destinationExists = false;

      if (parseFloat(sweepAmount) > 0.01) {
        logs.push(`Sweeping ${sweepAmount} Pi to Vault: ${vaultPublic}...`);

        try {
          await server.loadAccount(vaultPublic);
          destinationExists = true;
        } catch (err: any) {
          if (err?.response?.status === 404) {
            destinationExists = false;
          } else {
            throw new Error(`Failed to query vault destination: ${err.message}`);
          }
        }

        const sweepOp = destinationExists
          ? Operation.payment({
              destination: vaultPublic,
              asset: Asset.native(),
              amount: sweepAmount.toString(),
            })
          : Operation.createAccount({
              destination: vaultPublic,
              startingBalance: sweepAmount.toString(),
            });

        const sweepTx = new TransactionBuilder(refreshedAccount, {
          fee: SHIELD_FEE,
          networkPassphrase: NETWORK_PASSPHRASE,
        })
          .addOperation(sweepOp)
          .setTimeout(TimeoutInfinite)
          .build();

        sweepTx.sign(compromisedKeypair);
        sweepTx.sign(guardianKeypair);

        const sweepRes = await server.submitTransaction(sweepTx);
        sweepTxHash = sweepRes.hash;
        hashes.push(sweepRes.hash);
        logs.push(`✅ Evacuated ${sweepAmount} Pi via ${destinationExists ? 'PAYMENT' : 'CREATE_ACCOUNT'}. Hash: ${sweepRes.hash}`);
      } else {
        logs.push('ℹ️ No liquid balance above reserve to evacuate.');
      }

      // STEP 3: Neutralize Compromised Master Key
      let revokeTxHash: string | null = null;
      if (revokeMaster) {
        logs.push('Deactivating compromised master key (masterWeight: 0)...');
        const latestAccount = await server.loadAccount(compromisedPub);

        const revokeTx = new TransactionBuilder(latestAccount, {
          fee: SHIELD_FEE,
          networkPassphrase: NETWORK_PASSPHRASE,
        })
          .addOperation(
            Operation.setOptions({
              masterWeight: 0,
              lowThreshold: 1,
              medThreshold: 1,
              highThreshold: 1,
            })
          )
          .setTimeout(TimeoutInfinite)
          .build();

        revokeTx.sign(compromisedKeypair);
        revokeTx.sign(guardianKeypair);

        const revokeRes = await server.submitTransaction(revokeTx);
        revokeTxHash = revokeRes.hash;
        hashes.push(revokeRes.hash);
        logs.push(`🛑 Compromised master key permanently deactivated! Hash: ${revokeRes.hash}`);
      }

      // ---------------------------------------------------------
      // MONGODB PRISMA PERSISTENCE
      // ---------------------------------------------------------
      try {
        const finalAccount = await server.loadAccount(compromisedPub);
        const finalBalance = parseFloat(
          finalAccount.balances.find((b: any) => b.asset_type === 'native')?.balance || '0'
        );

        const shieldDoc = await prisma.shieldAccount.upsert({
          where: { targetAddress: compromisedPub },
          update: {
            guardianAddress: guardianPub,
            recoveryVault: vaultPublic,
            currentBalance: finalBalance,
            masterWeight: revokeMaster ? 0 : 1,
            status: revokeMaster ? 'NEUTRALIZED_REVOKED' : 'ARMED_2OF2',
            lowThreshold: finalAccount.thresholds.low_threshold,
            medThreshold: finalAccount.thresholds.med_threshold,
            highThreshold: finalAccount.thresholds.high_threshold,
          },
          create: {
            targetAddress: compromisedPub,
            guardianAddress: guardianPub,
            recoveryVault: vaultPublic,
            initialBalance: balance,
            currentBalance: finalBalance,
            masterWeight: revokeMaster ? 0 : 1,
            status: revokeMaster ? 'NEUTRALIZED_REVOKED' : 'ARMED_2OF2',
            lowThreshold: finalAccount.thresholds.low_threshold,
            medThreshold: finalAccount.thresholds.med_threshold,
            highThreshold: finalAccount.thresholds.high_threshold,
          },
        });

        if (sweepTxHash) {
          await prisma.recoverySettlement.create({
            data: {
              shieldAccountId: shieldDoc.id,
              evacuatedAmount: parseFloat(sweepAmount) > 0 ? parseFloat(sweepAmount) : 0,
              vaultAddress: vaultPublic,
              operationType: destinationExists ? 'PAYMENT' : 'CREATE_ACCOUNT',
              armTxHash: armTxHash,
              sweepTxHash: sweepTxHash,
              revokeTxHash: revokeTxHash,
              settledLedger: finalAccount.last_modified_ledger,
            },
          });

          await prisma.meshLedger.create({
            data: {
              walletId: vaultPublic,
              txHash: sweepTxHash,
              txType: 'SHIELD_SWEEP',
              piAmount: parseFloat(sweepAmount) > 0 ? parseFloat(sweepAmount) : 0,
              status: 'CONFIRMED',
              description: `RFC-002 Evacuation from ${compromisedPub.slice(0, 8)}... to vault`,
            },
          });
        }
      } catch (dbErr: any) {
        console.error('⚠️ Database persistence warning:', dbErr.message);
        logs.push(`⚠️ Note: On-chain succeeded, but DB audit sync encountered: ${dbErr.message}`);
      }

      return NextResponse.json({ success: true, logs, hashes });
    }

    return NextResponse.json({ error: 'Invalid action requested' }, { status: 400 });
  } catch (error: any) {
    const errorCodes = error?.response?.data?.extras?.result_codes;
    console.error('🚨 Guardian Route Error:', error?.response?.data || error.message);
    return NextResponse.json(
      {
        error: error.message || 'Operation failed',
        details: errorCodes || null,
      },
      { status: 500 }
    );
  }
}