// Location: setup-db-client.mjs
import fs from 'fs';
import path from 'path';

// 1. Write Clean Schema v2.7.2
const schemaContent = `datasource db {
  provider = "mongodb"
  url      = env("DATABASE_URL")
}

generator client {
  provider      = "prisma-client-js"
  output        = "./generated/client"
  binaryTargets = ["native", "windows", "rhel-openssl-3.0.x", "linux-musl-openssl-3.0.x"]
}

enum Tier {
  GENESIS
  CITIZEN
  NOVICE
  ACADEMY_CORE
  MESH_GUARDIAN
  BAZAAR_FOUNDER
  STANDARD
}

enum NodeStatus {
  SYNCING
  ACTIVE
  FROZEN
  SUSPENDED
  QUARANTINED
  MAINTENANCE
}

enum ProposalStatus {
  ACTIVE
  PASSED
  REJECTED
  EXPIRED
}

enum VoteDecision {
  YES
  NO
  ABSTAIN
}

enum PaymentStatus {
  INITIALIZED
  PENDING
  APPROVED
  COMPLETED
  CANCELLED
  FAILED
}

enum LedgerTxType {
  GENESIS_MINT
  EARLY_REDEEM
  SERVICE_SETTLEMENT
}

model PioneerNode {
  id                    String      @id @default(auto()) @map("_id") @db.ObjectId
  uid                   String      @unique
  username              String?     @unique
  walletAddress         String?     @unique
  tier                  Tier        @default(CITIZEN)
  status                NodeStatus  @default(SYNCING)
  isFrozen              Boolean     @default(false)
  freezeReason          String?
  trustScore            Float       @default(100.0)
  regionCode            String?     @default("US")
  countryCode           String?     @default("US")
  phonePrefix           String?     @default("+1")
  pppMultiplier         Float       @default(1.0)
  balance               String?     @default("0")
  mbzrBalance           Float       @default(0)
  mbzrBalanceSubunits   String?     @default("0")
  mbzrBalanceFormatted  String?     @default("0.0000000")
  cpuUsage              String?     @default("25.0%")
  ramUsage              String?     @default("4.0GB")
  ssdLatency            String?     @default("100 MB/s")
  downtimeHours         Float       @default(0)
  accumulatedDowntime   Float       @default(0)
  uptimeShield          Float       @default(100.0)
  stakedPi              Float       @default(0)
  mintedPiTotal         Float       @default(0)
  signature             String?
  ledgerHeight          Int         @default(0)
  syncState             String      @default("Unknown")
  activePeers           Int         @default(0)
  protocol              String      @default("24")
  isUnderRemoteRescue   Boolean     @default(false)
  quarantineStatus      String      @default("NONE")
  migrationHash         String?
  quarantineDate        DateTime?
  dormancyPiBalance     Float       @default(0)
  dormancyMBzrBalance   Float       @default(0)
  lastEpochYield        Float       @default(0)
  nextEpochEligible     DateTime?
  stakeWeight           Float       @default(0)
  lastActivityTimestamp DateTime    @default(now())
  lastHeartbeat         DateTime    @default(now())
  createdAt             DateTime    @default(now())
  updatedAt             DateTime    @updatedAt

  paymentsMade          Payment[]           @relation("PaymentsMade")
  passkeys              PasskeyCredential[]

  @@index([status, trustScore])
  @@index([quarantineStatus])
}

model PasskeyCredential {
  id           String      @id @default(auto()) @map("_id") @db.ObjectId
  credentialId String      @unique
  pioneerUid   String
  publicKey    String
  counter      Int         @default(0)
  transports   String[]
  createdAt    DateTime    @default(now())
  updatedAt    DateTime    @updatedAt

  pioneer PioneerNode @relation(fields: [pioneerUid], references: [uid])

  @@index([pioneerUid])
}

model SecurityCircle {
  id        String   @id @default(auto()) @map("_id") @db.ObjectId
  nodeUid   String   @unique
  peers     String[]
  trustTier Tier     @default(STANDARD)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model ServiceProvider {
  id               String       @id @default(auto()) @map("_id") @db.ObjectId
  businessName     String
  category         String
  description      String
  providerUid      String
  sectorLocation   String
  mbzrRate         Float
  unitLabel        String
  isVerified       Boolean      @default(false)
  totalSettlements Int          @default(0)
  rating           Float        @default(5.0)
  createdAt        DateTime     @default(now())
  updatedAt        DateTime     @updatedAt

  escrowLocks EscrowLock[]

  @@index([category, isVerified])
}

model EscrowLock {
  id                 String          @id @default(auto()) @map("_id") @db.ObjectId
  escrowId           String          @unique
  paymentId          String?         @unique
  txid               String?         @unique
  consumerUid        String
  providerId         String          @db.ObjectId
  amount             Float
  token              String          @default("PI")
  status             String          @default("LOCKED")
  timelockExpiresAt  DateTime
  serviceDescription String
  createdAt          DateTime        @default(now())
  updatedAt          DateTime        @updatedAt

  provider ServiceProvider @relation(fields: [providerId], references: [id])

  @@index([consumerUid])
  @@index([status])
}

model DisputeRecord {
  id           String       @id @default(auto()) @map("_id") @db.ObjectId
  escrowId     String       @unique
  status       String       @default("PENDING")
  initiatorUid String
  createdAt    DateTime     @default(now())
  updatedAt    DateTime     @updatedAt
  votes        VoteRecord[]

  @@index([status])
}

model VoteRecord {
  id        String        @id @default(auto()) @map("_id") @db.ObjectId
  disputeId String        @db.ObjectId
  voterUid  String
  decision  String
  createdAt DateTime      @default(now())
  dispute   DisputeRecord @relation(fields: [disputeId], references: [id], onDelete: Cascade)

  @@index([disputeId])
}

model MeshLedger {
  id             String       @id @default(auto()) @map("_id") @db.ObjectId
  walletId       String?
  txSignature    String?      @unique
  txHash         String?
  txType         LedgerTxType @default(SERVICE_SETTLEMENT)
  fromUid        String?
  toUid          String?
  piAmount       Float        @default(0)
  mbzrAmount     Float        @default(0)
  amount         Float        @default(0)
  penaltyApplied Float        @default(0)
  meltBurnAmount Float        @default(0)
  yieldAmount    Float        @default(0)
  status         String       @default("CONFIRMED")
  description    String?
  timestamp      DateTime?    @default(now())
  createdAt      DateTime?    @default(now())

  @@index([walletId])
  @@index([txType])
}

model InternalProposal {
  id           String            @id @default(auto()) @map("_id") @db.ObjectId
  title        String
  description  String
  status       ProposalStatus    @default(ACTIVE)
  authorUid    String?
  votesFor     Int               @default(0)
  votesAgainst Int               @default(0)
  createdAt    DateTime          @default(now())
  updatedAt    DateTime          @updatedAt
  expiresAt    DateTime?

  votes VoteRecordModel[]
}

model VoteRecordModel {
  id         String           @id @default(auto()) @map("_id") @db.ObjectId
  decision   VoteDecision
  proposalId String           @db.ObjectId
  voterId    String
  voterUid   String?
  createdAt  DateTime         @default(now())
  proposal   InternalProposal @relation(fields: [proposalId], references: [id], onDelete: Cascade)

  @@map("vote_records")
}

model Payment {
  id          String        @id @default(auto()) @map("_id") @db.ObjectId
  paymentId   String        @unique
  txid        String        @unique
  payerUid    String
  merchantUid String
  amount      Float
  status      PaymentStatus @default(COMPLETED)
  createdAt   DateTime      @default(now())

  payer PioneerNode @relation("PaymentsMade", fields: [payerUid], references: [uid])
}

model AuditLog {
  id        String   @id @default(auto()) @map("_id") @db.ObjectId
  action    String
  payload   String
  nodeId    String
  timestamp DateTime @default(now())
}

model RelayerSyncState {
  id         String   @id @default(auto()) @map("_id") @db.ObjectId
  lastLedger Int      @default(0)
  updatedAt  DateTime @updatedAt
}

model AcademyLog {
  id         String   @id @default(auto()) @map("_id") @db.ObjectId
  pioneerUid String
  moduleKey  String
  status     String   @default("COMPLETED")
  createdAt  DateTime @default(now())

  @@unique([pioneerUid, moduleKey])
}

model PioneerVault {
  id          String   @id @default(auto()) @map("_id") @db.ObjectId
  pioneerUid  String   @unique
  balance     Float    @default(0.0)
  lockedStake Float    @default(0.0)
  updatedAt   DateTime @updatedAt
}

model EpochBuffer {
  id             String   @id @default(auto()) @map("_id") @db.ObjectId
  epochNumber    Int      @unique @default(1)
  accumulatedPi  Float    @default(0.0)
  allocatedBonus Float    @default(0.0)
  lastSweepAt    DateTime @default(now())
  updatedAt      DateTime @updatedAt
}
`;

fs.writeFileSync('prisma/schema.prisma', schemaContent, 'utf8');
console.log('✅ 1. prisma/schema.prisma written cleanly.');

// 2. Write lib/prisma.ts Singleton
const prismaSingleton = `import { PrismaClient } from 'bzr-db';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
export default prisma;
`;

fs.writeFileSync('lib/prisma.ts', prismaSingleton, 'utf8');
console.log('✅ 2. lib/prisma.ts written cleanly.');