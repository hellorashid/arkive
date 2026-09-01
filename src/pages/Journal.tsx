import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBasic } from '@basictech/react';
import { JSONContent } from '@tiptap/react';
import TarotClock from '../components/TarotClock';
import UserProfilePopover from '../components/UserProfilePopover';
import TiptapEditor from '../components/TiptapEditor';
import MobileTabBar from '../components/MobileTabBar';
import MobileDrawer from '../components/MobileDrawer';
import MobileHome from '../components/MobileHome';
import { useIsMobile } from '../hooks/useIsMobile';
import placeholderAvatar from '../placeholder_avatar.png';
import { JournalProvider } from '../lib/journal-context';

// Helper to get days in a month
const getDaysInMonth = (year: number, month: number) => {
  return new Date(year, month + 1, 0).getDate();
};

// Helper to format date key for day entries (YYYY-MM-DD)
const formatDayDateKey = (year: number, month: number, day: number) => {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
};

// Helper to format date key for month entries (YYYY-MM)
const formatMonthDateKey = (year: number, month: number) => {
  return `${year}-${String(month + 1).padStart(2, '0')}`;
};

// Helper to get month name
const getMonthName = (month: number) => {
  return new Date(2000, month, 1).toLocaleString('default', { month: 'long' });
};

// Helper to determine entry type from date string
const getEntryType = (date: string): 'year' | 'month' | 'day' => {
  const parts = date.split('-');
  if (parts.length === 1) return 'year';
  if (parts.length === 2) return 'month';
  return 'day';
};

// Helper to extract plain text from TipTap JSON for preview
const getTextFromJSON = (json: JSONContent | null): string => {
  if (!json || !json.content) return '';
  
  const extractText = (node: JSONContent): string => {
    if (node.type === 'text' && node.text) {
      return node.text;
    }
    if (node.content) {
      return node.content.map(extractText).join('');
    }
    return '';
  };
  
  return json.content.map(extractText).join('\n');
};

type DayEntry = {
  year: number;
  month: number;
  day: number;
  dateKey: string;
  isFirstOfMonth: boolean;
};

// Type for journal entries in the database
type JournalEntry = {
  id: string;
  date: string;
  content: JSONContent;
};

