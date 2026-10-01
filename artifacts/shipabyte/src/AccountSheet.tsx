import { useEffect, useState } from 'react';
import {
  LogOut,
  Settings as SettingsIcon,
  Award,
  Recycle,
  Radio,
  Share2,
  Copy,
  Check,
  Zap,
  ChevronRight,
  ShieldCheck,
  UserCheck,
  ArrowLeft,
  Wallet,
  Sparkles,
  PhoneCall,
  CheckCircle2,
  ArrowUpRight,
  Send,
  Plus,
  Star,
  Calendar,
  Rocket,
} from 'lucide-react';
import { apiGet, apiPost } from './lib/api';
import { getStellarTier, getNextStellarTierProgress, STELLAR_RECYCLING_TIERS } from './data/stellarTiers';
import { useRevenueCat } from './hooks/useRevenueCat';

type User = {
  firstName: string;
  lastName?: string | null;
  phone: string;
  walletBalanceMb: number;
  profilePhotoUrl?: string | null;
};

const US_CARRIERS = [
  { id: 'tmobile', name: 'T-Mobile', color: '#E20074', code: 'T-MO', coverage: '5G Ultra Capacity' },
  { id: 'verizon', name: 'Verizon', color: '#CD040B', code: 'VZW', coverage: '5G Ultra Wideband' },
  { id: 'att', name: 'AT&T', color: '#00A8E0', code: 'ATT', coverage: '5G+' },
  { id: 'mint', name: 'Mint Mobile', color: '#68B04D', code: 'MINT', coverage: '5G Nationwide' },
];

const DATA_BUNDLES = [
  { mb: 500, label: '500MB', cost: '500 MB', popular: false },
  { mb: 1000, label: '1GB', cost: '1,000 MB', popular: true },
  { mb: 2500, label: '2.5GB', cost: '2,500 MB', popular: false },
  { mb: 5000, label: '5GB', cost: '5,000 MB', popular: false },
];

