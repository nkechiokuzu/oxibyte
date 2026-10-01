import { useState, useMemo } from 'react';
import { X, Bell, Recycle, Zap, Gift, CheckCheck, Loader2, Award, ChevronRight, Check } from 'lucide-react';
import { apiGet, ApiError } from './lib/api';

type Reason = 'signup_bonus' | 'deposit_backfill' | 'deposit' | 'gift_sent' | 'gift_received' | 'profile_bonus';
export type LedgerTransaction = { id: number; deltaMb: number; reason: Reason; createdAt: string; relatedFirstName: string | null };

export type AppNotification = {
  id: string;
  txId?: number;
  type: 'deposit' | 'credit' | 'bonus' | 'gift';
  title: string;
  message: string;
  deltaMb: number;
  createdAt: string;
  isRead: boolean;
};

export function transactionToNotification(t: LedgerTransaction, readIds: Set<string>): AppNotification {
  const notifId = `tx-${t.id}`;
  const isRead = readIds.has(notifId);

  if (t.reason === 'deposit' || t.reason === 'deposit_backfill') {
    return {
      id: notifId,
      txId: t.id,
      type: 'deposit',
      title: 'Plastic Deposit Verified',
      message: `Verified ${t.deltaMb}g of recycled plastic at drop-off station. Credited +${t.deltaMb}MB to your wallet.`,
      deltaMb: t.deltaMb,
      createdAt: t.createdAt,
      isRead,
    };
  }

  if (t.reason === 'signup_bonus') {
    return {
      id: notifId,
      txId: t.id,
      type: 'bonus',
      title: 'Welcome Data Bonus',
      message: `Welcome to Oxibyte! Your starting incentive of +${t.deltaMb}MB is ready to use.`,
      deltaMb: t.deltaMb,
      createdAt: t.createdAt,
      isRead,
    };
  }

  if (t.reason === 'gift_received') {
    return {
      id: notifId,
      txId: t.id,
      type: 'gift',
      title: 'Data Byte Received',
      message: `${t.relatedFirstName ? `${t.relatedFirstName}` : 'A builder'} transferred +${t.deltaMb}MB directly to your wallet.`,
      deltaMb: t.deltaMb,
      createdAt: t.createdAt,
      isRead,
    };
  }

  if (t.reason === 'profile_bonus') {
    return {
      id: notifId,
      txId: t.id,
      type: 'bonus',
      title: 'Profile Milestone Bonus',
      message: `Thanks for keeping your profile updated! +${t.deltaMb}MB added to your balance.`,
      deltaMb: t.deltaMb,
      createdAt: t.createdAt,
      isRead,
    };
  }

  // Fallback for any other positive credit
  return {
    id: notifId,
    txId: t.id,
    type: 'credit',
    title: t.deltaMb > 0 ? 'Data Credit' : 'Data Transfer',
    message: `${t.deltaMb > 0 ? '+' : ''}${t.deltaMb}MB applied to your Oxibyte wallet.`,
    deltaMb: t.deltaMb,
    createdAt: t.createdAt,
    isRead,
  };
}

function timeAgo(isoString: string): string {
  try {
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return 'Just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDays = Math.floor(diffHr / 24);
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return new Date(isoString).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return 'Recent';
  }
}

