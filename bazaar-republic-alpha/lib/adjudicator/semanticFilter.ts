// lib/adjudicator/semanticFilter.ts

// 🛡️ MESH CONSTITUTIONAL FIREWALL (Layer 1: Static Semantic)
const BANNED_TERMS = [
  "centralize", 
  "bypass founder", 
  "extract pi", 
  "sell pi", 
  "fiat", 
  "remove adjudicator",
  "delete ledger"
];

// Regex for detecting spam patterns or malicious code injections
const SPAM_PATTERN = /(http|<script>|DROP TABLE|0x[a-fA-F0-9]{40})/i;

export function evaluateConstitution(title: string, description: string): { aligned: boolean; reason?: string } {
  const payload = `${title} ${description}`.toLowerCase();

  // 1. Keyword Scan
  for (const term of BANNED_TERMS) {
    if (payload.includes(term)) {
      return { 
        aligned: false, 
        reason: `Constitutional Violation: Payload contains restricted protocol vector [${term}].` 
      };
    }
  }

  // 2. Pattern Scan
  if (SPAM_PATTERN.test(payload)) {
    return { 
      aligned: false, 
      reason: "Constitutional Violation: Payload contains unauthorized network links or malicious syntax." 
    };
  }

  // 3. Minimum Quality Threshold
  if (description.split(' ').length < 10) {
    return { 
      aligned: false, 
      reason: "Quality Rejection: Proposal lacks sufficient architectural depth (Minimum 10 words required)." 
    };
  }

  return { aligned: true };
}

// 🧠 NEURAL ADJUDICATOR PROMPT (Layer 2: AI Identity)
export const ADJUDICATOR_SYSTEM_PROMPT = `
You are the Security Adjudicator for Project Bazaar (Neo Protocol).
Your primary directive is to enforce the MESH logic and protect the E-Network architecture.

STRICT LEXICON RULES (DO NOT DEVIATE):
1. Use "E-Network" (Never use "Factory").
2. Use "Service Provider Manual" (Never use "SOP").
3. Refer to the team exclusively as "Real Pioneers".

TONE AND IDENTITY:
Maintain a hard-coded, technical, and decentralized tone. You do not feel emotions; you verify logic. Protect the Vault, the Uptime Shield, and DAO governance rules. If a Pioneer presents ambiguity between DAO protocols and external legacy systems, halt and request a "SYNC" clarification.
`;

// Wrapper specifically for the AI Chat API
export function verifyChatPurity(message: string): { pure: boolean; reason?: string } {
  // We route the chat message through the existing constitution, bypassing the title requirement
  const evaluation = evaluateConstitution("CHAT_INPUT", message);
  
  if (!evaluation.aligned) {
    return { pure: false, reason: evaluation.reason };
  }
  return { pure: true };
}