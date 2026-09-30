Write-Host "=== BAZAAR REPUBLIC SOVEREIGN NODE SETUP ===" -ForegroundColor Cyan

$NodeDir = "C:\Project-Bazaar"
if (!(Test-Path $NodeDir)) { New-Item -ItemType Directory -Path $NodeDir -Force | Out-Null }
Set-Location $NodeDir

$composeYaml = @"
services:
  db:
    image: mongo:6.0
    restart: always
    ports:
      - "127.0.0.1:27017:27017"
    environment:
      MONGO_INITDB_DATABASE: bazaar_republic
    volumes:
      - mongodb_data:/data/db
    networks:
      bzr-network:
        aliases:
          - mongo
          - db
    command: ["--replSet", "rs0", "--bind_ip_all"]
    healthcheck:
      test: ["CMD", "mongosh", "--eval", "try { rs.status().ok } catch (e) { try { rs.initiate({_id: 'rs0', members: [{_id: 0, host: 'db:27017'}]}); } catch (err) { quit(1); } }"]
      interval: 10s
      timeout: 5s
      retries: 5

  web:
    image: docker.io/pinoyq8/bazaar-republic-alpha:latest
    pull_policy: always
    restart: always
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_PI_SANDBOX=true
      - DATABASE_URL=mongodb://db:27017/bazaar_republic?replicaSet=rs0&readConcernLevel=majority&w=majority
      - MONGODB_URI=mongodb://db:27017/bazaar_republic?replicaSet=rs0&readConcernLevel=majority&w=majority
      - NEXT_PUBLIC_SOROBAN_RPC_URL=https://soroban-testnet.stellar.org
      - NEXT_PUBLIC_BAZAAR_VAULT_CONTRACT_ID=CBM5SVJHLHNAEUR4GA3IV5KZFPCCMGTZGMAJUNURUQIEFPTKZLKXQ3RY
    networks:
      - bzr-network
    depends_on:
      db:
        condition: service_healthy

volumes:
  mongodb_data:
    driver: local

networks:
  bzr-network:
    driver: bridge
"@

Set-Content -Path "$NodeDir\docker-compose.yml" -Encoding UTF8 -Value $composeYaml

docker compose down --remove-orphans 2>$null
docker compose pull
docker compose up -d

Write-Host "✔ Sovereign node online at http://localhost:3000" -ForegroundColor Green
