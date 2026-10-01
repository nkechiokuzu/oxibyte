import { useState } from 'react';
import {
  X,
  Headphones,
  Mail,
  Phone,
  MessageCircle,
  Copy,
  Check,
  ChevronDown,
  Sparkles,
  HelpCircle,
  Send,
  ExternalLink,
} from 'lucide-react';

const SUPPORT_EMAIL = 'support@oxibyte.com';
const SUPPORT_PHONE = '+2348064092767';

type FaqItem = {
  question: string;
  answer: string;
};

const FAQ_ITEMS: FaqItem[] = [
  {
    question: 'How does converting plastic to data (MB) work?',
    answer:
      'Our conversion rule is simple: 1 gram of verified clean plastic = 1MB of high-speed data credit. When you drop off plastic bottles at any approved collection point or smart bin, your deposit is weighed and the exact MB equivalent lands in your wallet in real time.',
  },
  {
    question: 'Where can I drop off my plastic bottles?',
    answer:
      'Tap "Deposit Plastic" on your Home screen to see all active collection hubs, campus centers, and vendor drop-off partners near you with distance and directions.',
  },
  {
    question: 'How fast will my deposit reflect in my wallet?',
    answer:
      'Instantly! The moment our partner operator weighs your deposit and enters your registered phone number, the data credit is automatically added to your wallet balance and an instant notification is sent to your Bell feed.',
  },
  {
    question: 'What types of plastics are accepted?',
    answer:
      'We accept clean, sorted post-consumer plastics, primarily PET (Resin Code #1: water, soft drink, and juice bottles) and HDPE (Resin Code #2: detergent and shampoo containers). Use our AI Scanner to check any bottle beforehand.',
  },
  {
    question: 'Can I transfer data credits to other students?',
    answer:
      'Yes! Use the "Send Byte" feature on your wallet card to transfer MB credits to any phone number or randomly support another student builder who needs data for their project.',
  },
  {
    question: 'What is Shipaton 2027?',
    answer:
      'Shipaton 2027 is the student builder hackathon organized on campus. Students recycle plastic to fuel their connectivity and build amazing web & mobile apps. Join the Shipaton 2027 channel in Chats to connect with other builders!',
  },
];

