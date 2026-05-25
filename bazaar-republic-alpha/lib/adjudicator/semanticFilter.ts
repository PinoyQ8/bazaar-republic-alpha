// 🛡️ MESH CONSTITUTIONAL FIREWALL (Layer 1: Semantic)

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