import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-ethers"; // 🛡️ Lightweight Engine locked

const config: HardhatUserConfig = {
  solidity: "0.8.24", // Adjust to 0.8.20 if your .sol files specify an older pragma
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  }
};

export default config;