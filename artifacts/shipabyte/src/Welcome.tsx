import { Zap, ArrowUpRight } from 'lucide-react';

export default function Welcome({ onGetStarted, onLogIn }: { onGetStarted: () => void; onLogIn: () => void }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center px-6 py-6 text-center my-auto">
      <div className="max-w-sm w-full my-auto">
        <div className="mx-auto mb-4 grid h-20 w-20 place-items-center rounded-3xl bg-[#141424] border border-[#57cfc8]/30 p-2 shadow-[0_0_30px_rgba(87,207,200,0.3)]">
          <img
            src={`${import.meta.env.BASE_URL}assets/Oxibyte_logo_1024x1024.svg`}
            alt="Oxibyte Logo"
            className="h-full w-full object-contain"
          />
        </div>
        <h1 className="mt-4 font-display text-3xl font-bold leading-tight text-white">
          Ship more.<br /><span className="text-[#ff6b35]">Waste less.</span>
        </h1>
        <p className="mt-3.5 leading-6 text-sm text-[#aaa9ba]">
          Deposit plastic, earn MB, and enter your app into Shipaton 2027.
        </p>
        <button
          data-testid="button-get-started"
          onClick={onGetStarted}
          className="mt-8 w-full rounded-2xl bg-[#ff6b35] py-3.5 font-bold text-[#1a1a2e] shadow-lg hover:-translate-y-0.5 transition-transform active:scale-98"
        >
          Get started <ArrowUpRight className="ml-1 inline" size={17} />
        </button>
        <button
          data-testid="button-go-to-login"
          onClick={onLogIn}
          className="mt-4 w-full text-center text-sm font-semibold text-[#858496] underline underline-offset-4 hover:text-white"
        >
          Already have an account? Log in
        </button>
      </div>
    </div>
  );
}
