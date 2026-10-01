import { useState } from 'react';
import {
  Trophy,
  Flame,
  Award,
  Users,
  ArrowLeft,
  Recycle,
  Sparkles,
  MapPin,
  Heart,
  Share2,
  ExternalLink,
} from 'lucide-react';

type CampusRanking = {
  rank: number;
  name: string;
  shortCode: string;
  totalKg: number;
  totalMb: number;
  studentsCount: number;
  accent: string;
};

type RecyclerLeader = {
  rank: number;
  name: string;
  campus: string;
  kg: number;
  mb: number;
  tier: string;
  tierColor: string;
};

type CampusFeedItem = {
  id: string;
  user: string;
  campus: string;
  action: string;
  amount: string;
  timeAgo: string;
  initialCheers: number;
  type: 'deposit' | 'gift' | 'milestone';
};

type BadgeItem = {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  progress?: string;
};

const CAMPUS_RANKINGS: CampusRanking[] = [
  { rank: 1, name: 'Massachusetts Institute of Technology', shortCode: 'MIT', totalKg: 1420.5, totalMb: 142050, studentsCount: 412, accent: '#57cfc8' },
  { rank: 2, name: 'Stanford University', shortCode: 'Stanford', totalKg: 1285.2, totalMb: 128520, studentsCount: 384, accent: '#ff6b35' },
  { rank: 3, name: 'Georgia Institute of Technology', shortCode: 'Georgia Tech', totalKg: 980.0, totalMb: 98000, studentsCount: 310, accent: '#f3c969' },
  { rank: 4, name: 'Carnegie Mellon University', shortCode: 'CMU', totalKg: 815.4, totalMb: 81540, studentsCount: 265, accent: '#c39bf4' },
  { rank: 5, name: 'University of Texas at Austin', shortCode: 'UT Austin', totalKg: 742.8, totalMb: 74280, studentsCount: 240, accent: '#ff936f' },
  { rank: 6, name: 'University of Michigan', shortCode: 'U-M', totalKg: 690.1, totalMb: 69010, studentsCount: 215, accent: '#57cfc8' },
];

const TOP_RECYCLERS: RecyclerLeader[] = [
  { rank: 1, name: 'Maya Lin', campus: 'MIT', kg: 48.6, mb: 4860, tier: 'Eco Legend', tierColor: '#ff6b35' },
  { rank: 2, name: 'Devon Vance', campus: 'Stanford', kg: 42.1, mb: 4210, tier: 'Eco Legend', tierColor: '#ff6b35' },
  { rank: 3, name: 'Jordan Hayes', campus: 'Georgia Tech', kg: 38.4, mb: 3840, tier: 'Gold Recycler', tierColor: '#f3c969' },
  { rank: 4, name: 'Priya Sharma', campus: 'CMU', kg: 34.2, mb: 3420, tier: 'Gold Recycler', tierColor: '#f3c969' },
  { rank: 5, name: 'Carlos Mendez', campus: 'UT Austin', kg: 29.8, mb: 2980, tier: 'Silver Recycler', tierColor: '#57cfc8' },
];

const INITIAL_FEED: CampusFeedItem[] = [
  {
    id: 'f-1',
    user: 'Alex Rivera',
    campus: 'Georgia Tech',
    action: 'deposited 2.4kg plastic at Smart Bin #04',
    amount: '+240MB',
    timeAgo: '3m ago',
    initialCheers: 14,
    type: 'deposit',
  },
  {
    id: 'f-2',
    user: 'Elena Rostova',
    campus: 'MIT',
    action: 'gifted data to Marcus for Shipaton build',
    amount: '50MB',
    timeAgo: '18m ago',
    initialCheers: 8,
    type: 'gift',
  },
  {
    id: 'f-3',
    user: 'Georgia Tech Campus',
    campus: 'Georgia Tech',
    action: 'unlocked the 1-Ton Recycled Campus Banner',
    amount: 'Milestone',
    timeAgo: '1h ago',
    initialCheers: 42,
    type: 'milestone',
  },
  {
    id: 'f-4',
    user: 'Liam Chen',
    campus: 'Stanford',
    action: 'deposited 3.1kg PET water bottles at Union Bin',
    amount: '+310MB',
    timeAgo: '2h ago',
    initialCheers: 19,
    type: 'deposit',
  },
];

