import { useState } from 'react';
import { ArrowUpRight, LogIn, Eye, EyeOff } from 'lucide-react';
import { apiPost, ApiError, getApiBaseUrl } from './lib/api';
import { countries, flagEmoji, type Country } from './lib/countries';
import ServerConfigModal from './components/ServerConfigModal';

type LoginResponse = {
  user: {
    id: string; phone: string; firstName: string; lastName: string | null; username: string | null;
    gender: string | null; dateOfBirth: string | null; email: string | null; emailVerified: boolean;
    profilePhotoUrl: string | null; walletBalanceMb: number;
  };
};

export default function Login({ onDone, onBack }: { onDone: (user: LoginResponse['user']) => void; onBack: () => void }) {
  const [country, setCountry] = useState<Country>(countries[0]!);
  const [localNumber, setLocalNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showConfig, setShowConfig] = useState(false);

  const phone = `+${country.dialCode}${localNumber.replace(/\D/g, '')}`;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (localNumber.replace(/\D/g, '').length < 6) {
      setError('Enter your full phone number.');
      return;
    }
    if (!password) {
      setError('Enter your password.');
      return;
    }
    setLoading(true);
    try {
      const data = await apiPost<LoginResponse>('/auth/login', { phone, password });
      onDone(data.user);
    } catch (err) {
      console.error('Login error:', err);
      const msg = err instanceof ApiError ? err.message : (err instanceof Error ? err.message : 'Could not log in. Please try again.');
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="safe-top safe-bottom absolute inset-0 z-50 overflow-y-auto grid place-items-center bg-[#11111f]/90 p-5 backdrop-blur-md">
      <div className="w-full max-w-md rounded-3xl border border-white/15 bg-[#24243c] p-7 shadow-2xl sm:p-10">
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-[#ff6b35]/15 text-[#ff6b35]"><LogIn size={18} /></span>
        <h2 className="mt-5 font-display text-2xl font-bold">Welcome back</h2>
        <p className="mt-2 text-sm leading-6 text-[#aaa9ba]">Log in with the phone number and password from sign-up.</p>

        <form onSubmit={submit}>
          <label className="mt-6 block text-xs font-semibold uppercase tracking-wider text-[#858496]">Country</label>
          <select
            data-testid="select-login-country"
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
              data-testid="input-login-phone"
              value={localNumber}
              onChange={(e) => setLocalNumber(e.target.value.replace(/[^\d\s]/g, ''))}
              placeholder="801 234 5678"
              inputMode="numeric"
              autoFocus
              className="w-full rounded-xl border border-white/15 bg-[#1a1a2e] px-4 py-3.5 text-sm placeholder:text-[#68687a] focus:border-[#ff6b35]"
            />
          </div>

          <label className="mt-4 block text-xs font-semibold uppercase tracking-wider text-[#858496]">Password</label>
          <div className="relative mt-2">
            <input
              data-testid="input-login-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              type={showPassword ? 'text' : 'password'}
              className="w-full rounded-xl border border-white/15 bg-[#1a1a2e] px-4 py-3.5 pr-12 text-sm placeholder:text-[#68687a] focus:border-[#ff6b35]"
            />
            <button
              type="button"
              data-testid="button-toggle-login-password"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#858496] hover:text-white"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {error && <p className="mt-3 text-sm text-[#ff938f]">{error}</p>}

          <button data-testid="button-login-submit" disabled={loading} type="submit" className="mt-6 w-full rounded-xl bg-[#ff6b35] py-3.5 font-bold text-[#1a1a2e] disabled:opacity-60">
            {loading ? 'Logging in…' : <>Log in <ArrowUpRight className="ml-1 inline" size={16} /></>}
          </button>
          <button type="button" onClick={onBack} className="mt-4 w-full text-center text-sm text-[#858496] underline underline-offset-4 hover:text-white">Back</button>
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => setShowConfig(true)}
              className="text-[10px] text-[#858496]/70 hover:text-white transition-colors underline"
            >
              Server: {getApiBaseUrl()} (Tap to change)
            </button>
          </div>
        </form>
      </div>

      <ServerConfigModal isOpen={showConfig} onClose={() => setShowConfig(false)} />
    </div>
  );
}
