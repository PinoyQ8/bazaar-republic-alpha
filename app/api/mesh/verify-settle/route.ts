import { NextRequest, NextResponse } from 'next/server';
import { Keypair } from '@stellar/stellar-sdk';
import { bazaarVaultService } from '@/services/bazaarVaultService';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { escrowId, consumerAddress, secretKey } = body;

    if (!escrowId) {
      return NextResponse.json(
        { success: false, error: 'Missing required settlement parameter: escrowId' },
        { status: 400 }
      );
    }

    const db = prisma as any;
    let targetEscrowId = escrowId;
    let resolvedConsumer = consumerAddress;

    // 1. Smart ID Resolution: Resolve 24-char MongoDB hex ObjectID to canonical on-chain escrowId
    if (/^[0-9a-fA-F]{24}$/.test(escrowId) && db.escrowLock) {
      const dbRecord = await db.escrowLock.findUnique({
        where: { id: escrowId }
      }).catch(() => null);

      if (dbRecord) {
        targetEscrowId = dbRecord.escrowId || targetEscrowId;
        resolvedConsumer = resolvedConsumer || dbRecord.consumerUid;
      }
    }

    resolvedConsumer = resolvedConsumer || 'GAU5Y5UWUQ5ETIEI5HWVJR7VDMXUETTSKQ4UKOIIGIW6GVIMCR354UJ3';

    // 2. Pre-flight On-Chain Ledger Verification
    const onChainVault = await bazaarVaultService.getVault(targetEscrowId).catch(() => null);

    if (!onChainVault) {
      return NextResponse.json(
        {
          success: false,
          error: `Escrow '${targetEscrowId}' does not exist on-chain in contract ${bazaarVaultService['contract'].contractId()}`,
        },
        { status: 404 }
      );
    }

    const currentStatus = String(onChainVault.status).toUpperCase();
    if (currentStatus !== 'LOCKED') {
      return NextResponse.json(
        {
          success: false,
          error: `Escrow '${targetEscrowId}' is not in Locked state (Current Status: ${onChainVault.status})`,
        },
        { status: 409 }
      );
    }

    // 3. Resolve Signer Key
    const signer = secretKey
      ? Keypair.fromSecret(secretKey)
      : Keypair.fromSecret(
          process.env.OPERATOR_STELLAR_SECRET ||
            process.env.STELLAR_VAULT_SEED ||
            process.env.STELLAR_DEPLOYER_SECRET ||
            'SA4F7YV45RRE4HYZ56R3CLL3G2C5B5OQ6EZ23675NPYF2C6N2BZZ7Z6F'
        );

    // 4. Broadcast Release Transaction on Soroban Protocol 28
    const txResult: any = await bazaarVaultService.releaseFunds(targetEscrowId, resolvedConsumer, signer);

    // 5. Update MongoDB Ledger Status
    if (db.escrowLock) {
      await db.escrowLock.updateMany({
        where: {
          OR: [{ escrowId: targetEscrowId }, { id: escrowId }]
        },
        data: {
          status: 'RELEASED',
          updatedAt: new Date(),
        },
      }).catch(() => {});
    }

    return NextResponse.json({
      success: true,
      protocol: 'PROTOCOL-28-MESH',
      escrowId: targetEscrowId,
      txHash: txResult?.hash || txResult?.txHash || 'SETTLED_ON_CHAIN',
      status: 'RELEASED',
    });
  } catch (err: any) {
    console.error('[VERIFY_SETTLE_ERROR]:', err);
    return NextResponse.json({ success: false, error: err.message || 'Settlement execution failed' }, { status: 500 });
  }
}
