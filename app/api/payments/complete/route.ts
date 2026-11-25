import { NextRequest } from "next/server";
import { POST as handlePiComplete } from "@/app/api/pi/complete/route";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  return handlePiComplete(req);
}