import { useEffect, useMemo, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Capacitor } from '@capacitor/core';
import { ArrowUpRight, Check, ChevronDown, Plus, Search, X, Zap, Signal, BatteryMedium, Wifi } from 'lucide-react';
import SignUp from './SignUp';
import Login from './Login';
import WalletHome from './WalletHome';
import BottomNav from './BottomNav';
import ShipatonCTA from './ShipatonCTA';
import PromoCards from './PromoCards';
import HomeCarousel from './HomeCarousel';
import Welcome from './Welcome';
import AccountSheet from './AccountSheet';
import SendByte from './SendByte';
import TransactionHistory from './TransactionHistory';
import EditProfile from './EditProfile';
import FindDropoff from './FindDropoff';
import Settings from './Settings';
import NotificationsModal, { type LedgerTransaction } from './NotificationsModal';
import ScannerModal from './ScannerModal';
import SupportModal from './SupportModal';
import ChatsScreen from './ChatsScreen';
import ShipsScreen from './ShipsScreen';
import SocialsScreen from './SocialsScreen';
import OxibyteStarModal from './components/OxibyteStarModal';
import StellarTierModal from './components/StellarTierModal';
import { initRevenueCat } from './lib/revenuecat';
import { apiGet } from './lib/api';

const queryClient = new QueryClient();

type Submission = { id: string; name: string; tagline: string; university: string; github: string; video: string; raised: number; accent: string; category: string; };
type CurrentUser = {
  id: string;
  phone: string;
  firstName: string;
  lastName: string | null;
  username: string | null;
  gender: string | null;
  dateOfBirth: string | null;
  email: string | null;
  emailVerified: boolean;
  profilePhotoUrl: string | null;
  walletBalanceMb: number;
};
const FALLBACK_UNIVERSITIES = ['University of Michigan', 'Georgia Tech', 'University of Waterloo', 'Carnegie Mellon University', 'University of Texas at Austin', 'Northeastern University', 'University of British Columbia'];

