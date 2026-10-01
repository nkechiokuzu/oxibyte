import { useEffect, useState } from 'react';
import {
  ShieldCheck,
  Eye,
  EyeOff,
  Headphones,
  ScanLine,
  Bell,
  Plus,
  Check,
  ChevronRight,
  Send,
  ArrowDownLeft,
  ArrowUpRight,
  Sparkles,
  Award,
} from 'lucide-react';
import { apiGet } from './lib/api';
import type { LedgerTransaction } from './NotificationsModal';
import { getStellarTier } from './data/stellarTiers';
import { useRevenueCat } from './hooks/useRevenueCat';

type WalletUser = { firstName: string; walletBalanceMb: number; profilePhotoUrl?: string | null };

function getRecentTxDetails(tx?: LedgerTransaction | null) {
  if (!tx) {
    return {
      label: 'Transfer to Charlie Chapman',
      deltaMb: -10,
      amountFormatted: '-10MB',
      isCredit: false,
    };
  }

  const isCredit = tx.deltaMb >= 0;
  const absMb = Math.abs(tx.deltaMb);
  let label = 'Transaction';

  switch (tx.reason) {
    case 'gift_sent':
      label = `Transfer to ${tx.relatedFirstName || 'a builder'}`;
      break;
    case 'gift_received':
      label = `Received from ${tx.relatedFirstName || 'a builder'}`;
      break;
    case 'deposit':
    case 'deposit_backfill':
      label = 'Plastic deposit reward';
      break;
    case 'signup_bonus':
      label = 'Welcome data bonus';
      break;
    case 'profile_bonus':
      label = 'Profile bonus';
      break;
    default:
      label = isCredit ? 'Credit received' : 'Transfer sent';
  }

  return {
    label,
    deltaMb: tx.deltaMb,
    amountFormatted: isCredit ? `+${absMb}MB` : `-${absMb}MB`,
    isCredit,
  };
}

