import { onchainTable } from "ponder";

const { hex, text, int, bigint } = onchainTable;

export const reserve = onchainTable("reserve", {
  address: hex().primaryKey(),
  symbol: text().notNull(),
  decimals: int().notNull(),
  liquidityIndex: bigint().notNull().default(0n),
  variableBorrowIndex: bigint().notNull().default(0n),
  liquidityRate: bigint().notNull().default(0n),
  variableBorrowRate: bigint().notNull().default(0n),
  lastUpdatedAt: int().notNull().default(0),
});

export const userPosition = onchainTable("userPosition", {
  id: text().primaryKey(),
  userAddress: hex().notNull(),
  reserveAddress: hex().notNull(),
  scaledATokenBalance: bigint().notNull().default(0n),
  scaledVariableDebt: bigint().notNull().default(0n),
  usageAsCollateralEnabled: int().notNull().default(1),
  lastUpdatedAt: int().notNull().default(0),
});