function App() {
  const [onboarding, setOnboarding] = useState(() => localStorage.getItem('Plasticbyte-onboarded') !== 'true');
  const [student, setStudent] = useState<boolean | null>(null);
  const [university, setUniversity] = useState(() => localStorage.getItem('Plasticbyte-university') || '');
  const [query, setQuery] = useState('');
  const [apps, setApps] = useState<Submission[]>(() => { try { return JSON.parse(localStorage.getItem('Plasticbyte-submissions') || 'null') || []; } catch { return []; } });
  const [showSubmit, setShowSubmit] = useState(false);
  const [notice, setNotice] = useState('');
  const [allUniversities, setAllUniversities] = useState<string[]>(FALLBACK_UNIVERSITIES);
  const [universitiesLoading, setUniversitiesLoading] = useState(true);
  const [showSignUp, setShowSignUp] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showAccount, setShowAccount] = useState(false);
  const [showSendByte, setShowSendByte] = useState(false);
  const [showTransactions, setShowTransactions] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showFindDropoff, setShowFindDropoff] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [showSupport, setShowSupport] = useState(false);
  const [chatThreadId, setChatThreadId] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<LedgerTransaction[]>([]);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [readNotifIds, setReadNotifIds] = useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem('oxibyte_read_notifications');
      return raw ? new Set<string>(JSON.parse(raw)) : new Set<string>();
    } catch {
      return new Set<string>();
    }
  });
  const [activeTab, setActiveTab] = useState<'home' | 'ships' | 'chats' | 'socials' | 'me'>('home');
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [showStarModal, setShowStarModal] = useState(false);
  const [starModalMode, setStarModalMode] = useState<'paywall' | 'customer_center'>('paywall');
  const [starModalMentor, setStarModalMentor] = useState<string | null>(null);
  const [showStellarTierModal, setShowStellarTierModal] = useState(false);
  const [depositedGrams, setDepositedGrams] = useState(0);

  function loadTransactions() {
    if (!currentUser) return;
    setTransactionsLoading(true);
    apiGet<{ transactions: LedgerTransaction[] }>('/wallet/transactions')
      .then((data) => setTransactions(data.transactions || []))
      .catch(() => {})
      .finally(() => setTransactionsLoading(false));
  }

  useEffect(() => {
    // Restore an existing session (if the backend is reachable and a
    // session cookie is already present).
    apiGet<{ user: typeof currentUser }>('/auth/me')
      .then((data) => setCurrentUser(data.user))
      .catch(() => {});
  }, []);

  useEffect(() => {
    loadTransactions();
    initRevenueCat(currentUser?.id).catch(() => {});
    if (currentUser) {
      apiGet<{ depositedGrams: number }>('/wallet/me')
        .then((d) => setDepositedGrams(d.depositedGrams || 0))
        .catch(() => {});
    }
  }, [currentUser]);

  useEffect(() => {
    const handleOpenPaywall = (e: any) => {
      setStarModalMode('paywall');
      setStarModalMentor(e.detail?.mentorName || null);
      setShowStarModal(true);
    };
    const handleOpenCustomerCenter = () => {
      setStarModalMode('customer_center');
      setShowStarModal(true);
    };

    window.addEventListener('oxibyte:open_star_paywall', handleOpenPaywall);
    window.addEventListener('oxibyte:open_star_customer_center', handleOpenCustomerCenter);
    return () => {
      window.removeEventListener('oxibyte:open_star_paywall', handleOpenPaywall);
      window.removeEventListener('oxibyte:open_star_customer_center', handleOpenCustomerCenter);
    };
  }, []);

  const unreadNotificationCount = useMemo(() => {
    let customCount = 0;
    try {
      const saved = localStorage.getItem('oxibyte_deposit_notifications');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          customCount = parsed.filter((item) => !readNotifIds.has(item.id || `custom-${item.createdAt}`)).length;
        }
      }
    } catch {}
    const txCount = transactions.filter((t) => t.deltaMb > 0 && !readNotifIds.has(`tx-${t.id}`)).length;
    return customCount + txCount;
  }, [transactions, readNotifIds]);

  function handleMarkNotificationRead(id: string) {
    setReadNotifIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      localStorage.setItem('oxibyte_read_notifications', JSON.stringify([...next]));
      return next;
    });
  }

  function handleMarkAllNotificationsRead() {
    const allIds = transactions.filter((t) => t.deltaMb > 0).map((t) => `tx-${t.id}`);
    const next = new Set([...readNotifIds, ...allIds]);
    setReadNotifIds(next);
    localStorage.setItem('oxibyte_read_notifications', JSON.stringify([...next]));
  }

  useEffect(() => {
    let cancelled = false;
    fetch(`${import.meta.env.BASE_URL}data/universities.json`)
      .then((res) => { if (!res.ok) throw new Error(`${res.status}`); return res.json(); })
      .then((data: Array<{ name: string }>) => {
        if (cancelled) return;
        const names = Array.from(new Set(data.map((item) => item.name))).sort((a, b) => a.localeCompare(b));
        setAllUniversities(names);
      })
      .catch(() => { /* keep FALLBACK_UNIVERSITIES if the file is missing/offline-first-run */ })
      .finally(() => { if (!cancelled) setUniversitiesLoading(false); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => { localStorage.setItem('Plasticbyte-submissions', JSON.stringify(apps)); }, [apps]);

  const visibleUniversities = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    const starts: string[] = []; const contains: string[] = [];
    for (const name of allUniversities) {
      const lower = name.toLowerCase();
      if (lower.startsWith(q)) starts.push(name);
      else if (lower.includes(q)) contains.push(name);
    }
    return [...starts, ...contains].slice(0, 25);
  }, [query, allUniversities]);

  function finishOnboarding(isStudent: boolean, school = '') {
    setStudent(isStudent); setUniversity(school); setOnboarding(false); localStorage.setItem('Plasticbyte-onboarded', 'true');
    if (school) localStorage.setItem('Plasticbyte-university', school);
    if (!currentUser) setShowSignUp(true);
  }
  function submitApp(data: Omit<Submission, 'id' | 'raised'>) {
    setApps((current) => [{ ...data, id: `${Date.now()}`, raised: 0 }, ...current]);
    setShowSubmit(false); setNotice('App submitted. The launchpad is watching.');
    window.setTimeout(() => setNotice(''), 3200);
  }

  const isNative = Capacitor.isNativePlatform();

  return (
    <QueryClientProvider client={queryClient}>
      <div className={isNative ? "h-[100dvh] w-full bg-[#1a1a2e] overflow-hidden" : "min-h-screen bg-[#0a0a14] flex justify-center items-center py-0 sm:py-6 selection:bg-[#57cfc8] selection:text-[#1a1a2e]"}>
        {/* Main App Container: Full screen on native phone, mock frame on desktop web */}
        <div className={isNative ? "relative w-full h-[100dvh] bg-[#1a1a2e] text-[#f4f0e8] overflow-hidden flex flex-col" : "relative w-full max-w-[420px] h-[100dvh] sm:h-[min(880px,94vh)] bg-[#1a1a2e] text-[#f4f0e8] overflow-hidden sm:rounded-[48px] sm:border-[8px] sm:border-[#272740] sm:shadow-[0_25px_80px_rgba(0,0,0,0.85)] flex flex-col"}>
          {/* Simulated Top Status Bar (Only on Web desktop mockup) */}
          {!isNative && (
            <div className="flex items-center justify-between px-6 pt-3 pb-1 select-none text-xs font-semibold text-white/90 shrink-0 z-30 bg-[#1a1a2e]">
              <span className="font-mono text-[11px]">9:41</span>
              {/* Camera notch / Dynamic Island */}
              <div className="h-4 w-24 rounded-full bg-black/60 mx-auto" />
              <div className="flex items-center gap-1.5 text-white/80">
                <Signal size={12} />
                <span className="text-[10px] font-bold">5G</span>
                <BatteryMedium size={14} />
              </div>
            </div>
          )}

          {/* Main Content Area: scrolls independently between Top Status Bar and Bottom Nav */}
          <main className={`noise flex-1 min-h-0 overflow-y-auto overflow-x-hidden relative ${!currentUser ? 'flex flex-col' : ''}`}>
            {activeTab === 'home' && (
              <>
                {currentUser ? (
                  <div className="flex flex-col pb-2">
                    <WalletHome
                      user={currentUser}
                      recentTransaction={transactions[0] || null}
                      notificationCount={unreadNotificationCount}
                      onSendByte={() => setShowSendByte(true)}
                      onViewTransactions={() => setShowTransactions(true)}
                      onOpenProfile={() => setShowEditProfile(true)}
                      onOpenFindDropoff={() => setShowFindDropoff(true)}
                      onOpenHelp={() => setShowSupport(true)}
                      onOpenScan={() => setShowScanner(true)}
                      onOpenNotifications={() => setShowNotifications(true)}
                      onOpenStellarTiers={() => setShowStellarTierModal(true)}
                      onOpenStarPaywall={() => {
                        setStarModalMode('paywall');
                        setStarModalMentor(null);
                        setShowStarModal(true);
                      }}
                      onOpenCustomerCenter={() => {
                        setStarModalMode('customer_center');
                        setShowStarModal(true);
                      }}
                    />
                    <ShipatonCTA onSubmit={() => setShowSubmit(true)} />
                    <PromoCards
                      onDeposit={() => setShowFindDropoff(true)}
                      onShare={() => {
                        navigator.clipboard?.writeText(window.location.href);
                        setNotice('Link copied — share Oxibyte with a friend.');
                        window.setTimeout(() => setNotice(''), 3200);
                      }}
                    />
                    <HomeCarousel />
                  </div>
                ) : (
                  <div className="flex flex-1 h-full w-full flex-col items-center justify-center my-auto">
                    <Welcome onGetStarted={() => setShowSignUp(true)} onLogIn={() => setShowLogin(true)} />
                  </div>
                )}
              </>
            )}

            {activeTab === 'ships' && (
              <ShipsScreen
                userApps={apps}
                onOpenSubmit={() => setShowSubmit(true)}
                onClose={() => setActiveTab('home')}
                onOpenDeposit={() => setShowFindDropoff(true)}
              />
            )}

            {activeTab === 'chats' && (
              <ChatsScreen
                initialThreadId={chatThreadId}
                currentUserFirstName={currentUser?.firstName || 'Shipper'}
                onClose={() => setActiveTab('home')}
              />
            )}

            {activeTab === 'socials' && (
              <SocialsScreen
                currentUser={currentUser}
                onOpenFindDropoff={() => setShowFindDropoff(true)}
                onClose={() => setActiveTab('home')}
              />
            )}
          </main>

          {/* Permanently Docked Bottom Navigation Bar */}
          {currentUser && (
            <div className="shrink-0 z-30">
              <BottomNav
                active={showAccount ? 'me' : activeTab}
                onSelect={(key) => {
                  if (key === 'me') {
                    setShowAccount(true);
                    return;
                  }
                  setShowAccount(false);
                  setActiveTab(key);
                  if (key === 'chats') {
                    setChatThreadId(null);
                  }
                }}
              />
            </div>
          )}

          {/* Overlays and Modals (bounded by the smartphone frame) */}
          {onboarding && (
            <Onboarding
              student={student}
              query={query}
              setQuery={setQuery}
              universities={visibleUniversities}
              loading={universitiesLoading}
              onStudent={setStudent}
              onFinish={finishOnboarding}
            />
          )}
          {showSignUp && (
            <SignUp
              onDone={(user) => {
                setCurrentUser(user);
                setShowSignUp(false);
              }}
              onSkip={() => setShowSignUp(false)}
            />
          )}
          {showLogin && (
            <Login
              onDone={(user) => {
                setCurrentUser(user);
                setShowLogin(false);
              }}
              onBack={() => setShowLogin(false)}
            />
          )}
          {showAccount && currentUser && (
            <AccountSheet
              user={currentUser}
              onClose={() => {
                setShowAccount(false);
                setActiveTab('home');
              }}
              onLoggedOut={() => {
                setCurrentUser(null);
                setShowAccount(false);
                setActiveTab('home');
              }}
              onOpenSettings={() => {
                setShowAccount(false);
                setShowSettings(true);
              }}
              onOpenEditProfile={() => {
                setShowAccount(false);
                setShowEditProfile(true);
              }}
              onOpenStarPaywall={() => {
                setStarModalMode('paywall');
                setStarModalMentor(null);
                setShowStarModal(true);
              }}
              onOpenCustomerCenter={() => {
                setStarModalMode('customer_center');
                setShowStarModal(true);
              }}
            />
          )}
          {showSettings && (
            <Settings
              onClose={() => setShowSettings(false)}
              onOpenEditProfile={() => {
                setShowSettings(false);
                setShowEditProfile(true);
              }}
            />
          )}
          {showFindDropoff && (
            <FindDropoff
              onClose={() => setShowFindDropoff(false)}
              currentUser={currentUser}
              onRedeemed={(newBalanceMb, message) => {
                if (currentUser) {
                  setCurrentUser((u) => (u ? { ...u, walletBalanceMb: newBalanceMb } : u));
                }
                loadTransactions();
                setNotice(message);
                window.setTimeout(() => setNotice(''), 4500);
              }}
            />
          )}
          {showEditProfile && currentUser && (
            <EditProfile
              onClose={() => setShowEditProfile(false)}
              onUpdated={(user) => setCurrentUser((u) => (u ? { ...u, ...user } : u))}
            />
          )}
          {showSendByte && currentUser && (
            <SendByte
              balanceMb={currentUser.walletBalanceMb}
              onClose={() => setShowSendByte(false)}
              onSent={(newBalanceMb, message) => {
                setCurrentUser((u) => (u ? { ...u, walletBalanceMb: newBalanceMb } : u));
                loadTransactions();
                setShowSendByte(false);
                setNotice(message);
                window.setTimeout(() => setNotice(''), 3200);
              }}
              onOpenStarPaywall={(mentorName) => {
                setStarModalMode('paywall');
                setStarModalMentor(mentorName || null);
                setShowStarModal(true);
              }}
            />
          )}
          {/* Oxibyte Star Mentorship Modal (Paywall & Customer Center) */}
          <OxibyteStarModal
            isOpen={showStarModal}
            onClose={() => setShowStarModal(false)}
            initialMode={starModalMode}
            selectedMentorName={starModalMentor}
          />

          {/* Stellar Recycling Tier Progression Modal */}
          <StellarTierModal
            isOpen={showStellarTierModal}
            onClose={() => setShowStellarTierModal(false)}
            depositedGrams={depositedGrams}
            onOpenDeposit={() => {
              setShowStellarTierModal(false);
              setShowFindDropoff(true);
            }}
          />
          {showTransactions && currentUser && (
            <TransactionHistory onClose={() => setShowTransactions(false)} />
          )}
          {showSubmit && (
            <SubmitModal
              university={university}
              allUniversities={allUniversities}
              onClose={() => setShowSubmit(false)}
              onSubmit={submitApp}
            />
          )}

          {showNotifications && (
            <NotificationsModal
              onClose={() => setShowNotifications(false)}
              onOpenDeposit={() => {
                setShowNotifications(false);
                setShowFindDropoff(true);
              }}
              readIds={readNotifIds}
              onMarkRead={handleMarkNotificationRead}
              onMarkAllRead={handleMarkAllNotificationsRead}
              rawTransactions={transactions}
              isLoading={transactionsLoading}
            />
          )}

          {showScanner && (
            <ScannerModal
              onClose={() => setShowScanner(false)}
              onOpenDropoff={() => {
                setShowScanner(false);
                setShowFindDropoff(true);
              }}
            />
          )}

          {showSupport && (
            <SupportModal
              onClose={() => setShowSupport(false)}
              onOpenOxibyteChat={() => {
                setShowSupport(false);
                setChatThreadId('support');
                setActiveTab('chats');
              }}
            />
          )}

          {notice && (
            <div
              role="status"
              data-testid="status-notice"
              style={{ bottom: 'max(4.5rem, env(safe-area-inset-bottom))' }}
              className="absolute left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-xl border border-[#57cfc8]/40 bg-[#202039] px-4 py-2.5 text-xs font-semibold shadow-2xl"
            >
              <Check size={15} className="text-[#57cfc8]" />
              {notice}
            </div>
          )}
        </div>
      </div>
    </QueryClientProvider>
  );
}

