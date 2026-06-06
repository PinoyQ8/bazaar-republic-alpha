import { NextResponse } from 'next/server';
import { ServiceProvider } from '@/lib/models/ServiceProvider';
import dbConnect from '@/lib/dbConnect'; // Import your new helper

export const GET = async (request: Request) => {
  try {
    // Establish the handshake
    await dbConnect();
    
    // Fetch data safely
    const allNodes = await ServiceProvider.find({}).lean();
    return NextResponse.json({ allNodes });
    
  } catch (error) {
    console.error("Ledger Connection Error:", error);
    return NextResponse.json({ error: "Failed to handshake with the Ledger" }, { status: 500 });
  }
};