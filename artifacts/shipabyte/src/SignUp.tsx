import { useState } from 'react';
import { ArrowUpRight, Check, Gift, Phone, ShieldCheck, User, KeyRound, Eye, EyeOff } from 'lucide-react';
import { apiPost, ApiError, getApiBaseUrl } from './lib/api';
import { countries, flagEmoji, type Country } from './lib/countries';
import ServerConfigModal from './components/ServerConfigModal';

type Step = 'phone' | 'otp' | 'name' | 'password' | 'done';

type RegisterResponse = {
  user: {
    id: string; phone: string; firstName: string; lastName: string | null; username: string | null;
    gender: string | null; dateOfBirth: string | null; email: string | null; emailVerified: boolean;
    profilePhotoUrl: string | null; walletBalanceMb: number;
  };
  signupBonusMb: number;
  priorDepositsFound: number;
  priorDepositsMb: number;
};

// Matches the server's validation exactly, so obviously malformed numbers
// never even trigger a request (saves a wasted verification text).
const PHONE_PATTERN = /^\+[1-9]\d{7,14}$/;

export default function SignUp({ onDone, onSkip }: { onDone: (user: RegisterResponse['user']) => void; onSkip: () => void }) {
  const [step, setStep] = useState<Step>('phone');
  const [country, setCountry] = useState<Country>(countries[0]!);
  const [localNumber, setLocalNumber] = useState('');
  const [code, setCode] = useState('');
  const [firstName, setFirstName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [verificationToken, setVerificationToken] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RegisterResponse | null>(null);
  const [showConfig, setShowConfig] = useState(false);

  // E.164, e.g. country "234" + local "8012345678" -> "+2348012345678"
  const phone = `+${country.dialCode}${localNumber.replace(/\D/g, '')}`;

  async function sendCode(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (localNumber.replace(/\D/g, '').length < 6) {
      setError('Enter your full phone number.');
      return;
    }
    if (!PHONE_PATTERN.test(phone)) {
      setError("That number doesn't look right for the selected country.");
      return;
    }
    setLoading(true);
    try {
      const data = await apiPost<{ ok: boolean; devCode?: string }>('/auth/request-otp', { phone });
      if (data?.devCode) {
        setCode(data.devCode);
      }
      setStep('otp');
    } catch (err: any) {
      console.error('Request OTP error:', err);
      const msg = err?.message || 'Could not send a code. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!/^\d{6}$/.test(code)) {
      setError('Enter the 6-digit code we sent you.');
      return;
    }
    setLoading(true);
    try {
      const data = await apiPost<{ verificationToken: string }>('/auth/verify-otp', { phone, code });
      setVerificationToken(data.verificationToken);
      setStep('name');
    } catch (err: any) {
      console.error('Verify OTP error:', err);
      const msg = err?.message || 'Could not verify that code.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  function submitName(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (firstName.trim().length < 1) {
      setError('Enter at least your first name.');
      return;
    }
    setStep('password');
  }

  async function createAccount(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (password.length < 6) {
      setError('Use at least 6 characters.');
      return;
    }
    setLoading(true);
    try {
      const data = await apiPost<RegisterResponse>('/auth/register', {
        verificationToken,
        firstName: firstName.trim(),
        password,
      });
      setResult(data);
      setStep('done');
    } catch (err: any) {
      console.error('Register error:', err);
      const msg = err?.message || 'Could not create your account.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="safe-top safe-bottom absolute inset-0 z-50 overflow-y-auto grid place-items-center bg-[#11111f]/90 p-5 backdrop-blur-md">
      <div className="w-full max-w-md rounded-3xl border border-white/15 bg-[#24243c] p-7 shadow-2xl sm:p-10">
        <StepIndicator step={step} />

        {step === 'phone' && (
          <form onSubmit={sendCode}>
            <IconBadge icon={<Phone size={18} />} />
            <h2 className="mt-5 font-display text-2xl font-bold">What's your number?</h2>
            <p className="mt-2 text-sm leading-6 text-[#aaa9ba]">
              This is how you'll log in and how redemptions reach you. We'll text a code to confirm it's yours.
            </p>
            <label className="mt-6 block text-xs font-semibold uppercase tracking-wider text-[#858496]">Country</label>
            <select
              data-testid="select-signup-country"
              value={country.iso2}
              onChange={(e) => setCountry(countries.find((c) => c.iso2 === e.target.value) ?? countries[0]!)}
              className="mt-2 w-full rounded-xl border border-white/15 bg-[#1a1a2e] px-4 py-3.5 text-sm focus:border-[#ff6b35]"
            >
              {countries.map((c) => (
                <option key={c.iso2} value={c.iso2}>{flagEmoji(c.iso2)} {c.name} (+{c.dialCode})</option>
              ))}
            </select>
            <label className="mt-4 block text-xs font-semibold uppercase tracking-wider text-[#858496]">Phone number</label>
            <div className="mt-2 flex gap-2">
              <div className="flex w-20 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-[#1a1a2e] px-2 py-3.5 text-sm text-[#aaa9ba]">+{country.dialCode}</div>
              <input
                data-testid="input-signup-phone"
                value={localNumber}
                onChange={(e) => setLocalNumber(e.target.value.replace(/[^\d\s]/g, ''))}
                placeholder="801 234 5678"
                inputMode="numeric"
                autoFocus
                className="w-full rounded-xl border border-white/15 bg-[#1a1a2e] px-4 py-3.5 text-sm placeholder:text-[#68687a] focus:border-[#ff6b35]"
              />
            </div>
            {error && <p className="mt-3 text-sm text-[#ff938f]">{error}</p>}
            <button data-testid="button-send-code" disabled={loading} type="submit" className="mt-6 w-full rounded-xl bg-[#ff6b35] py-3.5 font-bold text-[#1a1a2e] disabled:opacity-60">
              {loading ? 'Sending…' : <>Send code <ArrowUpRight className="ml-1 inline" size={16} /></>}
            </button>
            <button type="button" onClick={onSkip} className="mt-4 w-full text-center text-sm text-[#858496] underline underline-offset-4 hover:text-white">Skip for now</button>
          </form>
        )}

        {step === 'otp' && (
          <form onSubmit={verifyCode}>
            <IconBadge icon={<ShieldCheck size={18} />} />
            <h2 className="mt-5 font-display text-2xl font-bold">Enter the code</h2>
            <p className="mt-2 text-sm leading-6 text-[#aaa9ba]">We sent a 6-digit code to {phone}.</p>
            <input
              data-testid="input-signup-code"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="123456"
              inputMode="numeric"
              autoFocus
              className="mt-6 w-full rounded-xl border border-white/15 bg-[#1a1a2e] px-4 py-3.5 text-center text-2xl tracking-[0.5em] placeholder:text-[#68687a] focus:border-[#ff6b35]"
            />
            {code && (
              <div className="mt-3 rounded-xl border border-[#57cfc8]/30 bg-[#57cfc8]/10 p-2.5 text-center text-xs font-medium text-[#57cfc8]">
                <span>Testing verification code: </span>
                <span className="font-mono text-sm font-bold tracking-widest">{code}</span>
              </div>
            )}
            {error && <p className="mt-3 text-sm text-[#ff938f]">{error}</p>}
            <button data-testid="button-verify-code" disabled={loading} type="submit" className="mt-6 w-full rounded-xl bg-[#ff6b35] py-3.5 font-bold text-[#1a1a2e] disabled:opacity-60">
              {loading ? 'Verifying…' : <>Verify <ArrowUpRight className="ml-1 inline" size={16} /></>}
            </button>
            <button type="button" onClick={() => setStep('phone')} className="mt-4 w-full text-center text-sm text-[#858496] underline underline-offset-4 hover:text-white">Wrong number? Go back</button>
          </form>
        )}

        {step === 'name' && (
          <form onSubmit={submitName}>
            <IconBadge icon={<User size={18} />} />
            <h2 className="mt-5 font-display text-2xl font-bold">What should we call you?</h2>
            <p className="mt-2 text-sm leading-6 text-[#aaa9ba]">Just your first name is fine — used to personalize the app and your receipts.</p>
            <input
              data-testid="input-signup-name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="First name"
              autoFocus
              className="mt-6 w-full rounded-xl border border-white/15 bg-[#1a1a2e] px-4 py-3.5 text-sm placeholder:text-[#68687a] focus:border-[#ff6b35]"
            />
            {error && <p className="mt-3 text-sm text-[#ff938f]">{error}</p>}
            <button data-testid="button-continue-name" type="submit" className="mt-6 w-full rounded-xl bg-[#ff6b35] py-3.5 font-bold text-[#1a1a2e]">Continue <ArrowUpRight className="ml-1 inline" size={16} /></button>
          </form>
        )}

        {step === 'password' && (
          <form onSubmit={createAccount}>
            <IconBadge icon={<KeyRound size={18} />} />
            <h2 className="mt-5 font-display text-2xl font-bold">Set a password</h2>
            <p className="mt-2 text-sm leading-6 text-[#aaa9ba]">For logging back in next time. At least 6 characters.</p>
            <div className="relative mt-6">
              <input
                data-testid="input-signup-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                type={showPassword ? 'text' : 'password'}
                autoFocus
                className="w-full rounded-xl border border-white/15 bg-[#1a1a2e] px-4 py-3.5 pr-12 text-sm placeholder:text-[#68687a] focus:border-[#ff6b35]"
              />
              <button
                type="button"
                data-testid="button-toggle-password"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#858496] hover:text-white"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {error && <p className="mt-3 text-sm text-[#ff938f]">{error}</p>}
            <button data-testid="button-create-account" disabled={loading} type="submit" className="mt-6 w-full rounded-xl bg-[#ff6b35] py-3.5 font-bold text-[#1a1a2e] disabled:opacity-60">
              {loading ? 'Creating account…' : <>Create account <ArrowUpRight className="ml-1 inline" size={16} /></>}
            </button>
          </form>
        )}

        {step === 'done' && result && (
          <div>
            <IconBadge icon={<Check size={18} />} />
            <h2 className="mt-5 font-display text-2xl font-bold">You're in, {result.user.firstName}.</h2>
            <div className="mt-5 space-y-3">
              <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#1a1a2e] p-4">
                <Gift className="shrink-0 text-[#f3c969]" size={20} />
                <div className="text-sm"><span className="font-bold text-[#f3c969]">+{result.signupBonusMb}MB</span> welcome bonus credited.</div>
              </div>
              {result.priorDepositsFound > 0 && (
                <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#1a1a2e] p-4">
                  <Check className="shrink-0 text-[#57cfc8]" size={20} />
                  <div className="text-sm">Found {result.priorDepositsFound} deposit{result.priorDepositsFound === 1 ? '' : 's'} from before you signed up — <span className="font-bold text-[#57cfc8]">+{result.priorDepositsMb}MB</span> added too.</div>
                </div>
              )}
              <div className="rounded-xl bg-[#ff6b35] p-4 text-center">
                <div className="text-xs font-bold uppercase tracking-wider text-[#1a1a2e]/70">Wallet balance</div>
                <div className="font-display text-3xl font-bold text-[#1a1a2e]">{result.user.walletBalanceMb}MB</div>
              </div>
            </div>
            <button data-testid="button-signup-done" onClick={() => onDone(result.user)} className="mt-6 w-full rounded-xl border border-white/15 py-3.5 font-bold hover:border-white/35">Continue</button>
          </div>
        )}

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => setShowConfig(true)}
            className="text-[10px] text-[#858496]/70 hover:text-white transition-colors underline"
          >
            Server: {getApiBaseUrl()} (Tap to change)
          </button>
        </div>
      </div>

      <ServerConfigModal isOpen={showConfig} onClose={() => setShowConfig(false)} />
    </div>
  );
}

function IconBadge({ icon }: { icon: React.ReactNode }) {
  return <span className="grid h-11 w-11 place-items-center rounded-xl bg-[#ff6b35]/15 text-[#ff6b35]">{icon}</span>;
}

function StepIndicator({ step }: { step: Step }) {
  const steps: Step[] = ['phone', 'otp', 'name', 'password'];
  if (step === 'done') return null;
  const currentIndex = steps.indexOf(step);
  return (
    <div className="mb-6 flex gap-1.5">
      {steps.map((s, i) => (
        <div key={s} className={`h-1 flex-1 rounded-full ${i <= currentIndex ? 'bg-[#ff6b35]' : 'bg-white/10'}`} />
      ))}
    </div>
  );
}
