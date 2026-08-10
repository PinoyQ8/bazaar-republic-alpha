// PROJECT BAZAAR DAO - PROTOCOL 26.1
// API ROUTE: PI NETWORK WALLET AUTHENTICATION & VERIFICATION

import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { accessToken } = body;

    if (!accessToken) {
      return NextResponse.json(
        { error: 'MESH REJECT: Missing Pi Access Token.' },
        { status: 400 }
      );
    }

    // Call Pi Platform API to verify user credentials
    const piApiResponse = await fetch('https://api.minepi.com/v2/me', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!piApiResponse.ok) {
      return NextResponse.json(
        { error: 'MESH REJECT: Invalid or Expired Pi Access Token.' },
        { status: 401 }
      );
    }

    const piUserData = await piApiResponse.json();

    // Return verified node / pioneer session profile
    return NextResponse.json({
      success: true,
      uid: piUserData.uid,
      username: piUserData.username,
      roles: piUserData.roles || ['Pioneer'],
      timestamp: Date.now(),
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'SERVER PANIC: Pi Authentication Gateway Fault.', details: String(error) },
      { status: 500 }
    );
  }
}