const BADGES: BadgeItem[] = [
  {
    id: 'b-1',
    title: 'First Dropoff',
    description: 'Deposited your first batch of plastic at an authorized smart bin.',
    icon: '🌱',
    unlocked: true,
  },
  {
    id: 'b-2',
    title: 'Silver Recycler',
    description: 'Diverted over 10kg of plastic waste from campus landfills.',
    icon: '🥈',
    unlocked: true,
  },
  {
    id: 'b-3',
    title: 'Byte Philanthropist',
    description: 'Transferred 100MB+ in data bytes to fellow builders on campus.',
    icon: '⚡',
    unlocked: true,
  },
  {
    id: 'b-4',
    title: 'Gold Recycler (25kg+)',
    description: 'Reach 25kg total plastic deposited. Unlocks +15% bonus data.',
    icon: '🥇',
    unlocked: false,
    progress: 'Deposit 25kg to unlock (+15% bonus data)',
  },
  {
    id: 'b-5',
    title: 'Campus Ambassador',
    description: 'Invite 5 friends who complete their first plastic dropoff.',
    icon: '🎓',
    unlocked: false,
    progress: '2 / 5 invited',
  },
];

export default function SocialsScreen({
  currentUser,
  onOpenFindDropoff,
  onClose,
}: {
  currentUser?: { firstName: string; walletBalanceMb: number } | null;
  onOpenFindDropoff: () => void;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<'leaderboard' | 'feed' | 'badges'>('leaderboard');
  const [cheers, setCheers] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    INITIAL_FEED.forEach((item) => {
      init[item.id] = item.initialCheers;
    });
    return init;
  });
  const [userCheered, setUserCheered] = useState<Set<string>>(new Set());
  const [copiedShare, setCopiedShare] = useState(false);

  function handleCheer(id: string) {
    setUserCheered((prev) => {
      const next = new Set(prev);
      const isCheered = next.has(id);
      if (isCheered) {
        next.delete(id);
        setCheers((c) => ({ ...c, [id]: (c[id] || 1) - 1 }));
      } else {
        next.add(id);
        setCheers((c) => ({ ...c, [id]: (c[id] || 0) + 1 }));
      }
      return next;
    });
  }

  function handleShareLeaderboard() {
    const text = 'Check out the Shipaton 2027 Campus Recycling Leaderboard on Oxibyte! We are turning plastic into data bytes.';
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2200);
    }
  }

  return (
    <div className="flex h-full w-full flex-col bg-[#11111f] text-[#f4f0e8]">
      {/* Header */}
      <div className="border-b border-white/10 bg-[#1a1a2e]/95 px-5 py-3.5 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              data-testid="button-close-socials"
              onClick={onClose}
              className="rounded-lg p-2 text-[#cfced7] hover:bg-white/5"
              aria-label="Back to home"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display text-xl font-bold">Shipaton Campus</h1>
                <span className="flex items-center gap-1 rounded-full bg-[#57cfc8]/20 px-2 py-0.5 text-[10px] font-bold text-[#57cfc8]">
                  <Flame size={11} className="text-[#ff6b35]" /> Live
                </span>
              </div>
              <p className="text-xs text-[#858496]">Shipaton builder energy, rankings & sustainability feed</p>
            </div>
          </div>

          <button
            onClick={handleShareLeaderboard}
            data-testid="button-share-socials"
            className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-[#24243c] px-3 py-1.5 text-xs font-semibold text-[#cfced7] hover:border-white/20"
          >
            <Share2 size={13} />
            <span>{copiedShare ? 'Copied' : 'Share'}</span>
          </button>
        </div>

        {/* Global Impact Summary Bar */}
        <div className="mt-3.5 grid grid-cols-3 gap-2 rounded-2xl bg-[#16162a] p-2.5 text-center text-xs">
          <div>
            <span className="block text-[10px] text-[#858496]">Total Plastic</span>
            <span className="font-display font-bold text-[#57cfc8]">5,934 kg</span>
          </div>
          <div className="border-x border-white/10">
            <span className="block text-[10px] text-[#858496]">Data Granted</span>
            <span className="font-display font-bold text-[#f3c969]">593,400 MB</span>
          </div>
          <div>
            <span className="block text-[10px] text-[#858496]">Campuses</span>
            <span className="font-display font-bold text-white">48 Schools</span>
          </div>
        </div>

        {/* Navigation Sub-Tabs */}
        <div className="mt-3.5 flex border-b border-white/10">
          <button
            data-testid="tab-leaderboard"
            onClick={() => setTab('leaderboard')}
            className={`flex flex-1 items-center justify-center gap-1.5 pb-2.5 text-xs font-bold transition-colors ${
              tab === 'leaderboard'
                ? 'border-b-2 border-[#57cfc8] text-[#57cfc8]'
                : 'text-[#858496] hover:text-[#cfced7]'
            }`}
          >
            <Trophy size={14} /> Leaderboard
          </button>
          <button
            data-testid="tab-feed"
            onClick={() => setTab('feed')}
            className={`flex flex-1 items-center justify-center gap-1.5 pb-2.5 text-xs font-bold transition-colors ${
              tab === 'feed'
                ? 'border-b-2 border-[#ff6b35] text-[#ff6b35]'
                : 'text-[#858496] hover:text-[#cfced7]'
            }`}
          >
            <Users size={14} /> Live Feed
          </button>
          <button
            data-testid="tab-badges"
            onClick={() => setTab('badges')}
            className={`flex flex-1 items-center justify-center gap-1.5 pb-2.5 text-xs font-bold transition-colors ${
              tab === 'badges'
                ? 'border-b-2 border-[#f3c969] text-[#f3c969]'
                : 'text-[#858496] hover:text-[#cfced7]'
            }`}
          >
            <Award size={14} /> Badges
          </button>
        </div>
      </div>

      {/* Tab Body */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {/* LEADERBOARD TAB */}
        {tab === 'leaderboard' && (
          <div className="space-y-4">
            {/* User Campus Standing Banner */}
            <div className="rounded-2xl border border-[#57cfc8]/30 bg-gradient-to-r from-[#57cfc8]/15 via-[#24243c] to-[#24243c] p-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#57cfc8]">
                    Your Campus Standing
                  </span>
                  <h3 className="font-display text-base font-bold text-white">
                    Georgia Tech — Rank #3
                  </h3>
                  <p className="mt-0.5 text-xs text-[#aaa9ba]">
                    980 kg recycled · 310 active shippers
                  </p>
                </div>
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#57cfc8]/20 text-[#57cfc8]">
                  <Trophy size={22} />
                </div>
              </div>
            </div>

            {/* University Rankings List */}
            <div>
              <div className="mb-2 flex items-center justify-between text-xs">
                <span className="font-bold uppercase tracking-wider text-[#858496]">
                  Top Campus Rankings
                </span>
                <span className="text-[#57cfc8]">Shipaton 2027 Season</span>
              </div>

              <div className="space-y-2">
                {CAMPUS_RANKINGS.map((campus) => {
                  const isTop3 = campus.rank <= 3;
                  return (
                    <div
                      key={campus.rank}
                      data-testid={`campus-rank-${campus.rank}`}
                      className="flex items-center gap-3 rounded-2xl border border-white/5 bg-[#1c1c30] p-3.5 transition-colors hover:border-white/15"
                    >
                      <span
                        className={`grid h-7 w-7 shrink-0 place-items-center rounded-xl font-display text-xs font-bold ${
                          campus.rank === 1
                            ? 'bg-[#ff6b35] text-[#1a1a2e]'
                            : campus.rank === 2
                            ? 'bg-[#57cfc8] text-[#1a1a2e]'
                            : campus.rank === 3
                            ? 'bg-[#f3c969] text-[#1a1a2e]'
                            : 'bg-white/10 text-[#aaa9ba]'
                        }`}
                      >
                        {campus.rank}
                      </span>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="truncate text-sm font-bold text-white">
                            {campus.shortCode}
                          </span>
                          {isTop3 && (
                            <span className="rounded-md bg-white/10 px-1 py-0.2 text-[9px] font-bold text-[#f3c969]">
                              Top 3
                            </span>
                          )}
                        </div>
                        <p className="truncate text-[11px] text-[#858496]">{campus.name}</p>
                      </div>

                      <div className="text-right">
                        <div className="font-mono text-xs font-bold text-[#57cfc8]">
                          {campus.totalKg.toLocaleString()} kg
                        </div>
                        <span className="text-[10px] text-[#858496]">
                          {campus.studentsCount} shippers
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Individual Student Recycler Stars */}
            <div className="mt-4">
              <div className="mb-2 flex items-center justify-between text-xs">
                <span className="font-bold uppercase tracking-wider text-[#858496]">
                  Top Campus Shippers
                </span>
                <span className="text-[#858496]">All time</span>
              </div>

              <div className="space-y-2">
                {TOP_RECYCLERS.map((rec) => (
                  <div
                    key={rec.rank}
                    className="flex items-center justify-between rounded-xl bg-[#24243c] p-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="grid h-8 w-8 place-items-center rounded-full bg-[#ff6b35] text-xs font-bold text-[#1a1a2e]">
                        {rec.name.slice(0, 1)}
                      </span>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-white">{rec.name}</span>
                          <span
                            className="rounded-full px-1.5 py-0.2 text-[9px] font-bold"
                            style={{
                              backgroundColor: `${rec.tierColor}20`,
                              color: rec.tierColor,
                            }}
                          >
                            {rec.tier}
                          </span>
                        </div>
                        <span className="text-[10px] text-[#858496]">{rec.campus}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="font-display text-xs font-bold text-[#57cfc8]">
                        {rec.kg} kg
                      </span>
                      <span className="block text-[10px] text-[#f3c969]">+{rec.mb}MB</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* LIVE FEED TAB */}
        {tab === 'feed' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-2xl bg-[#24243c] p-4">
              <div>
                <h3 className="text-xs font-bold text-white">Join the Drop-off Stream</h3>
                <p className="mt-0.5 text-[11px] text-[#aaa9ba]">
                  Every bottle diverted earns data and shows on your campus activity feed.
                </p>
              </div>
              <button
                onClick={onOpenFindDropoff}
                data-testid="button-feed-deposit"
                className="shrink-0 rounded-xl bg-[#57cfc8] px-3.5 py-2 text-xs font-bold text-[#1a1a2e] hover:brightness-110"
              >
                Deposit Plastic
              </button>
            </div>

            {INITIAL_FEED.map((item) => {
              const count = cheers[item.id] || 0;
              const isCheered = userCheered.has(item.id);

              return (
                <div
                  key={item.id}
                  className="rounded-2xl border border-white/5 bg-[#1c1c30] p-4 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`grid h-8 w-8 place-items-center rounded-xl text-xs ${
                          item.type === 'milestone'
                            ? 'bg-[#f3c969]/20 text-[#f3c969]'
                            : item.type === 'gift'
                            ? 'bg-[#c39bf4]/20 text-[#c39bf4]'
                            : 'bg-[#57cfc8]/20 text-[#57cfc8]'
                        }`}
                      >
                        {item.type === 'milestone' ? (
                          <Sparkles size={16} />
                        ) : item.type === 'gift' ? (
                          <Heart size={16} />
                        ) : (
                          <Recycle size={16} />
                        )}
                      </span>

                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-white">{item.user}</span>
                          <span className="text-[10px] text-[#858496]">· {item.timeAgo}</span>
                        </div>
                        <span className="text-[10px] font-semibold text-[#858496]">
                          {item.campus}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`rounded-full px-2 py-0.5 font-mono text-[11px] font-bold ${
                        item.type === 'milestone'
                          ? 'bg-[#f3c969]/15 text-[#f3c969]'
                          : 'bg-[#57cfc8]/15 text-[#57cfc8]'
                      }`}
                    >
                      {item.amount}
                    </span>
                  </div>

                  <p className="mt-2.5 text-xs text-[#cfced7]">{item.action}</p>

                  <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-2.5">
                    <button
                      onClick={() => handleCheer(item.id)}
                      data-testid={`cheer-feed-${item.id}`}
                      className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition-transform active:scale-95 ${
                        isCheered
                          ? 'bg-[#ff6b35] text-[#1a1a2e]'
                          : 'bg-white/5 text-[#858496] hover:text-white'
                      }`}
                    >
                      <span>👏</span>
                      <span>{count}</span>
                    </button>

                    <button
                      onClick={onOpenFindDropoff}
                      className="flex items-center gap-1 text-[11px] text-[#858496] hover:text-[#57cfc8]"
                    >
                      <MapPin size={12} /> Find bin
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* BADGES & STREAKS TAB */}
        {tab === 'badges' && (
          <div className="space-y-4">
            {/* Weekly Streak Card */}
            <div className="rounded-3xl border border-[#ff6b35]/30 bg-gradient-to-br from-[#24243c] via-[#202038] to-[#18182b] p-5 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#ff6b35]">
                    Active Habit Streak
                  </span>
                  <h3 className="mt-0.5 font-display text-2xl font-bold text-white">
                    4-Day Streak 🔥
                  </h3>
                  <p className="mt-1 text-xs text-[#aaa9ba]">
                    Deposit 1 more day to unlock +50MB weekly streak bonus.
                  </p>
                </div>
                <span className="grid h-14 w-14 place-items-center rounded-2xl bg-[#ff6b35]/20 text-2xl">
                  🔥
                </span>
              </div>

              {/* Day tracker circles */}
              <div className="mt-4 grid grid-cols-7 gap-1 text-center">
                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, idx) => {
                  const completed = idx < 4;
                  return (
                    <div key={idx} className="flex flex-col items-center gap-1">
                      <span className="text-[10px] text-[#858496]">{day}</span>
                      <span
                        className={`grid h-8 w-8 place-items-center rounded-xl text-xs font-bold ${
                          completed
                            ? 'bg-[#57cfc8] text-[#1a1a2e]'
                            : 'border border-dashed border-white/20 bg-transparent text-[#858496]'
                        }`}
                      >
                        {completed ? '✓' : ''}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Badges Collection */}
            <div>
              <div className="mb-2 flex items-center justify-between text-xs">
                <span className="font-bold uppercase tracking-wider text-[#858496]">
                  Sustainability Badges (3 / 5 Unlocked)
                </span>
              </div>

              <div className="space-y-2.5">
                {BADGES.map((badge) => (
                  <div
                    key={badge.id}
                    className={`flex items-start gap-3.5 rounded-2xl border p-4 ${
                      badge.unlocked
                        ? 'border-white/10 bg-[#1c1c30]'
                        : 'border-white/5 bg-[#161626] opacity-65'
                    }`}
                  >
                    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/5 text-2xl">
                      {badge.icon}
                    </span>

                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-white">{badge.title}</h4>
                        {badge.unlocked && (
                          <span className="rounded-full bg-[#57cfc8]/20 px-2 py-0.2 text-[9px] font-bold text-[#57cfc8]">
                            Unlocked
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-[#aaa9ba]">
                        {badge.description}
                      </p>

                      {badge.progress && (
                        <div className="mt-2">
                          <span className="text-[10px] font-semibold text-[#f3c969]">
                            Progress: {badge.progress}
                          </span>
                          <div className="mt-1 h-1.5 w-full rounded-full bg-black/40">
                            <div className="h-full w-1/2 rounded-full bg-[#f3c969]" />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