function Onboarding({ student, query, setQuery, universities, loading, onStudent, onFinish }: { student: boolean | null; query: string; setQuery: (v: string) => void; universities: string[]; loading: boolean; onStudent: (v: boolean | null) => void; onFinish: (v: boolean, school?: string) => void }) {
  return <div className="safe-top safe-bottom absolute inset-0 z-50 overflow-y-auto grid place-items-center bg-[#11111f]/90 p-5 backdrop-blur-md"><div className="w-full max-w-md rounded-3xl border border-white/15 bg-[#24243c] p-6 shadow-2xl sm:p-8">{student === null ? <><div className="mb-8 flex items-center gap-2"><span className="grid h-8 w-8 place-items-center rounded-lg bg-[#ff6b35] text-[#1a1a2e]"><Zap size={16} fill="currentColor"/></span><span className="font-display font-bold">plasticbyte<span className="text-[#ff6b35]">.</span></span></div><p className="text-xs font-bold uppercase tracking-[.2em] text-[#57cfc8]">Welcome shipper</p><h2 className="mt-3 font-display text-2xl font-bold leading-tight">Are you a student?</h2><p className="mt-2 text-xs leading-5 text-[#aaa9ba]">Meet your campus energy entering shipaton 2027. Deposit plastic to stay connected.</p><div className="mt-6 grid gap-2.5"><button data-testid="button-onboarding-yes" onClick={() => onStudent(true)} className="rounded-xl bg-[#ff6b35] px-4 py-3 text-left font-bold text-[#1a1a2e]">Yes, I'm shipping from school <ArrowUpRight className="float-right" size={16}/></button><button data-testid="button-onboarding-no" onClick={() => onFinish(false)} className="rounded-xl border border-white/15 px-4 py-3 text-left font-bold hover:border-white/35">Not currently <ArrowUpRight className="float-right" size={16}/></button></div></> : <><button data-testid="button-onboarding-back" onClick={() => onStudent(null)} className="mb-6 text-xs text-[#858496] hover:text-white">← back</button><p className="text-xs font-bold uppercase tracking-[.2em] text-[#57cfc8]">Meet your people</p><h2 className="mt-2 font-display text-2xl font-bold">Which campus are you shipping from?</h2><div className="relative mt-5"><Search className="absolute left-3 top-3 text-[#858496]" size={15}/><input data-testid="input-university-search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={loading ? 'Loading universities…' : 'Search for your university here'} className="w-full rounded-xl border border-white/15 bg-[#1a1a2e] py-2.5 pl-9 pr-4 text-xs placeholder:text-[#68687a] focus:border-[#ff6b35]"/></div>{query.trim().length > 0 && query.trim().length < 2 && <p className="mt-2 text-xs text-[#858496]">Keep typing — 2+ letters to search.</p>}<div className="mt-2.5 max-h-48 overflow-y-auto rounded-xl border border-white/10 bg-[#1a1a2e] p-1">{universities.map((school) => <button key={school} data-testid={`button-university-${school}`} onClick={() => onFinish(true, school)} className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-xs hover:bg-[#24243c]">{school}<ChevronDown className="-rotate-90 text-[#858496]" size={14}/></button>)}{query.trim().length >= 2 && universities.length === 0 && !loading && <div className="p-3 text-xs text-[#858496]">No campus found. Add it yourself below.</div>}</div>{query.trim().length >= 2 && <button data-testid="button-university-custom" onClick={() => onFinish(true, query.trim())} className="mt-2.5 flex w-full items-center justify-between rounded-xl border border-dashed border-white/20 px-3 py-2.5 text-left text-xs text-[#f4f0e8] hover:border-[#ff6b35]"><span>Can't find it? Use "{query.trim()}"</span><Plus size={14}/></button>}<button data-testid="button-skip-university" onClick={() => onFinish(true)} className="mt-4 text-xs text-[#858496] underline underline-offset-4 hover:text-white">I'm independent — skip this</button></>}</div></div>;
}