export default function NotificationsModal({
  onClose,
  onOpenDeposit,
  readIds,
  onMarkRead,
  onMarkAllRead,
  rawTransactions,
  isLoading = false,
}: {
  onClose: () => void;
  onOpenDeposit: () => void;
  readIds: Set<string>;
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  rawTransactions: LedgerTransaction[];
  isLoading?: boolean;
}) {
  const [filter, setFilter] = useState<'all' | 'deposits' | 'credits'>('all');

  // Build notifications list from ledger transactions and local custom deposit notifications
  const notifications = useMemo(() => {
    let customNotifs: AppNotification[] = [];
    try {
      const saved = localStorage.getItem('oxibyte_deposit_notifications');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          customNotifs = parsed.map((item) => ({
            id: item.id || `custom-${item.createdAt}`,
            txId: item.txId,
            type: 'deposit' as const,
            title: 'Plastic Deposit Received',
            message: item.message,
            deltaMb: item.deltaMb || 50,
            createdAt: item.createdAt || new Date().toISOString(),
            isRead: readIds.has(item.id || `custom-${item.createdAt}`),
          }));
        }
      }
    } catch {}

    const txNotifs = rawTransactions
      .filter((t) => t.deltaMb > 0)
      .map((t) => transactionToNotification(t, readIds));

    // Combine and sort newest first
    const combined = [...customNotifs, ...txNotifs];
    const seen = new Set<string>();
    return combined
      .filter((n) => {
        const key = n.txId ? `tx-${n.txId}` : n.id;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [rawTransactions, readIds]);

  const filteredNotifications = useMemo(() => {
    if (filter === 'deposits') {
      return notifications.filter((n) => n.type === 'deposit');
    }
    if (filter === 'credits') {
      return notifications.filter((n) => n.type !== 'deposit');
    }
    return notifications;
  }, [notifications, filter]);

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.isRead).length;
  }, [notifications]);

  return (
    <div className="safe-top safe-bottom absolute inset-0 z-50 overflow-y-auto overflow-x-hidden bg-[#1a1a2e] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <div className="mx-auto max-w-lg px-5 pb-16 pt-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              data-testid="button-close-notifications"
              onClick={onClose}
              className="rounded-lg p-2 text-[#cfced7] hover:bg-white/5"
              aria-label="Back"
            >
              <X size={20} />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display text-xl font-bold">Notifications</h1>
                {unreadCount > 0 && (
                  <span className="rounded-full bg-[#ff6b35] px-2 py-0.5 text-xs font-bold text-[#1a1a2e]">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <p className="text-xs text-[#858496]">Plastic deposit alerts & data credit updates</p>
            </div>
          </div>

          {unreadCount > 0 && (
            <button
              data-testid="button-mark-all-read"
              onClick={onMarkAllRead}
              className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-[#24243c] px-3 py-2 text-xs font-bold text-[#57cfc8] hover:bg-white/10"
            >
              <CheckCheck size={14} /> Mark all read
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="mt-6 flex items-center gap-2 border-b border-white/10 pb-3">
          <button
            onClick={() => setFilter('all')}
            className={`rounded-full px-4 py-1.5 text-xs font-bold transition-colors ${
              filter === 'all'
                ? 'bg-[#57cfc8] text-[#1a1a2e]'
                : 'bg-[#24243c] text-[#858496] hover:text-white'
            }`}
          >
            All Activity ({notifications.length})
          </button>
          <button
            onClick={() => setFilter('deposits')}
            className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold transition-colors ${
              filter === 'deposits'
                ? 'bg-[#57cfc8] text-[#1a1a2e]'
                : 'bg-[#24243c] text-[#858496] hover:text-white'
            }`}
          >
            <Recycle size={13} /> Plastic Deposits
          </button>
          <button
            onClick={() => setFilter('credits')}
            className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold transition-colors ${
              filter === 'credits'
                ? 'bg-[#57cfc8] text-[#1a1a2e]'
                : 'bg-[#24243c] text-[#858496] hover:text-white'
            }`}
          >
            <Zap size={13} /> Data Credits
          </button>
        </div>

        {/* Notifications List */}
        <div className="mt-4 space-y-3">
          {isLoading && (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-[#858496]">
              <Loader2 className="animate-spin text-[#57cfc8]" size={24} />
              <span className="text-sm">Updating notification feed…</span>
            </div>
          )}

          {!isLoading && filteredNotifications.length === 0 && (
            <div className="mt-8 flex flex-col items-center justify-center rounded-3xl border border-white/10 bg-[#24243c] p-8 text-center">
              <div className="grid h-16 w-16 place-items-center rounded-2xl bg-[#57cfc8]/10 text-[#57cfc8]">
                <Bell size={28} />
              </div>
              <h3 className="mt-4 font-display text-lg font-bold">No notifications yet</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#aaa9ba]">
                Whenever you drop off plastic bottles at a collection point or receive bonus data credits, you will get notified right here!
              </p>
              <button
                onClick={() => {
                  onClose();
                  onOpenDeposit();
                }}
                className="mt-6 flex items-center gap-2 rounded-xl bg-[#ff6b35] px-5 py-3 text-sm font-bold text-[#1a1a2e] hover:brightness-110"
              >
                <Recycle size={16} /> Find Drop-off Point
              </button>
            </div>
          )}

          {!isLoading &&
            filteredNotifications.map((notif) => {
              const isDeposit = notif.type === 'deposit';
              const isGift = notif.type === 'gift';
              const isBonus = notif.type === 'bonus';

              return (
                <div
                  key={notif.id}
                  data-testid={`notification-item-${notif.id}`}
                  onClick={() => onMarkRead(notif.id)}
                  className={`group relative flex cursor-pointer items-start gap-4 rounded-2xl border p-4 transition-all ${
                    !notif.isRead
                      ? 'border-[#57cfc8]/40 bg-[#24243c] shadow-lg shadow-[#57cfc8]/5'
                      : 'border-white/5 bg-[#202036] opacity-85 hover:border-white/15'
                  }`}
                >
                  {/* Unread blue dot */}
                  {!notif.isRead && (
                    <span className="absolute -left-1 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-[#57cfc8]" />
                  )}

                  {/* Icon */}
                  <div
                    className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${
                      isDeposit
                        ? 'bg-[#57cfc8]/20 text-[#57cfc8]'
                        : isGift
                        ? 'bg-[#c39bf4]/20 text-[#c39bf4]'
                        : 'bg-[#ff6b35]/20 text-[#ff6b35]'
                    }`}
                  >
                    {isDeposit && <Recycle size={20} />}
                    {isGift && <Gift size={20} />}
                    {isBonus && <Zap size={20} />}
                    {!isDeposit && !isGift && !isBonus && <Award size={20} />}
                  </div>

                  {/* Body */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="truncate text-sm font-bold text-white">{notif.title}</h4>
                      <span className="shrink-0 text-[11px] font-medium text-[#858496]">
                        {timeAgo(notif.createdAt)}
                      </span>
                    </div>

                    <p className="mt-1 text-xs leading-relaxed text-[#cfced7]">{notif.message}</p>

                    <div className="mt-2.5 flex items-center justify-between">
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#57cfc8]/15 px-2.5 py-0.5 text-xs font-bold text-[#57cfc8]">
                        +{notif.deltaMb} MB
                      </span>

                      {!notif.isRead ? (
                        <span className="text-[11px] font-semibold text-[#57cfc8]">Tap to mark read</span>
                      ) : (
                        <span className="flex items-center gap-1 text-[11px] text-[#858496]">
                          <Check size={12} /> Read
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}
