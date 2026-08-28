// app/api/adjudicator/chat/route.ts
import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { ADJUDICATOR_SYSTEM_PROMPT, verifyChatPurity } from '@/lib/adjudicator/semanticFilter';

// Lock max duration for Vercel deployment stability
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    
    const latestMessage = messages[messages.length - 1]?.content || "";
    
    // 1. MESH-SCAN: Check against the Constitutional Firewall
    const purityCheck = verifyChatPurity(latestMessage);
    if (!purityCheck.pure) {
      return new Response(
        JSON.stringify({ error: purityCheck.reason }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 2. LOGIC FORGE: Stream the Neural Adjudicator's response
    const result = await streamText({
      model: openai('gpt-4o'), 
      system: ADJUDICATOR_SYSTEM_PROMPT,
      messages,
    });

    // MESH-FIX: Aligned to the local AI-SDK declaration
    return result.toTextStreamResponse();
    
  } catch (error) {
    console.error("MESH-ERROR:", error);
    return new Response(
      JSON.stringify({ error: "Internal E-Network fault. Adjudicator offline." }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
