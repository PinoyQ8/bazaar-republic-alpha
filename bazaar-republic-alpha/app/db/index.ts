import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

// The MESH now pulls the official Vercel Integration pooled string
const sql = neon(process.env.POSTGRES_URL!); 
export const db = drizzle(sql);