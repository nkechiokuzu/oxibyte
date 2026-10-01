import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  MapPin,
  Navigation,
  Phone,
  Info,
  Zap,
  Send,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
  Search,
} from 'lucide-react';
import { apiGet, apiPost } from './lib/api';
import { SPONSORS } from './data/sponsors';

type CollectionPoint = {
  id: number;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  phone: string | null;
  distanceKm?: number;
};

type Status = 'locating' | 'nearby' | 'fallback' | 'error';

export default function FindDropoff({
  onClose,
  currentUser,
  onRedeemed,
}: {
  onClose: () => void;
  currentUser?: { firstName: string; walletBalanceMb: number; phone?: string } | null;
  onRedeemed?: (newBalance: number, message: string, txId?: number) => void;
}) {
  const [status, setStatus] = useState<Status>('locating');
  const [points, setPoints] = useState<CollectionPoint[]>([]);
  const [error, setError] = useState('');
  const [searchAddress, setSearchAddress] = useState('');

  // Plastic code redemption state
  const [plasticCode, setPlasticCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [redeemSuccess, setRedeemSuccess] = useState<string | null>(null);
  const [codeError, setCodeError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadFallback(note: string) {
      try {
        const data = await apiGet<{ points: CollectionPoint[] }>('/collection-points');
        if (cancelled) return;
        setPoints(data.points);
        setStatus('fallback');
        setError(note);
      } catch {
        if (!cancelled) {
          setStatus('error');
          setError('Could not load collection points. Check your connection and try again.');
        }
      }
    }

    if (!navigator.geolocation) {
      loadFallback('Location isn’t available on this device — showing all drop-off points instead.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const data = await apiGet<{ points: CollectionPoint[] }>(
            `/collection-points/nearby?lat=${latitude}&lng=${longitude}`
          );
          if (cancelled) return;
          setPoints(data.points);
          setStatus('nearby');
        } catch {
          if (!cancelled) {
            setStatus('error');
            setError('Could not load collection points. Check your connection and try again.');
          }
        }
      },
      () => {
        loadFallback('Location access was denied — showing all drop-off points instead.');
      },
      { timeout: 8000 }
    );

    return () => {
      cancelled = true;
    };
  }, []);

  function storeCustomNotification(message: string, txId?: number) {
    try {
      const saved = localStorage.getItem('oxibyte_deposit_notifications');
      const list = saved ? JSON.parse(saved) : [];
      const newNotif = {
        id: `deposit-${txId || Date.now()}`,
        txId,
        message,
        deltaMb: 50,
        createdAt: new Date().toISOString(),
      };
      localStorage.setItem('oxibyte_deposit_notifications', JSON.stringify([newNotif, ...list]));
    } catch {}
  }

  async function handleRedeemCode(e?: React.FormEvent) {
    if (e) e.preventDefault();
    const cleanCode = plasticCode.trim();
    if (!cleanCode) return;

    if (cleanCode.toLowerCase() !== 'sh123456789pat0n') {
      setCodeError('Invalid plastic code. Please enter valid drop-off code (Demo: SH123456789paT0n).');
      setRedeemSuccess(null);
      return;
    }

    setIsSubmitting(true);
    setCodeError('');

    // Pick a random sponsor tool to recommend in notification
    const sponsorPool = SPONSORS.filter((s) => s.id !== 'shipaton').map((s) => s.name);
    const randomTool = sponsorPool[Math.floor(Math.random() * sponsorPool.length)] || 'ElevenLabs';
    const username = currentUser?.firstName || 'Shipper';
    const expectedMessage = `hey ${username}, your 50 gram of plastic waste is received and 50MB is now credited to your wallet, build today with ${randomTool}.`;

    try {
      const res = await apiPost<{
        ok: boolean;
        newBalanceMb: number;
        deltaMb: number;
        grams: number;
        txId: number;
        message: string;
      }>('/wallet/redeem-code', {
        code: cleanCode,
        sponsorTool: randomTool,
      });

      const finalMsg = res.message || expectedMessage;
      setRedeemSuccess(finalMsg);
      setPlasticCode('');
      storeCustomNotification(finalMsg, res.txId);
      onRedeemed?.(res.newBalanceMb, finalMsg, res.txId);
    } catch {
      // Offline / guest fallback
      const currentBal = currentUser?.walletBalanceMb ?? 0;
      const newBalance = currentBal + 50;
      setRedeemSuccess(expectedMessage);
      setPlasticCode('');
      const localTxId = Date.now();
      storeCustomNotification(expectedMessage, localTxId);
      onRedeemed?.(newBalance, expectedMessage, localTxId);
    } finally {
      setIsSubmitting(false);
    }
  }

  const filteredPoints = points.filter((p) => {
    if (!searchAddress.trim()) return true;
    const q = searchAddress.toLowerCase();
    return p.name.toLowerCase().includes(q) || p.address.toLowerCase().includes(q);
  });

  return (
    <div className="safe-top safe-bottom absolute inset-0 z-50 overflow-y-auto overflow-x-hidden bg-[#1a1a2e] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <div className="mx-auto max-w-md px-5 pb-16 pt-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            data-testid="button-close-find-dropoff"
            onClick={onClose}
            className="rounded-xl p-2 text-[#cfced7] transition-colors hover:bg-white/5 active:scale-95"
            aria-label="Back"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="font-display text-xl font-bold">Deposit Plastic</h1>
        </div>

        {/* Feature: Instant Plastic Code Redemption */}
        <div className="mt-4 rounded-3xl border border-[#ff6b35]/30 bg-gradient-to-br from-[#24243c] to-[#1a1a2e] p-5 shadow-xl">
          <div className="flex items-center gap-2.5">
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-[#ff6b35]/20 text-[#ff6b35]">
              <Zap size={18} />
            </div>
            <div>
              <h2 className="font-display text-sm font-bold text-white">Instant Plastic Code Deposit</h2>
              <p className="text-[11px] text-[#858496]">Redeem code from smart bin or drop-off receipt</p>
            </div>
          </div>

          <form onSubmit={handleRedeemCode} className="mt-3.5 flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                data-testid="input-plastic-code"
                value={plasticCode}
                onChange={(e) => {
                  setPlasticCode(e.target.value);
                  setCodeError('');
                }}
                placeholder="Enter plastic code..."
                className="w-full rounded-xl border border-white/15 bg-[#121224] px-3.5 py-2.5 text-xs text-white placeholder:text-[#68687a] focus:border-[#ff6b35] focus:outline-none"
              />
              {plasticCode && (
                <button
                  type="button"
                  onClick={() => setPlasticCode('')}
                  className="absolute right-2.5 top-2.5 text-[#858496] hover:text-white"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <button
              type="submit"
              data-testid="button-send-plastic-code"
              disabled={isSubmitting || !plasticCode.trim()}
              className="flex items-center gap-1.5 rounded-xl bg-[#ff6b35] px-4 py-2.5 text-xs font-bold text-[#1a1a2e] transition-all hover:brightness-110 active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <>
                  <span>Send</span>
                  <Send size={13} />
                </>
              )}
            </button>
          </form>

          {/* Quick Fill Demo Code */}
          <div className="mt-2.5 flex items-center gap-2 text-[11px] text-[#858496]">
            <span>Demo code:</span>
            <button
              type="button"
              onClick={() => {
                setPlasticCode('SH123456789paT0n');
                setCodeError('');
              }}
              className="rounded-lg border border-dashed border-[#57cfc8]/40 bg-[#57cfc8]/10 px-2 py-0.5 font-mono text-[10px] text-[#57cfc8] transition-colors hover:bg-[#57cfc8]/20 active:scale-95"
              title="Click to fill demo code"
            >
              SH123456789paT0n (50g / 50MB)
            </button>
          </div>

          {/* Success Banner */}
          {redeemSuccess && (
            <div className="mt-3.5 rounded-2xl border border-[#57cfc8]/40 bg-[#57cfc8]/15 p-3.5 text-xs text-[#f4f0e8] animate-in fade-in slide-in-from-top-2">
              <div className="flex items-start gap-2">
                <CheckCircle2 size={16} className="text-[#57cfc8] shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="font-bold text-[#57cfc8]">Plastic Deposit Credited! (+50MB)</div>
                  <p className="mt-1 leading-relaxed text-[#cfced7]">{redeemSuccess}</p>
                </div>
              </div>
            </div>
          )}

          {codeError && (
            <div className="mt-2.5 flex items-center gap-1.5 text-xs text-[#ff938f]">
              <AlertCircle size={13} className="shrink-0" />
              <span>{codeError}</span>
            </div>
          )}
        </div>

        {/* Informational Guidance */}
        <div className="mt-5 flex items-start gap-3 rounded-2xl bg-[#57cfc8]/10 p-4 text-xs text-[#cfced7] leading-relaxed">
          <Info size={18} className="mt-0.5 shrink-0 text-[#57cfc8]" />
          <p>
            You can also take clean plastic bottles to any shop or campus bin hub below. Give them your phone number or scan the QR code to get instant data credits.
          </p>
        </div>

        {/* Address Search */}
        <div className="relative mt-4">
          <Search className="absolute left-3.5 top-3 text-[#858496]" size={15} />
          <input
            type="text"
            value={searchAddress}
            onChange={(e) => setSearchAddress(e.target.value)}
            placeholder="Search drop-off hubs by address or name..."
            className="w-full rounded-2xl border border-white/10 bg-[#24243c] py-2.5 pl-10 pr-4 text-xs text-white placeholder:text-[#858496] focus:border-[#57cfc8] focus:outline-none"
          />
        </div>

        {status === 'locating' && (
          <div className="mt-8 text-center text-sm text-[#858496]">Finding shops near you…</div>
        )}

        {(status === 'fallback' || status === 'error') && error && (
          <div
            className={`mt-4 rounded-xl p-3 text-sm ${
              status === 'error' ? 'bg-[#ff938f]/10 text-[#ff938f]' : 'bg-white/5 text-[#858496]'
            }`}
          >
            {error}
          </div>
        )}

        {(status === 'nearby' || status === 'fallback') && (
          <div className="mt-4 space-y-3">
            {filteredPoints.length === 0 && (
              <div className="rounded-2xl bg-[#24243c] p-5 text-center text-sm text-[#858496]">
                No collection points matching "{searchAddress}".
              </div>
            )}
            {filteredPoints.map((point) => (
              <div
                key={point.id}
                data-testid={`card-collection-point-${point.id}`}
                className="rounded-2xl bg-[#24243c] p-4 sm:p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-display text-base font-bold text-white">{point.name}</div>
                    <div className="mt-1 flex items-start gap-1.5 text-xs text-[#aaa9ba]">
                      <MapPin size={14} className="mt-0.5 shrink-0 text-[#ff6b35]" />
                      <span>{point.address}</span>
                    </div>
                    {point.phone && (
                      <div className="mt-1 flex items-center gap-1.5 text-xs text-[#aaa9ba]">
                        <Phone size={14} className="shrink-0 text-[#57cfc8]" />
                        <span>{point.phone}</span>
                      </div>
                    )}
                  </div>
                  {point.distanceKm != null && (
                    <span className="shrink-0 rounded-full bg-[#57cfc8]/15 px-2.5 py-1 text-[11px] font-bold text-[#57cfc8]">
                      {point.distanceKm < 1
                        ? `${Math.round(point.distanceKm * 1000)}m`
                        : `${point.distanceKm.toFixed(1)}km`}
                    </span>
                  )}
                </div>
                <a
                  data-testid={`link-directions-${point.id}`}
                  href={`https://www.google.com/maps/dir/?api=1&destination=${point.latitude},${point.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3.5 flex items-center justify-center gap-1.5 rounded-xl bg-[#1a1a2e] py-2.5 text-xs font-bold text-[#cfced7] transition-colors hover:bg-[#20203a] hover:text-white"
                >
                  <Navigation size={14} /> Get directions
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
