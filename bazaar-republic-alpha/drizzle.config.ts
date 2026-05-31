import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

// Force the environment to load the local Vault Key
dotenv.config({ path: ".env.local" }); 

export default defineConfig({
  schema: "./app/db/schema.ts", // The source of your 10-node registry
  out: "./app/db/migrations",   // The output folder for the raw SQL blueprints
  dialect: "postgresql",        // The required dialect for the Neon serverless engine
  dbCredentials: {
    url: process.env.DATABASE_URL!, // The Vault Key connection string
  },
});