export default function SupportModal({
  onClose,
  onOpenOxibyteChat,
}: {
  onClose: () => void;
  onOpenOxibyteChat: () => void;
}) {
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketMessage, setTicketMessage] = useState('');
  const [ticketSubmitted, setTicketSubmitted] = useState(false);

  function copyToClipboard(text: string, type: 'email' | 'phone') {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      if (type === 'email') {
        setCopiedEmail(true);
        setTimeout(() => setCopiedEmail(false), 2000);
      } else {
        setCopiedPhone(true);
        setTimeout(() => setCopiedPhone(false), 2000);
      }
    }
  }

  function handleSendTicket(e: React.FormEvent) {
    e.preventDefault();
    if (!ticketMessage.trim()) return;
    setTicketSubmitted(true);
    setTimeout(() => {
      setTicketSubject('');
      setTicketMessage('');
      setTicketSubmitted(false);
    }, 4000);
  }

  return (
    <div className="safe-top safe-bottom absolute inset-0 z-50 overflow-y-auto bg-[#1a1a2e] text-[#f4f0e8]">
      <div className="mx-auto max-w-lg px-5 pb-16 pt-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              data-testid="button-close-support"
              onClick={onClose}
              className="rounded-lg p-2 text-[#cfced7] hover:bg-white/5"
              aria-label="Back"
            >
              <X size={20} />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display text-xl font-bold">Help & Support</h1>
                <span className="rounded-full bg-[#ff6b35] px-2 py-0.5 text-[10px] font-bold uppercase text-[#1a1a2e]">
                  Help Center
                </span>
              </div>
              <p className="text-xs text-[#858496]">Assistance, direct contacts & FAQs</p>
            </div>
          </div>
        </div>

        {/* Highlight Banner: Chat on Oxibyte */}
        <div className="mt-6 rounded-3xl border border-[#57cfc8]/40 bg-gradient-to-br from-[#24243c] to-[#1c1c32] p-5 shadow-xl">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#57cfc8]/20 text-[#57cfc8]">
                <MessageCircle size={22} />
              </span>
              <div>
                <h3 className="font-display text-base font-bold text-white">Chat on Oxibyte</h3>
                <p className="text-xs text-[#aaa9ba]">In-app live messenger support</p>
              </div>
            </div>
            <span className="rounded-full bg-[#57cfc8]/15 px-2.5 py-1 text-[11px] font-bold text-[#57cfc8]">
              Online Now
            </span>
          </div>

          <p className="mt-3 text-xs leading-relaxed text-[#cfced7]">
            Connect directly with the Oxibyte Support Desk (<span className="font-mono text-white">{SUPPORT_PHONE}</span>) right inside the app messenger. Get quick answers on deposit statuses, conversion rates, and wallet credits.
          </p>

          <div className="mt-4 flex gap-2">
            <button
              data-testid="button-chat-oxibyte"
              onClick={() => {
                onClose();
                onOpenOxibyteChat();
              }}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#57cfc8] py-3 text-xs font-bold text-[#1a1a2e] transition-transform hover:brightness-105 active:scale-[0.98]"
            >
              <MessageCircle size={15} /> Chat on Oxibyte
            </button>
            <a
              href={`tel:${SUPPORT_PHONE}`}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-[#1a1a2e] px-4 py-3 text-xs font-bold text-white hover:bg-white/10"
              title="Call support directly"
            >
              <Phone size={14} /> Call
            </a>
            <button
              onClick={() => copyToClipboard(SUPPORT_PHONE, 'phone')}
              className="grid h-11 w-11 place-items-center rounded-xl border border-white/10 bg-[#1a1a2e] text-[#aaa9ba] hover:text-white"
              title="Copy phone number"
            >
              {copiedPhone ? <Check size={16} className="text-[#57cfc8]" /> : <Copy size={16} />}
            </button>
          </div>
        </div>

        {/* Email Support Card */}
        <div className="mt-4 rounded-3xl border border-white/10 bg-[#24243c] p-5">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#ff6b35]/20 text-[#ff6b35]">
                <Mail size={20} />
              </span>
              <div>
                <h3 className="font-display text-sm font-bold text-white">Email Inquiries</h3>
                <p className="font-mono text-xs text-[#57cfc8]">{SUPPORT_EMAIL}</p>
              </div>
            </div>
            <button
              onClick={() => copyToClipboard(SUPPORT_EMAIL, 'email')}
              className="flex items-center gap-1 rounded-xl bg-white/5 px-2.5 py-1.5 text-xs text-[#aaa9ba] hover:bg-white/10 hover:text-white"
            >
              {copiedEmail ? (
                <>
                  <Check size={12} className="text-[#57cfc8]" />
                  <span className="text-[#57cfc8]">Copied</span>
                </>
              ) : (
                <>
                  <Copy size={12} />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>

          <p className="mt-3 text-xs leading-relaxed text-[#aaa9ba]">
            For partnerships, student hub verification, bug reports, and general feedback. We respond within 24 hours.
          </p>

          <a
            href={`mailto:${SUPPORT_EMAIL}?subject=Oxibyte%20Support%20Request`}
            className="mt-3 flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-[#1a1a2e] py-2.5 text-xs font-bold text-[#f4f0e8] hover:bg-white/10"
          >
            <Mail size={13} /> Open in Email App
          </a>
        </div>

        {/* Frequently Asked Questions */}
        <div className="mt-8">
          <div className="flex items-center gap-2">
            <HelpCircle size={18} className="text-[#57cfc8]" />
            <h2 className="font-display text-base font-bold">Frequently Asked Questions</h2>
          </div>
          <p className="mt-1 text-xs text-[#858496]">Everything you need to know about Oxibyte</p>

          <div className="mt-4 space-y-2.5">
            {FAQ_ITEMS.map((item, idx) => {
              const isOpen = expandedFaq === idx;
              return (
                <div
                  key={idx}
                  className="overflow-hidden rounded-2xl border border-white/10 bg-[#24243c] transition-colors"
                >
                  <button
                    onClick={() => setExpandedFaq(isOpen ? null : idx)}
                    className="flex w-full items-center justify-between gap-3 p-4 text-left"
                  >
                    <span className="text-xs font-bold text-white">{item.question}</span>
                    <ChevronDown
                      size={16}
                      className={`shrink-0 text-[#858496] transition-transform ${
                        isOpen ? 'rotate-180 text-[#57cfc8]' : ''
                      }`}
                    />
                  </button>

                  {isOpen && (
                    <div className="border-t border-white/5 bg-[#1a1a2e]/60 px-4 py-3 text-xs leading-relaxed text-[#cfced7]">
                      {item.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Message Form */}
        <div className="mt-8 rounded-3xl border border-white/10 bg-[#24243c] p-5">
          <h3 className="font-display text-sm font-bold text-white">Send Quick Feedback</h3>
          <p className="mt-1 text-xs text-[#858496]">
            Have an idea or issue? Leave a quick note for our team.
          </p>

          {ticketSubmitted ? (
            <div className="mt-4 rounded-2xl bg-[#57cfc8]/15 p-4 text-center text-xs font-bold text-[#57cfc8]">
              ✓ Message sent to Oxibyte Support! We will review it shortly.
            </div>
          ) : (
            <form onSubmit={handleSendTicket} className="mt-4 space-y-3">
              <input
                type="text"
                value={ticketSubject}
                onChange={(e) => setTicketSubject(e.target.value)}
                placeholder="Topic (e.g. Deposit question, Campus Bin request)"
                className="w-full rounded-xl border border-white/10 bg-[#1a1a2e] px-3.5 py-2.5 text-xs text-white placeholder:text-[#858496] focus:border-[#57cfc8] focus:outline-none"
              />
              <textarea
                rows={3}
                value={ticketMessage}
                onChange={(e) => setTicketMessage(e.target.value)}
                placeholder="Describe your issue or feedback in detail..."
                className="w-full rounded-xl border border-white/10 bg-[#1a1a2e] px-3.5 py-2.5 text-xs text-white placeholder:text-[#858496] focus:border-[#57cfc8] focus:outline-none"
              />
              <button
                type="submit"
                disabled={!ticketMessage.trim()}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#ff6b35] py-2.5 text-xs font-bold text-[#1a1a2e] transition-opacity disabled:opacity-40"
              >
                <Send size={13} /> Submit Feedback
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
