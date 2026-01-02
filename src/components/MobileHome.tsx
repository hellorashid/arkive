import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { JSONContent } from '@tiptap/react';

interface MobileHomeProps {
  dayNotes: Record<string, JSONContent>;
  currentYear: number;
  currentMonthIndex: number;
  currentDay: number;
  userName?: string;
}

// Helper to format date key for day entries (YYYY-MM-DD)
const formatDayDateKey = (year: number, month: number, day: number) => {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
};

// Helper to get days in a month
const getDaysInMonth = (year: number, month: number) => {
  return new Date(year, month + 1, 0).getDate();
};

// Get greeting based on time of day
const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'Good morning';
  if (hour >= 12 && hour < 17) return 'Good afternoon';
  if (hour >= 17 && hour < 21) return 'Good evening';
  return 'Good night';
};

// Get time symbol based on time of day
const getTimeSymbol = () => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return '☀';
  if (hour >= 12 && hour < 17) return '☼';
  if (hour >= 17 && hour < 21) return '☽';
  return '☾';
};

// Get motivational quote
const getMotivationalQuote = () => {
  const quotes = [
    { text: "The unexamined life is not worth living.", author: "Socrates" },
    { text: "Write what should not be forgotten.", author: "Isabel Allende" },
    { text: "Journal writing is a voyage to the interior.", author: "Christina Baldwin" },
    { text: "Fill your paper with the breathings of your heart.", author: "William Wordsworth" },
    { text: "The act of writing is the act of discovering what you believe.", author: "David Hare" },
    { text: "In the journal I do not just express myself more openly than I could to any person; I create myself.", author: "Susan Sontag" },
  ];
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  return quotes[dayOfYear % quotes.length];
};

// Helper to extract text length from TipTap JSON content
const getContentLength = (content: JSONContent | undefined): number => {
  if (!content || !content.content) return 0;
  
  const extractText = (node: JSONContent): string => {
    if (node.type === 'text' && node.text) {
      return node.text;
    }
    if (node.content) {
      return node.content.map(extractText).join('');
    }
    return '';
  };
  
  return content.content.map(extractText).join('').length;
};

// Arrow icon components
const ChevronLeft = ({ className }: { className?: string }) => (
  <svg 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="m15 18-6-6 6-6"/>
  </svg>
);

const ChevronRight = ({ className }: { className?: string }) => (
  <svg 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="m9 18 6-6-6-6"/>
  </svg>
);

