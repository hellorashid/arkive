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

  // Generate GitHub-style contribution graph data (last 12 weeks)
  const contributionGraph = useMemo(() => {
    const today = new Date(currentYear, currentMonthIndex, currentDay);
    const weeks: Array<Array<{ date: Date; dateKey: string; hasEntry: boolean; isToday: boolean; isFuture: boolean }>> = [];
    
    // Get the most recent Sunday (or today if Sunday)
    const currentDayOfWeek = today.getDay();
    const mostRecentSunday = new Date(today);
    mostRecentSunday.setDate(today.getDate() - currentDayOfWeek);
    
    // Generate 12 weeks of data (columns), with days of week as rows
    const numWeeks = 12;
    
    for (let weekOffset = numWeeks - 1; weekOffset >= 0; weekOffset--) {
      const week: Array<{ date: Date; dateKey: string; hasEntry: boolean; isToday: boolean; isFuture: boolean }> = [];
      
      for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
        const date = new Date(mostRecentSunday);
        date.setDate(mostRecentSunday.getDate() - (weekOffset * 7) + dayOfWeek);
        
        const dateKey = formatDayDateKey(date.getFullYear(), date.getMonth(), date.getDate());
        const isToday = date.toDateString() === today.toDateString();
        const isFuture = date > today;
        
        week.push({
          date,
          dateKey,
          hasEntry: !!dayNotes[dateKey],
          isToday,
          isFuture,
        });
      }
      
      weeks.push(week);
    }
    
    return weeks;
  }, [currentYear, currentMonthIndex, currentDay, dayNotes]);

  // Calculate total entries in the graph period
  const graphStats = useMemo(() => {
    let totalEntries = 0;
    let totalDays = 0;
    
    contributionGraph.forEach(week => {
      week.forEach(day => {
        if (!day.isFuture) {
          totalDays++;
          if (day.hasEntry) totalEntries++;
        }
      });
    });
    
    return { totalEntries, totalDays, percentage: totalDays > 0 ? Math.round((totalEntries / totalDays) * 100) : 0 };
  }, [contributionGraph]);

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
        // Don't break on today if no entry yet
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

  // Get month labels for the graph
  const monthLabels = useMemo(() => {
    const labels: Array<{ label: string; position: number }> = [];
    let lastMonth = -1;
    
    contributionGraph.forEach((week, weekIndex) => {
      const firstDayOfWeek = week[0];
      const month = firstDayOfWeek.date.getMonth();
      
      if (month !== lastMonth) {
        labels.push({
          label: firstDayOfWeek.date.toLocaleDateString('en-US', { month: 'short' }),
          position: weekIndex,
        });
        lastMonth = month;
      }
    });
    
    return labels;
  }, [contributionGraph]);

  const quote = getMotivationalQuote();
  const displayName = userName || 'Friend';
  const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

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

      {/* Streak Stats - Combined */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
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
          
          {/* Total Entries */}
          <div className="text-center flex-1">
            <div className="text-2xl mb-1">📝</div>
            <div className="text-tarot-gold-light text-2xl font-semibold">{graphStats.totalEntries}</div>
            <div className="text-tarot-gold/60 text-xs tracking-wide uppercase">Entries</div>
          </div>
        </div>
      </motion.div>

      {/* GitHub-style Contribution Graph */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="bg-tarot-dark/50 border border-tarot-gold/20 rounded-xl p-4 mb-4"
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-tarot-gold-light text-sm font-semibold tracking-wide uppercase">
            Activity
          </h2>
          <span className="text-tarot-gold/60 text-xs">
            {graphStats.percentage}% in last 12 weeks
          </span>
        </div>
        
        {/* Month labels */}
        <div className="flex mb-1 ml-5">
          {monthLabels.map((label, index) => (
            <div
              key={index}
              className="text-tarot-gold/40 text-xs"
              style={{
                position: 'relative',
                left: `${label.position * (100 / 12)}%`,
                marginRight: index < monthLabels.length - 1 ? 'auto' : 0,
              }}
            >
              {label.label}
            </div>
          ))}
        </div>
        
        {/* Graph grid */}
        <div className="flex gap-0.5">
          {/* Day labels */}
          <div className="flex flex-col gap-0.5 mr-1">
            {dayLabels.map((label, index) => (
              <div 
                key={index} 
                className="h-3 w-3 flex items-center justify-center text-tarot-gold/40"
                style={{ fontSize: '8px' }}
              >
                {index % 2 === 1 ? label : ''}
              </div>
            ))}
          </div>
          
          {/* Weeks grid */}
          <div className="flex gap-0.5 flex-1">
            {contributionGraph.map((week, weekIndex) => (
              <div key={weekIndex} className="flex flex-col gap-0.5 flex-1">
                {week.map((day, dayIndex) => (
                  <motion.div
                    key={dayIndex}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ 
                      duration: 0.2, 
                      delay: 0.3 + (weekIndex * 0.02) + (dayIndex * 0.01) 
                    }}
                    className={`aspect-square rounded-sm transition-all duration-200 ${
                      day.isFuture
                        ? 'bg-tarot-dark/30'
                        : day.isToday
                          ? 'bg-tarot-gold ring-1 ring-tarot-gold-light ring-offset-1 ring-offset-tarot-dark'
                          : day.hasEntry
                            ? 'bg-tarot-gold/60 hover:bg-tarot-gold/80'
                            : 'bg-tarot-gold/10 hover:bg-tarot-gold/20'
                    }`}
                    title={`${day.date.toLocaleDateString()}: ${day.hasEntry ? 'Entry written' : 'No entry'}`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
        
        {/* Legend */}
        <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-tarot-gold/10">
          <span className="text-tarot-gold/40 text-xs">Less</span>
          <div className="flex gap-0.5">
            <div className="w-3 h-3 rounded-sm bg-tarot-gold/10"></div>
            <div className="w-3 h-3 rounded-sm bg-tarot-gold/30"></div>
            <div className="w-3 h-3 rounded-sm bg-tarot-gold/50"></div>
            <div className="w-3 h-3 rounded-sm bg-tarot-gold/70"></div>
            <div className="w-3 h-3 rounded-sm bg-tarot-gold"></div>
          </div>
          <span className="text-tarot-gold/40 text-xs">More</span>
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
          {streakStats.currentStreak >= streakStats.longestStreak && streakStats.currentStreak >= 7
            ? `You're on fire! Your current ${streakStats.currentStreak}-day streak is your best ever! 🏆`
            : streakStats.currentStreak >= 7 
              ? `Amazing! You've been journaling for ${streakStats.currentStreak} days straight. Keep the momentum going! 🌟`
              : streakStats.currentStreak >= 3
                ? `Great job! You're building a ${streakStats.currentStreak}-day streak. Your record is ${streakStats.longestStreak} days! 💪`
                : graphStats.totalEntries > 0
                  ? `You've written ${graphStats.totalEntries} ${graphStats.totalEntries === 1 ? 'entry' : 'entries'} recently. Every entry counts! ✨`
                  : `Start your journaling journey today. Even a few words can make a difference. 🌱`
          }
        </p>
      </motion.div>
    </div>
  );
}
