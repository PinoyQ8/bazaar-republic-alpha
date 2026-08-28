module.exports = {
  apps: [
    {
      name: "bzr-db-keeper",
      script: "scripts/bzr-ttl-keeper.cjs",
      cwd: "J:/Project-Bazaar/bazaar-republic/bazaar-republic-alpha",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "300M",
      env: {
        NODE_ENV: "production",
        NODE_ID: "Node-001-X570-Taichi",
        ESCROW_TTL_SECONDS: "86400",
        SWEEP_INTERVAL_MS: "30000"
      }
    },
    {
      name: "soroban-ttl-sentinel",
      script: "scripts/ttl-keeper.ts",
      cwd: "J:/Project-Bazaar/bazaar-republic/bazaar-republic-alpha",
      interpreter: "node",
      interpreter_args: "--import tsx",
      instances: 1,
      autorestart: true,
      // cron disabled in favor of internal loop
      watch: false,
      max_memory_restart: "400M",
      env: {
        NODE_ENV: "production",
        NEXT_PUBLIC_BAZAAR_VAULT_CONTRACT_ID: "CCLEEATNMEUZGVSYL4NSZYADVCAPU2EFCJNCNV77KVOUDFO3CGM3SKKL"
      }
    }
  ]
};

