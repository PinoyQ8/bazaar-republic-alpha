import { NextResponse } from 'next/server';
import { ServiceProvider } from '@/lib/models/ServiceProvider';

export const GET = async (request: Request) => {
  // Fetch ALL providers regardless of status
  const allNodes = await ServiceProvider.find({}).lean();
  return NextResponse.json({ allNodes });
};
