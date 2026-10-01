import { Recycle, Share2 } from 'lucide-react';

export default function PromoCards({ onDeposit, onShare }: { onDeposit: () => void; onShare: () => void }) {
  return (
    <div className="w-full px-4 mt-2.5">
      <div className="grid grid-cols-2 gap-2.5">
        {/* Card 1: Deposit Plastics */}
        <div
          role="button"
          tabIndex={0}
          onClick={onDeposit}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onDeposit()}
          className="flex flex-col justify-between rounded-2xl border border-white/5 bg-[#24243c] p-3 text-left transition-colors hover:border-[#57cfc8]/40 hover:bg-[#282844] cursor-pointer shadow-md"
        >
          <div className="flex items-center justify-between">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-[#57cfc8]/15 text-[#57cfc8]">
              <Recycle size={17} />
            </span>
            <span className="rounded-full bg-[#57cfc8]/20 px-2 py-0.5 text-[9px] font-bold text-[#57cfc8]">
              1g = 1MB
            </span>
          </div>
          <div className="mt-2">
            <div className="font-display text-xs font-bold text-white">Deposit Plastic</div>
            <p className="mt-0.5 text-[10px] leading-tight text-[#aaa9ba]">
              Turn bottles into data
            </p>
          </div>
          <button
            data-testid="button-deposit-promo"
            onClick={(e) => {
              e.stopPropagation();
              onDeposit();
            }}
            className="mt-2.5 w-full rounded-xl bg-[#57cfc8] py-1.5 text-center text-[11px] font-bold text-[#1a1a2e] transition-transform hover:brightness-110 active:scale-95"
          >
            Deposit
          </button>
        </div>

        {/* Card 2: Share Oxibyte */}
        <div
          role="button"
          tabIndex={0}
          onClick={onShare}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onShare()}
          className="flex flex-col justify-between rounded-2xl border border-white/5 bg-[#24243c] p-3 text-left transition-colors hover:border-[#ff6b35]/40 hover:bg-[#282844] cursor-pointer shadow-md"
        >
          <div className="flex items-center justify-between">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-[#ff6b35]/15 text-[#ff6b35]">
              <Share2 size={17} />
            </span>
            <span className="rounded-full bg-[#ff6b35]/20 px-2 py-0.5 text-[9px] font-bold text-[#ff6b35]">
              +50MB
            </span>
          </div>
          <div className="mt-2">
            <div className="font-display text-xs font-bold text-white">Share Oxibyte</div>
            <p className="mt-0.5 text-[10px] leading-tight text-[#aaa9ba]">
              Invite classmates
            </p>
          </div>
          <button
            data-testid="button-share-promo"
            onClick={(e) => {
              e.stopPropagation();
              onShare();
            }}
            className="mt-2.5 w-full rounded-xl bg-[#ff6b35] py-1.5 text-center text-[11px] font-bold text-[#1a1a2e] transition-transform hover:brightness-110 active:scale-95"
          >
            Share
          </button>
        </div>
      </div>
    </div>
  );
}
