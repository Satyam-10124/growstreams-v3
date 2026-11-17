/**
 * GrowStreams Vara Mainnet Treasury 20% Budget Guard
 *
 * Enforces that all Mainnet deployments, gas fees, vouchers, and protocol test
 * operations combined NEVER spend more than 20% of the Treasury wallet's VARA
 * and gVARA balances, protecting 80% of the Treasury at all times.
 *
 * Live Baseline (Treasury: kGkLork3scX9ngz3vhFywax2uC3LUfp7m1PMxkQXdtdsnYiZA):
 * - Native VARA Free Balance: 3.5493517768 VARA (3,549,351,776,800 plancks)
 *   -> 20% Native VARA Budget:  0.70987035536 VARA (709,870,355,360 plancks)
 *   -> 80% Native Reserve Floor: 2.83948142144 VARA (2,839,481,421,440 plancks)
 * - gVARA SuperToken Balance: 386.500000000000 gVARA (386,500,000,000,000 plancks)
 *   -> 20% gVARA Stream Budget:  77.300000000000 gVARA (77,300,000,000,000 plancks)
 *   -> 80% gVARA Reserve Floor: 309.200000000000 gVARA (309,200,000,000,000 plancks)
 */

export const TREASURY_CONFIG = {
  ss58Address: 'kGkLork3scX9ngz3vhFywax2uC3LUfp7m1PMxkQXdtdsnYiZA',
  varaAddress: 'kGkLork3scX9ngz3vhFywax2uC3LUfp7m1PMxkQXdtdsnYiZA',
  substrateAddress: '5GsXKGe5Ayw4u3obnUDXuQ6kg4atXuGAVGj6FfjMVb7smuAp',
  actorIdHex: '0xd4a5fb8326bb9d4dd6fa34e60fc5c2f18e8b677b39908e78907df89b0948bd67',
  budgetPercent: 20,
  reserveFloorPercent: 80,
};

let baselineNativePlancks = process.env.TREASURY_BASELINE_PLANCKS
  ? BigInt(process.env.TREASURY_BASELINE_PLANCKS)
  : 2_535_809_000_000_000n;

let baselineGvaraPlancks = process.env.TREASURY_BASELINE_GVARA_PLANCKS
  ? BigInt(process.env.TREASURY_BASELINE_GVARA_PLANCKS)
  : 386_500_000_000_000n;

let cumulativeNativeSpentPlancks = 0n;
let cumulativeGvaraSpentPlancks = 0n;

export async function getTreasuryBudgetStatus(gearApi = null, currentGvaraRaw = null) {
  let currentFree = null;
  if (gearApi) {
    try {
      const { data: { free } } = await gearApi.query.system.account(TREASURY_CONFIG.substrateAddress);
      currentFree = BigInt(free.toString());
    } catch {}
  }
  const currentGvara = currentGvaraRaw != null ? BigInt(String(currentGvaraRaw)) : null;
  return getBudgetParameters(currentFree, currentGvara);
}

