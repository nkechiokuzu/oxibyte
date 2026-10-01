import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Check, Inbox, Loader2, ArrowUpRight, ArrowDownLeft, Filter, Sparkles } from 'lucide-react';
import { apiGet, ApiError } from './lib/api';

type Reason = 'signup_bonus' | 'deposit_backfill' | 'deposit' | 'gift_sent' | 'gift_received' | 'profile_bonus';
type Transaction = { id: number; deltaMb: number; reason: Reason; createdAt: string; relatedFirstName: string | null };

const REASON_LABEL: Record<Reason, (t: Transaction) => string> = {
  gift_sent: (t) => `Transfer to ${t.relatedFirstName ?? 'a builder'}`,
  gift_received: (t) => `Received from ${t.relatedFirstName ?? 'a builder'}`,
  deposit: () => 'Plastic deposit reward',
  deposit_backfill: () => 'Plastic deposit backfill',
  signup_bonus: () => 'Welcome bonus',
  profile_bonus: () => 'Profile completion bonus',
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return `${d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} · ${d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}`;
}

export default function TransactionHistory({ onClose }: { onClose: () => void }) {
  const [transactions, setTransactions] = useState<Transaction[] | null>(null);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'credits' | 'debits'>('all');

  useEffect(() => {
    let cancelled = false;
    apiGet<{ transactions: Transaction[] }>('/wallet/transactions')
      .then((data) => { if (!cancelled) setTransactions(data.transactions); })
      .catch((err) => { if (!cancelled) setError(err instanceof ApiError ? err.message : 'Could not load your transactions.'); });
    return () => { cancelled = true; };
  }, []);

  const filteredTransactions = useMemo(() => {
    if (!transactions) return [];
    if (filter === 'credits') return transactions.filter((t) => t.deltaMb >= 0);
    if (filter === 'debits') return transactions.filter((t) => t.deltaMb < 0);
    return transactions;
  }, [transactions, filter]);

  const stats = useMemo(() => {
    if (!transactions) return { totalCredited: 0, totalDebited: 0, count: 0 };
    let credited = 0;
    let debited = 0;
    transactions.forEach((t) => {
      if (t.deltaMb >= 0) credited += t.deltaMb;
      else debited += Math.abs(t.deltaMb);
    });
    return { totalCredited: credited, totalDebited: debited, count: transactions.length };
  }, [transactions]);

  return (
    <div className="safe-top safe-bottom absolute inset-0 z-50 overflow-y-auto bg-[#1a1a2e] text-[#f4f0e8]">
      <div className="mx-auto max-w-md px-5 pb-16 pt-5">
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              data-testid="button-close-transactions"
              onClick={onClose}
              className="rounded-lg p-2 text-[#cfced7] hover:bg-white/5 active:scale-95 transition-transform"
              aria-label="Back to home"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="font-display text-xl font-bold">Transaction History</h1>
              <p className="text-xs text-[#858496]">Complete ledger of your plastic rewards & transfers</p>
            </div>
          </div>
        </div>

        {/* Ledger Summary Stats Card */}
        <div className="mt-5 rounded-3xl border border-white/10 bg-gradient-to-br from-[#24243c] via-[#202038] to-[#171728] p-5 shadow-xl">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold uppercase tracking-wider text-[#858496]">Activity Summary</span>
            <span className="rounded-full bg-[#57cfc8]/15 px-2.5 py-0.5 font-bold text-[#57cfc8]">
              {stats.count} Transactions
            </span>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-[#161628] p-3.5 border border-white/5">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#57cfc8]">
                <ArrowDownLeft size={14} /> Total Received
              </div>
              <div className="mt-1 font-display text-2xl font-bold text-white">
                +{stats.totalCredited} <span className="text-xs font-normal text-[#858496]">MB</span>
              </div>
            </div>

            <div className="rounded-2xl bg-[#161628] p-3.5 border border-white/5">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#ff938f]">
                <ArrowUpRight size={14} /> Total Sent
              </div>
              <div className="mt-1 font-display text-2xl font-bold text-white">
                -{stats.totalDebited} <span className="text-xs font-normal text-[#858496]">MB</span>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Chips */}
        <div className="mt-4 flex items-center gap-2">
          <button
            data-testid="filter-tx-all"
            onClick={() => setFilter('all')}
            className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-colors ${
              filter === 'all'
                ? 'bg-[#57cfc8] text-[#1a1a2e]'
                : 'bg-[#24243c] text-[#858496] hover:text-white'
            }`}
          >
            All ({transactions?.length || 0})
          </button>
          <button
            data-testid="filter-tx-credits"
            onClick={() => setFilter('credits')}
            className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-colors ${
              filter === 'credits'
                ? 'bg-[#57cfc8] text-[#1a1a2e]'
                : 'bg-[#24243c] text-[#858496] hover:text-white'
            }`}
          >
            Credits (+MB)
          </button>
          <button
            data-testid="filter-tx-debits"
            onClick={() => setFilter('debits')}
            className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-colors ${
              filter === 'debits'
                ? 'bg-[#57cfc8] text-[#1a1a2e]'
                : 'bg-[#24243c] text-[#858496] hover:text-white'
            }`}
          >
            Transfers (-MB)
          </button>
        </div>

        {/* Transactions List */}
        <div className="mt-4">
          {transactions === null && !error && (
            <div className="flex items-center justify-center gap-2 py-16 text-sm text-[#858496]">
              <Loader2 className="animate-spin text-[#57cfc8]" size={18} /> Loading ledger entries…
            </div>
          )}

          {error && (
            <div className="rounded-2xl bg-[#ff938f]/10 p-4 text-center text-sm text-[#ff938f]">
              {error}
            </div>
          )}

          {transactions !== null && filteredTransactions.length === 0 && (
            <div className="flex flex-col items-center gap-2 rounded-3xl border border-white/5 bg-[#24243c]/60 py-16 text-center text-sm text-[#858496]">
              <Inbox size={28} className="text-[#858496]/60" />
              <div className="font-semibold text-white">No transactions found</div>
              <p className="text-xs text-[#858496]">
                {filter === 'credits'
                  ? 'No plastic deposits or data rewards yet.'
                  : filter === 'debits'
                  ? 'You have not transferred any MBs yet.'
                  : 'Start depositing plastic at smart bins to earn your first MB.'}
              </p>
            </div>
          )}

          {filteredTransactions.length > 0 && (
            <div className="space-y-2.5">
              {filteredTransactions.map((t) => {
                const credit = t.deltaMb >= 0;
                return (
                  <div
                    key={t.id}
                    data-testid={`row-transaction-${t.id}`}
                    className="flex items-center gap-3.5 rounded-2xl border border-white/5 bg-[#24243c] p-4 transition-colors hover:border-white/15"
                  >
                    <span
                      className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${
                        credit ? 'bg-[#57cfc8]/15 text-[#57cfc8]' : 'bg-[#ff938f]/15 text-[#ff938f]'
                      }`}
                    >
                      {credit ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="truncate text-sm font-bold text-white">
                          {REASON_LABEL[t.reason](t)}
                        </span>
                        <span
                          className={`font-mono text-sm font-bold ${
                            credit ? 'text-[#57cfc8]' : 'text-[#ff938f]'
                          }`}
                        >
                          {credit ? '+' : ''}{t.deltaMb} MB
                        </span>
                      </div>
                      <div className="mt-0.5 flex items-center justify-between text-[11px] text-[#858496]">
                        <span>{formatDate(t.createdAt)}</span>
                        <span className="capitalize">{t.reason.replace('_', ' ')}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
