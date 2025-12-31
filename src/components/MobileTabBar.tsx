import { motion } from 'framer-motion';

type Tab = 'year' | 'month' | 'day' | 'home';

interface MobileTabBarProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  currentYear: number;
  currentMonth: string;
  currentDay: number;
}

// Home icon component
const HomeIcon = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="20" 
    height="20" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    className={className}
  >
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
    <polyline points="9 22 9 12 15 12 15 22"></polyline>
  </svg>
);

export default function MobileTabBar({ 
  activeTab, 
  onTabChange, 
  currentYear, 
  currentMonth, 
  currentDay 
}: MobileTabBarProps) {
  const tabs: { id: Tab; label: string; isIcon?: boolean }[] = [
    { id: 'year', label: `'${String(currentYear).slice(-2)}` },
    { id: 'month', label: currentMonth },
    { id: 'day', label: String(currentDay).padStart(2, '0') },
    { id: 'home', label: 'Home', isIcon: true },
  ];

  return (
    <nav className="h-14 bg-tarot-dark border-t border-tarot-gold/30 flex items-center justify-around px-4 pb-safe">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className="py-2 px-6 relative"
          >
            {isActive && (
              <motion.div
                layoutId="activeTab"
                className="absolute inset-0 bg-tarot-gold/10 rounded-lg"
                transition={{ duration: 0.2, ease: 'easeOut' }}
              />
            )}
            {tab.isIcon ? (
              <HomeIcon 
                className={`relative z-10 transition-colors duration-200 ${
                  isActive ? 'text-tarot-gold-light' : 'text-tarot-gold/50'
                }`}
              />
            ) : (
              <span 
                className={`text-base font-tarot font-semibold relative z-10 transition-colors duration-200 tracking-wide ${
                  isActive ? 'text-tarot-gold-light' : 'text-tarot-gold/50'
                }`}
              >
                {tab.label}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}
