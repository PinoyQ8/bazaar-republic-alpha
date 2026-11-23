module.exports = {
  apps: [
    {
      name: "bzr-ttl-sentinel",
      script: "scripts/bzr-ttl-keeper.ts",
      cwd: "J:/Project-Bazaar/bazaar-republic/bazaar-republic-alpha",
      interpreter: "node",
      exec_mode: "fork",
      node_args: "--import tsx --dns-result-order=ipv4first",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "400M",
      env: {
        NODE_ENV: "production"
      }
    }
  ]
};
