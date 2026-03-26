import { onchainTable } from "ponder";

export const reserve = onchainTable("reserve", (t) => ({
  address: t.hex().primaryKey(),
  symbol: t.text().notNull(),
  decimals: t.integer().notNull(),
  liquidityIndex: t.bigint().notNull().default(0n),
  variableBorrowIndex: t.bigint().notNull().default(0n),
  liquidityRate: t.bigint().notNull().default(0n),
  variableBorrowRate: t.bigint().notNull().default(0n),
  lastUpdatedAt: t.integer().notNull().default(0),
}));

export const userPosition = onchainTable("userPosition", (t) => ({
  id: t.text().primaryKey(),
  userAddress: t.hex().notNull(),
  reserveAddress: t.hex().notNull(),
  scaledATokenBalance: t.bigint().notNull().default(0n),
  scaledVariableDebt: t.bigint().notNull().default(0n),
  usageAsCollateralEnabled: t.integer().notNull().default(1),
  lastUpdatedAt: t.integer().notNull().default(0),
}));