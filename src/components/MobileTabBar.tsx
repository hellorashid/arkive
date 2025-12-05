import { motion } from 'framer-motion';

type Tab = 'year' | 'month' | 'day';

interface MobileTabBarProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  currentYear: number;
  currentMonth: string;
  currentDay: number;
}

export default function MobileTabBar({ 
  activeTab, 
  onTabChange, 
  currentYear, 
  currentMonth, 
  currentDay 
}: MobileTabBarProps) {
  const tabs: { id: Tab; label: string }[] = [
    { id: 'year', label: `'${String(currentYear).slice(-2)}` },
    { id: 'month', label: currentMonth },
    { id: 'day', label: String(currentDay).padStart(2, '0') },
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
            <span 
              className={`text-base font-tarot font-semibold relative z-10 transition-colors duration-200 tracking-wide ${
                isActive ? 'text-tarot-gold-light' : 'text-tarot-gold/50'
              }`}
            >
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
