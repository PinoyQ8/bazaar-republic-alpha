import { NextRequest, NextResponse } from 'next/server';
import { Keypair } from '@stellar/stellar-sdk';
import { bazaarVaultService, BAZAAR_VAULT_CONTRACT_ID } from '@/services/bazaarVaultService';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Allow': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const rawId = searchParams.get('escrowId') || searchParams.get('id') || 'MBZR_ESCROW_CANARY_01';

    let targetEscrowId = rawId;
    const db = prisma as any;

    if (/^[0-9a-fA-F]{24}$/.test(rawId) && db?.escrowLock) {
      const dbRecord = await db.escrowLock.findUnique({
        where: { id: rawId },
      }).catch(() => null);

      if (dbRecord?.escrowId) {
        targetEscrowId = dbRecord.escrowId;
      }
    }

    const vault: any = await bazaarVaultService.getVault(targetEscrowId);

    if (vault) {
      return NextResponse.json({
        found: true,
        source: 'ON_CHAIN',
        escrowId: targetEscrowId,
        contractId: BAZAAR_VAULT_CONTRACT_ID,
        vault: {
          ...vault,
          amount: vault.amount ? vault.amount.toString() : '0',
          expires_at: vault.expires_at ? vault.expires_at.toString() : null,
        },
      }, { status: 200 });
    }

    return NextResponse.json(
      { found: false, escrowId: targetEscrowId, error: `Escrow '${targetEscrowId}' not found on ledger.` },
      { status: 404 }
    );
  } catch (error: any) {
    console.error('[API_VAULT_GET_ERROR]:', error);
    return NextResponse.json(
      { found: false, error: error?.message || 'Failed to query vault ledger' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ success: false, error: 'Invalid JSON payload in request body.' }, { status: 400 });
    }

    const { action, escrowId, consumerAddress, providerAddress, amount, secretKey } = body || {};

    if (!action || !escrowId) {
      return NextResponse.json({ success: false, error: 'Missing action or escrowId.' }, { status: 400 });
    }

    const activeSecret = secretKey || process.env.STELLAR_DEPLOYER_SECRET || process.env.STELLAR_VAULT_SEED;
    if (!activeSecret) {
      return NextResponse.json({ success: false, error: 'No signing key supplied in request or environment.' }, { status: 400 });
    }

    const signer = Keypair.fromSecret(activeSecret.trim());
    let txResponse: any;

    switch (action.toUpperCase()) {
      case 'LOCK':
        if (!consumerAddress || !providerAddress || !amount) {
          return NextResponse.json(
            { success: false, error: 'Missing consumerAddress, providerAddress, or amount for LOCK action.' },
            { status: 400 }
          );
        }
        txResponse = await bazaarVaultService.lockFunds(
          { escrowId, consumerAddress, providerAddress, amount },
          signer
        );
        break;

      case 'RELEASE':
        txResponse = await bazaarVaultService.releaseFunds(
          escrowId,
          consumerAddress || signer.publicKey(),
          signer
        );
        break;

      default:
        return NextResponse.json({ success: false, error: `Unsupported vault action: ${action}` }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      txHash: txResponse?.hash || txResponse?.txHash || 'SETTLED_ON_CHAIN',
      result: txResponse,
    }, { status: 200 });
  } catch (error: any) {
    console.error('[API_VAULT_POST_ERROR]:', error);
    return NextResponse.json({ success: false, error: error?.message || 'Vault transaction failed' }, { status: 500 });
  }
}