export default function AccountSheet({
  user,
  onClose,
  onLoggedOut,
  onOpenSettings,
  onOpenEditProfile,
  onOpenStarPaywall,
  onOpenCustomerCenter,
}: {
  user: User;
  onClose: () => void;
  onLoggedOut: () => void;
  onOpenSettings: () => void;
  onOpenEditProfile?: () => void;
  onOpenStarPaywall?: () => void;
  onOpenCustomerCenter?: () => void;
}) {
  const [view, setView] = useState<'menu' | 'wallet' | 'eco' | 'redeem' | 'refer'>('menu');
  const [selectedCarrier, setSelectedCarrier] = useState('tmobile');
  const [selectedBundle, setSelectedBundle] = useState(1000);
  const [redeemSuccess, setRedeemSuccess] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [depositedGrams, setDepositedGrams] = useState<number | null>(null);
  const { isStar, tier: starTier } = useRevenueCat();

  useEffect(() => {
    let cancelled = false;
    apiGet<{ depositedGrams: number; balanceMb: number }>('/wallet/me')
      .then((data) => {
        if (!cancelled && typeof data.depositedGrams === 'number') {
          setDepositedGrams(data.depositedGrams);
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const totalGrams = depositedGrams ?? 0;
  const totalKg = (totalGrams / 1000).toFixed(totalGrams % 1000 === 0 ? 0 : 2);
  const bottlesCount = Math.floor(totalGrams / 50); // ~50g PET bottle
  const stellarTier = getStellarTier(totalGrams);
  const stellarProgress = getNextStellarTierProgress(totalGrams);
  const tierName = `${stellarTier.name} Recycler`;
  const tierEmoji = stellarTier.badgeEmoji;
  const progressPercent = stellarProgress.progressPercent;
  const remainingKgToNext = (stellarProgress.gramsRemaining / 1000).toFixed(2);
  const nextTierLabel = stellarProgress.nextTier ? `${stellarProgress.nextTier.name} (${(stellarProgress.nextTier.minGrams / 1000).toFixed(0)} kg)` : 'Max Stellar Tier';

  const referralCode = 'OXIBYTE-SHIPPER';
  const referralUrl = `https://oxibyte.com/invite?ref=${referralCode}`;
  const shareText = encodeURIComponent(
    `Join me on Oxibyte! Deposit plastic bottles at smart bins to get free mobile data. Use my code ${referralCode} for a +50MB bonus: ${referralUrl}`
  );

  async function logOut() {
    try {
      await apiPost('/auth/logout', {});
    } catch {
      // even if the request fails, clear local state
    }
    onLoggedOut();
  }

  function handleRedeemData() {
    setRedeemSuccess(true);
    setTimeout(() => setRedeemSuccess(false), 4000);
  }

  function copyReferral() {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(referralCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  }

  const carrierObj = US_CARRIERS.find((c) => c.id === selectedCarrier) || US_CARRIERS[0];

  return (
    <div className="safe-top safe-bottom absolute inset-0 z-50 overflow-y-auto bg-[#1a1a2e] text-[#f4f0e8]">
      <div className="mx-auto max-w-md px-5 pb-16 pt-5">
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              data-testid="button-back-account"
              onClick={() => (view === 'menu' ? onClose() : setView('menu'))}
              className="rounded-lg p-2 text-[#cfced7] hover:bg-white/5"
              aria-label={view === 'menu' ? 'Back to home' : 'Back to Me menu'}
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="font-display text-xl font-bold">
                {view === 'menu'
                  ? 'Me & Account'
                  : view === 'wallet'
                  ? 'Wallet Balance'
                  : view === 'eco'
                  ? 'Eco Impact & Tier'
                  : view === 'redeem'
                  ? 'Redeem Data to SIM'
                  : 'Refer Friends'}
              </h1>
              <p className="text-xs text-[#858496]">
                {view === 'menu'
                  ? 'Manage your perks, balance & connectivity'
                  : view === 'wallet'
                  ? 'Your active data bytes ledger'
                  : view === 'eco'
                  ? 'Campus sustainability milestones'
                  : view === 'redeem'
                  ? 'Activate cellular data on U.S. carriers'
                  : 'Earn +50MB for every classmate invited'}
              </p>
            </div>
          </div>

          {view === 'menu' && onOpenEditProfile && (
            <button
              data-testid="button-quick-edit-profile"
              onClick={onOpenEditProfile}
              className="flex items-center gap-1 rounded-xl bg-white/10 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/15"
            >
              <UserCheck size={13} /> Edit
            </button>
          )}
        </div>

        {/* ========================================================================= */}
        {/* VIEW: MAIN MENU (4 DISTINCT SETTINGS-STYLE BUTTONS)                       */}
        {/* ========================================================================= */}
        {view === 'menu' && (
          <div className="mt-5 space-y-5">
            {/* User Profile Overview Card */}
            <div className="flex items-center justify-between rounded-3xl border border-white/10 bg-[#24243c] p-5 shadow-lg">
              <div className="flex items-center gap-3.5">
                <span className="grid h-14 w-14 place-items-center overflow-hidden rounded-full bg-[#ff6b35] font-display text-xl font-bold text-[#1a1a2e] shadow-md">
                  {user.profilePhotoUrl ? (
                    <img src={user.profilePhotoUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    user.firstName.slice(0, 1).toUpperCase()
                  )}
                </span>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h2 className="font-display text-base font-bold text-white">
                      {user.firstName} {user.lastName || ''}
                    </h2>
                    <ShieldCheck size={16} className="text-[#57cfc8]" />
                  </div>
                  <p className="font-mono text-xs text-[#858496]">{user.phone}</p>
                  <span className="mt-1 inline-block rounded-md bg-[#57cfc8]/15 px-2 py-0.5 text-[10px] font-bold text-[#57cfc8]">
                    Verified Shipper
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#858496]">
                  Balance
                </span>
                <div className="font-display text-lg font-bold text-[#57cfc8]">
                  {user.walletBalanceMb} MB
                </div>
              </div>
            </div>

            {/* Oxibyte Star Membership Card (Shipaton 2027 Mentorship Access) */}
            <div className="relative overflow-hidden rounded-3xl border border-[#facc15]/30 bg-gradient-to-r from-[#1c1c32] via-[#24243c] to-[#1e2038] p-4 shadow-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-amber-400/20 text-amber-300 border border-amber-400/40 shadow-[0_0_12px_rgba(251,191,36,0.3)]">
                    <Star size={22} className="fill-amber-300" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-display font-bold text-sm text-white">Oxibyte Star</span>
                      {isStar ? (
                        <span className="rounded-full bg-emerald-500/20 px-2 py-0.2 text-[9px] font-bold text-emerald-300 uppercase">
                          Active Member
                        </span>
                      ) : (
                        <span className="rounded-full bg-amber-400/20 px-2 py-0.2 text-[9px] font-bold text-amber-300 uppercase">
                          Venture Pass
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-[#aaa9ba]">
                      {isStar
                        ? 'Shipaton 2027 direct mentorship & pitch review unlocked'
                        : 'Direct 1-on-1 office hours with 30+ founders & mentors'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  data-testid="button-account-star-action"
                  onClick={isStar ? onOpenCustomerCenter : onOpenStarPaywall}
                  className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-bold transition-all active:scale-95 ${
                    isStar
                      ? 'bg-white/10 text-white hover:bg-white/15 border border-white/15'
                      : 'bg-gradient-to-r from-[#0d9488] to-[#57cfc8] text-[#141424] hover:brightness-110 shadow-md'
                  }`}
                >
                  {isStar ? 'Manage' : 'Upgrade'}
                </button>
              </div>
            </div>

            {/* 4 Distinct Settings-Style Buttons Container */}
            <div>
              <div className="mb-2 px-1 text-[11px] font-bold uppercase tracking-wider text-[#858496]">
                Perks & Wallet Features
              </div>

              <div className="overflow-hidden rounded-3xl bg-[#24243c] border border-white/10 shadow-lg">
                {/* Button 1: Available Wallet Balance */}
                <button
                  data-testid="button-me-wallet-balance"
                  onClick={() => setView('wallet')}
                  className="flex w-full items-center gap-3.5 border-b border-white/5 p-4 text-left transition-colors hover:bg-white/5 active:bg-white/10"
                >
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#57cfc8]/15 text-[#57cfc8]">
                    <Wallet size={20} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm text-white">Available Wallet Balance</span>
                      <span className="rounded-full bg-[#57cfc8]/15 px-2.5 py-0.5 text-xs font-bold text-[#57cfc8]">
                        {user.walletBalanceMb} MB
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-[#858496]">
                      View active data balance, rates & wallet ledger
                    </p>
                  </div>
                  <ChevronRight size={18} className="shrink-0 text-[#68687a]" />
                </button>

                {/* Button 2: Eco Impact & Badge Tier */}
                <button
                  data-testid="button-me-eco-impact"
                  onClick={() => setView('eco')}
                  className="flex w-full items-center gap-3.5 border-b border-white/5 p-4 text-left transition-colors hover:bg-white/5 active:bg-white/10"
                >
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#f3c969]/15 text-[#f3c969]">
                    <Recycle size={20} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm text-white">Eco Impact & Badge Tier</span>
                      <span className="rounded-full bg-[#f3c969]/15 px-2.5 py-0.5 text-xs font-bold text-[#f3c969]">
                        {tierName}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-[#858496]">
                      {totalKg} kg plastic diverted · ~{bottlesCount} bottles saved
                    </p>
                  </div>
                  <ChevronRight size={18} className="shrink-0 text-[#68687a]" />
                </button>

                {/* Button 3: Redeem Data to U.S. SIM */}
                <button
                  data-testid="button-me-redeem-sim"
                  onClick={() => setView('redeem')}
                  className="flex w-full items-center gap-3.5 border-b border-white/5 p-4 text-left transition-colors hover:bg-white/5 active:bg-white/10"
                >
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#ff6b35]/15 text-[#ff6b35]">
                    <Radio size={20} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm text-white">Redeem Data to U.S. SIM</span>
                      <span className="rounded-full bg-[#ff6b35]/15 px-2.5 py-0.5 text-xs font-bold text-[#ff6b35]">
                        Cellular
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-[#858496]">
                      T-Mobile, Verizon, AT&T, Mint Mobile top-ups
                    </p>
                  </div>
                  <ChevronRight size={18} className="shrink-0 text-[#68687a]" />
                </button>

                {/* Button 4: Refer Friends & Earn +50MB */}
                <button
                  data-testid="button-me-refer-friends"
                  onClick={() => setView('refer')}
                  className="flex w-full items-center gap-3.5 p-4 text-left transition-colors hover:bg-white/5 active:bg-white/10"
                >
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#c39bf4]/15 text-[#c39bf4]">
                    <Share2 size={20} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm text-white">Refer Friends & Earn +50MB</span>
                      <span className="rounded-full bg-[#c39bf4]/15 px-2.5 py-0.5 text-xs font-bold text-[#c39bf4]">
                        +50MB Each
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-[#858496]">
                      Share code {referralCode} via WhatsApp & Telegram
                    </p>
                  </div>
                  <ChevronRight size={18} className="shrink-0 text-[#68687a]" />
                </button>
              </div>
            </div>

            {/* App Preferences & System Card */}
            <div>
              <div className="mb-2 px-1 text-[11px] font-bold uppercase tracking-wider text-[#858496]">
                App Preferences
              </div>

              <div className="overflow-hidden rounded-3xl bg-[#24243c] border border-white/10 shadow-lg">
                <button
                  data-testid="button-open-settings"
                  onClick={onOpenSettings}
                  className="flex w-full items-center gap-3.5 border-b border-white/5 p-4 text-left transition-colors hover:bg-white/5 active:bg-white/10"
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-white/10 text-white">
                    <SettingsIcon size={18} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-sm text-white">App Settings</div>
                    <div className="text-xs text-[#858496]">Password, security & app options</div>
                  </div>
                  <ChevronRight size={18} className="shrink-0 text-[#68687a]" />
                </button>

                {onOpenEditProfile && (
                  <button
                    data-testid="button-edit-profile-menu"
                    onClick={onOpenEditProfile}
                    className="flex w-full items-center gap-3.5 p-4 text-left transition-colors hover:bg-white/5 active:bg-white/10"
                  >
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-white/10 text-white">
                      <UserCheck size={18} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-sm text-white">Edit Profile Details</div>
                      <div className="text-xs text-[#858496]">Photo, name, gender, birthday, email</div>
                    </div>
                    <ChevronRight size={18} className="shrink-0 text-[#68687a]" />
                  </button>
                )}
              </div>
            </div>

            {/* Log Out Button */}
            <button
              data-testid="button-log-out"
              onClick={logOut}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[#ff938f]/30 bg-[#ff938f]/10 py-3.5 text-xs font-bold text-[#ff938f] transition-colors hover:bg-[#ff938f]/20 active:scale-[0.99]"
            >
              <LogOut size={16} /> Log out from Oxibyte
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SUBVIEW 1: AVAILABLE WALLET BALANCE                                       */}
        {/* ========================================================================= */}
        {view === 'wallet' && (
          <div className="mt-5 space-y-4">
            {/* Primary Balance Display */}
            <div className="rounded-3xl border border-[#57cfc8]/30 bg-gradient-to-br from-[#24243c] via-[#1c1c32] to-[#16162a] p-6 shadow-xl text-center">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#57cfc8]/20 px-3 py-1 text-xs font-bold text-[#57cfc8]">
                <Wallet size={14} /> Total Available Data
              </span>
              <div className="mt-4 font-display text-5xl font-black text-white">
                {user.walletBalanceMb}
                <span className="text-2xl text-[#57cfc8] ml-1">MB</span>
              </div>
              <p className="mt-2 text-xs text-[#aaa9ba]">
                Equivalent to {(user.walletBalanceMb / 1000).toFixed(2)} GB usable high-speed data
              </p>

              <div className="mt-6 grid grid-cols-2 gap-3 border-t border-white/10 pt-4">
                <div className="rounded-2xl bg-[#161628] p-3 text-left">
                  <span className="text-[10px] text-[#858496]">Conversion Rate</span>
                  <div className="font-display text-sm font-bold text-white">1g = 1MB</div>
                </div>
                <div className="rounded-2xl bg-[#161628] p-3 text-left">
                  <span className="text-[10px] text-[#858496]">Plastic Rate</span>
                  <div className="font-display text-sm font-bold text-[#57cfc8]">1kg = 1,000MB</div>
                </div>
              </div>
            </div>

            {/* Quick Actions Guide */}
            <div className="rounded-3xl border border-white/10 bg-[#24243c] p-5">
              <h3 className="font-semibold text-sm text-white">How to Earn More MB</h3>
              <div className="mt-3 space-y-3">
                <div className="flex items-start gap-3">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-xl bg-[#57cfc8]/20 text-[#57cfc8] text-xs font-bold">1</span>
                  <div>
                    <div className="text-xs font-bold text-white">Deposit Plastic at Smart Bins</div>
                    <p className="text-[11px] text-[#858496]">Take clean bottles or HDPE jugs to campus drop-off points.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-xl bg-[#ff6b35]/20 text-[#ff6b35] text-xs font-bold">2</span>
                  <div>
                    <div className="text-xs font-bold text-white">Refer Classmates & Builders</div>
                    <p className="text-[11px] text-[#858496]">Get +50MB each time a friend deposits their first item.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-xl bg-[#f3c969]/20 text-[#f3c969] text-xs font-bold">3</span>
                  <div>
                    <div className="text-xs font-bold text-white">Maintain Weekly Recycling Streaks</div>
                    <p className="text-[11px] text-[#858496]">Earn bonus data rewards on 4-day and 7-day streaks.</p>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => setView('redeem')}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#57cfc8] py-3.5 text-xs font-bold text-[#1a1a2e] hover:brightness-110 active:scale-98"
            >
              <Radio size={16} /> Redeem to Cellular SIM Now
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SUBVIEW 2: ECO IMPACT & BADGE TIER                                        */}
        {/* ========================================================================= */}
        {view === 'eco' && (
          <div className="mt-5 space-y-4">
            {/* Current Tier Badge */}
            <div className={`rounded-3xl border ${stellarTier.borderClass} ${stellarTier.bgClass} p-6 shadow-xl`}>
              <div className="flex items-center justify-between">
                <div>
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${stellarTier.textClass}`}>
                    Classified Sustainability Tier
                  </span>
                  <h3 className="mt-0.5 font-display text-2xl font-bold text-white">{stellarTier.name} Recycler</h3>
                  <p className="mt-1 text-xs text-[#aaa9ba]">{stellarTier.classification} · {stellarTier.description}</p>
                </div>
                <div className={`grid h-14 w-14 place-items-center rounded-2xl bg-white/10 text-3xl shadow-lg border border-white/20`}>
                  {tierEmoji}
                </div>
              </div>

              {/* Progress to next tier */}
              <div className="mt-5 rounded-2xl bg-[#16162a]/80 p-3.5 border border-white/5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-white">Tier Progress ({progressPercent}%)</span>
                  <span className={stellarTier.textClass}>{nextTierLabel}</span>
                </div>
                <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-[#24243c]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#0d9488] to-[#57cfc8] transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <p className="mt-2 text-[10px] text-[#858496]">
                  {stellarProgress.nextTier
                    ? `Deposit ${remainingKgToNext} kg (${stellarProgress.gramsRemaining}g) more plastic to reach ${stellarProgress.nextTier.name}.`
                    : 'Maximum Stellar Rank Achieved! You are an elite Blue Star environmental luminary.'}
                </p>
              </div>
            </div>

            {/* Impact Metric Cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-white/10 bg-[#24243c] p-4 text-center">
                <span className="grid h-10 w-10 mx-auto place-items-center rounded-xl bg-[#57cfc8]/20 text-[#57cfc8]">
                  <Recycle size={20} />
                </span>
                <span className="mt-2 block text-[11px] text-[#858496]">Plastic Diverted</span>
                <span className="font-display text-xl font-bold text-white">{totalKg} kg</span>
                <span className="text-[10px] text-[#57cfc8]">{totalGrams.toLocaleString()} grams</span>
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#24243c] p-4 text-center">
                <span className="grid h-10 w-10 mx-auto place-items-center rounded-xl bg-[#ff6b35]/20 text-[#ff6b35]">
                  <Sparkles size={20} />
                </span>
                <span className="mt-2 block text-[11px] text-[#858496]">Bottles Saved</span>
                <span className="font-display text-xl font-bold text-[#ff6b35]">~{bottlesCount} units</span>
                <span className="text-[10px] text-[#aaa9ba]">PET diverted</span>
              </div>
            </div>

            {/* The 5 Stellar Tiers Ladder */}
            <div className="rounded-3xl border border-white/10 bg-[#24243c] p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-sm text-white">Stellar Recycling Classification</h3>
                <span className="text-[10px] text-[#858496]">Astrophysical Scale</span>
              </div>

              <div className="space-y-2">
                {STELLAR_RECYCLING_TIERS.map((tier) => {
                  const isReached = totalGrams >= tier.minGrams;
                  const isCurrent = tier.id === stellarTier.id;

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
                        <span className="text-base">{tier.badgeEmoji}</span>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className={isCurrent ? tier.textClass : 'text-white'}>{tier.name}</span>
                            {isCurrent && (
                              <span className="rounded-full bg-white/15 px-1.5 py-0.2 text-[9px] uppercase font-bold text-white">
                                Current
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-[#858496]">
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
                          <span className="text-[10px] text-[#858496]">Locked</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 rounded-xl bg-[#102220] border border-[#57cfc8]/20 p-2.5 text-center text-[11px] text-[#71d8d2]">
                🛡️ <strong>Un-fakeable Ecological Rank</strong>: Stellar tiers are solely earned by diverting plastic waste into Oxibyte smart bins.
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SUBVIEW 3: REDEEM DATA TO U.S. SIM                                        */}
        {/* ========================================================================= */}
        {view === 'redeem' && (
          <div className="mt-5 space-y-4">
            {/* Carrier Selector */}
            <div className="rounded-3xl border border-white/10 bg-[#24243c] p-5 shadow-lg">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm text-white">Select U.S. Mobile Carrier</h3>
                <span className="text-[10px] text-[#858496]">Real cellular connection</span>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2.5">
                {US_CARRIERS.map((c) => {
                  const isSelected = selectedCarrier === c.id;
                  return (
                    <button
                      key={c.id}
                      onClick={() => setSelectedCarrier(c.id)}
                      className={`flex items-center gap-2.5 rounded-2xl p-3 text-left transition-all ${
                        isSelected
                          ? 'border-2 border-white/30 bg-[#2c2c48] shadow-md'
                          : 'border border-white/5 bg-[#1a1a2e] text-[#858496] hover:text-white'
                      }`}
                    >
                      <span
                        className="h-3 w-3 shrink-0 rounded-full"
                        style={{ backgroundColor: c.color }}
                      />
                      <div>
                        <div className="font-bold text-xs text-white">{c.name}</div>
                        <span className="text-[10px] text-[#858496]">{c.coverage}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bundle Selector */}
            <div className="rounded-3xl border border-white/10 bg-[#24243c] p-5">
              <h3 className="font-semibold text-sm text-white">Select Data Bundle</h3>
              <p className="mt-0.5 text-xs text-[#858496]">Redeemed directly using your Oxibyte MB</p>

              <div className="mt-3 grid grid-cols-2 gap-2.5">
                {DATA_BUNDLES.map((bundle) => {
                  const isSelected = selectedBundle === bundle.mb;
                  return (
                    <button
                      key={bundle.mb}
                      onClick={() => setSelectedBundle(bundle.mb)}
                      className={`relative flex flex-col rounded-2xl p-3.5 text-left transition-all ${
                        isSelected
                          ? 'border-2 border-[#ff6b35] bg-[#ff6b35]/10'
                          : 'border border-white/10 bg-[#1a1a2e] hover:border-white/20'
                      }`}
                    >
                      {bundle.popular && (
                        <span className="absolute -top-2 right-2 rounded-full bg-[#ff6b35] px-1.5 py-0.5 text-[8px] font-bold text-[#1a1a2e]">
                          Popular
                        </span>
                      )}
                      <span className="font-display text-lg font-bold text-white">{bundle.label}</span>
                      <span className="text-xs text-[#57cfc8]">{bundle.cost}</span>
                    </button>
                  );
                })}
              </div>

              {redeemSuccess ? (
                <div className="mt-4 rounded-2xl bg-[#57cfc8]/20 p-4 text-center text-xs font-bold text-[#57cfc8]">
                  ✓ Top-up initiated! An eSIM / SMS activation PIN for {carrierObj.name} has been dispatched to {user.phone}.
                </div>
              ) : (
                <button
                  onClick={handleRedeemData}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#ff6b35] py-3.5 text-xs font-bold text-[#1a1a2e] transition-transform hover:brightness-105 active:scale-98"
                >
                  <Zap size={16} /> Activate {selectedBundle >= 1000 ? `${selectedBundle/1000}GB` : `${selectedBundle}MB`} on {carrierObj.name}
                </button>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SUBVIEW 4: REFER FRIENDS & EARN +50MB                                     */}
        {/* ========================================================================= */}
        {view === 'refer' && (
          <div className="mt-5 space-y-4">
            {/* Referral Hero Card */}
            <div className="rounded-3xl border border-[#c39bf4]/30 bg-gradient-to-br from-[#24243c] via-[#221f38] to-[#161426] p-6 shadow-xl text-center">
              <span className="grid h-14 w-14 mx-auto place-items-center rounded-2xl bg-[#c39bf4]/20 text-[#c39bf4] text-2xl">
                🎁
              </span>
              <h3 className="mt-3 font-display text-xl font-bold text-white">
                Give +50MB, Get +50MB
              </h3>
              <p className="mt-1 text-xs text-[#aaa9ba]">
                Invite campus friends to Shipaton 2027. Both of you receive 50MB after their first bottle drop-off.
              </p>

              {/* Code Box */}
              <div className="mt-5 flex items-center justify-between rounded-2xl bg-[#161426] p-3.5 border border-white/10">
                <div className="text-left">
                  <span className="block text-[10px] text-[#858496]">Your Personal Invite Code</span>
                  <span className="font-mono text-base font-bold text-[#c39bf4]">{referralCode}</span>
                </div>
                <button
                  onClick={copyReferral}
                  className="flex items-center gap-1.5 rounded-xl bg-white/10 px-3 py-1.5 text-xs font-bold text-white hover:bg-white/20 active:scale-95"
                >
                  {copiedCode ? <Check size={14} className="text-[#57cfc8]" /> : <Copy size={14} />}
                  <span>{copiedCode ? 'Copied!' : 'Copy Code'}</span>
                </button>
              </div>
            </div>

            {/* Direct Social Invitations */}
            <div className="rounded-3xl border border-white/10 bg-[#24243c] p-5">
              <h4 className="font-semibold text-xs text-white uppercase tracking-wider text-[#858496]">
                Instant Share Channels
              </h4>
              <div className="mt-3 space-y-2.5">
                <a
                  href={`https://api.whatsapp.com/send?text=${shareText}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between rounded-2xl bg-[#25D366]/20 p-3.5 text-xs font-bold text-[#25D366] hover:bg-[#25D366]/30 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <span>💬</span> Share to WhatsApp Class Group
                  </span>
                  <ArrowUpRight size={16} />
                </a>

                <a
                  href={`https://t.me/share/url?url=${encodeURIComponent(referralUrl)}&text=${shareText}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between rounded-2xl bg-[#0088cc]/20 p-3.5 text-xs font-bold text-[#0088cc] hover:bg-[#0088cc]/30 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <span>✈️</span> Share to Telegram Channels
                  </span>
                  <ArrowUpRight size={16} />
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
