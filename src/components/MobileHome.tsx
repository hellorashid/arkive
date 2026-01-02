import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
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

// Sun icon component
const SunIcon = () => (
  <svg 
    width="32" 
    height="32" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="1.5"
    className="text-tarot-gold"
  >
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2" />
    <path d="M12 20v2" />
    <path d="m4.93 4.93 1.41 1.41" />
    <path d="m17.66 17.66 1.41 1.41" />
    <path d="M2 12h2" />
    <path d="M20 12h2" />
    <path d="m6.34 17.66-1.41 1.41" />
    <path d="m19.07 4.93-1.41 1.41" />
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

  // Generate radial sun data for the current month
  const sunRays = useMemo(() => {
    const daysInMonth = getDaysInMonth(currentYear, currentMonthIndex);
    const rays: Array<{
      day: number;
      dateKey: string;
      hasEntry: boolean;
      isToday: boolean;
      isFuture: boolean;
      contentLength: number;
    }> = [];
    
    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = formatDayDateKey(currentYear, currentMonthIndex, day);
      const content = dayNotes[dateKey];
      const hasEntry = !!content;
      const isToday = day === currentDay;
      const isFuture = day > currentDay;
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
  }, [currentYear, currentMonthIndex, currentDay, dayNotes]);

  // Calculate max content length for normalization
  const maxContentLength = useMemo(() => {
    return Math.max(...sunRays.map(r => r.contentLength), 100);
  }, [sunRays]);

  // Calculate monthly stats
  const monthlyStats = useMemo(() => {
    let entriesCount = 0;
    for (let day = 1; day <= currentDay; day++) {
      const dateKey = formatDayDateKey(currentYear, currentMonthIndex, day);
      if (dayNotes[dateKey]) {
        entriesCount++;
      }
    }
    return {
      entriesCount,
      passedDays: currentDay,
      percentage: currentDay > 0 ? Math.round((entriesCount / currentDay) * 100) : 0,
    };
  }, [currentYear, currentMonthIndex, currentDay, dayNotes]);

  // Calculate current streak and longest streak
  const streakStats = useMemo(() => {
    const today = new Date(currentYear, currentMonthIndex, currentDay);
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    
    // Calculate current streak (going backwards from today)
    for (let i = 0; i <= 365; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateKey = formatDayDateKey(date.getFullYear(), date.getMonth(), date.getDate());
      
      if (dayNotes[dateKey]) {
        currentStreak++;
      } else if (i > 0) {
        break;
      }
    }
    
    // Calculate longest streak (scan all entries in the last year)
    for (let i = 365; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateKey = formatDayDateKey(date.getFullYear(), date.getMonth(), date.getDate());
      
      if (dayNotes[dateKey]) {
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        tempStreak = 0;
      }
    }
    
    return { currentStreak, longestStreak };
  }, [currentYear, currentMonthIndex, currentDay, dayNotes]);

  const quote = getMotivationalQuote();
  const displayName = userName || 'Friend';

  // Calculate ray properties
  const getRayStyle = (ray: typeof sunRays[0], index: number, total: number) => {
    const angle = (index / total) * 360 - 90; // Start from top (-90 degrees)
    const baseLength = 35; // Base length in pixels
    const minLength = 20;
    const maxLength = 55;
    
    let length: number;
    let opacity: number;
    let color: string;
    let glowIntensity: number = 0;
    
    if (ray.isFuture) {
      // Upcoming: shorter, very faint
      length = minLength;
      opacity = 0.15;
      color = 'rgb(185, 144, 107)'; // tarot-gold
      glowIntensity = 0;
    } else if (!ray.hasEntry) {
      // No entry: medium, light
      length = baseLength;
      opacity = 0.3;
      color = 'rgb(185, 144, 107)';
      glowIntensity = 0;
    } else {
      // Has entry: length based on content, bright with glow
      const normalizedLength = Math.min(ray.contentLength / maxContentLength, 1);
      length = baseLength + (maxLength - baseLength) * normalizedLength;
      opacity = 0.8 + (normalizedLength * 0.2);
      color = 'rgb(212, 176, 140)'; // tarot-gold-light
      glowIntensity = 0.3 + (normalizedLength * 0.7);
    }
    
    // Today gets special treatment
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

      {/* Radial Sun Tracker */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="relative mb-6"
      >
        {/* Background circle */}
        <div className="relative mx-auto" style={{ width: '280px', height: '280px' }}>
          {/* Outer glow ring */}
          <div 
            className="absolute inset-0 rounded-full"
            style={{
              background: 'radial-gradient(circle, transparent 40%, rgba(185, 144, 107, 0.05) 60%, transparent 70%)',
            }}
          />
          
          {/* Rays container */}
          <svg 
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
                      delay: 0.3 + (index * 0.02),
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
                      transition={{ duration: 0.3, delay: 0.8 }}
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
          </svg>
          
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
            <SunIcon />
            <span className="text-tarot-gold text-xs font-semibold tracking-widest mt-1">TODAY</span>
          </motion.div>
        </div>
        
        {/* Month label */}
        <div className="text-center mt-2">
          <span className="text-tarot-gold/60 text-sm tracking-wide">
            {monthName} {year} • {monthlyStats.percentage}%
          </span>
        </div>
      </motion.div>

      {/* Streak Stats - Combined */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="bg-tarot-dark/50 border border-tarot-gold/20 rounded-xl p-4 mb-4"
      >
        <div className="flex items-center justify-around">
          {/* Current Streak */}
          <div className="text-center flex-1">
            <div className="text-2xl mb-1">🔥</div>
            <div className="text-tarot-gold-light text-2xl font-semibold">{streakStats.currentStreak}</div>
            <div className="text-tarot-gold/60 text-xs tracking-wide uppercase">Current</div>
          </div>
          
          {/* Divider */}
          <div className="h-12 w-px bg-tarot-gold/20"></div>
          
          {/* Longest Streak */}
          <div className="text-center flex-1">
            <div className="text-2xl mb-1">👑</div>
            <div className="text-tarot-gold-light text-2xl font-semibold">{streakStats.longestStreak}</div>
            <div className="text-tarot-gold/60 text-xs tracking-wide uppercase">Longest</div>
          </div>
          
          {/* Divider */}
          <div className="h-12 w-px bg-tarot-gold/20"></div>
          
          {/* Monthly Entries */}
          <div className="text-center flex-1">
            <div className="text-2xl mb-1">📝</div>
            <div className="text-tarot-gold-light text-2xl font-semibold">
              {monthlyStats.entriesCount}<span className="text-tarot-gold/40 text-lg">/{monthlyStats.passedDays}</span>
            </div>
            <div className="text-tarot-gold/60 text-xs tracking-wide uppercase">This Month</div>
          </div>
        </div>
      </motion.div>

      {/* Legend */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="flex items-center justify-center gap-6 mb-4 text-xs"
      >
        <div className="flex items-center gap-2">
          <div className="w-6 h-0.5 bg-tarot-gold/15 rounded"></div>
          <span className="text-tarot-gold/40">Upcoming</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-0.5 bg-tarot-gold/30 rounded"></div>
          <span className="text-tarot-gold/40">No entry</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-0.5 bg-tarot-gold-light rounded" style={{ boxShadow: '0 0 4px rgba(212, 176, 140, 0.5)' }}></div>
          <span className="text-tarot-gold/40">Entry</span>
        </div>
      </motion.div>

      {/* Motivational Quote */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.7 }}
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
        transition={{ duration: 0.5, delay: 0.8 }}
        className="mt-4 bg-gradient-to-r from-tarot-gold/5 to-transparent border-l-2 border-tarot-gold/30 rounded-r-xl p-4"
      >
        <h3 className="text-tarot-gold-light text-sm font-semibold mb-1">Quick Insight</h3>
        <p className="text-white/60 text-sm leading-relaxed">
          {streakStats.currentStreak >= streakStats.longestStreak && streakStats.currentStreak >= 7
            ? `You're on fire! Your current ${streakStats.currentStreak}-day streak is your best ever! 🏆`
            : streakStats.currentStreak >= 7 
              ? `Amazing! You've been journaling for ${streakStats.currentStreak} days straight. Keep the momentum going! 🌟`
              : streakStats.currentStreak >= 3
                ? `Great job! You're building a ${streakStats.currentStreak}-day streak. Your record is ${streakStats.longestStreak} days! 💪`
                : monthlyStats.entriesCount > 0
                  ? `You've written ${monthlyStats.entriesCount} ${monthlyStats.entriesCount === 1 ? 'entry' : 'entries'} this month. Every entry counts! ✨`
                  : `Start your journaling journey today. Even a few words can make a difference. 🌱`
          }
        </p>
      </motion.div>
    </div>
  );
}