export default function MobileHome({
  dayNotes,
  currentYear,
  currentMonthIndex,
  currentDay,
  userName,
}: MobileHomeProps) {
  const [time, setTime] = useState(new Date());
  const [viewingMonth, setViewingMonth] = useState(currentMonthIndex);
  const [viewingYear, setViewingYear] = useState(currentYear);
  
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (num: number) => num.toString().padStart(2, '0');
  const hours = time.getHours();
  const minutes = time.getMinutes();
  const formattedHour = hours % 12 || 12;
  const ampm = hours >= 12 ? 'PM' : 'AM';

  // Format today's date beautifully
  const dayName = time.toLocaleDateString('en-US', { weekday: 'long' });
  const monthName = time.toLocaleDateString('en-US', { month: 'long' });
  const dayNumber = time.getDate();
  const year = time.getFullYear();

  // Check if viewing current month
  const isCurrentMonth = viewingMonth === currentMonthIndex && viewingYear === currentYear;

  // Navigate months
  const goToPreviousMonth = () => {
    if (viewingMonth === 0) {
      setViewingMonth(11);
      setViewingYear(viewingYear - 1);
    } else {
      setViewingMonth(viewingMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (isCurrentMonth) return; // Can't go to future
    if (viewingMonth === 11) {
      setViewingMonth(0);
      setViewingYear(viewingYear + 1);
    } else {
      setViewingMonth(viewingMonth + 1);
    }
  };

  // Get month abbreviation for the viewing month
  const viewingMonthAbbr = new Date(viewingYear, viewingMonth, 1)
    .toLocaleDateString('en-US', { month: 'short' })
    .toUpperCase();

  // Generate radial sun data for the viewing month
  const sunRays = useMemo(() => {
    const daysInMonth = getDaysInMonth(viewingYear, viewingMonth);
    const rays: Array<{
      day: number;
      dateKey: string;
      hasEntry: boolean;
      isToday: boolean;
      isFuture: boolean;
      contentLength: number;
    }> = [];
    
    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = formatDayDateKey(viewingYear, viewingMonth, day);
      const content = dayNotes[dateKey];
      const hasEntry = !!content;
      const isToday = isCurrentMonth && day === currentDay;
      const isFuture = isCurrentMonth && day > currentDay;
      const contentLength = getContentLength(content);
      
      rays.push({
        day,
        dateKey,
        hasEntry,
        isToday,
        isFuture,
        contentLength,
      });
    }
    
    return rays;
  }, [viewingYear, viewingMonth, currentDay, dayNotes, isCurrentMonth]);

  // Calculate max content length for normalization
  const maxContentLength = useMemo(() => {
    return Math.max(...sunRays.map(r => r.contentLength), 100);
  }, [sunRays]);

  // Calculate current streak
  const currentStreak = useMemo(() => {
    const today = new Date(currentYear, currentMonthIndex, currentDay);
    let streak = 0;
    
    for (let i = 0; i <= 365; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateKey = formatDayDateKey(date.getFullYear(), date.getMonth(), date.getDate());
      
      if (dayNotes[dateKey]) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }
    
    return streak;
  }, [currentYear, currentMonthIndex, currentDay, dayNotes]);

  const quote = getMotivationalQuote();
  const displayName = userName || 'Friend';

  // Calculate ray properties
  const getRayStyle = (ray: typeof sunRays[0], index: number, total: number) => {
    const angle = (index / total) * 360 - 90; // Start from top (-90 degrees)
    const baseLength = 35;
    const minLength = 20;
    const maxLength = 55;
    
    let length: number;
    let opacity: number;
    let color: string;
    let glowIntensity: number = 0;
    
    if (ray.isFuture) {
      length = minLength;
      opacity = 0.15;
      color = 'rgb(185, 144, 107)';
      glowIntensity = 0;
    } else if (!ray.hasEntry) {
      length = baseLength;
      opacity = 0.3;
      color = 'rgb(185, 144, 107)';
      glowIntensity = 0;
    } else {
      const normalizedLength = Math.min(ray.contentLength / maxContentLength, 1);
      length = baseLength + (maxLength - baseLength) * normalizedLength;
      opacity = 0.8 + (normalizedLength * 0.2);
      color = 'rgb(212, 176, 140)';
      glowIntensity = 0.3 + (normalizedLength * 0.7);
    }
    
    if (ray.isToday) {
      length = Math.max(length, maxLength);
      glowIntensity = 1;
      color = 'rgb(212, 176, 140)';
      opacity = 1;
    }
    
    return {
      angle,
      length,
      opacity,
      color,
      glowIntensity,
    };
  };

  return (
    <div className="min-h-full p-4 pb-20">
      {/* Header with Time */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-6"
      >
        <div className="text-tarot-gold-light text-3xl mb-1 animate-pulse">
          {getTimeSymbol()}
        </div>
        <div className="text-tarot-gold-light font-mono text-2xl tracking-wider">
          {formattedHour}:{formatTime(minutes)} <span className="text-tarot-gold/60 text-sm">{ampm}</span>
        </div>
      </motion.div>

      {/* Welcome Message & Date */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="text-center mb-6"
      >
        <h1 className="text-tarot-gold-light text-xl font-tarot mb-1">
          {getGreeting()}, <span className="font-semibold">{displayName}</span>
        </h1>
        <p className="text-tarot-gold/70 text-sm tracking-wide">
          {dayName}, {monthName} {dayNumber}, {year}
        </p>
      </motion.div>

      {/* Radial Sun Tracker with Navigation */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="relative mb-6"
      >
        {/* Navigation Arrows */}
        <div className="absolute inset-0 flex items-center justify-between px-2 pointer-events-none z-10">
          <button
            onClick={goToPreviousMonth}
            className="pointer-events-auto w-10 h-10 rounded-full bg-tarot-dark/80 border border-tarot-gold/30 flex items-center justify-center hover:bg-tarot-gold/20 transition-colors"
          >
            <ChevronLeft className="text-tarot-gold" />
          </button>
          <button
            onClick={goToNextMonth}
            disabled={isCurrentMonth}
            className={`pointer-events-auto w-10 h-10 rounded-full bg-tarot-dark/80 border border-tarot-gold/30 flex items-center justify-center transition-colors ${
              isCurrentMonth 
                ? 'opacity-30 cursor-not-allowed' 
                : 'hover:bg-tarot-gold/20'
            }`}
          >
            <ChevronRight className="text-tarot-gold" />
          </button>
        </div>

        {/* Sun Tracker */}
        <div className="relative mx-auto" style={{ width: '280px', height: '280px' }}>
          {/* Outer glow ring */}
          <div 
            className="absolute inset-0 rounded-full"
            style={{
              background: 'radial-gradient(circle, transparent 40%, rgba(185, 144, 107, 0.05) 60%, transparent 70%)',
            }}
          />
          
          {/* Rays container */}
          <AnimatePresence mode="wait">
            <motion.svg 
              key={`${viewingYear}-${viewingMonth}`}
              initial={{ opacity: 0, rotate: -10 }}
              animate={{ opacity: 1, rotate: 0 }}
              exit={{ opacity: 0, rotate: 10 }}
              transition={{ duration: 0.3 }}
              viewBox="0 0 280 280" 
              className="absolute inset-0 w-full h-full"
              style={{ overflow: 'visible' }}
            >
              {sunRays.map((ray, index) => {
                const style = getRayStyle(ray, index, sunRays.length);
                const centerX = 140;
                const centerY = 140;
                const innerRadius = 50;
                const angleRad = (style.angle * Math.PI) / 180;
                
                const x1 = centerX + Math.cos(angleRad) * innerRadius;
                const y1 = centerY + Math.sin(angleRad) * innerRadius;
                const x2 = centerX + Math.cos(angleRad) * (innerRadius + style.length);
                const y2 = centerY + Math.sin(angleRad) * (innerRadius + style.length);
                
                return (
                  <g key={ray.day}>
                    {/* Glow effect for entries */}
                    {style.glowIntensity > 0 && (
                      <line
                        x1={x1}
                        y1={y1}
                        x2={x2}
                        y2={y2}
                        stroke={style.color}
                        strokeWidth={ray.isToday ? 6 : 4}
                        strokeLinecap="round"
                        opacity={style.glowIntensity * 0.4}
                        filter="blur(3px)"
                      />
                    )}
                    {/* Main ray */}
                    <motion.line
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{ pathLength: 1, opacity: style.opacity }}
                      transition={{ 
                        duration: 0.5, 
                        delay: 0.1 + (index * 0.015),
                        ease: "easeOut"
                      }}
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke={style.color}
                      strokeWidth={ray.isToday ? 3 : 1.5}
                      strokeLinecap="round"
                    />
                    {/* Today indicator dot */}
                    {ray.isToday && (
                      <motion.circle
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.3, delay: 0.6 }}
                        cx={x2}
                        cy={y2}
                        r={4}
                        fill="rgb(212, 176, 140)"
                        filter="drop-shadow(0 0 4px rgb(212, 176, 140))"
                      />
                    )}
                  </g>
                );
              })}
            </motion.svg>
          </AnimatePresence>
          
          {/* Center circle */}
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.4, type: "spring" }}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full bg-tarot-darker border-2 border-tarot-gold/50 flex flex-col items-center justify-center"
            style={{
              boxShadow: '0 0 20px rgba(185, 144, 107, 0.2), inset 0 0 20px rgba(0, 0, 0, 0.5)',
            }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={`${viewingYear}-${viewingMonth}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col items-center"
              >
                <span className="text-tarot-gold-light text-lg font-semibold tracking-wider">
                  {viewingMonthAbbr}
                </span>
                {isCurrentMonth && currentStreak > 0 && (
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-sm">🔥</span>
                    <span className="text-tarot-gold text-sm font-semibold">{currentStreak}</span>
                  </div>
                )}
                {!isCurrentMonth && (
                  <span className="text-tarot-gold/50 text-xs mt-1">{viewingYear}</span>
                )}
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </div>
      </motion.div>

      {/* Motivational Quote */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="bg-tarot-dark/30 border border-tarot-gold/10 rounded-xl p-4 text-center"
      >
        <div className="text-tarot-gold/20 text-2xl mb-2">✦</div>
        <blockquote className="text-white/70 text-sm italic leading-relaxed mb-2">
          "{quote.text}"
        </blockquote>
        <cite className="text-tarot-gold/50 text-xs not-italic">— {quote.author}</cite>
      </motion.div>

      {/* Quick Insight */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="mt-4 bg-gradient-to-r from-tarot-gold/5 to-transparent border-l-2 border-tarot-gold/30 rounded-r-xl p-4"
      >
        <h3 className="text-tarot-gold-light text-sm font-semibold mb-1">Quick Insight</h3>
        <p className="text-white/60 text-sm leading-relaxed">
          {currentStreak >= 7 
            ? `Amazing! You've been journaling for ${currentStreak} days straight. Keep the momentum going! 🌟`
            : currentStreak >= 3
              ? `Great job! You're building a ${currentStreak}-day streak. Consistency is key! 💪`
              : currentStreak > 0
                ? `You're on a ${currentStreak}-day streak. Every entry counts! ✨`
                : `Start your journaling journey today. Even a few words can make a difference. 🌱`
          }
        </p>
      </motion.div>
    </div>
  );
}
