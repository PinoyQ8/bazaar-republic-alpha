// Location: app/api/auth/passkey/register/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface RegisterPasskeyRequestBody {
  pioneerUid?: string;
  credentialId?: string;
  publicKey?: string;
  transports?: string[];
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as RegisterPasskeyRequestBody;

    const headerUid =
      req.headers.get("x-pioneer-uid") || req.headers.get("x-actor-uid") || "";
    const pioneerUid = String(body.pioneerUid || headerUid || "").trim();
    const credentialId = String(body.credentialId || "").trim();
    const publicKey = String(body.publicKey || "").trim();
    const transports =
      Array.isArray(body.transports) && body.transports.length > 0
        ? body.transports.map((t) => String(t).trim()).filter(Boolean)
        : ["internal"];

    if (!pioneerUid || !credentialId || !publicKey) {
      return NextResponse.json(
        { error: "Missing required passkey registration fields" },
        { status: 400 }
      );
    }

    if (credentialId.length < 8) {
      return NextResponse.json(
        { error: "Invalid passkey credentialId format" },
        { status: 400 }
      );
    }

    // 🛡️ Type-safe assertion bypass for runtime synchronization
    const db = prisma as any;

    const pioneer = await db.pioneerNode.findUnique({
      where: { uid: pioneerUid },
    });

    if (!pioneer) {
      return NextResponse.json(
        { error: "Pioneer node not found in registry" },
        { status: 404 }
      );
    }

    const nodeStatus = String(pioneer.status || "").toUpperCase();
    if (
      pioneer.isFrozen ||
      nodeStatus === "FROZEN" ||
      nodeStatus === "QUARANTINED" ||
      nodeStatus === "SUSPENDED"
    ) {
      return NextResponse.json(
        { error: "Passkey registration is blocked for frozen or suspended nodes" },
        { status: 403 }
      );
    }

    const existingCredential = await db.passkeyCredential.findUnique({
      where: { credentialId },
    });

    if (existingCredential && existingCredential.pioneerUid !== pioneer.uid) {
      return NextResponse.json(
        { error: "Credential is already bound to another Pioneer account" },
        { status: 409 }
      );
    }

    const savedCredential = await db.passkeyCredential.upsert({
      where: { credentialId },
      update: {
        publicKey,
        transports,
        counter: { increment: 1 },
      },
      create: {
        credentialId,
        pioneerUid: pioneer.uid,
        publicKey,
        counter: 0,
        transports,
      },
    });

    await db.auditLog
      ?.create?.({
        data: {
          action: "PASSKEY_REGISTERED",
          nodeId: pioneer.uid,
          payload: JSON.stringify({
            credentialId: savedCredential.credentialId,
            transports: savedCredential.transports,
          }),
        },
      })
      .catch(() => null);

    return NextResponse.json(
      {
        success: true,
        credentialId: savedCredential.credentialId,
        pioneerUid: savedCredential.pioneerUid,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Passkey Registration Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error during passkey binding" },
      { status: 500 }
    );
  }
}