export default function WalletHome({
  user,
  recentTransaction,
  notificationCount = 0,
  onSendByte,
  onViewTransactions,
  onOpenProfile,
  onOpenFindDropoff,
  onOpenHelp,
  onOpenScan,
  onOpenNotifications,
  onOpenStellarTiers,
  onOpenStarPaywall,
  onOpenCustomerCenter,
}: {
  user: WalletUser;
  recentTransaction?: LedgerTransaction | null;
  notificationCount?: number;
  onSendByte: () => void;
  onViewTransactions: () => void;
  onOpenProfile?: () => void;
  onOpenFindDropoff: () => void;
  onOpenHelp?: () => void;
  onOpenScan?: () => void;
  onOpenNotifications?: () => void;
  onOpenStellarTiers?: () => void;
  onOpenStarPaywall?: () => void;
  onOpenCustomerCenter?: () => void;
}) {
  const [showBalance, setShowBalance] = useState(true);
  const [depositedGrams, setDepositedGrams] = useState<number | null>(null);
  const { isStar } = useRevenueCat();

  useEffect(() => {
    let cancelled = false;
    apiGet<{ depositedGrams: number }>('/wallet/me')
      .then((data) => { if (!cancelled) setDepositedGrams(data.depositedGrams); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const totalGrams = depositedGrams ?? 0;
  const stellarTier = getStellarTier(totalGrams);
  const depositedKgLabel = depositedGrams == null ? '…' : `${(totalGrams / 1000).toFixed(totalGrams % 1000 === 0 ? 0 : 2)}`;

  const recentTxDetails = getRecentTxDetails(recentTransaction);

  return (
    <div className="w-full px-4 pt-2">
      {/* Compact top header bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* User profile photo with circular tier outline ring (e.g. red ring line) */}
          <button
            data-testid="button-open-profile"
            onClick={onOpenProfile}
            aria-label={`Edit profile • ${stellarTier.name} Recycler`}
            title={`Recycling Tier: ${stellarTier.name} (${stellarTier.classification})`}
            className="relative grid h-10 w-10 place-items-center rounded-full p-[2px] transition-transform hover:scale-105 active:scale-95 shrink-0"
            style={{
              boxShadow: `0 0 0 2px ${stellarTier.colorHex}`,
            }}
          >
            <div className="h-full w-full rounded-full overflow-hidden bg-[#ff6b35] grid place-items-center font-display text-sm font-bold text-[#1a1a2e]">
              {user.profilePhotoUrl ? (
                <img src={user.profilePhotoUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                user.firstName.slice(0, 1).toUpperCase()
              )}
            </div>
          </button>
          
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xs sm:text-sm font-semibold text-white truncate">Hi, {user.firstName}</span>
            
            {/* Unified Star Pass Pill with Stellar Recycling Tier Dot inside */}
            {isStar ? (
              <button
                type="button"
                data-testid="badge-star-member"
                onClick={onOpenCustomerCenter}
                title="Oxibyte Star Active • Click to manage"
                className="flex items-center gap-1.5 rounded-full bg-amber-400/15 border border-amber-400/35 px-2.5 py-0.5 text-[10px] font-bold text-amber-300 shadow-sm hover:brightness-110 active:scale-95 transition-all shrink-0"
              >
                <span>⭐ Star Member</span>
                <span
                  className="h-1.5 w-1.5 rounded-full shrink-0 shadow-sm"
                  style={{ backgroundColor: stellarTier.colorHex }}
                  title={`Stellar Recycling Tier: ${stellarTier.name}`}
                />
              </button>
            ) : (
              <button
                type="button"
                data-testid="button-upgrade-star"
                onClick={onOpenStarPaywall}
                title="Unlock Shipaton 2027 Mentorship Access"
                className="flex items-center gap-1.5 rounded-full bg-white/10 border border-white/15 px-2.5 py-0.5 text-[10px] font-semibold text-white hover:border-[#57cfc8] hover:text-[#57cfc8] active:scale-95 transition-all shrink-0"
              >
                <span>⭐ Star Pass</span>
                <span
                  className="h-1.5 w-1.5 rounded-full shrink-0 shadow-sm"
                  style={{ backgroundColor: stellarTier.colorHex }}
                  title={`Stellar Recycling Tier: ${stellarTier.name}`}
                />
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            data-testid="button-help"
            onClick={onOpenHelp}
            aria-label="Help"
            className="relative text-[#aaa9ba] transition-colors hover:text-white"
          >
            <Headphones size={20} />
            <span className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-full bg-[#ff6b35] px-1 py-0.2 text-[7px] font-bold uppercase leading-none text-[#1a1a2e]">Help</span>
          </button>
          <button
            data-testid="button-scan"
            onClick={onOpenScan}
            aria-label="Scan"
            className="text-[#aaa9ba] transition-colors hover:text-white"
          >
            <ScanLine size={20} />
          </button>
          <button
            data-testid="button-notifications"
            onClick={onOpenNotifications}
            aria-label="Notifications"
            className="relative text-[#aaa9ba] transition-colors hover:text-white"
          >
            <Bell size={20} />
            {notificationCount > 0 && (
              <span className="absolute -right-1.5 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-[#ff6b35] px-1 text-[9px] font-bold text-[#1a1a2e]">
                {notificationCount > 99 ? '99+' : notificationCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Compact wallet card */}
      <div className="relative overflow-hidden mt-3 rounded-2xl bg-[#57cfc8] p-4 text-[#1a1a2e] shadow-md">
        {/* Subtle Centralized Oxibyte Eye Logo watermark */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-12 select-none">
          <img
            src={`${import.meta.env.BASE_URL}assets/Oxibyte_logo_1024x1024.svg`}
            alt=""
            className="h-28 w-28 sm:h-32 sm:w-32 object-contain"
          />
        </div>

        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <ShieldCheck size={16} />
            <span className="text-xs font-bold uppercase tracking-wider">Available</span>
            <button
              data-testid="button-toggle-balance"
              onClick={() => setShowBalance((v) => !v)}
              aria-label={showBalance ? 'Hide balance' : 'Show balance'}
              className="text-[#1a1a2e]/70 hover:text-[#1a1a2e] ml-1"
            >
              {showBalance ? <Eye size={15} /> : <EyeOff size={15} />}
            </button>
          </div>
          <button
            data-testid="button-deposit-plastic"
            onClick={onOpenFindDropoff}
            className="flex items-center rounded-full bg-[#1a1a2e]/10 px-3 py-1 text-xs font-bold hover:bg-[#1a1a2e]/15 transition-colors"
          >
            <Plus className="mr-1 inline" size={13} /> Deposit Plastic
          </button>
        </div>

        <div data-testid="text-wallet-balance" className="relative z-10 mt-2 font-display text-3xl font-black">
          {showBalance ? `${user.walletBalanceMb}MB` : '••••'}
        </div>

        <div className="relative z-10 mt-2 flex items-center justify-between pt-1">
          <div className="text-xs font-medium text-[#1a1a2e]/75">
            Plastic Deposited <span className="font-bold text-[#1a1a2e]">{showBalance ? `${depositedKgLabel}kg` : '••••'}</span>
          </div>
          
          <button
            data-testid="button-send-byte"
            onClick={onSendByte}
            className="flex items-center rounded-full bg-[#1a1a2e]/10 px-3 py-1 text-xs font-bold hover:bg-[#1a1a2e]/15 transition-colors"
          >
            <Send className="mr-1 inline" size={12} /> Send Byte
          </button>
        </div>
      </div>

      {/* Recent Transaction display & Separate Transactions button */}
      <div className="mt-2.5 flex w-full items-center gap-2">
        {/* Element 1: Recent Transaction Display (dynamic function of latest ledger activity) */}
        <div
          data-testid="display-recent-transaction"
          onClick={onViewTransactions}
          className="flex min-w-0 flex-1 cursor-pointer items-center gap-2.5 rounded-2xl bg-[#24243c] px-3.5 py-2.5 shadow-sm transition-colors hover:bg-[#282844] active:scale-[0.99]"
          title="Most recent transaction"
        >
          <span
            className={`grid h-5 w-5 shrink-0 place-items-center rounded-full ${
              recentTxDetails.isCredit ? 'bg-[#57cfc8]/20 text-[#57cfc8]' : 'bg-[#ff938f]/20 text-[#ff938f]'
            }`}
          >
            {recentTxDetails.isCredit ? (
              <ArrowDownLeft size={12} strokeWidth={2.5} />
            ) : (
              <ArrowUpRight size={12} strokeWidth={2.5} />
            )}
          </span>
          <div className="min-w-0 flex-1 truncate text-xs">
            <span className="text-[#cfced7] truncate">{recentTxDetails.label} </span>
            <span
              className={`font-mono font-bold ${
                recentTxDetails.isCredit ? 'text-[#57cfc8]' : 'text-[#ff938f]'
              }`}
            >
              {recentTxDetails.amountFormatted}
            </span>
          </div>
        </div>

        {/* Element 2: Separate Transaction Button (leads to transaction history page) */}
        <button
          type="button"
          data-testid="button-transactions"
          onClick={onViewTransactions}
          className="group flex shrink-0 items-center gap-1.5 rounded-2xl border border-white/10 bg-[#24243c] px-3.5 py-2.5 text-xs font-semibold text-[#858496] shadow-sm transition-all hover:border-white/20 hover:bg-[#2c2c48] hover:text-white active:scale-95"
          title="View Transaction History"
        >
          <span>Transactions</span>
          <ChevronRight
            size={14}
            className="text-[#858496] transition-transform group-hover:translate-x-0.5 group-hover:text-white"
          />
        </button>
      </div>
    </div>
  );
}
