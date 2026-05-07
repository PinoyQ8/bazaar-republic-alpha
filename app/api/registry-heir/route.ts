import { db } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  // Obtain a dedicated client from the pool
  const client = await db.connect();

  try {
    const { citizen_uid, heirs } = await request.json(); 

    if (!citizen_uid || !heirs || heirs.length === 0) {
      return NextResponse.json({ message: "FAULT: Incomplete Heir Payload" }, { status: 400 });
    }

    // PHASE 1: OPEN TRANSACTION
    await client.sql`BEGIN`;

    // PHASE 2: PURGE EXISTING DATA (The Clean Slate)
    await client.sql`
      DELETE FROM heir_registry 
      WHERE citizen_uid = ${citizen_uid}
    `;

    // PHASE 3: SEQUENTIAL INJECTION
    // We loop through the array and execute individual prepared statements
    for (const heir of heirs) {
      await client.sql`
        INSERT INTO heir_registry (citizen_uid, heir_label, heir_wallet_address, allocation_percentage)
        VALUES (${citizen_uid}, ${heir.label}, ${heir.address}, ${heir.percent})
      `;
    }

    // PHASE 4: SEAL THE TRANSACTION
    await client.sql`COMMIT`;

    return NextResponse.json({ message: "HEIR REGISTRY SEALED" }, { status: 200 });

  } catch (error: any) {
    // CRITICAL: Rollback if any part of the chain fractures
    await client.sql`ROLLBACK`;
    console.error("VAULT_FORGE_ERROR:", error.message);
    return NextResponse.json({ message: `VAULT ERROR: ${error.message}` }, { status: 500 });
  } finally {
    // Release the client back to the MESH pool
    client.release();
  }
}