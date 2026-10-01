import { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  Search,
  CheckCheck,
  Send,
  ShieldCheck,
  Rocket,
  Users,
  Phone,
  Sparkles,
  Paperclip,
  MoreVertical,
  X,
  MessageCircle,
  UserPlus,
  Share2,
  Copy,
  Check,
  Zap,
  ExternalLink,
  MessageSquare,
  Plus,
} from 'lucide-react';

const BASE_URL = import.meta.env.BASE_URL || '/';

export type ChatMessage = {
  id: string;
  sender: 'user' | 'support' | 'peer';
  senderName?: string;
  text: string;
  timestamp: string;
  isRead?: boolean;
  isDataGift?: boolean;
  giftMb?: number;
};

export type ChatThread = {
  id: string;
  title: string;
  subtitle: string;
  phone?: string;
  isVerified?: boolean;
  isPinned?: boolean;
  avatarBg: string;
  avatarText: string;
  avatarUrl?: string;
  badgeText?: string;
  unreadCount: number;
  lastMessage: string;
  lastMessageTime: string;
  messages: ChatMessage[];
};

import { BUILDER_CONTACTS, type ContactProfile } from './data/contacts';

type PhoneContact = ContactProfile;

const DEVICE_CONTACTS: PhoneContact[] = BUILDER_CONTACTS;

const INITIAL_THREADS: ChatThread[] = [
  {
    id: 'support',
    title: 'Oxibyte Support Team',
    subtitle: 'Official 24/7 Verified Support',
    phone: '+2348064092767',
    isVerified: true,
    isPinned: true,
    avatarBg: 'bg-[#57cfc8]',
    avatarText: 'OX',
    badgeText: 'Official',
    unreadCount: 0,
    lastMessage: 'Ask us anything about drop-offs, MB rates, or your wallet.',
    lastMessageTime: 'Just now',
    messages: [
      {
        id: 'sup-1',
        sender: 'support',
        senderName: 'Oxibyte Support',
        text: 'Hello and welcome to Oxibyte Support! 🌿 How can we assist you with your plastic recycling or data credits today?',
        timestamp: '10:00 AM',
        isRead: true,
      },
      {
        id: 'sup-2',
        sender: 'support',
        senderName: 'Oxibyte Support',
        text: 'You can ask about:\n• Locating verified drop-off hubs\n• Plastic-to-MB exchange rates (1g = 1MB)\n• Data byte transfers to friends\n• Instant troubleshooting',
        timestamp: '10:01 AM',
        isRead: true,
      },
    ],
  },
  {
    id: 'shipaton',
    title: 'Shipaton 2027 Builders',
    subtitle: '412 student builders active',
    isVerified: true,
    isPinned: true,
    avatarBg: 'bg-[#ff6b35]',
    avatarText: '🚀',
    badgeText: 'Shipaton 2027',
    unreadCount: 2,
    lastMessage: 'Tolu: Anyone organizing a campus plastic drop-off drive?',
    lastMessageTime: '5m ago',
    messages: [
      {
        id: 'sh-1',
        sender: 'peer',
        senderName: 'Oxibyte Bot',
        text: '🏆 Welcome to the Shipaton 2027 Community Channel! Connect with fellow builders, form teams, and use your recycled data credits to keep your builds shipping.',
        timestamp: '9:30 AM',
        isRead: true,
      },
      {
        id: 'sh-2',
        sender: 'peer',
        senderName: 'Amina',
        text: 'We just submitted our green energy project to the launchpad! Recycled 2kg of plastic bottles at the faculty drop-off hub for testing data.',
        timestamp: '9:45 AM',
        isRead: true,
      },
      {
        id: 'sh-3',
        sender: 'peer',
        senderName: 'Tolu',
        text: 'Anyone organizing a campus plastic drop-off drive this Friday? We want to hit the Gold recycler tier together!',
        timestamp: '9:58 AM',
        isRead: false,
      },
    ],
  },
  {
    id: 'charlie',
    title: 'Charlie Chapman',
    subtitle: 'Creator of Dark Noise & Podcaster',
    phone: '+1 (555) 234-8901',
    avatarBg: 'bg-[#c39bf4]',
    avatarText: 'CC',
    avatarUrl: `${BASE_URL}contacts/charlie-chapman.png`,
    unreadCount: 0,
    lastMessage: 'Thanks for the data byte transfer! Saved my demo.',
    lastMessageTime: '1h ago',
    messages: [
      {
        id: 'cc-1',
        sender: 'peer',
        senderName: 'Charlie',
        text: 'Hey! Are you heading to the campus drop-off bin later today?',
        timestamp: '9:15 AM',
        isRead: true,
      },
      {
        id: 'cc-2',
        sender: 'user',
        text: 'Yeah, I have about 15 bottles ready to weigh in!',
        timestamp: '9:18 AM',
        isRead: true,
      },
      {
        id: 'cc-3',
        sender: 'peer',
        senderName: 'Charlie',
        text: 'Awesome! Thanks for the data byte transfer! Saved my demo.',
        timestamp: '9:20 AM',
        isRead: true,
      },
    ],
  },
];

