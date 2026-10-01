import { useState, useMemo, useEffect } from 'react';
import {
  ArrowLeft,
  ArrowUpRight,
  Plus,
  Github,
  Video,
  Heart,
  TrendingUp,
  Search,
} from 'lucide-react';
import ShipsCanvas from './components/ShipsCanvas';

export type ShipApp = {
  id: string;
  name: string;
  tagline: string;
  university: string;
  github: string;
  video: string;
  raised: number;
  accent: string;
  category: string;
};

const FEATURED_APPS: ShipApp[] = [
  {
    id: 'feat-1',
    name: 'LoopNote',
    tagline: 'Audio-first collaborative study notes powered by recycled data credits.',
    university: 'University of Michigan',
    github: 'github.com/loopnote/app',
    video: 'youtube.com/watch?v=loopnote-demo',
    raised: 350,
    accent: '#57cfc8',
    category: 'Productivity',
  },
  {
    id: 'feat-2',
    name: 'EcoScale IoT',
    tagline: 'Hardware smart scale that authenticates plastic polymer grades in dorms.',
    university: 'Georgia Tech',
    github: 'github.com/ecoscale/iot-firmware',
    video: 'youtube.com/watch?v=ecoscale-demo',
    raised: 520,
    accent: '#ff6b35',
    category: 'Climate',
  },
  {
    id: 'feat-3',
    name: 'CampusByte Mesh',
    tagline: 'Local Wi-Fi tethering network shared across student dorm quads.',
    university: 'University of Waterloo',
    github: 'github.com/campusbyte/mesh-router',
    video: 'youtube.com/watch?v=campusbyte-demo',
    raised: 280,
    accent: '#c39bf4',
    category: 'Access',
  },
];

