import { useState, useEffect, useMemo, useRef } from 'react';
import {
  Sparkles,
  ExternalLink,
  ArrowUpRight,
  X,
  ChevronDown,
  Check,
  Layers,
  Zap,
  HelpCircle,
  Code2,
  Smartphone,
  Mic,
  CreditCard,
  Database,
  GitBranch,
  TrendingUp,
  Cloud,
  Palette,
  Bell,
  Bot,
  Coins,
} from 'lucide-react';
import { SPONSORS, type Sponsor } from '../data/sponsors';
import SpotifyPlugin from './SpotifyPlugin';

const BASE_URL = import.meta.env.BASE_URL || '/';

interface TryCategory {
  id: string;
  label: string;
  icon: string;
  hint: string;
  filterTerm: string;
}

const TRY_CATEGORIES: TryCategory[] = [
  { id: 'website', label: 'Website', icon: '🌐', filterTerm: 'website', hint: 'Web apps, fullstack, landing pages' },
  { id: 'mobile-app', label: 'Mobile App', icon: '📱', filterTerm: 'mobile', hint: 'React Native, Expo, iOS & Android' },
  { id: 'voice-ai', label: 'Voice AI', icon: '🎙️', filterTerm: 'voice', hint: 'Text-to-speech, audio models, voice bots' },
  { id: 'payments', label: 'Payments', icon: '💳', filterTerm: 'payments', hint: 'Stripe, Paddle, checkout & billing' },
  { id: 'database', label: 'Database', icon: '🗄️', filterTerm: 'database', hint: 'Vector storage, embeddings & realtime DB' },
  { id: 'ci-cd', label: 'CI/CD', icon: '⚡', filterTerm: 'ci/cd', hint: 'Continuous integration, device testing, deploy' },
  { id: 'aso', label: 'ASO', icon: '📈', filterTerm: 'aso', hint: 'App Store Optimization, keywords & ratings' },
  { id: 'cloud', label: 'Cloud & Hosting', icon: '☁️', filterTerm: 'cloud', hint: 'Serverless compute & edge runtimes' },
  { id: 'ui-design', label: 'UI / UX Design', icon: '🎨', filterTerm: 'design', hint: 'Design systems, screenshots & vectors' },
  { id: 'push-notifications', label: 'Push Notifications', icon: '🔔', filterTerm: 'notifications', hint: 'In-app messaging, push & alerts' },
  { id: 'ai-llm', label: 'AI & LLMs', icon: '🤖', filterTerm: 'llm', hint: 'Model gateways, agentic workflows, APIs' },
  { id: 'web3', label: 'Web3 & Crypto', icon: '⛓️', filterTerm: 'crypto', hint: 'Smart contract wallets & Starknet' },
];

