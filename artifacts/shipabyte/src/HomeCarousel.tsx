import { useState, useEffect, useRef } from 'react';
import { ArrowUpRight, ChevronLeft, ChevronRight } from 'lucide-react';

export default function HomeCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const touchDeltaX = useRef<number>(0);

  // Auto-slide every 4.5 seconds when not paused
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev === 0 ? 1 : 0));
    }, 4500);
    return () => clearInterval(interval);
  }, [isPaused]);

  function handleTouchStart(e: React.TouchEvent) {
    setIsPaused(true);
    touchStartX.current = e.touches[0].clientX;
    touchDeltaX.current = 0;
  }

  function handleTouchMove(e: React.TouchEvent) {
    if (touchStartX.current !== null) {
      touchDeltaX.current = e.touches[0].clientX - touchStartX.current;
    }
  }

  function handleTouchEnd() {
    if (Math.abs(touchDeltaX.current) > 35) {
      if (touchDeltaX.current < 0) {
        // Swiped left -> next slide
        setActiveIndex(1);
      } else {
        // Swiped right -> prev slide
        setActiveIndex(0);
      }
    }
    touchStartX.current = null;
    touchDeltaX.current = 0;
    // Resume auto-slide after a short delay
    setTimeout(() => setIsPaused(false), 2000);
  }

  return (
    <div className="w-full px-4 mt-2.5 mb-2">
      <div
        className="group relative h-[215px] w-full overflow-hidden rounded-2xl border border-white/10 bg-[#0e101f] shadow-lg"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Slides Track */}
        <div
          className="flex h-full w-full transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${activeIndex * 100}%)` }}
        >
          {/* Slide 1: Shipaton Award (Live on Stage Trophy Moments) */}
          <div className="relative h-full w-full shrink-0 select-none overflow-hidden bg-[#10111e]">
            <a
              href="https://www.shipaton.com"
              target="_blank"
              rel="noopener noreferrer"
              className="relative block h-full w-full"
              title="Visit Shipaton 2026"
            >
              <img
                src={`${import.meta.env.BASE_URL}brand/shipatonaward.jpg`}
                alt="Shipaton Live on Stage - Trophy moments"
                className="h-full w-full object-cover object-center transition-transform duration-700 group-hover:scale-[1.02]"
                onError={(e) => {
                  // Fallback if brand path fails
                  (e.currentTarget as HTMLImageElement).src = `${import.meta.env.BASE_URL}shipatonaward.jpg`;
                }}
              />
              {/* Subtle top right badge */}
              <div className="absolute right-2.5 top-2.5 flex items-center gap-1 rounded-full border border-white/20 bg-black/60 px-2.5 py-0.5 text-[10px] font-semibold text-white/95 backdrop-blur-md transition-all hover:bg-black/80">
                <span>Shipaton 2026</span>
                <ArrowUpRight size={12} />
              </div>
            </a>
          </div>

          {/* Slide 2: Recreated Ship Kit Interactive Card */}
          <div className="relative flex h-full w-full shrink-0 select-none flex-col justify-between overflow-hidden bg-[#0d0e1d] p-4 text-left">
            {/* Constellation & Geometric Line Art Background */}
            <svg
              className="pointer-events-none absolute inset-0 h-full w-full opacity-35"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              {/* Curved orbit tracks */}
              <path
                d="M -30 200 C 60 70, 240 230, 420 90"
                stroke="#ff7300"
                strokeWidth="1.2"
                fill="none"
                opacity="0.4"
              />
              <path
                d="M 30 -30 C 130 110, 60 210, 390 230"
                stroke="#818cf8"
                strokeWidth="1"
                fill="none"
                opacity="0.3"
              />
              {/* Constellation stars */}
              <circle cx="18%" cy="25%" r="1.5" fill="#ffffff" opacity="0.8" />
              <circle cx="52%" cy="16%" r="1.2" fill="#ffffff" opacity="0.6" />
              <circle cx="86%" cy="22%" r="1.5" fill="#ffffff" opacity="0.7" />
              <circle cx="14%" cy="72%" r="1.5" fill="#f3c969" opacity="0.8" />
              <circle cx="72%" cy="60%" r="1.2" fill="#ffffff" opacity="0.6" />
              <circle cx="91%" cy="74%" r="1.5" fill="#ffffff" opacity="0.7" />
              <circle cx="38%" cy="52%" r="1" fill="#ffffff" opacity="0.5" />
            </svg>

            {/* Content Header */}
            <div className="relative z-10">
              <h3 className="font-display text-2xl font-black tracking-tight text-white">
                Ship Kit
              </h3>
              <p className="mt-1 text-[11px] sm:text-xs leading-snug font-normal text-[#eae8f4]">
                Unlock 28 sponsor perks automatically as you build, test, connect your store, and earn your first revenue.
              </p>
            </div>

            {/* Interactive Devpost Buttons */}
            <div className="relative z-10 flex flex-col gap-1.5 mt-2">
              <a
                href="https://revenuecat-shipaton-2026.devpost.com/"
                target="_blank"
                rel="noopener noreferrer"
                data-testid="button-devpost-register"
                className="flex items-center justify-center gap-1.5 rounded-xl bg-[#ff7300] py-2 px-3 text-xs font-bold text-black shadow-md transition-all hover:bg-[#ff851a] hover:shadow-orange-500/20 active:scale-[0.98]"
              >
                <span>Register on Devpost</span>
                <ArrowUpRight size={14} className="stroke-[2.5]" />
              </a>

              <a
                href="https://revenuecat-shipaton-2026.devpost.com/resources#ship-kit"
                target="_blank"
                rel="noopener noreferrer"
                data-testid="button-devpost-view"
                className="flex items-center justify-center gap-1.5 rounded-xl bg-[#fffbf2] py-2 px-3 text-xs font-bold text-[#15162a] shadow transition-all hover:bg-white active:scale-[0.98]"
              >
                <span>View on Devpost</span>
                <ArrowUpRight size={14} className="stroke-[2.5]" />
              </a>
            </div>
          </div>
        </div>

        {/* Previous / Next Arrow Controls (Visible on hover on desktop, easy tap on mobile) */}
        <button
          type="button"
          onClick={() => setActiveIndex((prev) => (prev === 0 ? 1 : 0))}
          aria-label="Previous slide"
          className="absolute left-1.5 top-1/2 -translate-y-1/2 z-20 grid h-7 w-7 place-items-center rounded-full bg-black/40 text-white/80 backdrop-blur-sm transition-all hover:bg-black/70 hover:text-white opacity-0 group-hover:opacity-100"
        >
          <ChevronLeft size={16} />
        </button>
        <button
          type="button"
          onClick={() => setActiveIndex((prev) => (prev === 0 ? 1 : 0))}
          aria-label="Next slide"
          className="absolute right-1.5 top-1/2 -translate-y-1/2 z-20 grid h-7 w-7 place-items-center rounded-full bg-black/40 text-white/80 backdrop-blur-sm transition-all hover:bg-black/70 hover:text-white opacity-0 group-hover:opacity-100"
        >
          <ChevronRight size={16} />
        </button>

        {/* Carousel Pill Dot Indicators */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 rounded-full bg-black/50 px-2 py-0.5 backdrop-blur-md border border-white/10">
          <button
            type="button"
            onClick={() => setActiveIndex(0)}
            aria-label="Slide 1: Shipaton Award Trophy Moments"
            className={`h-1.5 rounded-full transition-all duration-300 ${
              activeIndex === 0 ? 'w-5 bg-[#ff7300]' : 'w-1.5 bg-white/40 hover:bg-white/70'
            }`}
          />
          <button
            type="button"
            onClick={() => setActiveIndex(1)}
            aria-label="Slide 2: Ship Kit Devpost Perks"
            className={`h-1.5 rounded-full transition-all duration-300 ${
              activeIndex === 1 ? 'w-5 bg-[#ff7300]' : 'w-1.5 bg-white/40 hover:bg-white/70'
            }`}
          />
        </div>
      </div>
    </div>
  );
}