export default function ShipsScreen({
  userApps = [],
  onOpenSubmit,
  onClose,
  onOpenDeposit,
}: {
  userApps: ShipApp[];
  onOpenSubmit: () => void;
  onClose: () => void;
  onOpenDeposit?: () => void;
}) {
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Persisted cheers dictionary
  const [cheers, setCheers] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem('oxibyte_ships_cheers');
      return saved
        ? JSON.parse(saved)
        : {
            'feat-1': 48,
            'feat-2': 73,
            'feat-3': 39,
          };
    } catch {
      return {
        'feat-1': 48,
        'feat-2': 73,
        'feat-3': 39,
      };
    }
  });

  useEffect(() => {
    localStorage.setItem('oxibyte_ships_cheers', JSON.stringify(cheers));
  }, [cheers]);

  // Deduplicate builds by name so user submissions don't duplicate hardcoded builds (like LoopNote)
  const allProjects = useMemo(() => {
    const userNames = new Set(userApps.map((a) => a.name.trim().toLowerCase()));
    const uniqueFeatured = FEATURED_APPS.filter((f) => !userNames.has(f.name.trim().toLowerCase()));
    return [...userApps, ...uniqueFeatured];
  }, [userApps]);

  const filteredProjects = allProjects.filter((app) => {
    const matchesCategory = activeCategory === 'All' || app.category === activeCategory;
    const matchesSearch =
      !searchQuery.trim() ||
      app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.university.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.tagline.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  function getProjectCheerCount(project: ShipApp) {
    if (cheers[project.id] !== undefined) return cheers[project.id];
    // Realistic deterministic baseline for newly submitted apps
    const hash = Math.abs(
      project.name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    );
    return (hash % 30) + 16;
  }

  function handleCheer(id: string) {
    setCheers((prev) => {
      const project = allProjects.find((p) => p.id === id);
      const current = prev[id] ?? (project ? getProjectCheerCount(project) : 12);
      return {
        ...prev,
        [id]: current + 1,
      };
    });
  }

  return (
    <div className="safe-top safe-bottom absolute inset-0 z-50 flex flex-col bg-[#11111f] text-[#f4f0e8]">
      {/* Header: Clean minimal top bar with simple text "ENTER SHIPATON 2027" */}
      <div className="border-b border-white/10 bg-[#16162a]/95 px-4 py-3 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <button
            data-testid="button-close-ships"
            onClick={onClose}
            className="rounded-xl p-2 text-[#cfced7] transition-colors hover:bg-white/5 active:scale-95"
            aria-label="Back"
          >
            <ArrowLeft size={18} />
          </button>

          <a
            href="https://shipaton.com"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-1.5 text-xs font-black tracking-widest text-[#ff6b35] transition-all hover:text-[#ff8252] active:scale-95 uppercase"
            title="Enter Shipaton 2027"
          >
            <span>ENTER SHIPATON 2027</span>
            <ArrowUpRight
              size={13}
              className="text-[#ff6b35] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            />
          </a>

          <div className="w-8" aria-hidden="true" />
        </div>
      </div>

      {/* Main Scrollable Content */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {/* Canvas Workspace sits below it */}
        <ShipsCanvas onOpenSubmit={onOpenSubmit} onOpenDeposit={onOpenDeposit} />

        {/* Search & Categories */}
        <div className="mt-4">
          <div className="relative">
            <Search className="absolute left-3.5 top-3 text-[#858496]" size={15} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search builds by name, campus, or tech..."
              className="w-full rounded-2xl border border-white/10 bg-[#24243c] py-2.5 pl-10 pr-4 text-xs text-white placeholder:text-[#858496] focus:border-[#57cfc8] focus:outline-none"
            />
          </div>

          {/* Filter Chips without stray grey scrollbar */}
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1 text-xs [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {['All', 'Climate', 'Community', 'Productivity', 'Access', 'Rewards'].map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors ${
                  activeCategory === cat
                    ? 'bg-[#57cfc8] text-[#1a1a2e]'
                    : 'border border-white/10 bg-[#1a1a2e] text-[#858496] hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Builds Showcase List */}
        <div className="mt-4 space-y-3.5 pb-8">
          <div className="flex items-center justify-between text-xs font-semibold text-[#858496]">
            <span>Active Builds ({filteredProjects.length})</span>
            <span className="flex items-center gap-1 text-[#57cfc8]">
              <TrendingUp size={13} /> Trending now
            </span>
          </div>

          {filteredProjects.map((project) => {
            const cheerCount = cheerCountFor(project);

            return (
              <div
                key={project.id}
                data-testid={`card-ship-${project.id}`}
                className="rounded-3xl border border-white/10 bg-[#24243c] p-5 shadow-lg transition-all hover:border-white/20"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: project.accent || '#57cfc8' }}
                      />
                      <h3 className="font-display text-base font-bold text-white">{project.name}</h3>
                      <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-[#cfced7]">
                        {project.category}
                      </span>
                    </div>

                    <p className="mt-1.5 text-xs leading-relaxed text-[#aaa9ba]">
                      {project.tagline}
                    </p>
                  </div>

                  <button
                    onClick={() => handleCheer(project.id)}
                    className="flex shrink-0 items-center gap-1 rounded-full border border-[#ff6b35]/30 bg-[#ff6b35]/10 px-2.5 py-1 text-xs font-bold text-[#ff6b35] transition-transform active:scale-90"
                    title="Cheer for this build"
                  >
                    <Heart size={13} fill="#ff6b35" />
                    <span>{cheerCount}</span>
                  </button>
                </div>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-white/5 pt-3 text-xs">
                  <span className="rounded-lg bg-[#1a1a2e] px-2.5 py-1 text-[11px] font-semibold text-[#57cfc8]">
                    🎓 {project.university}
                  </span>

                  <div className="flex items-center gap-2">
                    {project.github && (
                      <a
                        href={`https://${project.github.replace(/^https?:\/\//, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-[11px] text-[#aaa9ba] hover:text-white"
                      >
                        <Github size={13} /> Code
                      </a>
                    )}
                    {project.video && (
                      <a
                        href={`https://${project.video.replace(/^https?:\/\//, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-[11px] text-[#57cfc8] hover:underline"
                      >
                        <Video size={13} /> Demo
                      </a>
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

  function cheerCountFor(project: ShipApp) {
    return cheers[project.id] ?? getProjectCheerCount(project);
  }
}
