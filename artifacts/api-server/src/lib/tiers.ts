// Deposit-based account tier. Replaces the old "OPay-style" account tier
// concept with something driven by how much plastic a user has actually
// recycled through the app.
//
// Bands: Tier 1 is 0–0.999kg, Tier 2 is 1–10kg. Anything above 10kg falls
// into Tier 3, which isn't explicitly specified by product yet — adjust the
// threshold/label below once that's decided.
export type DepositTier = {
  level: number;
  label: string;
  minGrams: number;
  /** null means no upper bound (the top tier) */
  maxGrams: number | null;
};

const TIERS: DepositTier[] = [
  { level: 1, label: "Tier 1", minGrams: 0, maxGrams: 999 },
  { level: 2, label: "Tier 2", minGrams: 1000, maxGrams: 10_000 },
  { level: 3, label: "Tier 3", minGrams: 10_001, maxGrams: null },
];

export function tierForGrams(totalGrams: number): DepositTier {
  return TIERS.find((t) => totalGrams >= t.minGrams && (t.maxGrams === null || totalGrams <= t.maxGrams)) ?? TIERS[0]!;
}

// How many more grams until the next tier, or null if already at the top.
export function gramsToNextTier(totalGrams: number): number | null {
  const current = tierForGrams(totalGrams);
  const next = TIERS.find((t) => t.level === current.level + 1);
  if (!next) return null;
  return Math.max(0, next.minGrams - totalGrams);
}
