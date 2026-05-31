import { NextResponse } from 'next/server';
import { checkBlockchainStatus } from '@/lib/blockchain';

export async function GET() { // 🛡️ MESH-GATE: Named Export enforced
  const data = await checkBlockchainStatus();
  
  if (data.status === "FRACTURE") {
    return NextResponse.json(data, { status: 500 });
  }
  
  return NextResponse.json(data, { status: 200 });
}
