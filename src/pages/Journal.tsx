import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import TarotClock from '../components/TarotClock';
import UserProfilePopover from '../components/UserProfilePopover';
import TiptapEditor from '../components/TiptapEditor';
import placeholderAvatar from '../placeholder_avatar.png';
import dailyPlaceholders from '../data/placeholder/daily.json';
import monthlyPlaceholders from '../data/placeholder/monthly.json';
import yearlyPlaceholders from '../data/placeholder/yearly.json';
import { JournalProvider } from '../lib/journal-context';

type DailyPlaceholder = { date: string; entry: string };
type MonthlyPlaceholder = { month: string; entry: string };
type YearlyPlaceholder = { year: string; entry: string };

const toParagraphHtml = (text: string) => {
  const escape = (value: string) =>
    value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

  const paragraphs = text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => `<p>${escape(line)}</p>`)
    .join('');

  return paragraphs || '<p></p>';
};

const parseDate = (isoDate: string) => {
  const [yearStr, monthStr, dayStr] = isoDate.split('-');
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);
  if (Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day)) {
    return null;
  }
  // Use local-time construction to avoid UTC offset shifting the date
  return new Date(year, month - 1, day);
};

const parseMonth = (isoMonth: string) => {
  const [yearStr, monthStr] = isoMonth.split('-');
  const year = Number(yearStr);
  const month = Number(monthStr);
  if (Number.isNaN(year) || Number.isNaN(month)) {
    return null;
  }
  return { year, month };
};

// Helper to get days in a month
const getDaysInMonth = (year: number, month: number) => {
  return new Date(year, month + 1, 0).getDate();
};

// Helper to format date key
const formatDateKey = (year: number, month: number, day: number) => {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
};

// Helper to get month name
const getMonthName = (month: number) => {
  return new Date(2000, month, 1).toLocaleString('default', { month: 'long' });
};

type DayEntry = {
  year: number;
  month: number;
  day: number;
  dateKey: string;
  isFirstOfMonth: boolean;
};

