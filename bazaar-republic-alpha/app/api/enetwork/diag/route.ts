import { NextResponse } from 'next/server';
import { connectToLedger } from '@/lib/mongodb';
import { ServiceProvider } from '@/lib/models/ServiceProvider';

export const GET = async (request: Request) => {
  await connectToLedger();
  // Fetch ALL providers regardless of status
  const allNodes = await ServiceProvider.find({}).lean();
  return NextResponse.json({ allNodes });
};