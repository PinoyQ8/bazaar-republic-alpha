import { NextResponse } from 'next/server';
import { db } from '../../../../lib/db';

export async function GET() {
  try {
    const updatedNode = await db.pioneerNode.upsert({
      where: { uid: 'pi_node_founder_99' },
      update: { mbzrBalance: 5000 },
      create: { 
        uid: 'pi_node_founder_99', 
        username: 'PinoyQ8_Dev', 
        mbzrBalance: 5000, 
        tier: 'BAZAAR_FOUNDER',
        status: 'ACTIVE'
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: 'LIQUIDITY SECURED', 
      node: updatedNode 
    }, { status: 200 });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