function SubmitModal({ university, allUniversities, onClose, onSubmit }: { university: string; allUniversities: string[]; onClose: () => void; onSubmit: (data: Omit<Submission, 'id' | 'raised'>) => void }) {
  const [name, setName] = useState(''); const [tagline, setTagline] = useState(''); const [school, setSchool] = useState(university); const [github, setGithub] = useState(''); const [video, setVideo] = useState(''); const [category, setCategory] = useState('Climate'); const [error, setError] = useState('');
  function submit(e: React.FormEvent) { e.preventDefault(); if (!name || !tagline || !github || !video) { setError('Give your build a name, a one-line hook, and both links.'); return; } onSubmit({ name, tagline, university: school || 'Independent builder', github: github.replace(/^https?:\/\//, ''), video: video.replace(/^https?:\/\//, ''), category, accent: ['#57cfc8', '#f3c969', '#c39bf4', '#ff936f'][Math.floor(Math.random() * 4)] }); }
  return <div className="safe-top safe-bottom absolute inset-0 z-50 overflow-y-auto bg-[#11111f]/90 p-4 backdrop-blur-md"><div className="mx-auto my-4 max-w-md rounded-3xl border border-white/15 bg-[#24243c] p-5 shadow-2xl"><div className="flex items-start justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#ff6b35]">Shipaton submission</p><h2 className="mt-1 font-display text-xl font-bold">Put your build in orbit.</h2></div><button data-testid="button-close-submit" onClick={onClose} className="rounded-lg p-1.5 text-[#858496] hover:bg-white/5 hover:text-white" aria-label="Close submission form"><X size={18}/></button></div><form onSubmit={submit} className="mt-5 grid gap-3"><Field label="App name" value={name} setValue={setName} placeholder="e.g. LoopNote" test="input-app-name"/><Field label="One-line hook" value={tagline} setValue={setTagline} placeholder="What does it make possible?" test="input-app-tagline"/><Field label="GitHub link" value={github} setValue={setGithub} placeholder="github.com/you/project" test="input-github"/><Field label="Demo video link" value={video} setValue={setVideo} placeholder="youtube.com/watch..." test="input-video"/><label className="grid gap-1.5 text-xs font-semibold">University tag<input data-testid="input-university" list="university-options" value={school} onChange={(e) => setSchool(e.target.value)} placeholder="Type to search, or leave blank" className="rounded-xl border border-white/15 bg-[#1a1a2e] px-3 py-2.5 font-normal text-[#f4f0e8] placeholder:text-[#68687a]"/><datalist id="university-options">{allUniversities.map((item) => <option key={item} value={item}/>)}</datalist></label><label className="grid gap-1.5 text-xs font-semibold">Build category<select data-testid="select-category" value={category} onChange={(e) => setCategory(e.target.value)} className="rounded-xl border border-white/15 bg-[#1a1a2e] px-3 py-2.5 font-normal text-[#f4f0e8]"><option>Climate</option><option>Community</option><option>Rewards</option><option>Productivity</option><option>Access</option></select></label>{error && <p className="text-xs text-[#ff938f]">{error}</p>}<div className="flex justify-end gap-2.5 mt-2"><button type="button" onClick={onClose} className="rounded-xl px-3 py-2 text-xs font-semibold text-[#aaa9ba] hover:text-white">Cancel</button><button data-testid="button-submit-app" type="submit" className="rounded-xl bg-[#ff6b35] px-4 py-2 text-xs font-bold text-[#1a1a2e]">Submit build <ArrowUpRight className="ml-1 inline" size={14}/></button></div></form></div></div>;
}
function Field({ label, value, setValue, placeholder, test }: { label: string; value: string; setValue: (v: string) => void; placeholder: string; test: string }) { return <label className="grid gap-1.5 text-xs font-semibold">{label}<input data-testid={test} value={value} onChange={(e) => setValue(e.target.value)} placeholder={placeholder} className="rounded-xl border border-white/15 bg-[#1a1a2e] px-3 py-2.5 font-normal placeholder:text-[#68687a] focus:border-[#ff6b35]"/></label>; }

export default App;
