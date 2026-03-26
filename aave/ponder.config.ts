import { createConfig } from "ponder";
import { AavePoolAbi } from "./abis/AavePool";

export default createConfig({
  database: {
    kind: "postgres",
    connectionString: process.env.DATABASE_URL,
  },
  chains: {
    arbitrum: {
      id: 42161,
      rpc: process.env.PONDER_RPC_URL,
    },
  },
  contracts: {
    AavePool: {
      abi: AavePoolAbi,
      chain: "arbitrum",
      address: "0x794a61358D6845594F94dc1DB02A252b5b4814aD",
      startBlock: 7742429,
    },
  },
});
