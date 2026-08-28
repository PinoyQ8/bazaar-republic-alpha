export type VercelEnvTarget = "production" | "preview" | "development";
export type VercelEnvType = "plain" | "encrypted" | "secret" | "sensitive";

export interface VercelEnvVariable {
  key: string;
  value: string;
  type?: VercelEnvType;
  target?: VercelEnvTarget[];
  comment?: string;
}

export interface InjectEnvOptions {
  accessToken: string;
  projectIdOrName: string;
  teamId?: string | null;
  variables: VercelEnvVariable[];
  upsert?: boolean;
}

export interface VercelEnvResponse {
  created?: {
    id: string;
    key: string;
    target: VercelEnvTarget[];
    type: string;
  };
  error?: {
    code: string;
    message: string;
  };
}

/**
 * Injects or updates environment variables in a Vercel project.
 */
export async function injectVercelEnvVariables({
  accessToken,
  projectIdOrName,
  teamId,
  variables,
  upsert = true,
}: InjectEnvOptions): Promise<{ success: boolean; results: VercelEnvResponse[] }> {
  const queryParams = new URLSearchParams();
  if (upsert) queryParams.set("upsert", "true");
  if (teamId) queryParams.set("teamId", teamId);

  const url = `https://api.vercel.com/v10/projects/${encodeURIComponent(
    projectIdOrName
  )}/env?${queryParams.toString()}`;

  const results: VercelEnvResponse[] = [];

  // Vercel v10 /env endpoint accepts single objects or arrays of variables
  for (const envVar of variables) {
    const payload = {
      key: envVar.key,
      value: envVar.value,
      type: envVar.type || "encrypted",
      target: envVar.target || ["production", "preview", "development"],
      comment: envVar.comment || "Injected via Bazaar Republic integration",
    };

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data: VercelEnvResponse = await response.json();

    if (!response.ok) {
      console.error(`[VERCEL ENV ERROR] Failed to inject ${envVar.key}:`, data);
      throw new Error(
        data.error?.message || `Failed to inject ${envVar.key} (Status ${response.status})`
      );
    }

    results.push(data);
  }

  return { success: true, results };
}