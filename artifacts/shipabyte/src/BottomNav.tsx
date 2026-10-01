import { Home, Rocket, MessageCircle, Users, CircleUserRound } from 'lucide-react';

const tabs = [
  { key: 'home', label: 'Home', icon: Home },
  { key: 'ships', label: 'Ships', icon: Rocket },
  { key: 'chats', label: 'Chats', icon: MessageCircle },
  { key: 'socials', label: 'Socials', icon: Users },
  { key: 'me', label: 'Me', icon: CircleUserRound },
] as const;

// Only "Home" and "Me" are real right now — Ships/Chats/Socials are
// placeholders for screens that don't exist yet, wired up so the nav is
// ready to become fully functional without a layout change later.
export default function BottomNav({ active = 'home', onSelect }: { active?: (typeof tabs)[number]['key']; onSelect?: (key: (typeof tabs)[number]['key']) => void }) {
  return (
    <nav className="safe-bottom w-full border-t border-white/10 bg-[#1a1a2e]/95 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[420px] items-center justify-between px-3 pt-2 pb-1">
        {tabs.map(({ key, label, icon: Icon }) => {
          const isActive = key === active;
          return (
            <button
              key={key}
              data-testid={`tab-${key}`}
              onClick={() => onSelect?.(key)}
              className={`flex flex-1 flex-col items-center gap-0.5 py-1 text-[11px] font-semibold transition-colors ${isActive ? 'text-[#57cfc8]' : 'text-[#858496] hover:text-[#cfced7]'}`}
            >
              <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              {label}
            </button>
          );
        })}
      </div>
      <div className="mx-auto my-1 h-1 w-28 rounded-full bg-white/20" />
    </nav>
  );
}
