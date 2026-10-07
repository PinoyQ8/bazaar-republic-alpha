module.exports = {
  apps: [
    {
      name: "bzr-db-keeper",
      script: "scripts/bzr-ttl-keeper.cjs",
      cwd: "J:/Project-Bazaar/bazaar-republic/bazaar-republic-alpha",
      interpreter: "node",
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
      name: "bzr-ttl-sentinel",
      script: "scripts/bzr-ttl-keeper.ts",
      cwd: "J:/Project-Bazaar/bazaar-republic/bazaar-republic-alpha",
      interpreter: "node",
      node_args: "--import tsx --dns-result-order=ipv4first",
      autorestart: true,
      watch: false,
      max_memory_restart: "400M",
      env: {
        NODE_ENV: "production"
      }
    }
  ]
};