export default function Journal() {
  const [expandedColumn, setExpandedColumn] = useState<'left' | 'middle' | 'right'>('right');
  const [currentYear] = useState(new Date().getFullYear());
  const [currentMonth] = useState(new Date().toLocaleString('default', { month: 'short' }));
  const [currentMonthIndex] = useState(new Date().getMonth());
  const [currentDay] = useState(new Date().getDate());
  const [yearProgress] = useState((currentMonthIndex / 11) * 100);
  const [monthProgress] = useState((currentDay / new Date(currentYear, currentMonthIndex + 1, 0).getDate()) * 100);
  const [dayProgress, setDayProgress] = useState(() => {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const totalMinutes = hours * 60 + minutes;
    return (totalMinutes / (24 * 60)) * 100;
  });
  const [isSignedIn, setIsSignedIn] = useState(false);

  useEffect(() => {
    const updateDayProgress = () => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      const totalMinutes = hours * 60 + minutes;
      setDayProgress((totalMinutes / (24 * 60)) * 100);
    };

    const interval = setInterval(updateDayProgress, 60000);
    return () => clearInterval(interval);
  }, []);

  const [yearNotes, setYearNotes] = useState<Record<number, string>>(() => {
    const map: Record<number, string> = {};
    (yearlyPlaceholders as YearlyPlaceholder[]).forEach(({ year, entry }) => {
      const yearNumber = Number(year);
      if (!Number.isNaN(yearNumber)) {
        map[yearNumber] = toParagraphHtml(entry);
      }
    });
    return map;
  });

  const [monthNotes, setMonthNotes] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    (monthlyPlaceholders as MonthlyPlaceholder[]).forEach(({ month, entry }) => {
      const parsed = parseMonth(month);
      if (parsed && parsed.year === currentYear) {
        const monthName = new Date(parsed.year, parsed.month - 1, 1).toLocaleString('default', { month: 'long' });
        map[monthName] = toParagraphHtml(entry);
      }
    });
    return map;
  });

  const [dayNotes, setDayNotes] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    (dailyPlaceholders as DailyPlaceholder[]).forEach(({ date, entry }) => {
      const parsed = parseDate(date);
      if (parsed) {
        const dateKey = formatDateKey(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
        map[dateKey] = toParagraphHtml(entry);
      }
    });
    return map;
  });

  // Track how many months back we've loaded (0 = current month only)
  const [loadedMonthsCount, setLoadedMonthsCount] = useState(1);
  const loadMoreSentinelRef = useRef<HTMLDivElement>(null);
  const dayScrollContainerRef = useRef<HTMLDivElement>(null);
  
  // Track scroll position for scroll-to-top button
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  
  // Track currently visible month and day for the column indicators
  const [visibleMonthIndex, setVisibleMonthIndex] = useState(currentMonthIndex);
  const [visibleMonthYear, setVisibleMonthYear] = useState(currentYear);
  const [visibleDay, setVisibleDay] = useState(currentDay);

  // Generate visible days based on loaded months
  const visibleDays = useCallback((): DayEntry[] => {
    const days: DayEntry[] = [];
    let year = currentYear;
    let month = currentMonthIndex;
    
    for (let m = 0; m < loadedMonthsCount; m++) {
      const daysInThisMonth = m === 0 ? currentDay : getDaysInMonth(year, month);
      
      for (let d = daysInThisMonth; d >= 1; d--) {
        days.push({
          year,
          month,
          day: d,
          dateKey: formatDateKey(year, month, d),
          isFirstOfMonth: d === daysInThisMonth && m > 0,
        });
      }
      
      // Move to previous month
      month--;
      if (month < 0) {
        month = 11;
        year--;
      }
    }
    
    return days;
  }, [currentYear, currentMonthIndex, currentDay, loadedMonthsCount]);

  // Intersection observer for infinite scroll
  useEffect(() => {
    const sentinel = loadMoreSentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          // Load one more month (limit to 12 months back for now)
          setLoadedMonthsCount(prev => Math.min(prev + 1, 12));
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [expandedColumn]);

  // Track scroll position for scroll-to-top button and visible month
  useEffect(() => {
    const container = dayScrollContainerRef.current;
    if (!container || expandedColumn !== 'right') return;

    const handleScroll = () => {
      // Show scroll-to-top button after scrolling down 500px
      setShowScrollToTop(container.scrollTop > 500);
      
      // Find the currently visible day entry by checking which element is near the top
      const dayEntries = container.querySelectorAll('[data-day-entry]');
      for (const entry of dayEntries) {
        const rect = entry.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        // Check if this entry is near the top of the visible area
        if (rect.top <= containerRect.top + 100 && rect.bottom > containerRect.top) {
          const month = parseInt(entry.getAttribute('data-month') || '0', 10);
          const year = parseInt(entry.getAttribute('data-year') || '0', 10);
          const day = parseInt(entry.getAttribute('data-day') || '0', 10);
          setVisibleMonthIndex(month);
          setVisibleMonthYear(year);
          setVisibleDay(day);
          break;
        }
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [expandedColumn]);

  const scrollToTop = () => {
    dayScrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getColumnFlex = (column: 'left' | 'middle' | 'right') => {
    return column === expandedColumn ? 10 : 1;
  };

  const years = Array.from({ length: 10 }, (_, i) => currentYear - i);

  const handleYearNoteChange = (year: number, value: string) => {
    setYearNotes(prev => ({ ...prev, [year]: value }));
  };

  const handleMonthNoteChange = (month: string, value: string) => {
    setMonthNotes(prev => ({ ...prev, [month]: value }));
  };

  const handleDayNoteChange = (dateKey: string, value: string) => {
    setDayNotes(prev => ({ ...prev, [dateKey]: value }));
  };

  const currentMonthName = new Date(currentYear, currentMonthIndex, 1).toLocaleString('default', { month: 'long' });

  const journalContextValue = {
    yearNotes,
    monthNotes,
    dayNotes,
    currentYear,
    currentMonth: currentMonthName,
    currentMonthIndex,
    currentDay,
  };

  return (
    <JournalProvider value={journalContextValue}>
    <div className="min-h-screen w-screen bg-linear-to-br from-tarot-darker to-tarot-dark font-tarot">
      <div className="flex h-screen">
        {/* Columns container - Year, Month, Day */}
        <div className="flex flex-1 h-full">
          {/* Left sidebar - Year View */}
          <motion.div 
            onClick={() => setExpandedColumn('left')}
            className="bg-tarot-dark border-r border-tarot-gold/30 cursor-pointer overflow-hidden shadow-tarot"
            animate={{ flex: getColumnFlex('left') }}
            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
          >
            <div className="h-full bg-linear-to-b from-tarot-darker to-tarot-dark">
              {expandedColumn === 'left' ? (
                <div className="h-full overflow-y-auto scrollbar-hide">
                  {years.map(year => (
                    <div 
                      key={year}
                      className="bg-tarot-dark/50 border-b border-tarot-gold/20 min-h-[60vh] flex flex-col relative transition-colors duration-200"
                    >
                      <div className="sticky top-0 z-10 px-4 py-3 border-b border-tarot-gold/30 bg-tarot-dark/80 backdrop-blur-sm shadow-tarot">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-semibold text-tarot-gold-light tracking-wide">{year}</h3>
                        </div>
                      </div>
                      <div className="grow">
                        <TiptapEditor
                          content={yearNotes[year] || ''}
                          onChange={(value) => handleYearNoteChange(year, value)}
                          placeholder="how was your day"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center">
                  <div className="pt-4 flex flex-col items-center gap-2">
                    <span className="text-tarot-gold-light font-semibold text-lg tracking-wider">
                      {String(currentYear).slice(-2)}
                    </span>
                    <div className="relative h-[80vh] w-1 bg-tarot-gold/20 rounded-full overflow-hidden">
                      <div 
                        className="bg-linear-to-b from-tarot-gold to-tarot-gold-dark w-full transition-all duration-300"
                        style={{ height: `${yearProgress}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* Main content - Month View */}
          <motion.div 
            onClick={() => setExpandedColumn('middle')}
            className="bg-tarot-dark border-r border-tarot-gold/30 cursor-pointer overflow-hidden shadow-tarot"
            animate={{ flex: getColumnFlex('middle') }}
            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
          >
            <div className="h-full bg-linear-to-b from-tarot-darker to-tarot-dark">
              {expandedColumn === 'middle' ? (
                <div className="h-full overflow-y-auto scrollbar-hide">
                  {[
                    'January', 'February', 'March', 'April', 'May', 'June',
                    'July', 'August', 'September', 'October', 'November', 'December'
                  ].slice(0, currentMonthIndex + 1).reverse().map((month) => (
                    <div 
                      key={month}
                      className="bg-tarot-dark/50 border-b border-tarot-gold/20 min-h-[60vh] flex flex-col relative transition-colors duration-200"
                    >
                      <div className="sticky top-0 z-10 px-4 py-3 border-b border-tarot-gold/30 bg-tarot-dark/80 backdrop-blur-sm shadow-tarot">
                        <h3 className="text-lg font-semibold text-tarot-gold-light tracking-wide">{month}</h3>
                      </div>
                      <div className="grow">
                        <TiptapEditor
                          content={monthNotes[month] || ''}
                          onChange={(value) => handleMonthNoteChange(month, value)}
                          placeholder="how was your day"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center">
                  <div className="pt-4 flex flex-col items-center gap-2">
                    <span className="text-tarot-gold-light font-semibold text-lg tracking-wider">
                      {expandedColumn === 'right' 
                        ? new Date(visibleMonthYear, visibleMonthIndex, 1).toLocaleString('default', { month: 'short' })
                        : currentMonth
                      }
                    </span>
                    <div className="relative h-[80vh] w-1 bg-tarot-gold/20 rounded-full overflow-hidden">
                      <div 
                        className="bg-linear-to-b from-tarot-gold to-tarot-gold-dark w-full transition-all duration-300"
                        style={{ 
                          height: expandedColumn === 'right'
                            ? `${(visibleMonthIndex === currentMonthIndex && visibleMonthYear === currentYear) ? monthProgress : 100}%`
                            : `${monthProgress}%`
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* Right column - Day View */}
          <motion.div 
            onClick={() => setExpandedColumn('right')}
            className="bg-tarot-dark border-r border-tarot-gold/30 cursor-pointer overflow-hidden shadow-tarot"
            animate={{ flex: getColumnFlex('right') }}
            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
          >
            <div className="h-full bg-linear-to-b from-tarot-darker to-tarot-dark">
              {expandedColumn === 'right' ? (
                <div ref={dayScrollContainerRef} className="h-full overflow-y-auto scrollbar-hide relative">
                  {visibleDays().map((entry) => (
                    <div 
                      key={entry.dateKey}
                      data-day-entry
                      data-month={entry.month}
                      data-year={entry.year}
                      data-day={entry.day}
                      className="bg-tarot-dark/50 border-b border-tarot-gold/20 min-h-[60vh] flex flex-col relative transition-colors duration-200"
                    >
                      <div className="sticky top-0 z-10 px-4 py-3 border-b border-tarot-gold/30 bg-tarot-dark/80 backdrop-blur-sm shadow-tarot">
                        <h3 className="text-lg font-semibold text-tarot-gold-light tracking-wide">
                          {entry.isFirstOfMonth && (
                            <span className="text-tarot-gold/60 mr-2">{getMonthName(entry.month)}</span>
                          )}
                          {entry.day}
                        </h3>
                      </div>
                      <div className="grow">
                        <TiptapEditor
                          content={dayNotes[entry.dateKey] || ''}
                          onChange={(value) => handleDayNoteChange(entry.dateKey, value)}
                          placeholder="how was your day"
                        />
                      </div>
                    </div>
                  ))}
                  {/* Sentinel for infinite scroll */}
                  <div 
                    ref={loadMoreSentinelRef} 
                    className="h-20 flex items-center justify-center text-tarot-gold/30 text-sm"
                  >
                    {loadedMonthsCount < 12 ? 'Scroll for more...' : ''}
                  </div>
                  
                  {/* Scroll to top button */}
                  <AnimatePresence>
                    {showScrollToTop && (
                      <motion.button
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          scrollToTop();
                        }}
                        className="fixed bottom-6 right-28 w-10 h-10 rounded-full bg-tarot-gold/20 border border-tarot-gold/50 flex items-center justify-center cursor-pointer hover:bg-tarot-gold/30 shadow-lg backdrop-blur-sm z-20"
                        aria-label="Scroll to top"
                      >
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
                          className="text-tarot-gold-light"
                        >
                          <path d="m18 15-6-6-6 6"/>
                        </svg>
                      </motion.button>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center">
                  <div className="pt-4 flex flex-col items-center gap-2">
                    <span className="text-tarot-gold-light font-semibold text-lg tracking-wider">
                      {visibleDay}
                    </span>
                    <div className="relative h-[80vh] w-1 bg-tarot-gold/20 rounded-full overflow-hidden">
                      <div 
                        className="bg-linear-to-b from-tarot-gold to-tarot-gold-dark w-full transition-all duration-300"
                        style={{ 
                          height: visibleMonthIndex === currentMonthIndex && visibleMonthYear === currentYear && visibleDay === currentDay
                            ? `${dayProgress}%` 
                            : '100%'
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Sidebar with Clock */}
        <div className="w-20 bg-tarot-dark border-l border-tarot-gold/30 flex flex-col items-center justify-between pt-4 pb-4">
          <TarotClock />
          <div className="flex flex-col items-center gap-3">
            <UserProfilePopover isSignedIn={isSignedIn} onSignInChange={setIsSignedIn}>
              <button className="w-12 h-12 rounded-full bg-tarot-gold/20 border-2 border-tarot-gold/30 flex items-center justify-center cursor-pointer hover:bg-tarot-gold/30 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-tarot-gold/50 overflow-hidden">
                {isSignedIn ? (
                  <div className="text-tarot-gold-light text-lg font-semibold">U</div>
                ) : (
                  <img 
                    src={placeholderAvatar} 
                    alt="Anonymous avatar" 
                    className="w-full h-full object-cover"
                  />
                )}
              </button>
            </UserProfilePopover>
          </div>
        </div>
      </div>
    </div>
    </JournalProvider>
  );
}

