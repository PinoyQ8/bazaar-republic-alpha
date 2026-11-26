import { Db, MongoClient } from "mongodb";
import {
  EPOCH_REWARD_LEDGER_INDEXES,
  LIQUIDITY_POOL_COLLECTIONS,
  LIQUIDITY_POOL_ID,
  POOL_CONFIG_INDEXES,
  STAKE_POSITION_INDEXES,
  buildGenesisPoolConfig,
  buildInitialEpochLedger,
  DEFAULT_VAULT_CONTRACT_ID,
} from "./liquidityPoolSeed";

const LOCAL_MONGO_URI = "mongodb://127.0.0.1:27017/?directConnection=true";
const DB_NAME = process.env.MONGODB_DB_NAME || "bazaar_republic";

declare global {
  // eslint-disable-next-line no-var
  var __bazaarMongoClientPromise: Promise<MongoClient> | undefined;
  // eslint-disable-next-line no-var
  var __bazaarStakingEnsured: boolean | undefined;
}

function getCandidateMongoUri(): string {
  const configured = (process.env.MONGODB_URI || process.env.DATABASE_URL || "").trim();
  if (!configured || configured.includes("192.168.8.108")) {
    return LOCAL_MONGO_URI;
  }
  return configured;
}

async function connectWithFallback(): Promise<MongoClient> {
  const primaryUri = getCandidateMongoUri();
  const primaryClient = new MongoClient(primaryUri, { serverSelectionTimeoutMS: 2500 });

  try {
    await primaryClient.connect();
    return primaryClient;
  } catch (err: unknown) {
    await primaryClient.close().catch(() => {});
    if (primaryUri !== LOCAL_MONGO_URI) {
      const fallbackClient = new MongoClient(LOCAL_MONGO_URI, { serverSelectionTimeoutMS: 2500 });
      await fallbackClient.connect();
      return fallbackClient;
    }
    throw err;
  }
}

export async function getStakingDb(): Promise<Db> {
  if (!global.__bazaarMongoClientPromise) {
    global.__bazaarMongoClientPromise = connectWithFallback().catch((err) => {
      global.__bazaarMongoClientPromise = undefined;
      throw err;
    });
  }

  const client = await global.__bazaarMongoClientPromise;
  const db = client.db(DB_NAME);

  if (!global.__bazaarStakingEnsured) {
    await Promise.all([
      db.collection(LIQUIDITY_POOL_COLLECTIONS.config).createIndexes(POOL_CONFIG_INDEXES),
      db.collection(LIQUIDITY_POOL_COLLECTIONS.stakes).createIndexes(STAKE_POSITION_INDEXES),
      db.collection(LIQUIDITY_POOL_COLLECTIONS.epochs).createIndexes(EPOCH_REWARD_LEDGER_INDEXES),
    ]);

    const now = new Date();
    const configCol = db.collection(LIQUIDITY_POOL_COLLECTIONS.config);
    const epochsCol = db.collection(LIQUIDITY_POOL_COLLECTIONS.epochs);

    const existingPool = await configCol.findOne({ poolId: LIQUIDITY_POOL_ID });
    if (!existingPool) {
      await configCol.insertOne(buildGenesisPoolConfig(now, DEFAULT_VAULT_CONTRACT_ID));
    }

    const existingEpoch1 = await epochsCol.findOne({ epochNumber: 1 });
    if (!existingEpoch1) {
      await epochsCol.insertOne(buildInitialEpochLedger(1, now));
    }

    global.__bazaarStakingEnsured = true;
  }

  return db;
}

export function safeBigInt(value: string | number | bigint | undefined | null, fallback = 0n): bigint {
  if (typeof value === "bigint") return value;
  if (typeof value === "number") return Number.isFinite(value) ? BigInt(Math.trunc(value)) : fallback;
  if (typeof value === "string" && value.trim().length > 0) {
    try {
      return BigInt(value.trim());
    } catch {
      return fallback;
    }
  }
  return fallback;
}

export function generateStakeId(nowMs: number = Date.now()): string {
  const suffix = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `LP_STK_${Math.floor(nowMs / 1000)}_${suffix}`;
}