// Location: fix-schema.mjs
import fs from 'fs';

const schema = `datasource db {
  provider = "mongodb"
  url      = env("DATABASE_URL")
}

generator client {
  provider      = "prisma-client-js"
  output        = "./generated/client"
  binaryTargets = ["native", "windows", "rhel-openssl-3.0.x", "linux-musl-openssl-3.0.x"]
}

enum Tier {
  PIONEER
  CITIZEN
  VALIDATOR
  ELDER
  BAZAAR_FOUNDER
}

enum NodeStatus {
  ACTIVE
  SYNCING
  MAINTENANCE
  QUARANTINED
  FROZEN
  OFFLINE
}

enum NodeType {
  STANDARD
  SOLOHOST_NODE
  VALIDATOR
}

enum ListingStatus {
  ACTIVE
  LOCKED
  COMPLETED
  DISPUTED
}

enum EscrowState {
  LOCKED
  UNBONDED
  CLAIMED
}

model User {
  id            String            @id @default(auto()) @map("_id") @db.ObjectId
  walletAddress String            @unique
  nodeType      NodeType          @default(SOLOHOST_NODE)
  uptimeShield  Float             @default(100.0)
  listings      ENetworkListing[]
  vaults        VaultState[]
  createdAt     DateTime          @default(now())
  updatedAt     DateTime          @updatedAt
}

model PioneerNode {
  id                    String              @id @default(auto()) @map("_id") @db.ObjectId
  uid                   String              @unique
  username              String?             @unique
  walletAddress         String?             @unique
  tier                  Tier                @default(PIONEER)
  status                NodeStatus          @default(ACTIVE)
  isFrozen              Boolean             @default(false)
  freezeReason          String?
  countryCode           String?
  phonePrefix           String?
  pppMultiplier         Float               @default(1.0)
  balanceSubunits       String              @default("0")
  mbzrBalance           Float               @default(0.0)
  dormancyPiBalance     Float               @default(0.0)
  dormancyMBzrBalance   Float               @default(0.0)
  stakedPi              Float               @default(0.0)
  mintedPiTotal         Float               @default(0.0)
  cpuUsage              Float               @default(0.0)
  ramUsage              Float               @default(0.0)
  ssdLatency            String              @default("100 MB/s")
  downtimeHours         Float               @default(0.0)
  uptimeShield          Float               @default(100.0)
  trustScore            Float               @default(100.0)
  quarantineStatus      String              @default("NONE")
  quarantineDate        DateTime?
  lastActivityTimestamp DateTime            @default(now())
  lastHeartbeat         DateTime            @default(now())
  createdAt             DateTime            @default(now())
  updatedAt             DateTime            @updatedAt
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
  pioneer      PioneerNode @relation(fields: [pioneerUid], references: [uid], onDelete: Cascade)

  @@index([pioneerUid])
}

model SecurityCircle {
  id          String   @id @default(auto()) @map("_id") @db.ObjectId
  pioneerUid  String   @unique
  circleNodes String[]
  trustScore  Float    @default(100.0)
  updatedAt   DateTime @updatedAt
}

model AcademyLog {
  id           String   @id @default(auto()) @map("_id") @db.ObjectId
  pioneerUid   String
  moduleLocked String
  action       String
  timestamp    DateTime @default(now())

  @@index([pioneerUid, moduleLocked])
}

model MeshLedger {
  id          String   @id @default(auto()) @map("_id") @db.ObjectId
  txHash      String?  @unique
  fromUid     String
  toUid       String
  amount      Float
  type        String
  description String?
  timestamp   DateTime @default(now())

  @@index([fromUid])
  @@index([toUid])
}

model LedgerLog {
  id        String   @id @default(auto()) @map("_id") @db.ObjectId
  sender    String
  receiver  String
  amount    Float
  type      String
  status    String
  timestamp DateTime @default(now())
}

model EpochBuffer {
  id             String   @id @default(auto()) @map("_id") @db.ObjectId
  epochNumber    Int      @unique @default(1)
  accumulatedPi  Float    @default(0.0)
  allocatedBonus Float    @default(0.0)
  lastSweepAt    DateTime @default(now())
  updatedAt      DateTime @updatedAt
}

model PioneerVault {
  id          String   @id @default(auto()) @map("_id") @db.ObjectId
  pioneerUid  String   @unique
  balance     Float    @default(0.0)
  lockedStake Float    @default(0.0)
  updatedAt   DateTime @updatedAt
}

model InternalProposal {
  id          String   @id @default(auto()) @map("_id") @db.ObjectId
  title       String
  description String
  proposerUid String
  status      String   @default("ACTIVE")
  votesFor    Int      @default(0)
  votesAgain  Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model VoteRecord {
  id         String   @id @default(auto()) @map("_id") @db.ObjectId
  proposalId String?
  disputeId  String?
  voterUid   String
  vote       String
  decision   String?
  timestamp  DateTime @default(now())

  @@index([proposalId])
  @@index([disputeId])
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
  escrowLocks      EscrowLock[]

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
  provider           ServiceProvider @relation(fields: [providerId], references: [id])
  dispute            DisputeRecord?

  @@index([consumerUid])
  @@index([status])
}

model DisputeRecord {
  id               String     @id @default(auto()) @map("_id") @db.ObjectId
  escrowLockId     String     @unique @db.ObjectId
  initiatorUid     String
  bondAmount       Float
  selectedElders   String[]
  votesForConsumer Int        @default(0)
  votesForMerchant Int        @default(0)
  status           String     @default("VOTING")
  reason           String?
  createdAt        DateTime   @default(now())
  updatedAt        DateTime   @updatedAt
  escrowLock       EscrowLock @relation(fields: [escrowLockId], references: [id], onDelete: Cascade)

  @@index([initiatorUid])
  @@index([status])
}

model ENetworkListing {
  id          String        @id @default(auto()) @map("_id") @db.ObjectId
  title       String
  description String
  providerId  String        @db.ObjectId
  provider    User          @relation(fields: [providerId], references: [id])
  metadataUri String
  status      ListingStatus @default(ACTIVE)
  createdAt   DateTime      @default(now())
}

model VaultState {
  id              String      @id @default(auto()) @map("_id") @db.ObjectId
  contractId      String      @unique
  userId          String      @db.ObjectId
  user            User        @relation(fields: [userId], references: [id])
  state           EscrowState @default(LOCKED)
  balance         Float
  protocolVersion Int         @default(28)
  updatedAt       DateTime    @updatedAt
}

model AuditLog {
  id        String   @id @default(auto()) @map("_id") @db.ObjectId
  action    String
  payload   String
  nodeId    String
  timestamp DateTime @default(now())
}
`;

fs.writeFileSync('prisma/schema.prisma', schema, 'utf8');
console.log('✅ prisma/schema.prisma updated successfully.');