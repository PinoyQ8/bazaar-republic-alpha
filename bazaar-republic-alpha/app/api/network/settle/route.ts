import { NextResponse } from 'next/server';
import { db } from '../../../../lib/db'; // 🛡️ Strict relative path to avoid compiler ghosts

const MOCK_MERCHANTS = [
  {
    businessName: 'Kuwa-Mesh Logistics Hub',
    category: 'LOGISTICS',
    description: 'Decentralized physical package forwarding and peer-to-peer courier node in Sector 4.',
    providerUid: 'pi_node_alpha_01',
    sectorLocation: 'Sector 4 (Kuwa-Node)',
    mbzrRate: 15,
    unitLabel: 'per package dispatch',
    isVerified: true,
    totalSettlements: 142,
    rating: 4.9,
  },
  {
    businessName: 'X570 Workstation Hardware Repair',
    category: 'HARDWARE',
    description: 'On-site node diagnostics, motherboard replacement, and BIOS flashing for MESH nodes.',
    providerUid: 'bazaar_tech_master',
    sectorLocation: 'Sector 1 (Taichi-HQ)',
    mbzrRate: 50,
    unitLabel: 'per node service',
    isVerified: true,
    totalSettlements: 89,
    rating: 5.0,
  },
  {
    businessName: 'Relay Cloud Container Hosting',
    category: 'INFRASTRUCTURE',
    description: 'High-uptime Docker container deployment for Pioneer Pi worker nodes and fallback relays.',
    providerUid: 'pi_node_beta_02',
    sectorLocation: 'Global Decentralized Mesh',
    mbzrRate: 5,
    unitLabel: 'per month container',
    isVerified: true,
    totalSettlements: 310,
    rating: 4.8,
  },
  {
    businessName: 'MESH Security Audit Sentinel',
    category: 'TECH_SERVICES',
    description: 'Smart contract vulnerability scanning and real-time MESH security auditing for Pioneer DAO projects.',
    providerUid: 'pi_node_alpha_01',
    sectorLocation: 'Sector 2 (Sentinel-Hub)',
    mbzrRate: 75,
    unitLabel: 'per contract audit',
    isVerified: true,
    totalSettlements: 44,
    rating: 5.0,
  },
];

export async function POST() {
  try {
    const seededProviders = [];

    for (const merchant of MOCK_MERCHANTS) {
      // 1. Check for Existing Provider Entry
      const existing = await (db as any).serviceProvider.findFirst({
        where: {
          businessName: merchant.businessName,
          providerUid: merchant.providerUid,
        },
      });

      if (existing) {
        // Update existing record
        const updated = await (db as any).serviceProvider.update({
          where: { id: existing.id },
          data: {
            category: merchant.category as any,
            description: merchant.description,
            sectorLocation: merchant.sectorLocation,
            mbzrRate: merchant.mbzrRate,
            unitLabel: merchant.unitLabel,
            isVerified: merchant.isVerified,
            updatedAt: new Date(),
          },
        });
        seededProviders.push(updated);
      } else {
        // Create new record
        const created = await (db as any).serviceProvider.create({
          data: {
            ...merchant,
            category: merchant.category as any,
          },
        });
        seededProviders.push(created);
      }
    }

    console.log(`[ENET-SEED] Service provider merchant fleet seeded into MongoDB.`);

    return NextResponse.json({
      success: true,
      telemetry: {
        message: 'E-Network merchant fleet successfully seeded into MongoDB.',
        seededProvidersCount: seededProviders.length,
        providers: seededProviders,
        timestamp: Date.now(),
      },
    }, { status: 200 });

  } catch (error) {
    console.error('[ENET-SEED] Merchant Seeder Fault:', error);
    return NextResponse.json(
      { success: false, error: 'SERVER-LOGIC-FAULT: Merchant fleet seeding failed.' },
      { status: 500 }
    );
  }
}

// Allow GET triggers from browser or terminal for quick testing
export async function GET() {
  return POST();
}