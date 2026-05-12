// Route: /app/api/auth/verify/route.ts
// Logic: Pi Backend Verification & HttpOnly Cookie Forge

import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { accessToken } = body;

    if (!accessToken) {
      console.error("MESH Error: Null token intercepted.");
      return NextResponse.json({ error: 'Invalid payload.' }, { status: 400 });
    }

    // Ping the Pi Network Backend to verify the token
    const piVerifyResponse = await fetch('https://api.minepi.com/v2/me', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!piVerifyResponse.ok) {
      console.warn("MESH Alert: Rogue token rejected by Pi API.");
      return NextResponse.json({ error: 'Authentication failed.' }, { status: 401 });
    }

    const pioneerData = await piVerifyResponse.json();

    // The Vault Key: Generate response and set the HttpOnly cookie
    const response = NextResponse.json({ 
      success: true, 
      uid: pioneerData.uid,
      message: "Node Handshake Successful" 
    });

    // Hard-coding the State Lock
    response.cookies.set({
      name: 'mesh_session_token',
      value: accessToken, // In a future v23 patch, we will wrap this in a JWT
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // True on Vercel, False on localhost:3000
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7 // 7-day session buffer
    });

    return response;

  } catch (error) {
    console.error("MESH Error: Vault route failure.", error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}