export default function Journal() {
  const isMobile = useIsMobile();
  const { db, isSignedIn, user } = useBasic();
  
  const [expandedColumn, setExpandedColumn] = useState<'left' | 'middle' | 'right' | 'home'>('home');
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
  
  // Mobile-specific state
  const [mobileTab, setMobileTab] = useState<'year' | 'month' | 'day' | 'home'>('home');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<{
    type: 'year' | 'month' | 'day';
    key: string;
    title: string;
  } | null>(null);

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

  // Journal notes stored as TipTap JSON, keyed by date string
  const [yearNotes, setYearNotes] = useState<Record<string, JSONContent>>({});
  const [monthNotes, setMonthNotes] = useState<Record<string, JSONContent>>({});
  const [dayNotes, setDayNotes] = useState<Record<string, JSONContent>>({});
  
  // Entry ID lookup for updates
  const [entryIds, setEntryIds] = useState<Record<string, string>>({});

  // Load entries from Basic DB
  useEffect(() => {
    if (!db) return;
    
    const loadEntries = async () => {
      try {
        const entries = await db.collection('entries').getAll() as JournalEntry[];
        const newYearNotes: Record<string, JSONContent> = {};
        const newMonthNotes: Record<string, JSONContent> = {};
        const newDayNotes: Record<string, JSONContent> = {};
        const newEntryIds: Record<string, string> = {};
        
        for (const entry of entries) {
          const type = getEntryType(entry.date);
          newEntryIds[entry.date] = entry.id;
          
          if (type === 'year') {
            newYearNotes[entry.date] = entry.content;
          } else if (type === 'month') {
            newMonthNotes[entry.date] = entry.content;
          } else {
            newDayNotes[entry.date] = entry.content;
          }
        }
        
        setYearNotes(newYearNotes);
        setMonthNotes(newMonthNotes);
        setDayNotes(newDayNotes);
        setEntryIds(newEntryIds);
      } catch (error) {
        console.error('Failed to load journal entries:', error);
      }
    };
    
    loadEntries();
  }, [db]);

  // Track how many months back we've loaded (0 = current month only)
  const [loadedMonthsCount, setLoadedMonthsCount] = useState(1);
  const loadMoreSentinelRef = useRef<HTMLDivElement>(null);
  const dayScrollContainerRef = useRef<HTMLDivElement>(null);
  const mobileScrollContainerRef = useRef<HTMLDivElement>(null);
  
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
          dateKey: formatDayDateKey(year, month, d),
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

    // For mobile, we need to use the mobile scroll container as root
    // For desktop, we use the day scroll container when the right column is expanded
    const scrollRoot = isMobile 
      ? mobileScrollContainerRef.current 
      : (expandedColumn === 'right' ? dayScrollContainerRef.current : null);

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          // Load one more month (limit to 12 months back for now)
          setLoadedMonthsCount(prev => Math.min(prev + 1, 12));
        }
      },
      { threshold: 0.1, root: scrollRoot }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [expandedColumn, isMobile, mobileTab]);

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

  const getColumnFlex = (column: 'left' | 'middle' | 'right' | 'home') => {
    return column === expandedColumn ? 10 : 1;
  };

  const years = Array.from({ length: 10 }, (_, i) => currentYear - i);

  // Save entry to Basic DB (works both signed in and out - SDK handles local storage)
  const saveEntry = async (date: string, content: JSONContent) => {
    if (!db) return;
    
    try {
      const existingId = entryIds[date];
      if (existingId) {
        // Update existing entry
        await db.collection('entries').update(existingId, {
          date,
          content,
        });
      } else {
        // Add new entry
        const result = await db.collection('entries').add({
          date,
          content,
        });
        if (result?.id) {
          setEntryIds(prev => ({ ...prev, [date]: result.id }));
        }
      }
    } catch (error) {
      console.error('Failed to save journal entry:', error);
    }
  };

  const handleYearNoteChange = (year: number, value: JSONContent) => {
    const dateKey = String(year);
    setYearNotes(prev => ({ ...prev, [dateKey]: value }));
    saveEntry(dateKey, value);
  };

  const handleMonthNoteChange = (year: number, month: number, value: JSONContent) => {
    const dateKey = formatMonthDateKey(year, month);
    setMonthNotes(prev => ({ ...prev, [dateKey]: value }));
    saveEntry(dateKey, value);
  };

  const handleDayNoteChange = (dateKey: string, value: JSONContent) => {
    setDayNotes(prev => ({ ...prev, [dateKey]: value }));
    saveEntry(dateKey, value);
  };

  const currentMonthName = new Date(currentYear, currentMonthIndex, 1).toLocaleString('default', { month: 'long' });

  // For JournalProvider, we need to adapt the data format (convert JSON to text for AI context)
  const journalContextValue = {
    yearNotes: Object.fromEntries(
      Object.entries(yearNotes).map(([k, v]) => [Number(k), getTextFromJSON(v)])
    ) as Record<number, string>,
    monthNotes: Object.fromEntries(
      Object.entries(monthNotes).map(([dateKey, v]) => {
        // Convert YYYY-MM back to month name for compatibility
        const [, monthStr] = dateKey.split('-');
        const monthIndex = parseInt(monthStr, 10) - 1;
        return [getMonthName(monthIndex), getTextFromJSON(v)];
      })
    ) as Record<string, string>,
    dayNotes: Object.fromEntries(
      Object.entries(dayNotes).map(([k, v]) => [k, getTextFromJSON(v)])
    ) as Record<string, string>,
    currentYear,
    currentMonth: currentMonthName,
    currentMonthIndex,
    currentDay,
  };

  // Mobile drawer helpers
  const getEditingContent = (): JSONContent | null => {
    if (!editingEntry) return null;
    switch (editingEntry.type) {
      case 'year':
        return yearNotes[editingEntry.key] || null;
      case 'month':
        return monthNotes[editingEntry.key] || null;
      case 'day':
        return dayNotes[editingEntry.key] || null;
    }
  };

  const handleEditingChange = (content: JSONContent) => {
    if (!editingEntry) return;
    switch (editingEntry.type) {
      case 'year':
        handleYearNoteChange(Number(editingEntry.key), content);
        break;
      case 'month': {
        // Parse YYYY-MM format
        const [yearStr, monthStr] = editingEntry.key.split('-');
        handleMonthNoteChange(Number(yearStr), Number(monthStr) - 1, content);
        break;
      }
      case 'day':
        handleDayNoteChange(editingEntry.key, content);
        break;
    }
  };

  const openEditor = (type: 'year' | 'month' | 'day', key: string, title: string) => {
    setEditingEntry({ type, key, title });
    setDrawerOpen(true);
  };

  // Get user display info
  const userName = user?.name || 'User';
  const userInitial = userName.charAt(0).toUpperCase();

  // Mobile Layout
  if (isMobile) {
    return (
      <JournalProvider value={journalContextValue}>
        <div className="h-screen w-screen bg-linear-to-br from-tarot-darker to-tarot-dark font-tarot">
          {/* Mobile top bar with avatar */}
          <div className="fixed top-0 right-0 z-30 pt-2 pr-3">
            <UserProfilePopover>
              <button className="w-10 h-10 rounded-full bg-tarot-dark/90 border-2 border-tarot-gold/30 flex items-center justify-center cursor-pointer hover:bg-tarot-gold/30 transition-colors duration-200 focus:outline-none overflow-hidden backdrop-blur-sm">
                {isSignedIn ? (
                  <div className="text-tarot-gold-light text-sm font-semibold">{userInitial}</div>
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
          
          {/* Content Area - fixed position for reliable sticky behavior */}
          <div ref={mobileScrollContainerRef} className="fixed top-0 left-0 right-0 bottom-14 overflow-y-auto">
            {mobileTab === 'home' && (
              <MobileHome
                dayNotes={dayNotes}
                currentYear={currentYear}
                currentMonthIndex={currentMonthIndex}
                currentDay={currentDay}
                userName={isSignedIn ? userName : undefined}
              />
            )}
            
            {mobileTab === 'year' && years.map(year => {
              const content = yearNotes[String(year)];
              const previewText = getTextFromJSON(content);
              const hasContent = !!previewText;
              return (
                <div 
                  key={year}
                  className={`border-b border-tarot-gold/20 ${hasContent ? 'min-h-[50vh]' : ''}`}
                >
                  <div 
                    className={`px-4 py-3 border-b border-tarot-gold/30 bg-tarot-dark backdrop-blur-sm cursor-pointer active:bg-tarot-gold/5 transition-colors ${hasContent ? 'sticky top-0 z-20' : ''}`}
                    onClick={() => openEditor('year', String(year), String(year))}
                  >
                    <h3 className="text-tarot-gold-light font-semibold text-lg tracking-wide">{year}</h3>
                  </div>
                  {hasContent && (
                    <div 
                      onClick={() => openEditor('year', String(year), String(year))}
                      className="p-4 active:bg-tarot-gold/5 transition-colors cursor-pointer"
                    >
                      <div className="text-white/70 text-sm leading-relaxed">
                        <div className="mobile-content-preview whitespace-pre-wrap">
                          {previewText}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {mobileTab === 'month' && Array.from({ length: currentMonthIndex + 1 }, (_, i) => i)
              .reverse()
              .map((monthIndex) => {
                const dateKey = formatMonthDateKey(currentYear, monthIndex);
                const monthName = getMonthName(monthIndex);
                const content = monthNotes[dateKey];
                const previewText = getTextFromJSON(content);
                const hasContent = !!previewText;
                return (
                  <div 
                    key={dateKey}
                    className={`border-b border-tarot-gold/20 ${hasContent ? 'min-h-[50vh]' : ''}`}
                  >
                    <div 
                      className={`px-4 py-3 border-b border-tarot-gold/30 bg-tarot-dark backdrop-blur-sm cursor-pointer active:bg-tarot-gold/5 transition-colors ${hasContent ? 'sticky top-0 z-20' : ''}`}
                      onClick={() => openEditor('month', dateKey, monthName)}
                    >
                      <h3 className="text-tarot-gold-light font-semibold text-lg tracking-wide">{monthName}</h3>
                    </div>
                    {hasContent && (
                      <div 
                        onClick={() => openEditor('month', dateKey, monthName)}
                        className="p-4 active:bg-tarot-gold/5 transition-colors cursor-pointer"
                      >
                        <div className="text-white/70 text-sm leading-relaxed">
                          <div className="mobile-content-preview whitespace-pre-wrap">
                            {previewText}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

            {mobileTab === 'day' && (
              <>
                {visibleDays().map((entry) => {
                  const content = dayNotes[entry.dateKey];
                  const previewText = getTextFromJSON(content);
                  const hasContent = !!previewText;
                  return (
                    <div 
                      key={entry.dateKey}
                      className={`border-b border-tarot-gold/20 ${hasContent ? 'min-h-[50vh]' : ''}`}
                    >
                      <div 
                        className={`px-4 py-3 border-b border-tarot-gold/30 bg-tarot-dark backdrop-blur-sm cursor-pointer active:bg-tarot-gold/5 transition-colors ${hasContent ? 'sticky top-0 z-20' : ''}`}
                        onClick={() => openEditor('day', entry.dateKey, `${entry.isFirstOfMonth ? getMonthName(entry.month) + ' ' : ''}${entry.day}`)}
                      >
                        <h3 className="text-tarot-gold-light font-semibold text-lg tracking-wide">
                          {entry.isFirstOfMonth && (
                            <span className="text-tarot-gold/60 mr-2">{getMonthName(entry.month)}</span>
                          )}
                          {entry.day}
                        </h3>
                      </div>
                      {hasContent && (
                        <div 
                          onClick={() => openEditor('day', entry.dateKey, `${entry.isFirstOfMonth ? getMonthName(entry.month) + ' ' : ''}${entry.day}`)}
                          className="p-4 active:bg-tarot-gold/5 transition-colors cursor-pointer"
                        >
                          <div className="text-white/70 text-sm leading-relaxed">
                            <div className="mobile-content-preview whitespace-pre-wrap">
                              {previewText}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
                {/* Load more sentinel */}
                <div 
                  ref={loadMoreSentinelRef}
                  className="h-20 flex items-center justify-center text-tarot-gold/30 text-sm"
                >
                  {loadedMonthsCount < 12 ? 'Scroll for more...' : ''}
                </div>
              </>
            )}
          </div>

          {/* Tab Bar */}
          <div className="fixed bottom-0 left-0 right-0 z-40">
            <MobileTabBar 
              activeTab={mobileTab} 
              onTabChange={setMobileTab}
              currentYear={currentYear}
              currentMonth={new Date(currentYear, currentMonthIndex, 1).toLocaleString('default', { month: 'short' })}
              currentDay={currentDay}
            />
          </div>

          {/* Editor Drawer */}
          <MobileDrawer
            isOpen={drawerOpen}
            onClose={() => {
              setDrawerOpen(false);
              setEditingEntry(null);
            }}
            title={editingEntry?.title || ''}
            content={getEditingContent()}
            onChange={handleEditingChange}
          />
        </div>
      </JournalProvider>
    );
  }

  // Desktop Layout
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
                          content={yearNotes[String(year)] || null}
                          onChange={(value) => handleYearNoteChange(year, value)}
                          placeholder="how was your year?"
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
                  {Array.from({ length: currentMonthIndex + 1 }, (_, i) => i)
                    .reverse()
                    .map((monthIndex) => {
                      const dateKey = formatMonthDateKey(currentYear, monthIndex);
                      const monthName = getMonthName(monthIndex);
                      return (
                        <div 
                          key={dateKey}
                          className="bg-tarot-dark/50 border-b border-tarot-gold/20 min-h-[60vh] flex flex-col relative transition-colors duration-200"
                        >
                          <div className="sticky top-0 z-10 px-4 py-3 border-b border-tarot-gold/30 bg-tarot-dark/80 backdrop-blur-sm shadow-tarot">
                            <h3 className="text-lg font-semibold text-tarot-gold-light tracking-wide">{monthName}</h3>
                          </div>
                          <div className="grow">
                            <TiptapEditor
                              content={monthNotes[dateKey] || null}
                              onChange={(value) => handleMonthNoteChange(currentYear, monthIndex, value)}
                              placeholder="how was your month?"
                            />
                          </div>
                        </div>
                      );
                    })}
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
                          content={dayNotes[entry.dateKey] || null}
                          onChange={(value) => handleDayNoteChange(entry.dateKey, value)}
                          placeholder="how was your day?"
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

        {/* Home Panel - Fourth sliding column */}
        <motion.div 
          onClick={() => setExpandedColumn('home')}
          className="bg-tarot-dark border-l border-tarot-gold/30 cursor-pointer overflow-hidden shadow-tarot"
          animate={{ flex: getColumnFlex('home') }}
          transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        >
          <div className="h-full bg-linear-to-b from-tarot-darker to-tarot-dark">
            {expandedColumn === 'home' ? (
              <div className="h-full overflow-y-auto scrollbar-hide">
                <MobileHome
                  dayNotes={dayNotes}
                  currentYear={currentYear}
                  currentMonthIndex={currentMonthIndex}
                  currentDay={currentDay}
                  userName={isSignedIn ? userName : undefined}
                />
                {/* Profile avatar at bottom of expanded home panel */}
                <div className="sticky bottom-0 w-full flex justify-center pb-4 bg-gradient-to-t from-tarot-dark via-tarot-dark to-transparent pt-4">
                  <UserProfilePopover>
                    <button className="w-12 h-12 rounded-full bg-tarot-gold/20 border-2 border-tarot-gold/30 flex items-center justify-center cursor-pointer hover:bg-tarot-gold/30 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-tarot-gold/50 overflow-hidden">
                      {isSignedIn ? (
                        <div className="text-tarot-gold-light text-lg font-semibold">{userInitial}</div>
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
            ) : (
              <div className="w-20 h-full flex flex-col items-center justify-between pt-4 pb-4">
                <TarotClock />
                <div className="flex flex-col items-center gap-3">
                  <UserProfilePopover>
                    <button className="w-12 h-12 rounded-full bg-tarot-gold/20 border-2 border-tarot-gold/30 flex items-center justify-center cursor-pointer hover:bg-tarot-gold/30 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-tarot-gold/50 overflow-hidden">
                      {isSignedIn ? (
                        <div className="text-tarot-gold-light text-lg font-semibold">{userInitial}</div>
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
            )}
          </div>
        </motion.div>
      </div>
    </div>
    </JournalProvider>
  );
}
