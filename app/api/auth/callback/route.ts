import { NextRequest, NextResponse } from "next/server";
import { injectVercelEnvVariables } from "@/app/lib/vercel-env";

export const dynamic = "force-dynamic";

/**
 * Validates the redirect target to prevent open redirect exploits.
 */
function getSafeRedirectUrl(next: string | null, baseUrl: string, configId?: string): URL {
  if (!next) {
    // Default fallback to configuration dashboard
    const fallback = new URL("/integration/configure", baseUrl);
    if (configId) fallback.searchParams.set("configurationId", configId);
    return fallback;
  }

  try {
    const parsed = new URL(next, baseUrl);
    const host = parsed.hostname.toLowerCase();

    // Allow internal relative paths or verified Vercel origins
    if (
      parsed.origin === new URL(baseUrl).origin ||
      host === "vercel.com" ||
      host.endsWith(".vercel.com") ||
      host === "vercel.app" ||
      host.endsWith(".vercel.app")
    ) {
      return parsed;
    }
  } catch {
    // Fallback on malformed URL string
  }

  return new URL("/integration/configure", baseUrl);
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const configurationId = searchParams.get("configurationId");
  const teamId = searchParams.get("teamId");
  const next = searchParams.get("next");

  // 1. Validate incoming OAuth parameters
  if (!code) {
    return NextResponse.json(
      { error: "Missing authorization code" },
      { status: 400 }
    );
  }

  const clientId = process.env.VERCEL_CLIENT_ID;
  const clientSecret = process.env.VERCEL_CLIENT_SECRET;
  const redirectUri =
    process.env.VERCEL_REDIRECT_URI ||
    "https://mesh-academy-alpha.vercel.app/api/auth/callback";

  if (!clientId || !clientSecret) {
    console.error("[OAUTH CONFIG ERROR] Missing VERCEL_CLIENT_ID or VERCEL_CLIENT_SECRET.");
    return NextResponse.json(
      { error: "Integration server misconfigured" },
      { status: 500 }
    );
  }

  try {
    // 2. Exchange authorization code for permanent access token
    const tokenResponse = await fetch("https://api.vercel.com/v2/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      console.error("[OAUTH TOKEN ERROR]", tokenData);
      return NextResponse.json(
        { error: tokenData.error_description || "Token exchange failed" },
        { status: tokenResponse.status }
      );
    }

    const {
      access_token,
      installation_id,
      user_id,
      team_id: returnedTeamId,
    } = tokenData;

    const resolvedConfigId = configurationId || installation_id;
    const resolvedOwnerId = returnedTeamId || teamId || user_id;

    console.log(
      `[INTEGRATION INSTALLED] Config ID: ${resolvedConfigId} | Owner: ${resolvedOwnerId}`
    );

    // 3. Optional: Trigger environment variable injection if projectId is known
    // If installed at the project scope, variables can be injected immediately:
    /*
    const targetProjectId = searchParams.get("projectId");
    if (targetProjectId) {
      await injectVercelEnvVariables({
        accessToken: access_token,
        projectIdOrName: targetProjectId,
        teamId: returnedTeamId,
        variables: [
          { key: "PI_NETWORK_ENV", value: "production", type: "plain" },
          { key: "PI_API_ENDPOINT", value: "https://api.minepi.com", type: "plain" },
        ],
      });
    }
    */

    // 4. Securely redirect user back to Vercel or your configure dashboard
    const destination = getSafeRedirectUrl(next, request.url, resolvedConfigId);
    return NextResponse.redirect(destination);
  } catch (error) {
    console.error("[OAUTH CALLBACK ERROR]", error);
    return NextResponse.json(
      { error: "Internal server error during handshake" },
      { status: 500 }
    );
  }
}