export default function ShipsCanvas({
  onOpenSubmit,
  onOpenDeposit,
}: {
  onOpenSubmit?: () => void;
  onOpenDeposit?: () => void;
}) {
  // Current active sponsor index in rotation (0 = Shipaton, 1..32 = sponsors)
  const [sponsorIndex, setSponsorIndex] = useState(0);
  const [fade, setFade] = useState(true);

  // Smart input search query
  const [query, setQuery] = useState('');
  const [showAllModal, setShowAllModal] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showDepositInfo, setShowDepositInfo] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside or pressing Escape
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setIsDropdownOpen(false);
      }
    }

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isDropdownOpen]);

  // Auto-cycle headline banner every 4.5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setSponsorIndex((prev) => (prev + 1) % SPONSORS.length);
        setFade(true);
      }, 350);
    }, 4500);

    return () => clearInterval(timer);
  }, []);

  const currentSponsor = SPONSORS[sponsorIndex] || SPONSORS[0];

  // Smart local substring/keyword matching against all sponsors
  const matchingSponsors = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return [];

    const words = trimmed.split(/\s+/).filter(Boolean);

    return SPONSORS.filter((s) => {
      const nameMatch = s.name.toLowerCase().includes(trimmed);
      const descMatch = s.description.toLowerCase().includes(trimmed);
      const keywordMatch = s.keywords.some((k) => {
        const kLower = k.toLowerCase();
        return (
          words.some((w) => kLower.includes(w) || w.includes(kLower)) ||
          trimmed.includes(kLower) ||
          kLower.includes(trimmed)
        );
      });

      return nameMatch || descMatch || keywordMatch;
    });
  }, [query]);

  function handleSelectCategory(cat: TryCategory) {
    setQuery(cat.label);
    setIsDropdownOpen(false);
  }

  function handleOpenSponsor(url: string) {
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  }

  function handleDepositClick() {
    if (onOpenDeposit) {
      onOpenDeposit();
    } else {
      setShowDepositInfo(true);
    }
  }

  const selectedCategory = TRY_CATEGORIES.find(
    (c) => c.label.toLowerCase() === query.trim().toLowerCase()
  );

  return (
    <div className="relative mb-5 w-full overflow-hidden rounded-3xl border border-white/10 bg-[#16162a]/95 p-4 shadow-2xl backdrop-blur-xl sm:p-5">
      {/* Background blueprint grid styling */}
      <div
        className="pointer-events-none absolute inset-0 rounded-3xl bg-[radial-gradient(#2e2e4a_1px,transparent_1px)] [background-size:16px_16px] opacity-40"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[#57cfc8]/10 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-[#ff6b35]/10 blur-3xl"
        aria-hidden="true"
      />

      {/* Canvas Top Bar: Spotify Audio Plug aligned to fit the space */}
      <div className="relative z-10 border-b border-white/10 pb-3">
        <SpotifyPlugin />
      </div>

      {/* Rotating Headline Banner & Interactive Deposit Button (Full Width) */}
      <div className="relative z-10 mt-3.5 rounded-2xl border border-white/10 bg-[#121224]/80 p-3.5 sm:p-4 backdrop-blur-md">
        {/* Line 1: Static text, only the sponsor logo rotates */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold leading-relaxed text-[#cfced7] sm:text-sm">
          <span>Don't have internet access to</span>
          <a
            href={currentSponsor.url}
            target="_blank"
            rel="noopener noreferrer"
            title={`Visit ${currentSponsor.name} (${currentSponsor.url})`}
            className={`mx-1.5 inline-flex items-center rounded-lg px-2.5 py-1 transition-all duration-300 hover:scale-105 active:scale-95 ${
              fade ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
            } ${
              currentSponsor.id === 'shipaton'
                ? 'border border-white/20 bg-[#1e1e38]'
                : 'border border-white/40 bg-white shadow-sm'
            }`}
          >
            <img
              src={currentSponsor.logo}
              alt={currentSponsor.name}
              className="h-5 max-w-[95px] object-contain sm:h-6"
            />
          </a>
          <span>?</span>
        </div>

        {/* Line 2: Responsive Deposit Plastic Button (Static) */}
        <div className="mt-2.5">
          <button
            type="button"
            data-testid="button-canvas-deposit-plastic"
            onClick={handleDepositClick}
            className="group inline-flex items-center gap-1.5 rounded-xl border border-[#ff6b35]/40 bg-[#ff6b35]/15 px-3 py-1.5 text-xs font-semibold text-[#f4f0e8] shadow-sm transition-all hover:border-[#ff6b35] hover:bg-[#ff6b35]/25 active:scale-95"
            title="Deposit plastic"
          >
            <span className="text-[#ff9d76] transition-colors group-hover:text-white">
              Deposit plastic
            </span>
            <img
              src={`${BASE_URL}assets/plasticbottleicon.svg`}
              alt="Plastic bottle"
              className="h-4.5 w-4.5 shrink-0 filter invert opacity-90 transition-transform group-hover:scale-110"
            />
            <ArrowUpRight
              size={13}
              className="ml-0.5 text-[#ff6b35] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            />
          </button>
        </div>
      </div>

      {/* Smart Input & Building Blocks Dropdown */}
      <div className="relative z-10 mt-4" ref={dropdownRef}>
        {/* Search / What are you building input */}
        <div className="relative">
          <div className="pointer-events-none absolute left-3.5 top-3.5 text-[#57cfc8]">
            <Sparkles size={16} />
          </div>
          <input
            type="text"
            data-testid="input-canvas-building"
            value={query}
            onFocus={() => setIsDropdownOpen(true)}
            onClick={() => setIsDropdownOpen(true)}
            onChange={(e) => {
              setQuery(e.target.value);
              if (!isDropdownOpen) setIsDropdownOpen(true);
            }}
            placeholder="What are you building? (Website, Mobile App, Voice AI...)"
            className="w-full rounded-2xl border border-white/15 bg-[#121224] py-3 pl-10 pr-10 text-xs text-white placeholder:text-[#68687a] focus:border-[#57cfc8] focus:bg-[#1a1a2e] focus:outline-none sm:text-sm shadow-inner transition-colors"
          />
          {query ? (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setIsDropdownOpen(false);
              }}
              className="absolute right-3 top-3 rounded-lg p-1 text-[#858496] hover:text-white transition-colors"
              title="Clear search"
            >
              <X size={15} />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setIsDropdownOpen((prev) => !prev)}
              className="absolute right-3 top-3 rounded-lg p-1 text-[#858496] hover:text-[#57cfc8] transition-colors"
              title="Toggle building blocks menu"
            >
              <ChevronDown
                size={16}
                className={`transition-transform duration-200 ${isDropdownOpen ? 'rotate-180 text-[#57cfc8]' : ''}`}
              />
            </button>
          )}
        </div>

        {/* Floating Building Blocks Dropdown (shows when user taps input) */}
        {isDropdownOpen && (
          <div className="absolute left-0 right-0 top-full z-40 mt-1.5 max-h-80 overflow-y-auto rounded-2xl border border-white/15 bg-[#16162c]/98 p-2.5 shadow-2xl backdrop-blur-2xl [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-white/10 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#57cfc8]">
                Select building block / tech:
              </span>
              <button
                type="button"
                onClick={() => setIsDropdownOpen(false)}
                className="text-[11px] font-semibold text-[#858496] hover:text-white transition-colors"
              >
                Close ✕
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {TRY_CATEGORIES.map((cat) => {
                const isSelected = query.toLowerCase() === cat.label.toLowerCase();
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleSelectCategory(cat)}
                    className={`flex items-center justify-between rounded-xl px-3 py-2 text-left text-xs transition-all active:scale-[0.98] ${
                      isSelected
                        ? 'border border-[#57cfc8]/40 bg-[#57cfc8]/20 font-bold text-[#57cfc8]'
                        : 'border border-transparent bg-white/5 text-[#f4f0e8] hover:border-white/15 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-base shrink-0">{cat.icon}</span>
                      <div className="min-w-0">
                        <div className="font-semibold truncate">{cat.label}</div>
                        <div className="text-[10px] text-[#858496] leading-tight truncate">
                          {cat.hint}
                        </div>
                      </div>
                    </div>
                    {isSelected && (
                      <Check size={14} className="text-[#57cfc8] shrink-0 ml-1.5" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Sub-bar below input with quick actions & link to all sponsors */}
        <div className="mt-2.5 flex items-center justify-between px-1">
          {query.trim() ? (
            <div className="flex items-center gap-1.5 text-[11px] text-[#57cfc8]">
              <span className="text-[#858496]">Filtered:</span>
              <span className="font-semibold text-white">"{query}"</span>
              <button
                type="button"
                onClick={() => setQuery('')}
                className="ml-1 text-[10px] text-[#ff6b35] hover:underline"
              >
                Clear
              </button>
            </div>
          ) : (
            <span className="text-[10px] text-[#858496]">
              Tap above for building blocks (Website, Mobile App, etc.)
            </span>
          )}

          <button
            type="button"
            onClick={() => setShowAllModal(true)}
            className="text-[11px] font-semibold text-[#57cfc8] hover:underline shrink-0"
          >
            All Sponsors (33) →
          </button>
        </div>

        {/* Matching Sponsor Suggestions */}
        {query.trim() !== '' && (
          <div className="mt-3.5">
            {matchingSponsors.length > 0 ? (
              <div>
                <div className="flex items-center justify-between text-[11px] font-semibold text-[#858496]">
                  <span>
                    Tools & sponsors for <strong className="text-white font-bold">"{query}"</strong> ({matchingSponsors.length}):
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowAllModal(true)}
                    className="text-[#57cfc8] hover:underline"
                  >
                    View all 33
                  </button>
                </div>

                <div className="mt-2.5 grid gap-2 sm:grid-cols-2">
                  {matchingSponsors.map((sponsor) => (
                    <div
                      key={sponsor.id}
                      className="group flex flex-col justify-between rounded-2xl border border-white/15 bg-[#121224] p-3 transition-all hover:border-[#57cfc8] hover:bg-[#1a1a2e]"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className={`grid h-7 w-16 shrink-0 place-items-center rounded-lg p-1 ${
                              sponsor.id === 'shipaton' ? 'bg-[#1e1e38]' : 'bg-white shadow-sm'
                            }`}>
                              <img
                                src={sponsor.logo}
                                alt={sponsor.name}
                                className="max-h-5 max-w-[55px] object-contain"
                              />
                            </div>
                            <span className="font-display text-xs font-bold text-white group-hover:text-[#57cfc8] truncate">
                              {sponsor.name}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleOpenSponsor(sponsor.url)}
                            className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[10px] font-semibold text-[#858496] transition-colors hover:border-[#57cfc8] hover:bg-[#57cfc8]/10 hover:text-[#57cfc8]"
                            title={`Visit ${sponsor.name}`}
                          >
                            <span>Visit</span>
                            <ExternalLink size={10} />
                          </button>
                        </div>
                        <p className="mt-2 line-clamp-2 text-[11px] text-[#aaa9ba] leading-relaxed">
                          {sponsor.description}
                        </p>
                      </div>

                      <div className="mt-2.5 flex flex-wrap gap-1 border-t border-white/5 pt-2">
                        {sponsor.keywords.slice(0, 4).map((k) => (
                          <span
                            key={k}
                            className="rounded bg-white/5 px-1.5 py-0.5 text-[9px] text-[#858496]"
                          >
                            {k}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* Neutral empty state */
              <div className="rounded-2xl border border-white/10 bg-[#121224]/80 p-4 text-center">
                <p className="text-xs text-[#aaa9ba]">No direct matches for "{query}".</p>
                <div className="mt-2 flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => setQuery('')}
                    className="rounded-xl border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-[#cfced7] hover:bg-white/10"
                  >
                    Clear Search
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAllModal(true)}
                    className="inline-flex items-center gap-1 rounded-xl border border-[#57cfc8]/30 bg-[#57cfc8]/10 px-3 py-1.5 text-xs font-semibold text-[#57cfc8] hover:bg-[#57cfc8]/20"
                  >
                    <Layers size={13} /> Browse all 33 sponsors
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Empty input state: Frictionless Starter Blueprints & Flow */}
        {!query.trim() && (
          <div className="mt-4 space-y-3">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#858496]">
              Quick Stack Blueprints:
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <button
                type="button"
                onClick={() => setQuery('Website')}
                className="flex flex-col items-start rounded-2xl border border-white/10 bg-[#121224]/90 p-3 text-left transition-all hover:border-[#57cfc8] hover:bg-white/5 active:scale-95"
              >
                <span className="text-lg">🌐</span>
                <span className="mt-1 font-display text-xs font-bold text-white">Fullstack Web</span>
                <span className="text-[10px] text-[#858496] leading-tight">Replit · Limrun · Mobbin</span>
              </button>

              <button
                type="button"
                onClick={() => setQuery('Mobile App')}
                className="flex flex-col items-start rounded-2xl border border-white/10 bg-[#121224]/90 p-3 text-left transition-all hover:border-[#57cfc8] hover:bg-white/5 active:scale-95"
              >
                <span className="text-lg">📱</span>
                <span className="mt-1 font-display text-xs font-bold text-white">Universal App</span>
                <span className="text-[10px] text-[#858496] leading-tight">Expo · Codemagic · ASO</span>
              </button>

              <button
                type="button"
                onClick={() => setQuery('Voice AI')}
                className="flex flex-col items-start rounded-2xl border border-white/10 bg-[#121224]/90 p-3 text-left transition-all hover:border-[#57cfc8] hover:bg-white/5 active:scale-95"
              >
                <span className="text-lg">🎙️</span>
                <span className="mt-1 font-display text-xs font-bold text-white">Voice & Audio AI</span>
                <span className="text-[10px] text-[#858496] leading-tight">ElevenLabs · Moises</span>
              </button>

              <button
                type="button"
                onClick={() => setQuery('Payments')}
                className="flex flex-col items-start rounded-2xl border border-white/10 bg-[#121224]/90 p-3 text-left transition-all hover:border-[#57cfc8] hover:bg-white/5 active:scale-95"
              >
                <span className="text-lg">💳</span>
                <span className="mt-1 font-display text-xs font-bold text-white">SaaS Payments</span>
                <span className="text-[10px] text-[#858496] leading-tight">Stripe · Paddle</span>
              </button>
            </div>

            {/* Seamless builder flow ribbon */}
            <div className="flex items-center justify-between rounded-2xl border border-white/5 bg-[#121224]/60 px-3.5 py-2.5 text-[10px] text-[#858496]">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-[#ff6b35]">1. Recycle Plastic</span>
                <span>→</span>
                <span className="font-semibold text-[#57cfc8]">2. Data Credits</span>
                <span>→</span>
                <span className="font-semibold text-white">3. Build & Ship</span>
              </div>
              <span className="text-[#aaa9ba]">Shipaton 2027</span>
            </div>
          </div>
        )}
      </div>

      {/* Modal: Plastic Deposit Info (if onOpenDeposit not available or help requested) */}
      {showDepositInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md">
          <div className="w-full max-w-sm rounded-3xl border border-white/15 bg-[#121224] p-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Zap className="text-[#ff6b35]" size={18} />
                <h3 className="font-display text-base font-bold text-white">Deposit Plastic Bottles</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowDepositInfo(false)}
                className="rounded-lg p-1 text-[#858496] hover:bg-white/10 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs text-[#aaa9ba]">
              <p>
                Turn plastic waste into high-speed internet data access so you can code, test, and ship your projects effortlessly.
              </p>
              <div className="rounded-2xl border border-white/10 bg-[#1a1a2e] p-3 space-y-2">
                <div className="font-semibold text-white">How it works:</div>
                <div className="flex items-start gap-2">
                  <span className="grid h-5 w-5 place-items-center rounded-full bg-[#ff6b35]/20 text-[#ff6b35] font-bold text-[10px]">1</span>
                  <span>Collect clean plastic bottles (PET 1).</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="grid h-5 w-5 place-items-center rounded-full bg-[#57cfc8]/20 text-[#57cfc8] font-bold text-[10px]">2</span>
                  <span>Drop off at your campus smart bin or hub.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="grid h-5 w-5 place-items-center rounded-full bg-[#1DB954]/20 text-[#1DB954] font-bold text-[10px]">3</span>
                  <span>Get immediate data credits credited to your wallet!</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowDepositInfo(false)}
              className="mt-4 w-full rounded-xl bg-[#ff6b35] py-2.5 text-xs font-bold text-[#121224] hover:brightness-110"
            >
              Got it, let's ship
            </button>
          </div>
        </div>
      )}

      {/* Modal: Browse all 33 sponsors */}
      {showAllModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md">
          <div className="flex max-h-[85vh] w-full max-w-lg flex-col rounded-3xl border border-white/15 bg-[#121224] p-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Layers className="text-[#57cfc8]" size={18} />
                <h3 className="font-display text-base font-bold text-white">All Shipaton 2027 Sponsors</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAllModal(false)}
                className="rounded-lg p-1 text-[#858496] hover:bg-white/10 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <p className="mt-2 text-xs text-[#aaa9ba]">
              Explore developer platforms, tools, APIs, and partner ecosystems powering Shipaton 2027.
            </p>

            <div className="mt-3 flex-1 overflow-y-auto pr-1 space-y-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {SPONSORS.map((s) => (
                <a
                  key={s.id}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between rounded-xl border border-white/10 bg-[#1a1a2e] p-3 transition-colors hover:border-[#57cfc8] hover:bg-[#202038]"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`grid h-10 w-24 shrink-0 place-items-center rounded-lg p-1 ${
                      s.id === 'shipaton' ? 'bg-[#1e1e38]' : 'bg-white shadow-sm'
                    }`}>
                      <img src={s.logo} alt={s.name} className="max-h-7 max-w-[85px] object-contain" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-display text-xs font-bold text-white">{s.name}</div>
                      <div className="truncate text-[10px] text-[#aaa9ba]">{s.description}</div>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {s.keywords.slice(0, 3).map((k) => (
                          <span key={k} className="rounded bg-white/5 px-1.5 py-0.2 text-[9px] text-[#858496]">
                            {k}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <ArrowUpRight size={14} className="shrink-0 text-[#858496]" />
                </a>
              ))}
            </div>

            <div className="mt-4 border-t border-white/10 pt-3 text-center">
              <button
                type="button"
                onClick={() => setShowAllModal(false)}
                className="w-full rounded-xl bg-white/10 py-2.5 text-xs font-semibold text-white hover:bg-white/15"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
