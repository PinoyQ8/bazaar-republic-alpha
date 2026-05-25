import { NextResponse } from 'next/server';
import { connectToLedger } from '@/lib/mongodb';
import { PioneerNode } from '@/lib/models/PioneerNode';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { uid, amount } = body;

    if (!uid || amount === undefined) {
      return NextResponse.json({ success: false, error: "INVALID_PAYLOAD" }, { status: 400 });
    }

    await connectToLedger();

    const updatedNode = await PioneerNode.findOneAndUpdate(
      { uid: uid.toLowerCase() },
      { $inc: { stakedBalance: Number(amount) } },
      { new: true }
    ).lean();

    if (!updatedNode) {
      return NextResponse.json({ success: false, error: "NODE_NOT_FOUND" }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      newBalance: updatedNode.stakedBalance 
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: "SERVER_ERROR" }, { status: 500 });
  }
}