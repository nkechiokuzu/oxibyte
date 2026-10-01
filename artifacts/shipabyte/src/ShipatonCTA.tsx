import { ArrowUpRight } from 'lucide-react';

export default function ShipatonCTA({ onSubmit }: { onSubmit: () => void }) {
  const SHIPATON_URL = 'https://www.shipaton.com';

  function handleOpenShipaton(e: React.MouseEvent) {
    e.preventDefault();
    window.open(SHIPATON_URL, '_blank', 'noopener,noreferrer');
  }

  return (
    <div className="w-full px-4 mt-2.5">
      <div className="flex items-center justify-between rounded-2xl border border-[#ff6b35]/30 bg-gradient-to-r from-[#202039] via-[#252542] to-[#1c1c34] p-3.5 shadow-md">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <img
            src={`${import.meta.env.BASE_URL}brand/shipaton-logo.svg`}
            alt="Shipaton"
            className="h-7 w-auto shrink-0"
          />
          <div className="min-w-0 flex-1">
            <h3 className="font-display text-xs font-bold text-white truncate">
              Enter your app into <span className="text-[#ff6b35]">Shipaton</span>
            </h3>
            <p className="text-[10px] text-[#aaa9ba] truncate">
              Fuel your build with recycled MBs
            </p>
          </div>
        </div>

        <a
          data-testid="button-shipaton-submit"
          href={SHIPATON_URL}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleOpenShipaton}
          className="ml-3 shrink-0 flex items-center gap-1 rounded-xl bg-[#ff6b35] px-3 py-2 text-xs font-bold text-[#1a1a2e] transition-transform hover:brightness-110 active:scale-95 shadow-sm"
        >
          <span>Enter app</span>
          <ArrowUpRight size={13} />
        </a>
      </div>
    </div>
  );
}
