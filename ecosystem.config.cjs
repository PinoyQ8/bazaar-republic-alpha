module.exports = {
  apps: [
    {
      name: "bzr-ttl-keeper",
      script: "scripts/bzr-ttl-keeper.cjs",
      cwd: "J:/Project-Bazaar/bazaar-republic/bazaar-republic-alpha",
      interpreter: "node",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "300M",
      restart_delay: 5000,
      env: {
        NODE_ENV: "production",
        NODE_ID: "Node-001-X570-Taichi",
        ESCROW_TTL_SECONDS: "86400",
        SWEEP_INTERVAL_MS: "30000"
      }
    }
  ]
};
