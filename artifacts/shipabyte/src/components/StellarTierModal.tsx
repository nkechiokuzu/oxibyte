import { X, Award, CheckCircle2, ChevronRight, Sparkles } from 'lucide-react';
import {
  STELLAR_RECYCLING_TIERS,
  getStellarTier,
  getNextStellarTierProgress,
} from '../data/stellarTiers';

interface StellarTierModalProps {
  isOpen: boolean;
  onClose: () => void;
  depositedGrams: number;
  onOpenDeposit?: () => void;
}

export default function StellarTierModal({
  isOpen,
  onClose,
  depositedGrams,
  onOpenDeposit,
}: StellarTierModalProps) {
  if (!isOpen) return null;

  const currentTier = getStellarTier(depositedGrams);
  const progress = getNextStellarTierProgress(depositedGrams);
  const bottlesEstimated = Math.floor(depositedGrams / 50); // ~50g per bottle

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md max-h-[92vh] overflow-y-auto rounded-3xl bg-[#141424] border border-[#2a2a46] p-5 text-white shadow-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full bg-white/10 text-white/70 hover:bg-white/20 hover:text-white transition-colors"
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div className="text-center pt-2 pb-3">
          <div
            className={`mx-auto mb-2 grid h-16 w-16 place-items-center rounded-2xl ${currentTier.bgClass} border ${currentTier.borderClass} ${currentTier.glowClass}`}
          >
            <span className="text-3xl">{currentTier.badgeEmoji}</span>
          </div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1 text-[11px] font-semibold text-[#8e8da0] mb-1">
            <Sparkles size={12} className={currentTier.textClass} />
            <span>Ecological Proof-of-Impact</span>
          </div>
          <h2 className="text-2xl font-black font-display text-white">
            {currentTier.name} Recycler
          </h2>
          <p className="text-xs text-[#aaa9ba] mt-0.5">{currentTier.classification}</p>
        </div>

        {/* Current Impact Metrics */}
        <div className="grid grid-cols-2 gap-2.5 my-3">
          <div className="rounded-2xl bg-[#1c1c32] p-3 text-center border border-white/5">
            <div className="text-[11px] text-[#8e8da0]">Plastic Recycled</div>
            <div className="font-display text-lg font-bold text-white mt-0.5">
              {(depositedGrams / 1000).toFixed(2)} kg
            </div>
            <div className="text-[10px] text-[#57cfc8]">{depositedGrams.toLocaleString()} grams</div>
          </div>
          <div className="rounded-2xl bg-[#1c1c32] p-3 text-center border border-white/5">
            <div className="text-[11px] text-[#8e8da0]">Bottles Diverted</div>
            <div className="font-display text-lg font-bold text-[#ff6b35] mt-0.5">
              ~{bottlesEstimated}
            </div>
            <div className="text-[10px] text-[#aaa9ba]">PET units diverted</div>
          </div>
        </div>

        {/* Next Tier Progress */}
        {progress.nextTier ? (
          <div className="my-3 rounded-2xl bg-[#1c1c32] p-3.5 border border-white/5">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-[#8e8da0]">Next: <strong className="text-white">{progress.nextTier.name} {progress.nextTier.badgeEmoji}</strong></span>
              <span className="font-mono font-bold text-[#57cfc8]">{progress.progressPercent}%</span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-black/40 overflow-hidden p-0.5">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#0d9488] to-[#57cfc8] transition-all duration-500"
                style={{ width: `${progress.progressPercent}%` }}
              />
            </div>
            <div className="mt-1.5 flex items-center justify-between text-[11px] text-[#8e8da0]">
              <span>{progress.formattedProgress}</span>
              <span>Target: {progress.nextTier.minGrams.toLocaleString()}g</span>
            </div>
          </div>
        ) : (
          <div className="my-3 rounded-2xl bg-[#0e2a3b] p-3 text-center border border-sky-400/30">
            <div className="text-xs font-bold text-sky-300">🌟 Maximum Stellar Rank Achieved!</div>
            <div className="text-[11px] text-sky-200/80 mt-0.5">You are an elite Blue Star environmental leader.</div>
          </div>
        )}

        {/* The 5 Stellar Tiers Ladder */}
        <div className="my-4 space-y-2">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#8e8da0] px-1">
            Stellar Progression Ladder
          </div>
          {STELLAR_RECYCLING_TIERS.map((tier) => {
            const isReached = depositedGrams >= tier.minGrams;
            const isCurrent = tier.id === currentTier.id;

            return (
              <div
                key={tier.id}
                className={`flex items-center justify-between rounded-xl p-2.5 text-xs transition-all ${
                  isCurrent
                    ? `${tier.bgClass} border ${tier.borderClass} font-bold`
                    : isReached
                    ? 'bg-white/5 border border-white/5 opacity-80'
                    : 'bg-white/[0.02] border border-white/[0.04] opacity-40'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-lg">{tier.badgeEmoji}</span>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className={isCurrent ? tier.textClass : 'text-white'}>
                        {tier.name}
                      </span>
                      {isCurrent && (
                        <span className="rounded-full bg-white/10 px-1.5 py-0.2 text-[9px] uppercase font-bold text-white">
                          Current
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-[#8e8da0]">
                      {tier.minGrams === 0
                        ? '0 – 499g'
                        : tier.maxGrams
                        ? `${tier.minGrams.toLocaleString()}g – ${tier.maxGrams.toLocaleString()}g`
                        : '50,000g+ (50kg+)'}
                    </div>
                  </div>
                </div>

                <div>
                  {isReached ? (
                    <CheckCircle2 size={16} className="text-emerald-400" />
                  ) : (
                    <span className="text-[10px] text-[#8e8da0]">Locked</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Sacred Rule Note */}
        <div className="rounded-xl bg-[#102220] border border-[#57cfc8]/20 p-2.5 text-center mb-3 text-[11px] text-[#71d8d2]">
          🛡️ <strong>Un-fakeable Status</strong>: Stellar tiers can only be earned by depositing plastic waste. Money cannot buy a Blue Star rank.
        </div>

        {/* Deposit CTA */}
        {onOpenDeposit && (
          <button
            onClick={() => {
              onClose();
              onOpenDeposit();
            }}
            className="w-full rounded-2xl bg-[#ff6b35] py-3 text-xs font-bold text-[#141424] shadow-md hover:brightness-110 active:scale-[0.99] transition-all"
          >
            Deposit Plastic to Level Up
          </button>
        )}
      </div>
    </div>
  );
}