export function getBudgetParameters(currentFreePlancks = null, currentGvaraPlancks = null) {
  const budgetPercent = BigInt(process.env.TREASURY_BUDGET_PERCENT || '20');
  const reservePercent = 100n - budgetPercent;

  if (currentFreePlancks != null) {
    const cur = BigInt(currentFreePlancks);
    if (cur > baselineNativePlancks) baselineNativePlancks = cur;
  }
  if (currentGvaraPlancks != null) {
    const curG = BigInt(currentGvaraPlancks);
    if (curG > baselineGvaraPlancks) baselineGvaraPlancks = curG;
  }

  const maxNativeBudget = (baselineNativePlancks * budgetPercent) / 100n;
  const minNativeReserve = (baselineNativePlancks * reservePercent) / 100n;
  const curNative =
    currentFreePlancks != null
      ? BigInt(currentFreePlancks)
      : baselineNativePlancks - cumulativeNativeSpentPlancks;

  const remNativeByFloor = curNative > minNativeReserve ? curNative - minNativeReserve : 0n;
  const remNativeByCap =
    maxNativeBudget > cumulativeNativeSpentPlancks ? maxNativeBudget - cumulativeNativeSpentPlancks : 0n;
  const remainingNativeBudget = remNativeByFloor < remNativeByCap ? remNativeByFloor : remNativeByCap;

  const maxGvaraBudget = (baselineGvaraPlancks * budgetPercent) / 100n;
  const minGvaraReserve = (baselineGvaraPlancks * reservePercent) / 100n;
  const curGvara =
    currentGvaraPlancks != null
      ? BigInt(currentGvaraPlancks)
      : baselineGvaraPlancks - cumulativeGvaraSpentPlancks;

  const remGvaraByFloor = curGvara > minGvaraReserve ? curGvara - minGvaraReserve : 0n;
  const remGvaraByCap =
    maxGvaraBudget > cumulativeGvaraSpentPlancks ? maxGvaraBudget - cumulativeGvaraSpentPlancks : 0n;
  const remainingGvaraBudget = remGvaraByFloor < remGvaraByCap ? remGvaraByFloor : remGvaraByCap;

  return {
    treasuryWalletSs58: 'kGkLork3scX9ngz3vhFywax2uC3LUfp7m1PMxkQXdtdsnYiZA',
    treasuryActorId: '0xd4a5fb8326bb9d4dd6fa34e60fc5c2f18e8b677b39908e78907df89b0948bd67',
    budgetPercent: Number(budgetPercent),
    reserveFloorPercent: Number(reservePercent),
    // Native VARA
    baselinePlancks: baselineNativePlancks.toString(),
    baselineVara: Number(baselineNativePlancks) / 1e12,
    maxBudgetPlancks: maxNativeBudget.toString(),
    maxBudgetVara: Number(maxNativeBudget) / 1e12,
    minReserveFloorPlancks: minNativeReserve.toString(),
    minReserveFloorVara: Number(minNativeReserve) / 1e12,
    currentFreePlancks: curNative.toString(),
    currentFreeVara: Number(curNative) / 1e12,
    remainingBudgetPlancks: remainingNativeBudget.toString(),
    remainingBudgetVara: Number(remainingNativeBudget) / 1e12,
    // gVARA SuperToken
    baselineGvaraPlancks: baselineGvaraPlancks.toString(),
    baselineGvara: Number(baselineGvaraPlancks) / 1e12,
    maxGvaraBudgetPlancks: maxGvaraBudget.toString(),
    maxGvaraBudget: Number(maxGvaraBudget) / 1e12,
    minGvaraReservePlancks: minGvaraReserve.toString(),
    minGvaraReserve: Number(minGvaraReserve) / 1e12,
    currentGvaraPlancks: curGvara.toString(),
    currentGvara: Number(curGvara) / 1e12,
    remainingGvaraBudgetPlancks: remainingGvaraBudget.toString(),
    remainingGvaraBudget: Number(remainingGvaraBudget) / 1e12,
    // Combined total VARA + gVARA
    totalCombinedBaselineVara: (Number(baselineNativePlancks) + Number(baselineGvaraPlancks)) / 1e12,
    totalCombined20PctBudgetVara: (Number(maxNativeBudget) + Number(maxGvaraBudget)) / 1e12,
  };
}

/**
 * Verifies on-chain that executing a transaction with `attachedValuePlancks` + estimated gas
 * will NOT breach the 80% Treasury Reserve Floor (i.e. stays strictly within the 20% budget).
 */
export async function assertWithinTreasuryBudget(
  gearApi,
  keyringAddress,
  attachedValuePlancks = 0n,
  estimatedGasFeePlancks = 25_000_000_000n,
  gvaraSpendPlancks = 0n
) {
  let currentFree = null;
  if (gearApi && keyringAddress) {
    const { data: { free } } = await gearApi.query.system.account(keyringAddress);
    currentFree = BigInt(free.toString());
  }

  const params = getBudgetParameters(currentFree);
  const totalNativeCost = BigInt(attachedValuePlancks || 0n) + BigInt(estimatedGasFeePlancks || 0n);
  const remainingNative = BigInt(params.remainingBudgetPlancks);

  if (totalNativeCost > remainingNative) {
    throw new Error(
      `[TreasuryBudgetGuard] Native VARA operation requires ${(Number(totalNativeCost) / 1e12).toFixed(4)} VARA, ` +
      `exceeding remaining 20% native budget (${params.remainingBudgetVara.toFixed(4)} VARA). ` +
      `80% reserve floor (${params.minReserveFloorVara.toFixed(4)} VARA) is strictly protected.`
    );
  }

  const gvaraCost = BigInt(gvaraSpendPlancks || 0n);
  const remainingGvara = BigInt(params.remainingGvaraBudgetPlancks);
  if (gvaraCost > remainingGvara) {
    throw new Error(
      `[TreasuryBudgetGuard] gVARA operation requires ${(Number(gvaraCost) / 1e12).toFixed(4)} gVARA, ` +
      `exceeding remaining 20% gVARA budget (${params.remainingGvaraBudget.toFixed(4)} gVARA). ` +
      `80% gVARA reserve floor (${params.minGvaraReserve.toFixed(4)} gVARA) is strictly protected.`
    );
  }

  cumulativeNativeSpentPlancks += totalNativeCost;
  cumulativeGvaraSpentPlancks += gvaraCost;
  return params;
}
