import React, { useState } from 'react';
import { X, Check, Star, ShieldCheck, Sparkles, ExternalLink, Calendar, Rocket, Award, RefreshCw, ChevronRight } from 'lucide-react';
import { useRevenueCat } from '../hooks/useRevenueCat';

interface OxibyteStarModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'paywall' | 'customer_center';
  selectedMentorName?: string | null;
}

export default function OxibyteStarModal({
  isOpen,
  onClose,
  initialMode = 'paywall',
  selectedMentorName = null,
}: OxibyteStarModalProps) {
  const { isStar, tier, expiresAt, purchase, restore, cancel } = useRevenueCat();
  const [mode, setMode] = useState<'paywall' | 'customer_center'>(initialMode);
  const [selectedPlan, setSelectedPlan] = useState<'yearly' | 'monthly'>('yearly');
  const [isProcessing, setIsProcessing] = useState(false);
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);

  // Sync mode with prop when opened
  React.useEffect(() => {
    if (isOpen) {
      setMode(isStar ? 'customer_center' : 'paywall');
      setFeedbackNotice(null);
    }
  }, [isOpen, isStar, initialMode]);

  if (!isOpen) return null;

  async function handlePurchase() {
    setIsProcessing(true);
    setFeedbackNotice(null);
    try {
      const res = await purchase(selectedPlan);
      if (res.success) {
        setFeedbackNotice('🎉 Welcome to Oxibyte Star! Shipaton mentorship access is now unlocked.');
        setTimeout(() => {
          onClose();
        }, 1800);
      } else if (res.cancelled) {
        // User cancelled
      } else {
        setFeedbackNotice(res.error || 'Purchase could not be completed.');
      }
    } catch (err: any) {
      setFeedbackNotice(err.message || 'Payment failed.');
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleRestore() {
    setIsProcessing(true);
    setFeedbackNotice(null);
    try {
      const res = await restore();
      if (res.isStar) {
        setFeedbackNotice('Your Oxibyte Star subscription was successfully restored!');
      } else {
        setFeedbackNotice('No active subscription found for this account.');
      }
    } catch {
      setFeedbackNotice('Could not restore purchases. Please check your connection.');
    } finally {
      setIsProcessing(false);
    }
  }

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

        {mode === 'paywall' ? (
          <div>
            {/* Header Branding with new Oxibyte Logo */}
            <div className="text-center pt-2 pb-4">
              <div className="relative mx-auto mb-3 grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-tr from-[#0d9488] via-[#14b8a6] to-[#ff6b35] p-0.5 shadow-[0_0_24px_rgba(20,184,166,0.4)]">
                <div className="flex h-full w-full items-center justify-center rounded-2xl bg-[#141424] overflow-hidden p-1.5">
                  <img
                    src={`${import.meta.env.BASE_URL}assets/Oxibyte_logo_1024x1024.svg`}
                    alt="Oxibyte Logo"
                    className="h-full w-full object-contain"
                  />
                </div>
                <span className="absolute -top-1.5 -right-1.5 grid h-6 w-6 place-items-center rounded-full bg-[#facc15] text-[#141424] shadow-md font-bold text-xs">
                  ★
                </span>
              </div>

              <div className="inline-flex items-center gap-1.5 rounded-full bg-[#57cfc8]/10 px-3 py-1 text-[11px] font-bold text-[#57cfc8] border border-[#57cfc8]/25 mb-1.5 uppercase tracking-wider">
                <Sparkles size={12} /> Shipaton 2027 Mentorship Pass
              </div>

              <h2 className="text-2xl font-black font-display tracking-tight text-white">
                OXIBYTE STAR
              </h2>
              <p className="mt-1 text-xs text-[#aaa9ba] max-w-[300px] mx-auto">
                {selectedMentorName ? (
                  <>Unlock direct 1-on-1 office hours with <strong className="text-white">{selectedMentorName}</strong> & 30+ top founders.</>
                ) : (
                  'Accelerate your build with direct mentor access and fast-track venture reviews.'
                )}
              </p>
            </div>

            {/* Core Value Props (Strict Separation from Data Caps) */}
            <div className="space-y-2.5 my-4">
              <div className="flex items-start gap-3 rounded-2xl bg-[#1c1c32] p-3 border border-white/5">
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-[#57cfc8]/20 text-[#57cfc8]">
                  <Calendar size={16} />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Direct 1-on-1 Office Hours</div>
                  <div className="text-[11px] text-[#8e8da0] leading-snug">
                    Schedule private sessions with 30+ Shipaton mentors and tech leads.
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-2xl bg-[#1c1c32] p-3 border border-white/5">
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-[#ff6b35]/20 text-[#ff6b35]">
                  <Rocket size={16} />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Priority Pitch Review</div>
                  <div className="text-[11px] text-[#8e8da0] leading-snug">
                    Fast-track evaluation for Shipaton 2027 hackathon grants & investor demo day.
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-2xl bg-[#1c1c32] p-3 border border-white/5">
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-[#facc15]/20 text-[#facc15]">
                  <Award size={16} />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">VIP Sponsor Tools & Star Badge</div>
                  <div className="text-[11px] text-[#8e8da0] leading-snug">
                    Access partner API sandbox credits and verified Star Builder badge.
                  </div>
                </div>
              </div>
            </div>

            {/* Sacred Ecological Disclaimer */}
            <div className="rounded-xl bg-[#102220] border border-[#57cfc8]/20 p-2.5 text-center mb-4">
              <p className="text-[11px] text-[#71d8d2] font-medium leading-tight">
                ♻️ <strong>Plastic fuels your data (1g = 1MB)</strong>.<br />
                Star pass fuels venture growth. No data caps are bypassed with money.
              </p>
            </div>

            {/* Plan Selector */}
            <div className="grid grid-cols-2 gap-2.5 mb-4">
              {/* Yearly Card */}
              <div
                onClick={() => setSelectedPlan('yearly')}
                className={`relative cursor-pointer rounded-2xl p-3.5 border transition-all text-left ${
                  selectedPlan === 'yearly'
                    ? 'border-[#57cfc8] bg-[#57cfc8]/10 shadow-[0_0_15px_rgba(87,207,200,0.2)]'
                    : 'border-white/10 bg-[#1c1c32] hover:border-white/20'
                }`}
              >
                <span className="absolute -top-2 right-2 rounded-full bg-[#ff6b35] px-2 py-0.5 text-[9px] font-bold text-[#141424] uppercase">
                  Best Value
                </span>
                <div className="text-xs font-bold text-white">Yearly Pass</div>
                <div className="mt-1 font-display text-lg font-black text-[#57cfc8]">$39.99<span className="text-[10px] font-normal text-[#aaa9ba]">/yr</span></div>
                <div className="mt-0.5 text-[10px] text-[#aaa9ba]">Save 33% • Full 2027 Season</div>
              </div>

              {/* Monthly Card */}
              <div
                onClick={() => setSelectedPlan('monthly')}
                className={`relative cursor-pointer rounded-2xl p-3.5 border transition-all text-left ${
                  selectedPlan === 'monthly'
                    ? 'border-[#57cfc8] bg-[#57cfc8]/10 shadow-[0_0_15px_rgba(87,207,200,0.2)]'
                    : 'border-white/10 bg-[#1c1c32] hover:border-white/20'
                }`}
              >
                <div className="text-xs font-bold text-white">Monthly Pass</div>
                <div className="mt-1 font-display text-lg font-black text-white">$4.99<span className="text-[10px] font-normal text-[#aaa9ba]">/mo</span></div>
                <div className="mt-0.5 text-[10px] text-[#aaa9ba]">Flexible monthly builder access</div>
              </div>
            </div>

            {/* Notification message */}
            {feedbackNotice && (
              <div className="mb-3 rounded-xl bg-white/10 p-2 text-center text-xs font-medium text-white">
                {feedbackNotice}
              </div>
            )}

            {/* Purchase CTA */}
            <button
              onClick={handlePurchase}
              disabled={isProcessing}
              className="w-full rounded-2xl bg-gradient-to-r from-[#0d9488] to-[#57cfc8] py-3.5 font-display text-sm font-bold text-[#141424] shadow-lg hover:brightness-110 active:scale-[0.99] transition-all disabled:opacity-50"
            >
              {isProcessing ? 'Connecting to RevenueCat...' : 'Unlock Shipaton 2027 Mentorship'}
            </button>

            {/* Footer controls: Restore Purchases */}
            <div className="mt-3 flex items-center justify-between text-[11px] text-[#8e8da0]">
              <button
                onClick={handleRestore}
                disabled={isProcessing}
                className="underline hover:text-white transition-colors"
              >
                Restore Purchases
              </button>
              <span>Cancel anytime via Store</span>
            </div>
          </div>
        ) : (
          /* Mode B: Customer Center View */
          <div>
            <div className="text-center pt-2 pb-3">
              <div className="mx-auto mb-2 grid h-14 w-14 place-items-center rounded-2xl bg-[#57cfc8]/15 border border-[#57cfc8]/30 text-[#57cfc8]">
                <ShieldCheck size={28} />
              </div>
              <h2 className="text-xl font-bold font-display text-white">Customer Center</h2>
              <p className="text-xs text-[#aaa9ba]">Manage your active Oxibyte Star membership</p>
            </div>

            <div className="my-4 rounded-2xl bg-[#1c1c32] p-4 border border-white/5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#8e8da0]">Current Plan</span>
                <span className="inline-flex items-center gap-1 font-bold text-sm text-[#57cfc8]">
                  ⭐ Oxibyte Star ({tier === 'yearly' ? 'Yearly' : 'Monthly'})
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#8e8da0]">Status</span>
                <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                  Active
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#8e8da0]">Renewal Date</span>
                <span className="text-xs text-white">
                  {expiresAt ? new Date(expiresAt).toLocaleDateString() : 'Active subscription'}
                </span>
              </div>
            </div>

            <div className="space-y-2 mb-4">
              <button
                onClick={() => setMode('paywall')}
                className="w-full flex items-center justify-between rounded-xl bg-white/5 p-3 text-xs font-semibold text-white hover:bg-white/10 transition-colors"
              >
                <span>Switch Billing Plan (Monthly / Yearly)</span>
                <ChevronRight size={14} className="text-[#8e8da0]" />
              </button>

              <button
                onClick={handleRestore}
                disabled={isProcessing}
                className="w-full flex items-center justify-between rounded-xl bg-white/5 p-3 text-xs font-semibold text-white hover:bg-white/10 transition-colors"
              >
                <span>Sync / Restore In-App Purchases</span>
                <RefreshCw size={14} className="text-[#8e8da0]" />
              </button>
            </div>

            {feedbackNotice && (
              <div className="mb-3 rounded-xl bg-white/10 p-2 text-center text-xs font-medium text-white">
                {feedbackNotice}
              </div>
            )}

            <button
              onClick={async () => {
                await cancel();
                setFeedbackNotice('Subscription simulated cancellation.');
                setTimeout(() => setMode('paywall'), 800);
              }}
              className="w-full rounded-2xl border border-red-500/30 bg-red-500/10 py-3 text-xs font-bold text-red-400 hover:bg-red-500/20 transition-colors"
            >
              Cancel Subscription
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
