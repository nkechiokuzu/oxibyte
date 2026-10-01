import { useState, useEffect, useRef } from 'react';
import { X, ScanLine, QrCode, Zap, Sparkles, Flashlight, MapPin, CheckCircle2, RefreshCw, AlertTriangle, ArrowRight } from 'lucide-react';

type ScanMode = 'ai_polymer' | 'bin_qr';

type ScannedResult = {
  mode: ScanMode;
  title: string;
  subtitle: string;
  polymer?: string;
  recyclability?: string;
  estimatedGrams?: number;
  projectedMb?: number;
  binLocation?: string;
  binCode?: string;
  verified: boolean;
};

const SAMPLE_SCANS: ScannedResult[] = [
  {
    mode: 'ai_polymer',
    title: '500ml Water Bottle',
    subtitle: 'Clear polyethylene terephthalate container with cap removed.',
    polymer: 'PET (Resin Code #1)',
    recyclability: '100% Highly Recyclable',
    estimatedGrams: 24,
    projectedMb: 24,
    verified: true,
  },
  {
    mode: 'ai_polymer',
    title: '1.5L Soft Drink Bottle',
    subtitle: 'Transparent carbonated beverage packaging, clean condition.',
    polymer: 'PET (Resin Code #1)',
    recyclability: '100% Highly Recyclable',
    estimatedGrams: 52,
    projectedMb: 52,
    verified: true,
  },
  {
    mode: 'ai_polymer',
    title: 'Detergent / Milk Jug',
    subtitle: 'Opaque high-density container, rinsed clean.',
    polymer: 'HDPE (Resin Code #2)',
    recyclability: '98% High Grade Recyclable',
    estimatedGrams: 75,
    projectedMb: 75,
    verified: true,
  },
  {
    mode: 'bin_qr',
    title: 'Oxibyte Smart Drop-off Bin',
    subtitle: 'Verified automated campus drop-off weighing station.',
    binLocation: 'University Campus Hub — Science Quad',
    binCode: 'OX-BIN-UNILAG-04',
    verified: true,
  },
  {
    mode: 'bin_qr',
    title: 'Oxibyte Vendor Partner Bin',
    subtitle: 'Physical scale terminal with live cloud data sync.',
    binLocation: 'Herbert Macaulay Way, Yaba, Lagos',
    binCode: 'OX-BIN-YABA-01',
    verified: true,
  },
];

