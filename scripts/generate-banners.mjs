import fs from "fs";
import path from "path";
import sharp from "sharp";

const OUTPUT_DIR = path.resolve(process.cwd(), "public/marketplace");
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const WIDTH = 1920;
const HEIGHT = 1080;

// Helper to safely escape XML characters
function escapeXml(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

const slides = [
  {
    filename: "slide-1-overview.png",
    badge: "DECENTRALIZED COMMERCE ENGINE",
    title: "Bazaar Republic",
    subtitle: "Web3 Payment Infrastructure & P2P Settlement for Pi Network",
    features: [
      { tag: "NON-CUSTODIAL", desc: "Zero passphrase or private key storage" },
      { tag: "EDGE READY", desc: "Native Next.js App Router integration" },
      { tag: "HORIZON SCP", desc: "3-stage consensus payment handshakes" },
    ],
  },
  {
    filename: "slide-2-payments.png",
    badge: "AUTOMATED SETTLEMENT",
    title: "Bidirectional Pi Payments",
    subtitle: "Complete U2A and A2U transaction lifecycle validation",
    features: [
      { tag: "A2U PAYOUTS", desc: "Automated developer-to-pioneer disbursement" },
      { tag: "MEMO MATCH", desc: "28-character cryptographic verification" },
      { tag: "LEDGER AUDIT", desc: "Real-time Stellar consensus tracking" },
    ],
  },
  {
    filename: "slide-3-developer.png",
    badge: "DEVELOPER PROTOCOL",
    title: "Zero-Config Deployment",
    subtitle: "Inject database endpoints and sync environment secrets at the edge",
    features: [
      { tag: "NEON POSTGRES", desc: "Serverless pooled database synchronization" },
      { tag: "REST & RPC", desc: "Standardized /api/payments route handlers" },
      { tag: "WEBHOOK SYNC", desc: "Real-time deployment and project status events" },
    ],
  },
];

function buildSvg(slide) {
  const safeTitle = escapeXml(slide.title);
  const safeSubtitle = escapeXml(slide.subtitle);
  const safeBadge = escapeXml(slide.badge);

  const cardsSvg = slide.features
    .map((feat, i) => {
      const x = 180 + i * 530;
      const safeTag = escapeXml(feat.tag);
      const words = feat.desc.split(" ");
      const line1 = escapeXml(words.slice(0, 3).join(" "));
      const line2 = escapeXml(words.slice(3).join(" "));

      return `
      <g transform="translate(${x}, 660)">
        <rect width="500" height="240" rx="16" fill="#111113" stroke="#27272a" stroke-width="2"/>
        <rect x="24" y="24" width="160" height="32" rx="8" fill="#1f1f23" stroke="#3f3f46" stroke-width="1"/>
        <text x="36" y="45" fill="#f59e0b" font-family="system-ui, sans-serif" font-size="13" font-weight="700" letter-spacing="1.5">${safeTag}</text>
        <text x="24" y="110" fill="#f4f4f5" font-family="system-ui, sans-serif" font-size="20" font-weight="600">${line1}</text>
        <text x="24" y="145" fill="#a1a1aa" font-family="system-ui, sans-serif" font-size="17" font-weight="400">${line2}</text>
      </g>
    `;
    })
    .join("");

  return `
  <svg width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="glow" cx="50%" cy="30%" r="60%">
        <stop offset="0%" stop-color="#f59e0b" stop-opacity="0.12"/>
        <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
      </radialGradient>
      <linearGradient id="titleGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#ffffff"/>
        <stop offset="100%" stop-color="#d4d4d8"/>
      </linearGradient>
    </defs>

    <!-- Background -->
    <rect width="${WIDTH}" height="${HEIGHT}" fill="#09090b"/>
    <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#glow)"/>

    <!-- Outer Frame -->
    <rect x="40" y="40" width="${WIDTH - 80}" height="${HEIGHT - 80}" rx="24" fill="none" stroke="#27272a" stroke-width="2"/>

    <!-- Pill Badge -->
    <g transform="translate(180, 160)">
      <rect width="320" height="38" rx="19" fill="#1c1917" stroke="#b45309" stroke-width="1.5"/>
      <circle cx="20" cy="19" r="5" fill="#f59e0b"/>
      <text x="36" y="24" fill="#fbbf24" font-family="system-ui, sans-serif" font-size="13" font-weight="700" letter-spacing="1.5">${safeBadge}</text>
    </g>

    <!-- Headings -->
    <text x="180" y="320" fill="url(#titleGrad)" font-family="system-ui, -apple-system, sans-serif" font-size="64" font-weight="800" letter-spacing="-1.5">${safeTitle}</text>
    <text x="180" y="390" fill="#a1a1aa" font-family="system-ui, sans-serif" font-size="26" font-weight="400">${safeSubtitle}</text>

    <!-- Divider -->
    <line x1="180" y1="460" x2="1740" y2="460" stroke="#27272a" stroke-width="2"/>

    <!-- Cards -->
    ${cardsSvg}
  </svg>
  `;
}

async function run() {
  for (const slide of slides) {
    const svgBuffer = Buffer.from(buildSvg(slide));
    const outputPath = path.join(OUTPUT_DIR, slide.filename);

    await sharp(svgBuffer)
      .png({ quality: 100 })
      .toFile(outputPath);

    console.log(`✓ Generated 16:9 Banner: ${outputPath}`);
  }
}

run().catch((err) => {
  console.error("Error generating banners:", err);
  process.exit(1);
});