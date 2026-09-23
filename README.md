# Bazaar Republic Alpha (dApp & SoloHost Node Hub)

The production client-facing decentralized application, consumer marketplace, and SoloHost telemetry interface for **Project Bazaar**, built on the Pi Network and Stellar Soroban infrastructure.

---

## Architecture Overview

While the underlying settlement contracts and multi-language verification SDKs reside in [bazaar-republic-core](https://github.com/PinoyQ8/bazaar-republic-core), this repository hosts the full user experience, state synchronizers, and decentralized host services:

* **Next.js Web3 dApp (pp/, components/)**: Production merchant storefront, escrow interaction flows, decentralized identity routing, and governance voter portals.
* **SoloHost Node Telemetry (solohost/, solohost.json)**: Daemon processes, container status monitors, healthcheck pingers, and hardware-accelerated telemetry dashboards.
* **Client Integration Services (services/, lib/, hooks/)**: Client-side transaction builders, state stores, and real-time WebSocket bridges.

---

## Getting Started

### Prerequisites

* Node.js v20.x or higher
* npm or pnpm
* Modern Web3 browser or Pi Browser viewport emulator

### Installation

\\\ash
# Install frontend dependencies
npm install

# Run the local development server
npm run dev
\\\

Open [http://localhost:3000](http://localhost:3000) with your browser or mobile viewport emulator (e.g. S23 Ultra responsive mode) to inspect the interface.

---

## Connected Repositories

* **Settlement Engine & SDK Ports**: [bazaar-republic-core](https://github.com/PinoyQ8/bazaar-republic-core) — Soroban Rust smart contracts, WASM build artifacts, and Python/PHP verification test suites.
