export type StellarRecyclingTierId = 'red_star' | 'orange_star' | 'yellow_star' | 'white_star' | 'blue_star';

export interface StellarTierConfig {
  id: StellarRecyclingTierId;
  name: string;
  classification: string;
  minGrams: number;
  maxGrams: number | null; // null for blue star
  badgeEmoji: string;
  colorHex: string;
  bgClass: string;
  borderClass: string;
  textClass: string;
  glowClass: string;
  description: string;
}

export const STELLAR_RECYCLING_TIERS: StellarTierConfig[] = [
  {
    id: 'red_star',
    name: 'Red Star',
    classification: 'Class M Stellar',
    minGrams: 0,
    maxGrams: 499,
    badgeEmoji: '🔴',
    colorHex: '#f87171',
    bgClass: 'bg-red-500/15',
    borderClass: 'border-red-500/30',
    textClass: 'text-red-400',
    glowClass: 'shadow-[0_0_12px_rgba(248,113,113,0.35)]',
    description: 'Novice Recycler: 0 – 499g of plastic bottles diverted.',
  },
  {
    id: 'orange_star',
    name: 'Orange Star',
    classification: 'Class K Stellar',
    minGrams: 500,
    maxGrams: 2499,
    badgeEmoji: '🟠',
    colorHex: '#fb923c',
    bgClass: 'bg-orange-500/15',
    borderClass: 'border-orange-500/30',
    textClass: 'text-orange-400',
    glowClass: 'shadow-[0_0_12px_rgba(251,146,60,0.35)]',
    description: 'Active Recycler: 500g – 2.49kg of plastic bottles diverted.',
  },
  {
    id: 'yellow_star',
    name: 'Yellow Star',
    classification: 'Class G Sol Stellar',
    minGrams: 2500,
    maxGrams: 9999,
    badgeEmoji: '🟡',
    colorHex: '#facc15',
    bgClass: 'bg-yellow-500/15',
    borderClass: 'border-yellow-500/30',
    textClass: 'text-yellow-400',
    glowClass: 'shadow-[0_0_12px_rgba(250,204,21,0.35)]',
    description: 'Core Community Builder: 2.5kg – 9.99kg of plastic bottles diverted.',
  },
  {
    id: 'white_star',
    name: 'White Star',
    classification: 'Class A Hyper-Bright',
    minGrams: 10000,
    maxGrams: 49999,
    badgeEmoji: '⚪',
    colorHex: '#f8fafc',
    bgClass: 'bg-slate-200/15',
    borderClass: 'border-slate-300/40',
    textClass: 'text-slate-100',
    glowClass: 'shadow-[0_0_14px_rgba(248,250,252,0.45)]',
    description: 'Elite Environmentalist: 10kg – 49.99kg of plastic bottles diverted.',
  },
  {
    id: 'blue_star',
    name: 'Blue Star',
    classification: 'Class O Supergiant',
    minGrams: 50000,
    maxGrams: null,
    badgeEmoji: '🔵',
    colorHex: '#38bdf8',
    bgClass: 'bg-sky-500/20',
    borderClass: 'border-sky-400/50',
    textClass: 'text-sky-300',
    glowClass: 'shadow-[0_0_16px_rgba(56,189,248,0.55)]',
    description: 'Hyper-Luminous Master Recycler: 50kg+ of plastic bottles diverted.',
  },
];

/**
 * Returns the active Stellar Recycling Tier for a given lifetime plastic weight in grams.
 */
export function getStellarTier(totalGrams: number = 0): StellarTierConfig {
  const safeGrams = Math.max(0, totalGrams || 0);
  for (let i = STELLAR_RECYCLING_TIERS.length - 1; i >= 0; i--) {
    if (safeGrams >= STELLAR_RECYCLING_TIERS[i].minGrams) {
      return STELLAR_RECYCLING_TIERS[i];
    }
  }
  return STELLAR_RECYCLING_TIERS[0];
}

/**
 * Returns next tier progression metrics (next tier, grams remaining, percentage complete).
 */
export function getNextStellarTierProgress(totalGrams: number = 0): {
  currentTier: StellarTierConfig;
  nextTier: StellarTierConfig | null;
  gramsRemaining: number;
  progressPercent: number;
  formattedProgress: string;
} {
  const safeGrams = Math.max(0, totalGrams || 0);
  const currentTier = getStellarTier(safeGrams);
  const currentIndex = STELLAR_RECYCLING_TIERS.findIndex((t) => t.id === currentTier.id);

  if (currentIndex === STELLAR_RECYCLING_TIERS.length - 1) {
    // Top tier (Blue Star)
    return {
      currentTier,
      nextTier: null,
      gramsRemaining: 0,
      progressPercent: 100,
      formattedProgress: 'Maximum Stellar Rank Achieved',
    };
  }

  const nextTier = STELLAR_RECYCLING_TIERS[currentIndex + 1];
  const tierSpan = nextTier.minGrams - currentTier.minGrams;
  const currentProgressInTier = safeGrams - currentTier.minGrams;
  const gramsRemaining = Math.max(0, nextTier.minGrams - safeGrams);
  const progressPercent = Math.min(100, Math.max(0, Math.round((currentProgressInTier / tierSpan) * 100)));

  return {
    currentTier,
    nextTier,
    gramsRemaining,
    progressPercent,
    formattedProgress: `${gramsRemaining}g to ${nextTier.name}`,
  };
}
