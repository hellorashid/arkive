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

// Get day of week (0 = Sunday, 6 = Saturday)
const getDayOfWeek = (year: number, month: number, day: number) => {
  return new Date(year, month, day).getDay();
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
  // Use the day of year to select a quote so it changes daily
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  return quotes[dayOfYear % quotes.length];
};

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

  // Calculate week entries (starting from Sunday)
  const weekEntries = useMemo(() => {
    const today = new Date(currentYear, currentMonthIndex, currentDay);
    const dayOfWeek = today.getDay(); // 0 = Sunday
    const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    
    return weekDays.map((label, i) => {
      // Calculate the date for this day of the week
      const dayOffset = i - dayOfWeek;
      const date = new Date(today);
      date.setDate(today.getDate() + dayOffset);
      
      const dateKey = formatDayDateKey(date.getFullYear(), date.getMonth(), date.getDate());
      const hasEntry = !!dayNotes[dateKey];
      const isToday = i === dayOfWeek;
      const isFuture = i > dayOfWeek;
      
      return { label, hasEntry, isToday, isFuture, date: date.getDate() };
    });
  }, [currentYear, currentMonthIndex, currentDay, dayNotes]);

  // Calculate monthly entries
  const monthlyStats = useMemo(() => {
    const daysInMonth = getDaysInMonth(currentYear, currentMonthIndex);
    let entriesCount = 0;
    
    for (let day = 1; day <= currentDay; day++) {
      const dateKey = formatDayDateKey(currentYear, currentMonthIndex, day);
      if (dayNotes[dateKey]) {
        entriesCount++;
      }
    }
    
    return {
      totalDays: daysInMonth,
      entriesCount,
      passedDays: currentDay,
      percentage: Math.round((entriesCount / currentDay) * 100),
    };
  }, [currentYear, currentMonthIndex, currentDay, dayNotes]);

  // Calculate current streak
  const currentStreak = useMemo(() => {
    let streak = 0;
    const today = new Date(currentYear, currentMonthIndex, currentDay);
    
    for (let i = 0; i <= 365; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateKey = formatDayDateKey(date.getFullYear(), date.getMonth(), date.getDate());
      
      if (dayNotes[dateKey]) {
        streak++;
      } else if (i > 0) {
        // Don't break on today if no entry yet
        break;
      }
    }
    
    return streak;
  }, [currentYear, currentMonthIndex, currentDay, dayNotes]);

  // Generate mini calendar for the month
  const miniCalendar = useMemo(() => {
    const daysInMonth = getDaysInMonth(currentYear, currentMonthIndex);
    const firstDayOfWeek = getDayOfWeek(currentYear, currentMonthIndex, 1);
    const days: Array<{ day: number | null; hasEntry: boolean; isToday: boolean }> = [];
    
    // Add empty cells for days before the first of the month
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push({ day: null, hasEntry: false, isToday: false });
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = formatDayDateKey(currentYear, currentMonthIndex, day);
      days.push({
        day,
        hasEntry: !!dayNotes[dateKey],
        isToday: day === currentDay,
      });
    }
    
    return days;
  }, [currentYear, currentMonthIndex, currentDay, dayNotes]);

  const quote = getMotivationalQuote();
  const displayName = userName || 'Friend';

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
        className="text-center mb-8"
      >
        <h1 className="text-tarot-gold-light text-xl font-tarot mb-1">
          {getGreeting()}, <span className="font-semibold">{displayName}</span>
        </h1>
        <p className="text-tarot-gold/70 text-sm tracking-wide">
          {dayName}, {monthName} {dayNumber}, {year}
        </p>
      </motion.div>

      {/* Week Tracker */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="bg-tarot-dark/50 border border-tarot-gold/20 rounded-xl p-4 mb-4"
      >
        <h2 className="text-tarot-gold-light text-sm font-semibold mb-3 tracking-wide uppercase">
          This Week
        </h2>
        <div className="flex justify-between">
          {weekEntries.map((day, index) => (
            <div key={index} className="flex flex-col items-center gap-1">
              <span className={`text-xs ${day.isToday ? 'text-tarot-gold-light font-semibold' : 'text-tarot-gold/50'}`}>
                {day.label}
              </span>
              <div 
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs transition-all duration-300 ${
                  day.isToday 
                    ? 'bg-tarot-gold/30 border-2 border-tarot-gold text-tarot-gold-light font-semibold'
                    : day.hasEntry 
                      ? 'bg-tarot-gold/20 text-tarot-gold-light' 
                      : day.isFuture
                        ? 'bg-tarot-dark/30 text-tarot-gold/30 border border-tarot-gold/10'
                        : 'bg-tarot-dark/50 text-tarot-gold/40 border border-dashed border-tarot-gold/20'
                }`}
              >
                {day.hasEntry && !day.isToday ? '✓' : day.date}
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="grid grid-cols-2 gap-3 mb-4"
      >
        {/* Current Streak */}
        <div className="bg-tarot-dark/50 border border-tarot-gold/20 rounded-xl p-4 text-center">
          <div className="text-3xl mb-1">🔥</div>
          <div className="text-tarot-gold-light text-2xl font-semibold">{currentStreak}</div>
          <div className="text-tarot-gold/60 text-xs tracking-wide uppercase">Day Streak</div>
        </div>
        
        {/* Monthly Progress */}
        <div className="bg-tarot-dark/50 border border-tarot-gold/20 rounded-xl p-4 text-center">
          <div className="text-3xl mb-1">📝</div>
          <div className="text-tarot-gold-light text-2xl font-semibold">
            {monthlyStats.entriesCount}<span className="text-tarot-gold/40 text-lg">/{monthlyStats.passedDays}</span>
          </div>
          <div className="text-tarot-gold/60 text-xs tracking-wide uppercase">This Month</div>
        </div>
      </motion.div>

      {/* Monthly Calendar */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="bg-tarot-dark/50 border border-tarot-gold/20 rounded-xl p-4 mb-4"
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-tarot-gold-light text-sm font-semibold tracking-wide uppercase">
            {monthName} {year}
          </h2>
          <span className="text-tarot-gold/60 text-xs">
            {monthlyStats.percentage}% consistency
          </span>
        </div>
        <div className="grid grid-cols-7 gap-1">
          {/* Day headers */}
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
            <div key={i} className="text-center text-tarot-gold/40 text-xs py-1">
              {d}
            </div>
          ))}
          {/* Calendar days */}
          {miniCalendar.map((cell, index) => (
            <div
              key={index}
              className={`aspect-square rounded flex items-center justify-center text-xs ${
                cell.day === null
                  ? ''
                  : cell.isToday
                    ? 'bg-tarot-gold/30 text-tarot-gold-light font-semibold border border-tarot-gold'
                    : cell.hasEntry
                      ? 'bg-tarot-gold/20 text-tarot-gold-light'
                      : cell.day <= currentDay
                        ? 'text-tarot-gold/30'
                        : 'text-tarot-gold/15'
              }`}
            >
              {cell.day}
            </div>
          ))}
        </div>
        
        {/* Legend */}
        <div className="flex items-center justify-center gap-4 mt-3 pt-3 border-t border-tarot-gold/10">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-tarot-gold/20"></div>
            <span className="text-tarot-gold/50 text-xs">Entry</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded border border-tarot-gold"></div>
            <span className="text-tarot-gold/50 text-xs">Today</span>
          </div>
        </div>
      </motion.div>

      {/* Motivational Quote */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
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
        transition={{ duration: 0.5, delay: 0.6 }}
        className="mt-4 bg-gradient-to-r from-tarot-gold/5 to-transparent border-l-2 border-tarot-gold/30 rounded-r-xl p-4"
      >
        <h3 className="text-tarot-gold-light text-sm font-semibold mb-1">Quick Insight</h3>
        <p className="text-white/60 text-sm leading-relaxed">
          {currentStreak >= 7 
            ? `Amazing! You've been journaling for ${currentStreak} days straight. Keep the momentum going! 🌟`
            : currentStreak >= 3
              ? `Great job! You're building a ${currentStreak}-day streak. Consistency is key! 💪`
              : monthlyStats.entriesCount > 0
                ? `You've written ${monthlyStats.entriesCount} ${monthlyStats.entriesCount === 1 ? 'entry' : 'entries'} this month. Every entry counts! ✨`
                : `Start your journaling journey today. Even a few words can make a difference. 🌱`
          }
        </p>
      </motion.div>
    </div>
  );
}
