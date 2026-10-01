import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Camera, CheckCircle2, X } from 'lucide-react';
import { apiGet, apiPatch, apiPost, ApiError } from './lib/api';

type ProfileUser = {
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

type Tier = { level: number; label: string; minGrams: number; maxGrams: number | null };
type ProfileResponse = { user: ProfileUser; totalGrams: number; tier: Tier; gramsToNextTier: number | null };

const GENDER_OPTIONS = [
  { value: '', label: 'Prefer not to say' },
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
];

const inputClass =
  'mt-2 w-full rounded-xl border border-white/15 bg-[#1a1a2e] px-4 py-3.5 text-sm placeholder:text-[#68687a] focus:border-[#ff6b35] disabled:opacity-50';
const labelClass = 'mt-4 block text-xs font-semibold uppercase tracking-wider text-[#858496]';

// Downscale + compress an image file client-side before it's sent, so we
// stay well under the server's 2MB cap and don't bloat the DB row.
function fileToCompressedDataUrl(file: File, maxDim = 512, quality = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read that file.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Could not read that image.'));
      img.onload = () => {
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        if (!ctx) { reject(new Error('Image processing is unavailable.')); return; }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

export default function EditProfile({ onClose, onUpdated }: { onClose: () => void; onUpdated: (user: ProfileUser) => void }) {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Editable field state, seeded once the profile loads.
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [gender, setGender] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');

  // Email verification sub-flow.
  const [emailDraft, setEmailDraft] = useState('');
  const [emailStage, setEmailStage] = useState<'idle' | 'code-sent'>('idle');
  const [emailCode, setEmailCode] = useState('');
  const [emailBusy, setEmailBusy] = useState(false);
  const [emailError, setEmailError] = useState('');

  useEffect(() => {
    let cancelled = false;
    apiGet<ProfileResponse>('/profile/me')
      .then((data) => {
        if (cancelled) return;
        setProfile(data);
        setFirstName(data.user.firstName);
        setLastName(data.user.lastName ?? '');
        setUsername(data.user.username ?? '');
        setGender(data.user.gender ?? '');
        setDateOfBirth(data.user.dateOfBirth ?? '');
        setEmailDraft(data.user.email ?? '');
      })
      .catch((err) => { if (!cancelled) setError(err instanceof ApiError ? err.message : 'Could not load your profile.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError('');
    setUploadingPhoto(true);
    try {
      const photoDataUrl = await fileToCompressedDataUrl(file);
      const data = await apiPost<{ user: ProfileUser }>('/profile/photo', { photoDataUrl });
      setProfile((prev) => (prev ? { ...prev, user: data.user } : prev));
      onUpdated(data.user);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not upload that photo. Try a smaller image.');
    } finally {
      setUploadingPhoto(false);
    }
  }

  async function saveDetails(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setNotice('');
    setSaving(true);
    try {
      const data = await apiPatch<{ user: ProfileUser }>('/profile', {
        firstName,
        lastName,
        username,
        gender,
        dateOfBirth,
      });
      setProfile((prev) => (prev ? { ...prev, user: data.user } : prev));
      onUpdated(data.user);
      setNotice('Profile updated.');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save your changes.');
    } finally {
      setSaving(false);
    }
  }

  async function requestEmailCode() {
    setEmailError('');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailDraft)) { setEmailError('Enter a valid email address.'); return; }
    setEmailBusy(true);
    try {
      await apiPost('/profile/email/request-otp', { email: emailDraft });
      setEmailStage('code-sent');
    } catch (err) {
      setEmailError(err instanceof ApiError ? err.message : 'Could not send a verification code.');
    } finally {
      setEmailBusy(false);
    }
  }

  async function confirmEmailCode(e: React.FormEvent) {
    e.preventDefault();
    setEmailError('');
    setEmailBusy(true);
    try {
      const data = await apiPost<{ user: ProfileUser }>('/profile/email/verify-otp', { code: emailCode });
      setProfile((prev) => (prev ? { ...prev, user: data.user } : prev));
      onUpdated(data.user);
      setEmailStage('idle');
      setEmailCode('');
    } catch (err) {
      setEmailError(err instanceof ApiError ? err.message : 'Could not verify that code.');
    } finally {
      setEmailBusy(false);
    }
  }

  const user = profile?.user;
  const fullNameInitial = (user?.firstName || 'U').slice(0, 1).toUpperCase();
  const totalKg = profile ? (profile.totalGrams / 1000).toFixed(profile.totalGrams % 1000 === 0 ? 0 : 2) : '0';
  const nextTierKg = profile?.gramsToNextTier != null ? (profile.gramsToNextTier / 1000).toFixed(2) : null;

  return (
    <div className="safe-top safe-bottom absolute inset-0 z-50 overflow-y-auto bg-[#1a1a2e]">
      <div className="mx-auto max-w-md px-5 pb-16 pt-5">
        <div className="flex items-center gap-3">
          <button data-testid="button-close-edit-profile" onClick={onClose} className="rounded-lg p-2 text-[#cfced7] hover:bg-white/5" aria-label="Back">
            <ArrowLeft size={20} />
          </button>
          <h1 className="font-display text-xl font-bold">My Profile</h1>
        </div>

        {loading && <div className="mt-10 text-center text-sm text-[#858496]">Loading your profile…</div>}

        {!loading && (error || notice) && (
          <div className={`mt-6 rounded-xl p-3 text-sm ${error ? 'bg-[#ff938f]/10 text-[#ff938f]' : 'bg-[#57cfc8]/10 text-[#57cfc8]'}`}>
            {error || notice}
          </div>
        )}

        {!loading && user && profile && (
          <>
            {/* Avatar + tier card */}
            <div className="mt-6 rounded-3xl bg-[#24243c] p-6">
              <div className="flex flex-col items-center">
                <div className="relative">
                  <span className="grid h-24 w-24 place-items-center overflow-hidden rounded-full bg-[#ff6b35] font-display text-3xl font-bold text-[#1a1a2e]">
                    {user.profilePhotoUrl ? (
                      <img src={user.profilePhotoUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      fullNameInitial
                    )}
                  </span>
                  <button
                    data-testid="button-change-photo"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingPhoto}
                    className="absolute bottom-0 right-0 grid h-8 w-8 place-items-center rounded-full bg-[#57cfc8] text-[#1a1a2e] shadow-lg hover:bg-[#6fdad4] disabled:opacity-60"
                    aria-label="Change profile photo"
                  >
                    <Camera size={15} />
                  </button>
                  <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handlePhotoChange} />
                </div>
                {uploadingPhoto && <div className="mt-2 text-xs text-[#858496]">Uploading…</div>}
                <div className="mt-3 font-display text-lg font-bold">{user.firstName}{user.lastName ? ` ${user.lastName}` : ''}</div>
                {user.username && <div className="text-sm text-[#858496]">@{user.username}</div>}
              </div>

              <div className="mt-5 flex items-center justify-between rounded-xl bg-[#1a1a2e] p-4">
                <div>
                  <div className="text-xs uppercase tracking-wider text-[#858496]">Mobile Number</div>
                  <div className="mt-1 text-sm font-semibold">{user.phone}</div>
                </div>
                <span className="rounded-full bg-white/5 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#68687a]">Not editable</span>
              </div>

              <div className="mt-3 flex items-center justify-between rounded-xl bg-[#1a1a2e] p-4">
                <div>
                  <div className="text-xs uppercase tracking-wider text-[#858496]">Deposit Tier</div>
                  <div className="mt-1 text-sm font-semibold">{profile.tier.label} · {totalKg}kg deposited</div>
                </div>
                <span className="rounded-full bg-[#57cfc8]/15 px-3 py-1.5 text-xs font-bold text-[#57cfc8]">{profile.tier.label}</span>
              </div>
              {nextTierKg && (
                <div className="mt-2 px-1 text-xs text-[#858496]">Deposit {nextTierKg}kg more plastic to reach the next tier.</div>
              )}
            </div>

            {(error || notice) && (
              <div className={`mt-4 rounded-xl p-3 text-sm ${error ? 'bg-[#ff938f]/10 text-[#ff938f]' : 'bg-[#57cfc8]/10 text-[#57cfc8]'}`}>
                {error || notice}
              </div>
            )}

            {/* Editable details */}
            <form onSubmit={saveDetails} className="mt-4 rounded-3xl bg-[#24243c] p-6">
              <h2 className="font-display text-sm font-bold uppercase tracking-wider text-[#858496]">Details</h2>

              <label className={labelClass}>First Name</label>
              <input data-testid="input-first-name" value={firstName} onChange={(e) => setFirstName(e.target.value)} className={inputClass} />

              <label className={labelClass}>Last Name</label>
              <input data-testid="input-last-name" value={lastName} onChange={(e) => setLastName(e.target.value)} className={inputClass} placeholder="Optional" />

              <label className={labelClass}>Username</label>
              <input data-testid="input-username" value={username} onChange={(e) => setUsername(e.target.value)} className={inputClass} placeholder="Optional, 3-20 characters" />

              <label className={labelClass}>Gender</label>
              <select data-testid="select-gender" value={gender} onChange={(e) => setGender(e.target.value)} className={inputClass}>
                {GENDER_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>

              <label className={labelClass}>Date of Birth</label>
              <input data-testid="input-dob" type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} className={inputClass} />

              <button
                data-testid="button-save-profile"
                type="submit"
                disabled={saving}
                className="mt-6 w-full rounded-xl bg-[#ff6b35] py-3.5 text-sm font-bold text-[#1a1a2e] hover:bg-[#ff7d4d] disabled:opacity-60"
              >
                {saving ? 'Saving…' : 'Save changes'}
              </button>
            </form>

            {/* Email verification */}
            <div className="mt-4 rounded-3xl bg-[#24243c] p-6">
              <h2 className="font-display text-sm font-bold uppercase tracking-wider text-[#858496]">Email</h2>

              {user.emailVerified ? (
                <div className="mt-3 flex items-center gap-2 text-sm">
                  <CheckCircle2 size={16} className="text-[#57cfc8]" />
                  <span>{user.email}</span>
                  <span className="rounded-full bg-[#57cfc8]/15 px-2 py-0.5 text-[10px] font-bold uppercase text-[#57cfc8]">Verified</span>
                </div>
              ) : emailStage === 'idle' ? (
                <>
                  <label className={labelClass}>Email address</label>
                  <input data-testid="input-email" type="email" value={emailDraft} onChange={(e) => setEmailDraft(e.target.value)} className={inputClass} placeholder="you@example.com" />
                  {emailError && <div className="mt-2 text-xs text-[#ff938f]">{emailError}</div>}
                  <button
                    data-testid="button-send-email-code"
                    onClick={requestEmailCode}
                    disabled={emailBusy}
                    className="mt-4 w-full rounded-xl border border-white/15 py-3 text-sm font-bold hover:border-[#57cfc8]/50 disabled:opacity-60"
                  >
                    {emailBusy ? 'Sending…' : 'Send verification code'}
                  </button>
                </>
              ) : (
                <form onSubmit={confirmEmailCode}>
                  <p className="mt-2 text-sm text-[#858496]">Enter the 6-digit code sent to {emailDraft}.</p>
                  <label className={labelClass}>Verification code</label>
                  <input
                    data-testid="input-email-code"
                    value={emailCode}
                    onChange={(e) => setEmailCode(e.target.value.replace(/[^\d]/g, '').slice(0, 6))}
                    inputMode="numeric"
                    className={inputClass}
                    placeholder="123456"
                  />
                  {emailError && <div className="mt-2 text-xs text-[#ff938f]">{emailError}</div>}
                  <button
                    data-testid="button-confirm-email-code"
                    type="submit"
                    disabled={emailBusy}
                    className="mt-4 w-full rounded-xl bg-[#57cfc8] py-3 text-sm font-bold text-[#1a1a2e] hover:bg-[#6fdad4] disabled:opacity-60"
                  >
                    {emailBusy ? 'Verifying…' : 'Confirm code'}
                  </button>
                  <button
                    data-testid="button-cancel-email-verify"
                    type="button"
                    onClick={() => { setEmailStage('idle'); setEmailCode(''); setEmailError(''); }}
                    className="mt-2 w-full py-2 text-xs text-[#858496] hover:text-white"
                  >
                    <X size={12} className="mr-1 inline" /> Use a different email
                  </button>
                </form>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
