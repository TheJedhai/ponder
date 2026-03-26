import { ponder } from "ponder:registry";
import { reserve, userPosition } from "ponder:schema";

// Helper para gerar o id composto de userPosition
function positionId(userAddress: string, reserveAddress: string): string {
  return `${userAddress.toLowerCase()}-${reserveAddress.toLowerCase()}`;
}

// ReserveDataUpdated: atualiza os índices de juros do ativo
ponder.on("AavePool:ReserveDataUpdated", async ({ event, context }) => {
  const reserveAddress = event.args.reserve.toLowerCase();
  await context.db
    .insert(reserve)
    .values({
      address: reserveAddress as `0x${string}`,
      symbol: "",
      decimals: 0,
      liquidityIndex: event.args.liquidityIndex,
      variableBorrowIndex: event.args.variableBorrowIndex,
      liquidityRate: event.args.liquidityRate,
      variableBorrowRate: event.args.variableBorrowRate,
      lastUpdatedAt: Number(event.block.timestamp),
    })
    .onConflictDoUpdate({
      liquidityIndex: event.args.liquidityIndex,
      variableBorrowIndex: event.args.variableBorrowIndex,
      liquidityRate: event.args.liquidityRate,
      variableBorrowRate: event.args.variableBorrowRate,
      lastUpdatedAt: Number(event.block.timestamp),
    });
});

// Supply: usuário depositou colateral
ponder.on("AavePool:Supply", async ({ event, context }) => {
  const userAddress = event.args.onBehalfOf.toLowerCase();
  const reserveAddress = event.args.reserve.toLowerCase();
  const id = positionId(userAddress, reserveAddress);

  await context.db
    .insert(userPosition)
    .values({
      id,
      userAddress: userAddress as `0x${string}`,
      reserveAddress: reserveAddress as `0x${string}`,
      scaledATokenBalance: event.args.amount,
      scaledVariableDebt: 0n,
      usageAsCollateralEnabled: 1,
      lastUpdatedAt: Number(event.block.timestamp),
    })
    .onConflictDoUpdate((row) => ({
      scaledATokenBalance: row.scaledATokenBalance + event.args.amount,
      lastUpdatedAt: Number(event.block.timestamp),
    }));
});

// Withdraw: usuário retirou colateral
ponder.on("AavePool:Withdraw", async ({ event, context }) => {
  const userAddress = event.args.user.toLowerCase();
  const reserveAddress = event.args.reserve.toLowerCase();
  const id = positionId(userAddress, reserveAddress);

  await context.db
    .insert(userPosition)
    .values({
      id,
      userAddress: userAddress as `0x${string}`,
      reserveAddress: reserveAddress as `0x${string}`,
      scaledATokenBalance: 0n,
      scaledVariableDebt: 0n,
      usageAsCollateralEnabled: 1,
      lastUpdatedAt: Number(event.block.timestamp),
    })
    .onConflictDoUpdate((row) => ({
      scaledATokenBalance: row.scaledATokenBalance - event.args.amount,
      lastUpdatedAt: Number(event.block.timestamp),
    }));
});

// Borrow: usuário tomou dívida
ponder.on("AavePool:Borrow", async ({ event, context }) => {
  const userAddress = event.args.onBehalfOf.toLowerCase();
  const reserveAddress = event.args.reserve.toLowerCase();
  const id = positionId(userAddress, reserveAddress);

  await context.db
    .insert(userPosition)
    .values({
      id,
      userAddress: userAddress as `0x${string}`,
      reserveAddress: reserveAddress as `0x${string}`,
      scaledATokenBalance: 0n,
      scaledVariableDebt: event.args.amount,
      usageAsCollateralEnabled: 1,
      lastUpdatedAt: Number(event.block.timestamp),
    })
    .onConflictDoUpdate((row) => ({
      scaledVariableDebt: row.scaledVariableDebt + event.args.amount,
      lastUpdatedAt: Number(event.block.timestamp),
    }));
});

// Repay: usuário pagou dívida
ponder.on("AavePool:Repay", async ({ event, context }) => {
  const userAddress = event.args.user.toLowerCase();
  const reserveAddress = event.args.reserve.toLowerCase();
  const id = positionId(userAddress, reserveAddress);

  await context.db
    .insert(userPosition)
    .values({
      id,
      userAddress: userAddress as `0x${string}`,
      reserveAddress: reserveAddress as `0x${string}`,
      scaledATokenBalance: 0n,
      scaledVariableDebt: 0n,
      usageAsCollateralEnabled: 1,
      lastUpdatedAt: Number(event.block.timestamp),
    })
    .onConflictDoUpdate((row) => ({
      scaledVariableDebt: row.scaledVariableDebt - event.args.amount,
      lastUpdatedAt: Number(event.block.timestamp),
    }));
});

// LiquidationCall: posição foi liquidada, zera a dívida coberta
ponder.on("AavePool:LiquidationCall", async ({ event, context }) => {
  const userAddress = event.args.user.toLowerCase();
  const debtReserveAddress = event.args.debtAsset.toLowerCase();
  const collateralReserveAddress = event.args.collateralAsset.toLowerCase();

  const debtId = positionId(userAddress, debtReserveAddress);
  const collateralId = positionId(userAddress, collateralReserveAddress);

  // Reduz a dívida
  await context.db
    .insert(userPosition)
    .values({
      id: debtId,
      userAddress: userAddress as `0x${string}`,
      reserveAddress: debtReserveAddress as `0x${string}`,
      scaledATokenBalance: 0n,
      scaledVariableDebt: 0n,
      usageAsCollateralEnabled: 1,
      lastUpdatedAt: Number(event.block.timestamp),
    })
    .onConflictDoUpdate((row) => ({
      scaledVariableDebt: row.scaledVariableDebt - event.args.debtToCover,
      lastUpdatedAt: Number(event.block.timestamp),
    }));

  // Reduz o colateral
  await context.db
    .insert(userPosition)
    .values({
      id: collateralId,
      userAddress: userAddress as `0x${string}`,
      reserveAddress: collateralReserveAddress as `0x${string}`,
      scaledATokenBalance: 0n,
      scaledVariableDebt: 0n,
      usageAsCollateralEnabled: 1,
      lastUpdatedAt: Number(event.block.timestamp),
    })
    .onConflictDoUpdate((row) => ({
      scaledATokenBalance: row.scaledATokenBalance - event.args.liquidatedCollateralAmount,
      lastUpdatedAt: Number(event.block.timestamp),
    }));
});
