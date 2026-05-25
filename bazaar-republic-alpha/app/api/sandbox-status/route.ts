// app/api/sandbox-status/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // The server makes the call, bypassing Chrome's browser restrictions
    const response = await fetch('http://localhost:8000/RequestStatus?sandbox=true');
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Sandbox Offline" }, { status: 500 });
  }
}