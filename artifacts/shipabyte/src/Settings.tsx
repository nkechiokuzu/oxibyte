import { useState } from 'react';
import { ArrowLeft, ChevronRight, KeyRound, User as UserIcon, Eye, EyeOff } from 'lucide-react';
import { apiPost, ApiError } from './lib/api';

const inputClass =
  'mt-2 w-full rounded-xl border border-white/15 bg-[#1a1a2e] px-4 py-3.5 text-sm placeholder:text-[#68687a] focus:border-[#ff6b35]';
const labelClass = 'mt-4 block text-xs font-semibold uppercase tracking-wider text-[#858496]';

function PasswordField({ label, value, onChange, testId }: { label: string; value: string; onChange: (v: string) => void; testId: string }) {
  const [show, setShow] = useState(false);
  return (
    <>
      <label className={labelClass}>{label}</label>
      <div className="relative">
        <input
          data-testid={testId}
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`${inputClass} pr-11`}
        />
        <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#858496] hover:text-white" aria-label={show ? 'Hide password' : 'Show password'}>
          {show ? <EyeOff size={17} /> : <Eye size={17} />}
        </button>
      </div>
    </>
  );
}

export default function Settings({ onClose, onOpenEditProfile }: { onClose: () => void; onOpenEditProfile: () => void }) {
  const [view, setView] = useState<'menu' | 'password'>('menu');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setNotice('');
    if (newPassword.length < 6) { setError('New password must be at least 6 characters.'); return; }
    if (newPassword !== confirmPassword) { setError('New passwords don\u2019t match.'); return; }

    setBusy(true);
    try {
      await apiPost('/auth/change-password', { currentPassword, newPassword });
      setNotice('Password updated.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not update your password.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="safe-top safe-bottom absolute inset-0 z-50 overflow-y-auto bg-[#1a1a2e]">
      <div className="mx-auto max-w-md px-5 pb-16 pt-5">
        <div className="flex items-center gap-3">
          <button
            data-testid="button-back-settings"
            onClick={() => (view === 'menu' ? onClose() : setView('menu'))}
            className="rounded-lg p-2 text-[#cfced7] hover:bg-white/5"
            aria-label="Back"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="font-display text-xl font-bold">{view === 'menu' ? 'Settings' : 'Change Password'}</h1>
        </div>

        {view === 'menu' && (
          <div className="mt-6 overflow-hidden rounded-3xl bg-[#24243c]">
            <button
              data-testid="button-settings-edit-profile"
              onClick={onOpenEditProfile}
              className="flex w-full items-center gap-3 border-b border-white/5 p-5 text-left hover:bg-white/5"
            >
              <span className="grid h-10 w-10 place-items-center rounded-full bg-[#57cfc8]/15 text-[#57cfc8]"><UserIcon size={18} /></span>
              <span className="flex-1">
                <div className="font-semibold">Edit profile</div>
                <div className="text-xs text-[#858496]">Photo, name, username, gender, DOB, email</div>
              </span>
              <ChevronRight size={18} className="text-[#68687a]" />
            </button>
            <button
              data-testid="button-settings-password"
              onClick={() => { setView('password'); setError(''); setNotice(''); }}
              className="flex w-full items-center gap-3 p-5 text-left hover:bg-white/5"
            >
              <span className="grid h-10 w-10 place-items-center rounded-full bg-[#ff6b35]/15 text-[#ff6b35]"><KeyRound size={18} /></span>
              <span className="flex-1">
                <div className="font-semibold">Password</div>
                <div className="text-xs text-[#858496]">Change your login password</div>
              </span>
              <ChevronRight size={18} className="text-[#68687a]" />
            </button>
          </div>
        )}

        {view === 'password' && (
          <form onSubmit={changePassword} className="mt-6 rounded-3xl bg-[#24243c] p-6">
            {(error || notice) && (
              <div className={`mb-2 rounded-xl p-3 text-sm ${error ? 'bg-[#ff938f]/10 text-[#ff938f]' : 'bg-[#57cfc8]/10 text-[#57cfc8]'}`}>
                {error || notice}
              </div>
            )}
            <PasswordField testId="input-current-password" label="Current password" value={currentPassword} onChange={setCurrentPassword} />
            <PasswordField testId="input-new-password" label="New password" value={newPassword} onChange={setNewPassword} />
            <PasswordField testId="input-confirm-password" label="Confirm new password" value={confirmPassword} onChange={setConfirmPassword} />
            <button
              data-testid="button-save-password"
              type="submit"
              disabled={busy}
              className="mt-6 w-full rounded-xl bg-[#ff6b35] py-3.5 text-sm font-bold text-[#1a1a2e] hover:bg-[#ff7d4d] disabled:opacity-60"
            >
              {busy ? 'Saving…' : 'Update password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
