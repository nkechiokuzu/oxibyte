import { useState, useEffect } from 'react';
import { Music, Play, Pause, AlertCircle, X, ExternalLink, Disc3, Radio } from 'lucide-react';

export type SpotifyState = 'disconnected' | 'connected_playing' | 'connected_idle' | 'auth_error';

export interface SpotifyTrack {
  title: string;
  artist: string;
  albumArt?: string;
  isPlaying: boolean;
}

const DEMO_TRACKS: SpotifyTrack[] = [
  {
    title: 'Midnight City',
    artist: 'M83',
    isPlaying: true,
  },
  {
    title: 'Starboy',
    artist: 'The Weeknd, Daft Punk',
    isPlaying: true,
  },
  {
    title: 'Resonance',
    artist: 'HOME',
    isPlaying: true,
  },
  {
    title: 'Synthwave Drift',
    artist: 'Kavinsky',
    isPlaying: true,
  },
];

export default function SpotifyPlugin() {
  const [state, setState] = useState<SpotifyState>(() => {
    try {
      return (localStorage.getItem('oxibyte_spotify_state') as SpotifyState) || 'disconnected';
    } catch {
      return 'disconnected';
    }
  });

  const [track, setTrack] = useState<SpotifyTrack>(() => {
    try {
      const saved = localStorage.getItem('oxibyte_spotify_track');
      return saved ? JSON.parse(saved) : DEMO_TRACKS[0];
    } catch {
      return DEMO_TRACKS[0];
    }
  });

  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    localStorage.setItem('oxibyte_spotify_state', state);
  }, [state]);

  useEffect(() => {
    localStorage.setItem('oxibyte_spotify_track', JSON.stringify(track));
  }, [track]);

  function handleConnectDemo(mode: 'playing' | 'idle' | 'error') {
    if (mode === 'playing') {
      const randomTrack = DEMO_TRACKS[Math.floor(Math.random() * DEMO_TRACKS.length)];
      setTrack({ ...randomTrack, isPlaying: true });
      setState('connected_playing');
    } else if (mode === 'idle') {
      setState('connected_idle');
    } else {
      setState('auth_error');
    }
    setShowModal(false);
  }

  function handleDisconnect() {
    setState('disconnected');
    setShowModal(false);
  }

  function togglePlayPause() {
    if (state === 'connected_playing') {
      setTrack((prev) => ({ ...prev, isPlaying: !prev.isPlaying }));
    }
  }

  return (
    <>
      {/* Spotify Audio Widget: Balanced width & responsive alignment */}
      <div className="relative z-10 w-full">
        {state === 'disconnected' && (
          <button
            type="button"
            data-testid="button-spotify-connect"
            onClick={() => setShowModal(true)}
            className="group flex w-full items-center justify-between gap-2.5 rounded-2xl border border-[#1DB954]/30 bg-[#1DB954]/10 px-3.5 py-2 text-xs font-semibold text-[#1DB954] transition-all hover:border-[#1DB954]/60 hover:bg-[#1DB954]/20 active:scale-[0.99]"
            title="Play your favourite work music on Spotify"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <SpotifyIcon className="h-4 w-4 shrink-0 text-[#1DB954]" />
              <span className="truncate text-xs font-medium text-[#1DB954]">
                Play your favourite work music on Spotify
              </span>
            </div>
            <span className="shrink-0 rounded-full bg-[#1DB954]/20 px-2 py-0.5 text-[10px] font-bold text-[#1DB954] group-hover:bg-[#1DB954] group-hover:text-[#121224] transition-colors">
              Plug in
            </span>
          </button>
        )}

        {state === 'connected_playing' && (
          <div
            className="flex w-full items-center justify-between gap-2.5 rounded-2xl border border-[#1DB954]/40 bg-[#121224]/90 px-3 py-2 text-xs shadow-sm backdrop-blur-md transition-all hover:border-[#1DB954]"
          >
            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2.5 text-left min-w-0 flex-1"
              title="Spotify settings"
            >
              <div className="relative grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-[#1DB954]/20 text-[#1DB954]">
                {track.isPlaying ? (
                  <div className="flex h-3.5 items-end gap-0.5" title="Playing">
                    <span className="w-0.5 animate-[equalizer_0.8s_ease-in-out_infinite] rounded-full bg-[#1DB954]" style={{ height: '60%' }} />
                    <span className="w-0.5 animate-[equalizer_1.1s_ease-in-out_infinite_0.2s] rounded-full bg-[#1DB954]" style={{ height: '100%' }} />
                    <span className="w-0.5 animate-[equalizer_0.9s_ease-in-out_infinite_0.4s] rounded-full bg-[#1DB954]" style={{ height: '40%' }} />
                  </div>
                ) : (
                  <Disc3 size={15} className="text-[#858496]" />
                )}
              </div>
              <div className="min-w-0 flex-1 truncate">
                <div className="truncate font-bold text-white text-xs">{track.title}</div>
                <div className="truncate text-[10px] text-[#858496]">{track.artist}</div>
              </div>
            </button>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={togglePlayPause}
                className="grid h-7 w-7 place-items-center rounded-full bg-[#1DB954] text-[#121224] hover:brightness-110 transition-colors shadow-md"
                title={track.isPlaying ? 'Pause' : 'Play'}
              >
                {track.isPlaying ? <Pause size={12} fill="currentColor" /> : <Play size={12} fill="currentColor" className="ml-0.5" />}
              </button>
            </div>
          </div>
        )}

        {state === 'connected_idle' && (
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="flex w-full items-center justify-between gap-2.5 rounded-2xl border border-white/10 bg-[#1a1a2e]/90 px-3.5 py-2 text-xs text-[#aaa9ba] hover:border-white/20 transition-colors"
            title="Spotify connected (nothing playing)"
          >
            <div className="flex items-center gap-2">
              <SpotifyIcon className="h-4 w-4 shrink-0 opacity-70" />
              <span className="truncate">Spotify Connected (Idle)</span>
            </div>
            <span className="text-[10px] text-[#57cfc8]">Choose song →</span>
          </button>
        )}

        {state === 'auth_error' && (
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="flex w-full items-center justify-between gap-2 rounded-2xl border border-[#ff938f]/40 bg-[#ff938f]/10 px-3.5 py-2 text-xs font-semibold text-[#ff938f] hover:bg-[#ff938f]/20 transition-colors"
            title="Spotify auth error. Tap to retry"
          >
            <div className="flex items-center gap-2">
              <AlertCircle size={14} className="shrink-0" />
              <span>Spotify Auth Error</span>
            </div>
            <span className="text-[10px] underline">Retry</span>
          </button>
        )}
      </div>

      {/* Spotify Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl border border-white/15 bg-[#121224] p-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <SpotifyIcon className="h-5 w-5 text-[#1DB954]" />
                <h3 className="font-display text-base font-bold text-white">Spotify Builder Audio</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="rounded-lg p-1 text-[#858496] hover:bg-white/10 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-4">
              <p className="text-xs leading-relaxed text-[#aaa9ba]">
                Play your favourite work music on Spotify. Soundtrack your build sessions with seamless Spotify audio controls directly in your workspace.
              </p>

              {/* Status display */}
              <div className="mt-3.5 rounded-2xl border border-white/10 bg-[#1a1a2e] p-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[#858496]">Connection status:</span>
                  <span className="font-bold text-white">
                    {state === 'disconnected' && 'Disconnected'}
                    {state === 'connected_playing' && 'Playing Live'}
                    {state === 'connected_idle' && 'Connected (Idle)'}
                    {state === 'auth_error' && 'Authentication Error'}
                  </span>
                </div>
                {state === 'connected_playing' && (
                  <div className="mt-2 border-t border-white/5 pt-2">
                    <div className="text-[#1DB954] font-semibold">{track.title}</div>
                    <div className="text-[#858496] text-[11px]">{track.artist}</div>
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="mt-4 space-y-2">
                {state === 'disconnected' || state === 'auth_error' ? (
                  <>
                    <button
                      type="button"
                      onClick={() => handleConnectDemo('playing')}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1DB954] py-2.5 text-xs font-bold text-[#121224] transition-transform hover:brightness-110 active:scale-95"
                    >
                      <SpotifyIcon className="h-4 w-4" />
                      Connect Spotify (Live Session)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleConnectDemo('idle')}
                      className="w-full rounded-xl border border-white/15 py-2 text-[11px] font-semibold text-[#aaa9ba] hover:bg-white/5 hover:text-white"
                    >
                      Test Idle State (No music playing)
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => handleConnectDemo('playing')}
                      className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-[#1DB954]/40 bg-[#1DB954]/10 py-2 text-xs font-bold text-[#1DB954] hover:bg-[#1DB954]/20"
                    >
                      <Radio size={13} /> Next Song in Queue
                    </button>
                    <button
                      type="button"
                      onClick={handleDisconnect}
                      className="w-full rounded-xl border border-[#ff938f]/30 py-2 text-xs font-semibold text-[#ff938f] hover:bg-[#ff938f]/10"
                    >
                      Disconnect Spotify
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function SpotifyIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.498 17.307c-.216.353-.674.466-1.026.25-2.812-1.718-6.352-2.107-10.521-1.155-.403.092-.806-.16-.898-.563-.092-.403.16-.806.563-.898 4.566-1.042 8.483-.6 11.632 1.34.352.216.465.673.25 1.026zm1.467-3.262c-.272.443-.852.583-1.295.31-3.218-1.978-8.125-2.55-11.932-1.394-.499.151-1.03-.133-1.181-.632-.152-.499.133-1.03.632-1.182 4.354-1.321 9.775-.68 13.466 1.589.443.272.583.852.31 1.295zm.126-3.41c-3.859-2.292-10.228-2.503-13.896-1.389-.592.18-1.218-.158-1.398-.75-.18-.592.158-1.218.75-1.398 4.218-1.281 11.246-1.039 15.688 1.597.533.316.708 1.009.392 1.542-.316.533-1.009.708-1.542.392z" />
    </svg>
  );
}