export default function ScannerModal({
  onClose,
  onOpenDropoff,
}: {
  onClose: () => void;
  onOpenDropoff: () => void;
}) {
  const [mode, setMode] = useState<ScanMode>('ai_polymer');
  const [torchOn, setTorchOn] = useState(false);
  const [isScanning, setIsScanning] = useState(true);
  const [scanResult, setScanResult] = useState<ScannedResult | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Attempt real camera stream if available in browser
  useEffect(() => {
    let stream: MediaStream | null = null;
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ video: { facingMode: 'environment' } })
        .then((s) => {
          stream = s;
          if (videoRef.current) {
            videoRef.current.srcObject = s;
            videoRef.current.play().catch(() => {});
            setCameraActive(true);
          }
        })
        .catch(() => {
          // Camera permission denied or not supported (e.g. running in desktop or iframe)
          setCameraActive(false);
        });
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  function handleSimulateScan(sampleIndex?: number) {
    setIsScanning(false);
    let chosen: ScannedResult;
    if (typeof sampleIndex === 'number' && SAMPLE_SCANS[sampleIndex]) {
      chosen = SAMPLE_SCANS[sampleIndex];
    } else {
      const filtered = SAMPLE_SCANS.filter((s) => s.mode === mode);
      chosen = filtered[Math.floor(Math.random() * filtered.length)] || SAMPLE_SCANS[0];
    }
    setScanResult(chosen);
  }

  function handleReset() {
    setScanResult(null);
    setIsScanning(true);
  }

  return (
    <div className="safe-top safe-bottom absolute inset-0 z-50 flex flex-col bg-[#0d0d1a] text-white">
      {/* Top Bar */}
      <div className="flex items-center justify-between border-b border-white/10 bg-[#1a1a2e]/90 px-5 py-3.5 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button
            data-testid="button-close-scanner"
            onClick={onClose}
            className="rounded-lg p-2 text-[#cfced7] hover:bg-white/5"
            aria-label="Close scanner"
          >
            <X size={20} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-white">Oxibyte Vision™</span>
              <span className="rounded-full bg-gradient-to-r from-[#ff6b35] to-[#f3c969] px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-[#1a1a2e]">
                Premium
              </span>
            </div>
            <p className="text-[11px] text-[#858496]">AI Polymer Inspector & Smart Drop-off Hub</p>
          </div>
        </div>

        <button
          onClick={() => setTorchOn((v) => !v)}
          className={`grid h-9 w-9 place-items-center rounded-xl border transition-colors ${
            torchOn
              ? 'border-[#f3c969] bg-[#f3c969]/20 text-[#f3c969]'
              : 'border-white/10 bg-[#24243c] text-[#858496] hover:text-white'
          }`}
          aria-label="Toggle flash"
        >
          <Flashlight size={17} />
        </button>
      </div>

      {/* Mode Selector Tabs */}
      <div className="mx-auto flex max-w-md items-center gap-2 px-5 py-3">
        <button
          onClick={() => {
            setMode('ai_polymer');
            handleReset();
          }}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition-all ${
            mode === 'ai_polymer'
              ? 'bg-[#57cfc8] text-[#1a1a2e] shadow-lg shadow-[#57cfc8]/20'
              : 'border border-white/10 bg-[#1a1a2e] text-[#aaa9ba] hover:text-white'
          }`}
        >
          <Sparkles size={14} /> AI Plastic Scanner
        </button>
        <button
          onClick={() => {
            setMode('bin_qr');
            handleReset();
          }}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition-all ${
            mode === 'bin_qr'
              ? 'bg-[#57cfc8] text-[#1a1a2e] shadow-lg shadow-[#57cfc8]/20'
              : 'border border-white/10 bg-[#1a1a2e] text-[#aaa9ba] hover:text-white'
          }`}
        >
          <QrCode size={14} /> Smart Bin QR
        </button>
      </div>

      {/* Viewfinder Area */}
      <div className="relative flex flex-1 flex-col items-center justify-center overflow-hidden px-5">
        {/* Background Video or Simulated Camera Grid */}
        {cameraActive ? (
          <video
            ref={videoRef}
            playsInline
            muted
            className="absolute inset-0 h-full w-full object-cover opacity-70"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-b from-[#111124] via-[#16162e] to-[#0c0c17]">
            {/* Grid texture for futuristic viewfinder feel */}
            <div
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage:
                  'radial-gradient(circle at 1px 1px, #57cfc8 1px, transparent 0)',
                backgroundSize: '24px 24px',
              }}
            />
          </div>
        )}

        {/* Viewfinder Target Reticle */}
        <div className="relative z-10 aspect-square w-full max-w-[280px] rounded-3xl border-2 border-white/20 bg-black/30 p-4 shadow-2xl backdrop-blur-[2px]">
          {/* Corner Guides */}
          <div className="absolute -left-1 -top-1 h-6 w-6 rounded-tl-xl border-l-4 border-t-4 border-[#57cfc8]" />
          <div className="absolute -right-1 -top-1 h-6 w-6 rounded-tr-xl border-r-4 border-t-4 border-[#57cfc8]" />
          <div className="absolute -bottom-1 -left-1 h-6 w-6 rounded-bl-xl border-b-4 border-l-4 border-[#57cfc8]" />
          <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-br-xl border-b-4 border-r-4 border-[#57cfc8]" />

          {/* Laser scanning beam line */}
          {isScanning && (
            <div
              className="absolute left-3 right-3 h-0.5 bg-gradient-to-r from-transparent via-[#57cfc8] to-transparent shadow-[0_0_12px_#57cfc8]"
              style={{
                animation: 'scanLaser 2.2s ease-in-out infinite alternate',
              }}
            />
          )}

          {/* Center Guide Graphics */}
          <div className="grid h-full w-full place-items-center">
            {mode === 'ai_polymer' ? (
              <div className="flex flex-col items-center gap-2 text-center">
                <ScanLine size={48} className="text-[#57cfc8]/70" />
                <span className="text-xs font-semibold text-[#cfced7]">
                  Align bottle or plastic container inside frame
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-center">
                <QrCode size={48} className="text-[#57cfc8]/70" />
                <span className="text-xs font-semibold text-[#cfced7]">
                  Point at Smart Bin or Collection Station QR
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Instruction badge */}
        <div className="relative z-10 mt-4 rounded-full border border-white/10 bg-[#1a1a2e]/80 px-4 py-1.5 text-xs text-[#aaa9ba] backdrop-blur-md">
          {mode === 'ai_polymer'
            ? 'Detects resin type (#1-#7), grams & projects MB reward'
            : 'Pairs directly with drop-off scales for instant data credits'}
        </div>

        {/* Scan Result Card (When simulated or detected) */}
        {scanResult && (
          <div className="relative z-20 mx-auto mt-4 w-full max-w-md animate-in fade-in slide-in-from-bottom-4 rounded-3xl border border-[#57cfc8]/40 bg-[#24243c] p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#57cfc8]/20 text-[#57cfc8]">
                  <CheckCircle2 size={20} />
                </span>
                <div>
                  <h3 className="font-display text-base font-bold text-white">{scanResult.title}</h3>
                  <p className="text-xs text-[#aaa9ba]">{scanResult.subtitle}</p>
                </div>
              </div>

              {scanResult.projectedMb && (
                <div className="rounded-2xl bg-[#57cfc8]/20 px-3 py-1.5 text-right">
                  <div className="text-[10px] font-bold uppercase text-[#57cfc8]">Projected Reward</div>
                  <div className="font-display text-lg font-black text-[#57cfc8]">
                    +{scanResult.projectedMb} MB
                  </div>
                </div>
              )}
            </div>

            {scanResult.polymer && (
              <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-xl bg-[#1a1a2e] p-2.5">
                  <span className="block text-[10px] text-[#858496]">Polymer Grade</span>
                  <span className="font-bold text-white">{scanResult.polymer}</span>
                </div>
                <div className="rounded-xl bg-[#1a1a2e] p-2.5">
                  <span className="block text-[10px] text-[#858496]">Recyclability</span>
                  <span className="font-bold text-[#57cfc8]">{scanResult.recyclability}</span>
                </div>
                <div className="rounded-xl bg-[#1a1a2e] p-2.5">
                  <span className="block text-[10px] text-[#858496]">Estimated Weight</span>
                  <span className="font-bold text-white">~{scanResult.estimatedGrams}g</span>
                </div>
                <div className="rounded-xl bg-[#1a1a2e] p-2.5">
                  <span className="block text-[10px] text-[#858496]">Exchange Rate</span>
                  <span className="font-bold text-white">1g = 1MB Data</span>
                </div>
              </div>
            )}

            {scanResult.binCode && (
              <div className="mt-3 rounded-xl bg-[#1a1a2e] p-3 text-xs">
                <div className="flex items-center gap-1.5 text-[#57cfc8]">
                  <MapPin size={14} />
                  <span className="font-bold">{scanResult.binLocation}</span>
                </div>
                <div className="mt-1 text-[11px] text-[#858496]">
                  Hub ID: <span className="font-mono text-white">{scanResult.binCode}</span> · Ready for deposit
                </div>
              </div>
            )}

            <div className="mt-4 flex gap-2">
              <button
                onClick={handleReset}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-[#1a1a2e] px-4 py-2.5 text-xs font-bold text-[#aaa9ba] hover:text-white"
              >
                <RefreshCw size={14} /> Scan Again
              </button>
              <button
                onClick={() => {
                  onClose();
                  onOpenDropoff();
                }}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#ff6b35] py-2.5 text-xs font-bold text-[#1a1a2e] hover:brightness-110"
              >
                Drop Off Plastic <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Action Controls */}
      <div className="border-t border-white/10 bg-[#1a1a2e]/95 px-5 py-4 backdrop-blur-md">
        <div className="mx-auto flex max-w-md items-center justify-between gap-3">
          <button
            onClick={() => handleSimulateScan()}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#57cfc8] to-[#43b6af] py-3.5 text-sm font-bold text-[#1a1a2e] shadow-lg shadow-[#57cfc8]/20 transition-transform active:scale-[0.98]"
          >
            <Sparkles size={17} />
            {mode === 'ai_polymer' ? 'Scan Plastic Bottle' : 'Scan Smart Bin QR'}
          </button>
        </div>

        {/* Quick Test Sample Picker */}
        <div className="mx-auto mt-3 flex max-w-md items-center justify-center gap-2">
          <span className="text-[11px] text-[#858496]">Test items:</span>
          <button
            onClick={() => handleSimulateScan(0)}
            className="rounded-lg bg-white/5 px-2 py-1 text-[11px] text-[#cfced7] hover:bg-white/10"
          >
            500ml Bottle (24g)
          </button>
          <button
            onClick={() => handleSimulateScan(1)}
            className="rounded-lg bg-white/5 px-2 py-1 text-[11px] text-[#cfced7] hover:bg-white/10"
          >
            1.5L Bottle (52g)
          </button>
          <button
            onClick={() => handleSimulateScan(3)}
            className="rounded-lg bg-white/5 px-2 py-1 text-[11px] text-[#cfced7] hover:bg-white/10"
          >
            Smart Bin QR
          </button>
        </div>
      </div>

      {/* Laser Animation Styles */}
      <style>{`
        @keyframes scanLaser {
          0% { top: 12px; }
          100% { top: calc(100% - 14px); }
        }
      `}</style>
    </div>
  );
}
