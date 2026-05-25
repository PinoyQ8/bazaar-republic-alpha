"use server";

import clientPromise from "@/lib/mongodb";
import { revalidatePath } from "next/cache";

// 🛡️ ACTION CONTRACT: Shared Type for Registry Operations
export type ActionResult = {
  success: boolean;
  message?: string;
};

// 🛡️ EXPORTED: Registration Logic
export async function registerServiceProvider(formData: FormData): Promise<ActionResult> {
  const pioneerId = formData.get("pioneerId") as string;
  const title = formData.get("title") as string;
  const rate = formData.get("rate") as string;

  try {
    const db = await (await clientPromise).db("bazaar_republic");

    if (!pioneerId || !title || !rate) {
      return { success: false, message: "MALFORMED_PAYLOAD" };
    }

    await db.collection("provider_ledger").insertOne({
      pioneerId,
      serviceTitle: title,
      description: formData.get("description") as string,
      rate: rate,
      rateType: formData.get("type") as string,
      status: "ACTIVE",
      createdAt: new Date(),
    });

    revalidatePath("/enetwork/dashboard");
    return { success: true };
    
  } catch (error) {
    console.error("[MESH-BRIDGE] 🚨 Action Fracture:", error);
    return { success: false, message: "DATABASE_CONNECTION_REFUSED" };
  }
}

// 🛡️ EXPORTED: Ledger Fetch Logic (CRITICAL: Must have 'export' keyword)
export async function getActiveProviders() {
  try {
    const db = await (await clientPromise).db("bazaar_republic");
    
    const providers = await db.collection("provider_ledger")
      .find({ status: "ACTIVE" })
      .toArray();

    return providers.map(p => ({
      id: p._id.toString(),
      pioneer: p.pioneerId,
      service: p.serviceTitle,
      description: p.description,
      rate: `${p.rate} Pi / ${p.rateType}`,
      status: p.status,
      rating: p.rating || 100
    }));
  } catch (error) {
    console.error("[MESH-BRIDGE] 🚨 Registry fetch failed:", error);
    return [];
  }
}