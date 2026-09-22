import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config();

const keys = Object.keys(process.env).filter((k) => {
  const upper = k.toUpperCase();
  return (
    upper.includes('SECRET') ||
    upper.includes('KEY') ||
    upper.includes('PI_') ||
    upper.includes('VAULT') ||
    upper.includes('WALLET')
  );
});

console.log('--- Configured Keys in Environment ---');
for (const k of keys) {
  const val = process.env[k] || '';
  const prefix = val.slice(0, 4);
  const len = val.length;
  console.log(` - ${k}: ${prefix}... (length: ${len})`);
}