function getAutoReply(text: string): string {
  const lower = text.toLowerCase();
  if (lower.includes('deposit') || lower.includes('drop off') || lower.includes('bin') || lower.includes('plastic')) {
    return 'Take clean plastic bottles (PET #1 or HDPE #2) to any registered collection point on your map. Once the operator weighs your drop-off, the exact MB amount is credited instantly to your account!';
  }
  if (lower.includes('mb') || lower.includes('rate') || lower.includes('conversion') || lower.includes('data')) {
    return 'Our standard conversion rate is 1 gram of verified plastic = 1MB of mobile data. For example, 100 grams of bottles = 100MB data credit!';
  }
  if (lower.includes('transfer') || lower.includes('send') || lower.includes('gift')) {
    return 'You can transfer data credits to any builder using their phone number via the "Send Byte" button on your Home screen. Transfers happen in real-time!';
  }
  if (lower.includes('shipaton') || lower.includes('hackathon') || lower.includes('build')) {
    return 'Shipaton 2027 is our flagship builder challenge! Check out the "Shipaton 2027 Builders" community channel right here in Chats to find teammates and share project demos.';
  }
  return 'Thank you for reaching out! Our support desk has logged your inquiry. A team specialist is reviewing your message. For urgent assistance, you can also call our direct line at +2348064092767.';
}

