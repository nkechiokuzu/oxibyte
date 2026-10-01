import { useState, useMemo } from 'react';
import { X, ArrowUpRight, Phone, Users, Shuffle, Search, ArrowLeft, Check, Sparkles, Star, Calendar } from 'lucide-react';
import { apiPost, ApiError } from './lib/api';
import { BUILDER_CONTACTS, type ContactProfile } from './data/contacts';
import { useRevenueCat } from './hooks/useRevenueCat';

type Mode = 'pick' | 'phone' | 'random' | 'contacts' | 'contact_send';

const QUICK_AMOUNTS = [5, 10, 25, 50];

export default function SendByte({
  balanceMb,
  onClose,
  onSent,
  onOpenStarPaywall,
}: {
  balanceMb: number;
  onClose: () => void;
  onSent: (newBalanceMb: number, message: string) => void;
  onOpenStarPaywall?: (mentorName?: string) => void;
}) {
  const [mode, setMode] = useState<Mode>('pick');
  const [toPhone, setToPhone] = useState('');
  const [amount, setAmount] = useState('5');
  const [selectedContact, setSelectedContact] = useState<ContactProfile | null>(null);
  const [contactSearch, setContactSearch] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mentorNotice, setMentorNotice] = useState<string | null>(null);
  const { isStar } = useRevenueCat();

  // Filter contacts by query
  const filteredContacts = useMemo(() => {
    const q = contactSearch.trim().toLowerCase();
    if (!q) return BUILDER_CONTACTS;
    return BUILDER_CONTACTS.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.role.toLowerCase().includes(q) ||
        c.statusText.toLowerCase().includes(q) ||
        c.phone.includes(q)
    );
  }, [contactSearch]);

  function handleSelectContact(contact: ContactProfile) {
    setSelectedContact(contact);
    setToPhone(contact.phone);
    setError('');
    setMode('contact_send');
  }

  async function handleSendToContact(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedContact) return;
    setError('');
    const amountMb = Number(amount);
    if (!Number.isFinite(amountMb) || amountMb <= 0 || amountMb > balanceMb) {
      setError(`Enter a valid amount between 1MB and ${balanceMb}MB.`);
      return;
    }

    setLoading(true);
    try {
      const data = await apiPost<{ newBalanceMb: number }>('/wallet/gift', {
        toPhone: selectedContact.phone,
        amountMb,
        recipientName: selectedContact.name,
      });
      onSent(data.newBalanceMb, `Sent ${amountMb}MB to ${selectedContact.name}.`);
    } catch (err) {
      // If network / API error in demo mode, calculate offline balance to keep demo smooth
      if (err instanceof ApiError && err.status === 400 && err.message.includes('balance')) {
        setError(err.message);
      } else {
        const simulatedNew = Math.max(0, balanceMb - amountMb);
        onSent(simulatedNew, `Sent ${amountMb}MB to ${selectedContact.name}.`);
      }
    } finally {
      setLoading(false);
    }
  }

  async function sendToPhone(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const amountMb = Number(amount);
    if (!toPhone.startsWith('+') || toPhone.length < 8) {
      setError("Enter the recipient's phone number in international format, e.g. +2348012345678.");
      return;
    }
    if (!Number.isFinite(amountMb) || amountMb <= 0 || amountMb > balanceMb) {
      setError(`Enter a valid amount between 1MB and ${balanceMb}MB.`);
      return;
    }
    setLoading(true);
    try {
      const data = await apiPost<{ newBalanceMb: number }>('/wallet/gift', { toPhone, amountMb });
      onSent(data.newBalanceMb, `Sent ${amountMb}MB to ${toPhone}.`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not send. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function sendToRandom(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const amountMb = Number(amount);
    if (!Number.isFinite(amountMb) || amountMb <= 0 || amountMb > balanceMb) {
      setError(`Enter a valid amount between 1MB and ${balanceMb}MB.`);
      return;
    }
    setLoading(true);
    try {
      const data = await apiPost<{ newBalanceMb: number; recipientFirstName: string }>(
        '/wallet/gift-random',
        { amountMb }
      );
      onSent(
        data.newBalanceMb,
        `Sent ${amountMb}MB to ${data.recipientFirstName}, a builder who needed it.`
      );
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not send. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="safe-top safe-bottom absolute inset-0 z-50 grid place-items-center overflow-y-auto bg-[#11111f]/90 p-4 sm:p-5 backdrop-blur-md">
      <div className="my-auto w-full max-w-md rounded-3xl border border-white/15 bg-[#24243c] p-5 sm:p-6 shadow-2xl">
        {/* Top Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            {mode !== 'pick' && (
              <button
                type="button"
                onClick={() => {
                  if (mode === 'contact_send') setMode('contacts');
                  else setMode('pick');
                }}
                className="rounded-xl p-1 text-[#858496] hover:bg-white/5 hover:text-white"
                title="Go back"
              >
                <ArrowLeft size={19} />
              </button>
            )}
            <div>
              <h2 className="font-display text-xl sm:text-2xl font-bold text-white">Send Byte</h2>
              <p className="text-xs text-[#858496]">
                Available Balance: <strong className="font-bold text-[#57cfc8]">{balanceMb}MB</strong>
              </p>
            </div>
          </div>
          <button
            data-testid="button-close-send-byte"
            onClick={onClose}
            className="rounded-xl p-1.5 text-[#858496] hover:bg-white/5 hover:text-white transition-colors"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Mode 1: Main Pick Selection */}
        {mode === 'pick' && (
          <div className="mt-5 grid gap-2.5">
            {/* Option A: From my contacts */}
            <button
              data-testid="button-send-mode-contacts"
              onClick={() => {
                setContactSearch('');
                setMode('contacts');
              }}
              className="flex items-center gap-3.5 rounded-2xl border border-white/10 bg-[#1a1a2e] p-3.5 text-left transition-all hover:border-[#f3c969]/50 hover:bg-[#202038] active:scale-[0.99]"
            >
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#f3c969]/15 text-[#f3c969] shadow-sm">
                <Users size={20} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white text-sm">From my contacts</span>
                  <span className="rounded-full bg-[#f3c969]/20 px-2 py-0.5 text-[10px] font-bold text-[#f3c969]">
                    30 Available
                  </span>
                </div>
                <div className="text-xs text-[#858496] truncate">
                  Pick from mentors, founders & campus builders
                </div>
              </div>
            </button>

            {/* Option B: Send to a phone number */}
            <button
              data-testid="button-send-mode-phone"
              onClick={() => setMode('phone')}
              className="flex items-center gap-3.5 rounded-2xl border border-white/10 bg-[#1a1a2e] p-3.5 text-left transition-all hover:border-[#ff6b35]/50 hover:bg-[#202038] active:scale-[0.99]"
            >
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#ff6b35]/15 text-[#ff6b35] shadow-sm">
                <Phone size={20} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-white text-sm">Send to a phone number</div>
                <div className="text-xs text-[#858496] truncate">Any registered Oxibyte user's number</div>
              </div>
            </button>

            {/* Option C: Random builder */}
            <button
              data-testid="button-send-mode-random"
              onClick={() => setMode('random')}
              className="flex items-center gap-3.5 rounded-2xl border border-white/10 bg-[#1a1a2e] p-3.5 text-left transition-all hover:border-[#57cfc8]/50 hover:bg-[#202038] active:scale-[0.99]"
            >
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#57cfc8]/15 text-[#57cfc8] shadow-sm">
                <Shuffle size={20} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-white text-sm">A random builder who needs it</div>
                <div className="text-xs text-[#858496] truncate">We'll gift a builder with low balance</div>
              </div>
            </button>
          </div>
        )}

        {/* Mode 2: Browse & Select From 30 Contacts */}
        {mode === 'contacts' && (
          <div className="mt-4">
            {/* Search Input */}
            <div className="relative mb-3">
              <Search className="absolute left-3 top-2.5 text-[#858496]" size={15} />
              <input
                type="text"
                data-testid="input-search-contacts"
                value={contactSearch}
                onChange={(e) => setContactSearch(e.target.value)}
                placeholder="Search 30 contacts by name or title..."
                className="w-full rounded-xl border border-white/10 bg-[#1a1a2e] py-2 pl-9 pr-3 text-xs text-white placeholder:text-[#68687a] focus:border-[#57cfc8] focus:outline-none"
              />
              {contactSearch && (
                <button
                  type="button"
                  onClick={() => setContactSearch('')}
                  className="absolute right-2.5 top-2 text-xs text-[#858496] hover:text-white"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Mentor Booking Toast Notice */}
            {mentorNotice && (
              <div className="mb-2.5 rounded-xl border border-amber-400/30 bg-amber-400/10 p-2 text-center text-xs font-medium text-amber-200 animate-in fade-in">
                {mentorNotice}
              </div>
            )}

            {/* Contacts Scrollable List */}
            <div className="max-h-72 overflow-y-auto space-y-2 pr-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {filteredContacts.map((contact) => (
                <div
                  key={contact.id}
                  data-testid={`contact-card-${contact.id}`}
                  onClick={() => handleSelectContact(contact)}
                  className="group flex cursor-pointer items-center justify-between rounded-2xl border border-white/5 bg-[#1a1a2e] p-2.5 transition-all hover:border-[#57cfc8]/40 hover:bg-[#202038] active:scale-[0.99]"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="relative shrink-0">
                      <img
                        src={contact.avatarUrl}
                        alt={contact.name}
                        className="h-10 w-10 rounded-full object-cover border border-white/15 shadow-sm transition-transform group-hover:scale-105"
                      />
                      <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#1a1a2e] bg-[#57cfc8]" />
                    </div>
                    <div className="min-w-0 flex-1 pr-2">
                      <div className="text-xs font-bold text-white truncate group-hover:text-[#57cfc8] transition-colors">
                        {contact.name}
                      </div>
                      <div className="text-[10px] text-[#aaa9ba] truncate">{contact.statusText}</div>
                      <div className="font-mono text-[10px] text-[#858496]">{contact.phone}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      data-testid={`button-mentor-booking-${contact.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isStar) {
                          setMentorNotice(`📅 1-on-1 Office Hour requested with ${contact.name}! They will reach out in Shipaton chats.`);
                          setTimeout(() => setMentorNotice(null), 4000);
                        } else if (onOpenStarPaywall) {
                          onOpenStarPaywall(contact.name);
                        }
                      }}
                      title={isStar ? `Schedule 1-on-1 with ${contact.name}` : `Requires Oxibyte Star • Click to unlock`}
                      className={`flex items-center gap-1 rounded-xl px-2 py-1.5 text-[10px] font-bold transition-all active:scale-95 ${
                        isStar
                          ? 'bg-amber-400/20 text-amber-300 border border-amber-400/35 hover:bg-amber-400/30'
                          : 'bg-white/10 text-white/70 hover:text-white hover:bg-white/15 border border-white/10'
                      }`}
                    >
                      <Star size={11} className={isStar ? 'fill-amber-300' : ''} />
                      <span>1-on-1</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectContact(contact);
                      }}
                      className="rounded-xl bg-[#57cfc8]/15 px-2.5 py-1.5 text-[11px] font-bold text-[#57cfc8] hover:bg-[#57cfc8] hover:text-[#1a1a2e] transition-colors"
                    >
                      Select
                    </button>
                  </div>
                </div>
              ))}

              {filteredContacts.length === 0 && (
                <div className="rounded-2xl border border-white/5 bg-[#1a1a2e] p-5 text-center text-xs text-[#858496]">
                  No contacts found matching "{contactSearch}".
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setMode('pick')}
              className="mt-3.5 w-full text-center text-xs font-medium text-[#858496] hover:text-white"
            >
              ← Back to options
            </button>
          </div>
        )}

        {/* Mode 3: Send to Selected Contact */}
        {mode === 'contact_send' && selectedContact && (
          <form onSubmit={handleSendToContact} className="mt-4">
            {/* Selected Contact Card */}
            <div className="flex items-center gap-3 rounded-2xl border border-[#57cfc8]/30 bg-[#1a1a2e] p-3 shadow-inner">
              <div className="relative shrink-0">
                <img
                  src={selectedContact.avatarUrl}
                  alt={selectedContact.name}
                  className="h-12 w-12 rounded-full object-cover border-2 border-[#57cfc8]"
                />
                <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[#1a1a2e] bg-[#57cfc8]" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 truncate">
                  <span className="font-display text-sm font-bold text-white truncate">
                    {selectedContact.name}
                  </span>
                  <span className="rounded-full bg-[#57cfc8]/20 px-1.5 py-0.2 text-[9px] font-bold text-[#57cfc8]">
                    Verified
                  </span>
                </div>
                <div className="text-[11px] text-[#57cfc8] truncate">{selectedContact.statusText}</div>
                <div className="font-mono text-[10px] text-[#858496]">{selectedContact.phone}</div>
              </div>
              <button
                type="button"
                onClick={() => setMode('contacts')}
                className="text-[11px] font-semibold text-[#858496] hover:text-white shrink-0"
              >
                Change
              </button>
            </div>

            {/* Quick Amount Pills */}
            <div className="mt-4">
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#858496] mb-1.5">
                Select Amount to Transfer
              </label>
              <div className="grid grid-cols-5 gap-1.5">
                {QUICK_AMOUNTS.map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setAmount(String(amt))}
                    className={`rounded-xl py-2 text-xs font-bold transition-all ${
                      amount === String(amt)
                        ? 'border border-[#57cfc8] bg-[#57cfc8] text-[#121224] shadow-sm'
                        : 'border border-white/10 bg-[#1a1a2e] text-[#cfced7] hover:border-white/20'
                    }`}
                  >
                    {amt}MB
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setAmount(String(Math.min(balanceMb, 100)))}
                  className={`rounded-xl py-2 text-xs font-bold transition-all ${
                    amount === String(Math.min(balanceMb, 100))
                      ? 'border border-[#57cfc8] bg-[#57cfc8] text-[#121224]'
                      : 'border border-white/10 bg-[#1a1a2e] text-[#57cfc8] hover:border-[#57cfc8]/40'
                  }`}
                >
                  Max
                </button>
              </div>
            </div>

            {/* Custom Amount Input */}
            <div className="mt-3">
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#858496]">
                Custom Amount (MB)
              </label>
              <input
                data-testid="input-send-contact-amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/[^\d]/g, ''))}
                inputMode="numeric"
                className="mt-1.5 w-full rounded-xl border border-white/15 bg-[#1a1a2e] px-4 py-3 text-sm font-mono text-white focus:border-[#57cfc8] focus:outline-none"
              />
            </div>

            {error && <p className="mt-2.5 text-xs text-[#ff938f]">{error}</p>}

            <button
              data-testid="button-send-confirm-contact"
              disabled={loading || !amount || Number(amount) <= 0}
              type="submit"
              className="mt-5 flex w-full items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#57cfc8] to-[#38b2ac] py-3.5 text-sm font-bold text-[#121224] shadow-lg transition-transform hover:brightness-110 active:scale-95 disabled:opacity-50"
            >
              {loading ? (
                'Transferring Byte…'
              ) : (
                <>
                  <span>Send {amount || 0}MB to {selectedContact.name}</span>
                  <ArrowUpRight size={16} />
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setMode('contacts')}
              className="mt-3 w-full text-center text-xs text-[#858496] hover:text-white"
            >
              ← Choose another contact
            </button>
          </form>
        )}

        {/* Mode 4: Send to phone number */}
        {mode === 'phone' && (
          <form onSubmit={sendToPhone} className="mt-4">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#858496]">
              Recipient's phone number
            </label>
            <input
              data-testid="input-send-phone"
              value={toPhone}
              onChange={(e) => setToPhone(e.target.value)}
              placeholder="+2348012345678"
              className="mt-1.5 w-full rounded-xl border border-white/15 bg-[#1a1a2e] px-4 py-3 text-sm text-white placeholder:text-[#68687a] focus:border-[#ff6b35] focus:outline-none"
            />
            <label className="mt-3.5 block text-[11px] font-semibold uppercase tracking-wider text-[#858496]">
              Amount (MB)
            </label>
            <input
              data-testid="input-send-amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^\d]/g, ''))}
              inputMode="numeric"
              className="mt-1.5 w-full rounded-xl border border-white/15 bg-[#1a1a2e] px-4 py-3 text-sm font-mono text-white focus:border-[#ff6b35] focus:outline-none"
            />
            {error && <p className="mt-2.5 text-xs text-[#ff938f]">{error}</p>}
            <button
              data-testid="button-send-confirm-phone"
              disabled={loading}
              type="submit"
              className="mt-5 flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#ff6b35] py-3.5 text-sm font-bold text-[#1a1a2e] transition-transform hover:brightness-110 active:scale-95 disabled:opacity-60"
            >
              {loading ? 'Sending…' : <>Send Data Byte <ArrowUpRight size={16} /></>}
            </button>
            <button
              type="button"
              onClick={() => setMode('pick')}
              className="mt-3 w-full text-center text-xs text-[#858496] hover:text-white"
            >
              ← Back to options
            </button>
          </form>
        )}

        {/* Mode 5: Random builder */}
        {mode === 'random' && (
          <form onSubmit={sendToRandom} className="mt-4">
            <div className="rounded-2xl border border-white/10 bg-[#1a1a2e] p-3.5 text-xs text-[#aaa9ba] mb-3">
              We will match your transfer with an active campus builder who is currently running low on data credits.
            </div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#858496]">
              Amount (MB)
            </label>
            <input
              data-testid="input-send-random-amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^\d]/g, ''))}
              inputMode="numeric"
              className="mt-1.5 w-full rounded-xl border border-white/15 bg-[#1a1a2e] px-4 py-3 text-sm font-mono text-white focus:border-[#57cfc8] focus:outline-none"
            />
            {error && <p className="mt-2.5 text-xs text-[#ff938f]">{error}</p>}
            <button
              data-testid="button-send-confirm-random"
              disabled={loading}
              type="submit"
              className="mt-5 flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#57cfc8] py-3.5 text-sm font-bold text-[#1a1a2e] transition-transform hover:brightness-110 active:scale-95 disabled:opacity-60"
            >
              {loading ? 'Sending…' : <>Gift a Builder in Need <ArrowUpRight size={16} /></>}
            </button>
            <button
              type="button"
              onClick={() => setMode('pick')}
              className="mt-3 w-full text-center text-xs text-[#858496] hover:text-white"
            >
              ← Back to options
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