export default function ChatsScreen({
  initialThreadId = null,
  onClose,
  currentUserFirstName = 'Shipper',
}: {
  initialThreadId?: string | null;
  onClose: () => void;
  currentUserFirstName?: string;
}) {
  const [threads, setThreads] = useState<ChatThread[]>(INITIAL_THREADS);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(initialThreadId);
  const [currentTab, setCurrentTab] = useState<'chats' | 'contacts' | 'groups'>('chats');
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [contactsSynced, setContactsSynced] = useState(false);
  const [copiedInvite, setCopiedInvite] = useState(false);
  const [contacts, setContacts] = useState<PhoneContact[]>(DEVICE_CONTACTS);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const activeThread = threads.find((t) => t.id === activeThreadId) || null;

  useEffect(() => {
    if (initialThreadId) {
      setActiveThreadId(initialThreadId);
    }
  }, [initialThreadId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeThread?.messages, isTyping]);

  function handleImportContacts() {
    setContactsSynced(true);
    // Add additional mock synchronized contacts if desired
  }

  function handleOpenContactChat(contact: PhoneContact) {
    const existing = threads.find((t) => t.id === contact.id || t.title === contact.name);
    if (existing) {
      setActiveThreadId(existing.id);
      return;
    }

    // Create a new thread for this contact
    const newThread: ChatThread = {
      id: contact.id,
      title: contact.name,
      subtitle: contact.statusText || 'Connected on Oxibyte',
      phone: contact.phone,
      avatarBg: contact.avatarBg,
      avatarText: contact.name.slice(0, 2).toUpperCase(),
      avatarUrl: contact.avatarUrl,
      unreadCount: 0,
      lastMessage: 'Conversation started',
      lastMessageTime: 'Just now',
      messages: [
        {
          id: `msg-${Date.now()}`,
          sender: 'peer',
          senderName: contact.name,
          text: `Hey ${currentUserFirstName}! Good to connect on Oxibyte.`,
          timestamp: new Date().toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }),
          isRead: true,
        },
      ],
    };

    setThreads((prev) => [newThread, ...prev]);
    setActiveThreadId(newThread.id);
  }

  function handleSendMessage(e?: React.FormEvent, customGiftMb?: number) {
    e?.preventDefault();
    if ((!inputText.trim() && !customGiftMb) || !activeThreadId) return;

    const isGift = Boolean(customGiftMb);
    const msgText = isGift ? `🎁 Sent +${customGiftMb}MB Data Byte Gift!` : inputText.trim();

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      senderName: currentUserFirstName,
      text: msgText,
      timestamp: new Date().toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }),
      isRead: true,
      isDataGift: isGift,
      giftMb: customGiftMb,
    };

    const currentText = inputText.trim();
    setInputText('');

    setThreads((prev) =>
      prev.map((thread) => {
        if (thread.id !== activeThreadId) return thread;
        return {
          ...thread,
          lastMessage: `You: ${userMsg.text}`,
          lastMessageTime: 'Just now',
          messages: [...thread.messages, userMsg],
        };
      })
    );

    if (activeThreadId === 'support') {
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        const replyText = getAutoReply(currentText);
        const replyMsg: ChatMessage = {
          id: `reply-${Date.now()}`,
          sender: 'support',
          senderName: 'Oxibyte Support',
          text: replyText,
          timestamp: new Date().toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }),
          isRead: true,
        };

        setThreads((prev) =>
          prev.map((thread) => {
            if (thread.id !== 'support') return thread;
            return {
              ...thread,
              lastMessage: replyText,
              lastMessageTime: 'Just now',
              messages: [...thread.messages, replyMsg],
            };
          })
        );
      }, 1000);
    }
  }

  const inviteText = encodeURIComponent(
    'Hey! Join me on Oxibyte to turn plastic bottles into free mobile data credits: https://oxibyte.com/invite'
  );

  function copyInviteLink() {
    if (navigator.clipboard) {
      navigator.clipboard.writeText('https://oxibyte.com/invite');
      setCopiedInvite(true);
      setTimeout(() => setCopiedInvite(false), 2000);
    }
  }

  // Filter contacts by search
  const filteredContacts = contacts.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone.includes(searchQuery)
  );
  const onOxibyteContacts = filteredContacts.filter((c) => c.isOnOxibyte);
  const inviteContacts = filteredContacts.filter((c) => !c.isOnOxibyte);

  return (
    <div className="safe-top safe-bottom absolute inset-0 z-50 flex flex-col bg-[#11111f] text-[#f4f0e8]">
      {/* If viewing main messenger screen (tabs: Chats, Contacts, Groups) */}
      {!activeThread && (
        <div className="relative flex flex-1 flex-col overflow-hidden">
          {/* WhatsApp / Telegram-Style Top App Bar */}
          <div className="border-b border-white/10 bg-[#1a1a2e] px-4 pt-3 shadow-md">
            <div className="flex items-center justify-between pb-2">
              <div className="flex items-center gap-3">
                <button
                  data-testid="button-close-chats"
                  onClick={onClose}
                  className="rounded-lg p-1.5 text-[#cfced7] hover:bg-white/5"
                  aria-label="Back"
                >
                  <ArrowLeft size={20} />
                </button>
                <div className="flex items-center gap-2">
                  <span className="font-display text-lg font-bold text-white">Oxibyte</span>
                  <span className="rounded-full bg-[#57cfc8]/20 px-2 py-0.5 text-[10px] font-bold text-[#57cfc8]">
                    Messenger
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1 text-[#aaa9ba]">
                <button
                  onClick={handleImportContacts}
                  className="flex items-center gap-1 rounded-xl bg-[#24243c] px-2.5 py-1.5 text-xs font-bold text-[#57cfc8] hover:bg-white/10"
                  title="Import contacts from device"
                >
                  <UserPlus size={14} />
                  <span>{contactsSynced ? 'Synced' : 'Sync'}</span>
                </button>
              </div>
            </div>

            {/* Messenger Tabs */}
            <div className="flex items-center border-t border-white/5 pt-1 text-xs font-bold uppercase tracking-wider">
              <button
                onClick={() => setCurrentTab('chats')}
                className={`flex-1 border-b-2 py-2.5 text-center transition-colors ${
                  currentTab === 'chats'
                    ? 'border-[#57cfc8] text-[#57cfc8]'
                    : 'border-transparent text-[#858496] hover:text-white'
                }`}
              >
                Chats
              </button>
              <button
                onClick={() => setCurrentTab('contacts')}
                className={`flex-1 border-b-2 py-2.5 text-center transition-colors ${
                  currentTab === 'contacts'
                    ? 'border-[#57cfc8] text-[#57cfc8]'
                    : 'border-transparent text-[#858496] hover:text-white'
                }`}
              >
                Contacts ({contacts.length})
              </button>
              <button
                onClick={() => setCurrentTab('groups')}
                className={`flex-1 border-b-2 py-2.5 text-center transition-colors ${
                  currentTab === 'groups'
                    ? 'border-[#57cfc8] text-[#57cfc8]'
                    : 'border-transparent text-[#858496] hover:text-white'
                }`}
              >
                Groups
              </button>
            </div>
          </div>

          {/* Search bar */}
          <div className="border-b border-white/5 bg-[#17172c] px-4 py-2.5">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-[#858496]" size={15} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  currentTab === 'contacts' ? 'Search contacts or phone...' : 'Search conversations...'
                }
                className="w-full rounded-xl border border-white/10 bg-[#24243c] py-2 pl-9 pr-4 text-xs text-white placeholder:text-[#858496] focus:border-[#57cfc8] focus:outline-none"
              />
            </div>
          </div>

          {/* Tab 1: CHATS LIST */}
          {currentTab === 'chats' && (
            <div className="flex-1 overflow-y-auto px-4 py-3 pb-20">
              <div className="space-y-2">
                {threads.map((thread) => (
                  <div
                    key={thread.id}
                    data-testid={`chat-thread-${thread.id}`}
                    onClick={() => {
                      setActiveThreadId(thread.id);
                      setThreads((prev) =>
                        prev.map((t) => (t.id === thread.id ? { ...t, unreadCount: 0 } : t))
                      );
                    }}
                    className="flex cursor-pointer items-center gap-3.5 rounded-2xl border border-white/5 bg-[#1a1a2e] p-3.5 transition-colors hover:border-white/15 hover:bg-[#202038]"
                  >
                    <div className="relative shrink-0">
                      {thread.avatarUrl ? (
                        <img
                          src={thread.avatarUrl}
                          alt={thread.title}
                          className="h-12 w-12 rounded-full object-cover border border-white/15 shadow-md"
                        />
                      ) : (
                        <div
                          className={`grid h-12 w-12 place-items-center rounded-full ${thread.avatarBg} font-display text-base font-bold text-[#1a1a2e] shadow-md`}
                        >
                          {thread.avatarText}
                        </div>
                      )}
                      {thread.isVerified && (
                        <span className="absolute -bottom-1 -right-1 grid h-4 w-4 place-items-center rounded-full bg-[#1a1a2e] text-[#57cfc8]">
                          <ShieldCheck size={14} fill="currentColor" className="text-[#57cfc8]" />
                        </span>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="truncate text-sm font-bold text-white">{thread.title}</span>
                          {thread.badgeText && (
                            <span className="shrink-0 rounded-full bg-white/10 px-1.5 py-0.5 text-[9px] font-bold text-[#57cfc8]">
                              {thread.badgeText}
                            </span>
                          )}
                        </div>
                        <span className="shrink-0 text-[11px] text-[#858496]">
                          {thread.lastMessageTime}
                        </span>
                      </div>

                      <p className="mt-1 truncate text-xs text-[#aaa9ba]">{thread.lastMessage}</p>
                    </div>

                    {thread.unreadCount > 0 && (
                      <span className="grid h-5 min-w-5 place-items-center rounded-full bg-[#57cfc8] px-1.5 text-[10px] font-black text-[#1a1a2e]">
                        {thread.unreadCount}
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {/* Bottom WhatsApp/Telegram style Invite Card */}
              <div className="mt-5 rounded-2xl border border-white/10 bg-[#24243c] p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-white">Invite Friends & Earn +50MB</h4>
                    <p className="text-[11px] text-[#858496]">Share on WhatsApp or Telegram</p>
                  </div>
                  <button
                    onClick={() => setCurrentTab('contacts')}
                    className="rounded-xl bg-[#57cfc8] px-3 py-1.5 text-xs font-bold text-[#1a1a2e]"
                  >
                    View Contacts
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: CONTACTS & INVITE */}
          {currentTab === 'contacts' && (
            <div className="flex-1 overflow-y-auto px-4 py-3 pb-20">
              {/* Import Action Bar */}
              <div className="mb-4 flex items-center justify-between rounded-2xl border border-[#57cfc8]/25 bg-[#24243c] p-3.5">
                <div className="flex items-center gap-2.5">
                  <div className="grid h-9 w-9 place-items-center rounded-xl bg-[#57cfc8]/20 text-[#57cfc8]">
                    <UserPlus size={18} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">Device Address Book</div>
                    <div className="text-[11px] text-[#858496]">
                      {contactsSynced ? '✓ 30 contacts synchronized' : 'Sync your contacts to chat & send bytes'}
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleImportContacts}
                  className="rounded-xl bg-[#57cfc8] px-3 py-1.5 text-xs font-bold text-[#1a1a2e] hover:brightness-110"
                >
                  {contactsSynced ? 'Resync' : 'Import'}
                </button>
              </div>

              {/* Section 1: Contacts On Oxibyte */}
              <div className="mb-4">
                <div className="mb-2 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[#57cfc8]">
                  <span>On Oxibyte ({onOxibyteContacts.length})</span>
                  <span className="text-[10px] text-[#858496]">Instant Chat & Byte Gift</span>
                </div>

                <div className="space-y-2">
                  {onOxibyteContacts.map((contact) => (
                    <div
                      key={contact.id}
                      className="flex items-center justify-between rounded-2xl border border-white/5 bg-[#1a1a2e] p-3 hover:border-white/15 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="relative shrink-0">
                          {contact.avatarUrl ? (
                            <img
                              src={contact.avatarUrl}
                              alt={contact.name}
                              className="h-11 w-11 rounded-full object-cover border border-white/15 shadow-sm"
                            />
                          ) : (
                            <div
                              className={`grid h-11 w-11 place-items-center rounded-full ${contact.avatarBg} font-display text-xs font-bold text-[#1a1a2e]`}
                            >
                              {contact.name.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[#1a1a2e] bg-[#57cfc8]" />
                        </div>
                        <div className="min-w-0 flex-1 pr-2">
                          <div className="text-xs font-bold text-white truncate">{contact.name}</div>
                          <div className="text-[10px] text-[#57cfc8] truncate">{contact.statusText}</div>
                          <div className="font-mono text-[10px] text-[#858496]">{contact.phone}</div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleOpenContactChat(contact)}
                        className="flex items-center gap-1.5 rounded-xl bg-[#57cfc8]/15 px-3 py-2 text-xs font-bold text-[#57cfc8] hover:bg-[#57cfc8] hover:text-[#1a1a2e] shrink-0 transition-colors"
                      >
                        <MessageCircle size={13} /> Chat
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 2: Invite Friends to Oxibyte */}
              <div className="mt-6">
                <div className="mb-2 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[#ff6b35]">
                  <span>Invite to Oxibyte ({inviteContacts.length})</span>
                  <span className="text-[10px] text-[#858496]">+50MB Referral Reward</span>
                </div>

                <div className="space-y-2">
                  {inviteContacts.map((contact) => (
                    <div
                      key={contact.id}
                      className="flex items-center justify-between rounded-2xl border border-white/5 bg-[#1a1a2e] p-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="grid h-10 w-10 place-items-center rounded-full bg-white/10 font-display text-xs font-bold text-[#aaa9ba]">
                          {contact.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white">{contact.name}</div>
                          <div className="font-mono text-[10px] text-[#858496]">{contact.phone}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {/* WhatsApp Invite Button */}
                        <a
                          href={`https://api.whatsapp.com/send?text=${inviteText}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 rounded-xl bg-[#25D366]/20 px-2.5 py-1.5 text-[11px] font-bold text-[#25D366] hover:bg-[#25D366]/30"
                          title="Invite on WhatsApp"
                        >
                          WhatsApp
                        </a>

                        {/* Telegram Invite Button */}
                        <a
                          href={`https://t.me/share/url?url=https://oxibyte.com/invite&text=${inviteText}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 rounded-xl bg-[#0088cc]/20 px-2.5 py-1.5 text-[11px] font-bold text-[#0088cc] hover:bg-[#0088cc]/30"
                          title="Invite on Telegram"
                        >
                          Telegram
                        </a>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Direct Link Share */}
                <div className="mt-4 flex items-center justify-between rounded-2xl border border-white/10 bg-[#24243c] p-3.5">
                  <div>
                    <div className="text-xs font-bold text-white">Your Personal Invite Link</div>
                    <div className="font-mono text-[11px] text-[#57cfc8]">oxibyte.com/invite?ref=shipper</div>
                  </div>
                  <button
                    onClick={copyInviteLink}
                    className="flex items-center gap-1 rounded-xl bg-white/10 px-3 py-1.5 text-xs font-bold text-white hover:bg-white/20"
                  >
                    {copiedInvite ? <Check size={13} className="text-[#57cfc8]" /> : <Copy size={13} />}
                    <span>{copiedInvite ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: GROUPS / COMMUNITIES */}
          {currentTab === 'groups' && (
            <div className="flex-1 overflow-y-auto px-4 py-3 pb-20">
              <div className="space-y-3">
                <div
                  onClick={() => setActiveThreadId('shipaton')}
                  className="cursor-pointer rounded-2xl border border-[#ff6b35]/30 bg-gradient-to-br from-[#24243c] to-[#1c1c32] p-4 transition-all hover:border-[#ff6b35]"
                >
                  <div className="flex items-start gap-3">
                    <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#ff6b35] text-xl shadow-md">
                      🚀
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-display text-sm font-bold text-white">Shipaton 2027 Builders</h3>
                        <span className="rounded-full bg-[#ff6b35]/20 px-2 py-0.5 text-[10px] font-bold text-[#ff6b35]">
                          Active
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-[#aaa9ba]">
                        Official group channel for student teams, hackathon collaborators, and campus drop-off drives.
                      </p>
                      <div className="mt-3 flex items-center gap-3 text-[11px] text-[#57cfc8]">
                        <span className="flex items-center gap-1">
                          <Users size={12} /> 412 builders
                        </span>
                        <span>• 12 online now</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-[#24243c] p-4 opacity-75">
                  <div className="flex items-start gap-3">
                    <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#57cfc8]/20 text-xl text-[#57cfc8]">
                      🌱
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-display text-sm font-bold text-white">Campus Recycling Captains</h3>
                      <p className="mt-1 text-xs text-[#aaa9ba]">
                        Student coordinators managing scale drop-offs and verified collection hubs.
                      </p>
                      <span className="mt-2 inline-block text-[10px] font-semibold text-[#858496]">
                        Invitation only
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* WhatsApp-Style Floating Action Button (FAB) */}
          <button
            data-testid="fab-new-chat"
            onClick={() => setCurrentTab('contacts')}
            className="absolute bottom-5 right-5 grid h-14 w-14 place-items-center rounded-full bg-gradient-to-r from-[#57cfc8] to-[#25D366] text-[#1a1a2e] shadow-2xl transition-transform hover:scale-105 active:scale-95"
            aria-label="Start new chat"
          >
            <MessageSquare size={24} />
          </button>
        </div>
      )}

      {/* If inside active conversation thread */}
      {activeThread && (
        <div className="flex h-full flex-col">
          {/* Thread Header */}
          <div className="flex items-center justify-between border-b border-white/10 bg-[#1a1a2e] px-4 py-3 shadow-md">
            <div className="flex items-center gap-3">
              <button
                data-testid="button-back-chat-list"
                onClick={() => setActiveThreadId(null)}
                className="rounded-lg p-1.5 text-[#cfced7] hover:bg-white/5"
                aria-label="Back to chat list"
              >
                <ArrowLeft size={18} />
              </button>

              {activeThread.avatarUrl ? (
                <img
                  src={activeThread.avatarUrl}
                  alt={activeThread.title}
                  className="h-10 w-10 rounded-full object-cover border border-white/15 shadow-sm"
                />
              ) : (
                <div
                  className={`grid h-10 w-10 place-items-center rounded-full ${activeThread.avatarBg} font-display text-sm font-bold text-[#1a1a2e]`}
                >
                  {activeThread.avatarText}
                </div>
              )}

              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-display text-sm font-bold text-white">{activeThread.title}</h3>
                  {activeThread.isVerified && (
                    <ShieldCheck size={14} className="text-[#57cfc8]" />
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-[#57cfc8]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#57cfc8]" />
                  <span>{activeThread.subtitle}</span>
                </div>
              </div>
            </div>

            {/* Support Call / Phone Action */}
            {activeThread.phone && (
              <a
                href={`tel:${activeThread.phone}`}
                className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-[#24243c] text-[#57cfc8] hover:bg-white/10"
                title="Call phone line"
              >
                <Phone size={16} />
              </a>
            )}
          </div>

          {/* Messages Feed with Chat Wallpaper */}
          <div
            className="flex-1 space-y-3 overflow-y-auto px-4 py-4"
            style={{
              backgroundImage:
                'radial-gradient(circle at 1px 1px, rgba(87, 207, 200, 0.05) 1px, transparent 0)',
              backgroundSize: '20px 20px',
            }}
          >
            {activeThread.messages.map((msg) => {
              const isMe = msg.sender === 'user';
              const isSupport = msg.sender === 'support';

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                >
                  {!isMe && msg.senderName && (
                    <span className="mb-1 ml-1 text-[10px] font-semibold text-[#858496]">
                      {msg.senderName}
                    </span>
                  )}

                  <div
                    className={`max-w-[82%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm ${
                      msg.isDataGift
                        ? 'border border-[#57cfc8] bg-[#57cfc8]/20 font-bold text-[#57cfc8]'
                        : isMe
                        ? 'rounded-tr-xs bg-[#57cfc8] font-medium text-[#1a1a2e]'
                        : isSupport
                        ? 'rounded-tl-xs border border-white/10 bg-[#24243c] text-white'
                        : 'rounded-tl-xs border border-white/10 bg-[#1e1e35] text-[#f4f0e8]'
                    }`}
                  >
                    <div className="whitespace-pre-line">{msg.text}</div>
                    <div
                      className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${
                        isMe ? 'text-[#1a1a2e]/70' : 'text-[#858496]'
                      }`}
                    >
                      <span>{msg.timestamp}</span>
                      {isMe && <CheckCheck size={12} className="text-[#1a1a2e]" />}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Typing indicator */}
            {isTyping && (
              <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-xs border border-white/10 bg-[#24243c] px-3.5 py-2.5 text-xs text-[#aaa9ba]">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#57cfc8]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#57cfc8] [animation-delay:0.2s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#57cfc8] [animation-delay:0.4s]" />
                <span className="ml-1 text-[11px]">Replying…</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick FAQ / Prompt Chips for Support */}
          {activeThread.id === 'support' && (
            <div className="flex gap-2 overflow-x-auto border-t border-white/5 bg-[#1a1a2e]/60 px-4 py-2 text-xs">
              <button
                onClick={() => setInputText('How do I deposit plastic?')}
                className="shrink-0 rounded-full border border-white/10 bg-[#24243c] px-3 py-1 text-[11px] text-[#cfced7] hover:border-[#57cfc8]"
              >
                ♻️ How to deposit?
              </button>
              <button
                onClick={() => setInputText('What is the MB conversion rate?')}
                className="shrink-0 rounded-full border border-white/10 bg-[#24243c] px-3 py-1 text-[11px] text-[#cfced7] hover:border-[#57cfc8]"
              >
                📊 What is the MB rate?
              </button>
              <button
                onClick={() => setInputText('How can I transfer data to a friend?')}
                className="shrink-0 rounded-full border border-white/10 bg-[#24243c] px-3 py-1 text-[11px] text-[#cfced7] hover:border-[#57cfc8]"
              >
                ⚡ Transfer data
              </button>
            </div>
          )}

          {/* Message Input Bar with In-Chat Byte Gift Option */}
          <form
            onSubmit={(e) => handleSendMessage(e)}
            className="flex items-center gap-2 border-t border-white/10 bg-[#1a1a2e] px-4 py-3"
          >
            {/* Direct Send Byte Button */}
            {activeThread.id !== 'support' && (
              <button
                type="button"
                onClick={() => handleSendMessage(undefined, 10)}
                className="flex items-center gap-1 rounded-xl bg-[#57cfc8]/20 px-2.5 py-2 text-xs font-bold text-[#57cfc8] hover:bg-[#57cfc8] hover:text-[#1a1a2e]"
                title="Send +10MB data byte directly in chat"
              >
                <Zap size={14} /> +10MB
              </button>
            )}

            <input
              type="text"
              data-testid="input-chat-message"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={
                activeThread.id === 'support'
                  ? 'Message Oxibyte Support (+2348064092767)…'
                  : 'Type a message…'
              }
              className="flex-1 rounded-2xl border border-white/10 bg-[#24243c] px-4 py-2.5 text-xs text-white placeholder:text-[#858496] focus:border-[#57cfc8] focus:outline-none"
            />

            <button
              type="submit"
              data-testid="button-send-chat"
              disabled={!inputText.trim()}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[#57cfc8] text-[#1a1a2e] transition-opacity disabled:opacity-40"
              aria-label="Send message"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
