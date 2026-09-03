import { useState, useEffect, useMemo, type MouseEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { JSONContent } from '@tiptap/react';

interface MobileHomeProps {
  dayNotes: Record<string, JSONContent>;
  currentYear: number;
  currentMonthIndex: number;
  currentDay: number;
  userName?: string;
  /** Desktop sliding panel: larger composition, calmer motion, no mobile tab padding */
  compact?: boolean;
}

const formatDayDateKey = (year: number, month: number, day: number) =>
  `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

const getDaysInMonth = (year: number, month: number) =>
  new Date(year, month + 1, 0).getDate();

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'Good morning';
  if (hour >= 12 && hour < 17) return 'Good afternoon';
  if (hour >= 17 && hour < 21) return 'Good evening';
  return 'Good night';
};

const getTimeSymbol = () => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return '☀';
  if (hour >= 12 && hour < 17) return '☼';
  if (hour >= 17 && hour < 21) return '☽';
  return '☾';
};

const getQuote = () => {
  const quotes = [
    { text: 'The unexamined life is not worth living.', author: 'Socrates' },
    { text: 'Write what should not be forgotten.', author: 'Isabel Allende' },
    { text: 'Journal writing is a voyage to the interior.', author: 'Christina Baldwin' },
    { text: 'Fill your paper with the breathings of your heart.', author: 'William Wordsworth' },
    { text: 'The act of writing is the act of discovering what you believe.', author: 'David Hare' },
    {
      text: 'In the journal I do not just express myself more openly than I could to any person; I create myself.',
      author: 'Susan Sontag',
    },
  ];
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
  );
  return quotes[dayOfYear % quotes.length];
};

const getContentLength = (content: JSONContent | undefined): number => {
  if (!content?.content) return 0;
  const extractText = (node: JSONContent): string => {
    if (node.type === 'text' && node.text) return node.text;
    if (node.content) return node.content.map(extractText).join('');
    return '';
  };
  return content.content.map(extractText).join('').length;
};

const ChevronLeft = ({ className }: { className?: string }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="m15 18-6-6 6-6" />
  </svg>
);

const ChevronRight = ({ className }: { className?: string }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="m9 18 6-6-6-6" />
  </svg>
);

type SunRay = {
  day: number;
  dateKey: string;
  hasEntry: boolean;
  isToday: boolean;
  isFuture: boolean;
  contentLength: number;
};

export default function MobileHome({
  dayNotes,
  currentYear,
  currentMonthIndex,
  currentDay,
  userName,
  compact = false,
}: MobileHomeProps) {
  const [time, setTime] = useState(new Date());
  const [viewingMonth, setViewingMonth] = useState(currentMonthIndex);
  const [viewingYear, setViewingYear] = useState(currentYear);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const hours = time.getHours();
  const minutes = time.getMinutes();
  const formattedHour = hours % 12 || 12;
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const pad = (n: number) => n.toString().padStart(2, '0');

  const dayName = time.toLocaleDateString('en-US', { weekday: 'long' });
  const monthName = time.toLocaleDateString('en-US', { month: 'long' });
  const dayNumber = time.getDate();
  const year = time.getFullYear();

  const isCurrentMonth = viewingMonth === currentMonthIndex && viewingYear === currentYear;

  const goToPreviousMonth = (e?: MouseEvent) => {
    e?.stopPropagation();
    if (viewingMonth === 0) {
      setViewingMonth(11);
      setViewingYear((y) => y - 1);
    } else {
      setViewingMonth((m) => m - 1);
    }
  };

  const goToNextMonth = (e?: MouseEvent) => {
    e?.stopPropagation();
    if (isCurrentMonth) return;
    if (viewingMonth === 11) {
      setViewingMonth(0);
      setViewingYear((y) => y + 1);
    } else {
      setViewingMonth((m) => m + 1);
    }
  };

  const viewingMonthAbbr = new Date(viewingYear, viewingMonth, 1)
    .toLocaleDateString('en-US', { month: 'short' })
    .toUpperCase();

  const sunRays = useMemo((): SunRay[] => {
    const daysInMonth = getDaysInMonth(viewingYear, viewingMonth);
    const rays: SunRay[] = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = formatDayDateKey(viewingYear, viewingMonth, day);
      const content = dayNotes[dateKey];
      rays.push({
        day,
        dateKey,
        hasEntry: !!content,
        isToday: isCurrentMonth && day === currentDay,
        isFuture: isCurrentMonth && day > currentDay,
        contentLength: getContentLength(content),
      });
    }
    return rays;
  }, [viewingYear, viewingMonth, currentDay, dayNotes, isCurrentMonth]);

  const maxContentLength = useMemo(
    () => Math.max(...sunRays.map((r) => r.contentLength), 100),
    [sunRays]
  );

  const currentStreak = useMemo(() => {
    const today = new Date(currentYear, currentMonthIndex, currentDay);
    let streak = 0;
    for (let i = 0; i <= 365; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateKey = formatDayDateKey(date.getFullYear(), date.getMonth(), date.getDate());
      if (dayNotes[dateKey]) streak++;
      else if (i > 0) break;
    }
    return streak;
  }, [currentYear, currentMonthIndex, currentDay, dayNotes]);

  const daysLoggedThisMonth = useMemo(
    () => sunRays.filter((r) => r.hasEntry && !r.isFuture).length,
    [sunRays]
  );

  const quote = getQuote();
  const displayName = userName || 'Friend';

  const sunSize = compact ? 340 : 280;
  const sunCenter = sunSize / 2;
  const sunInnerRadius = compact ? 58 : 50;
  const rayBase = compact ? 42 : 35;
  const rayMin = compact ? 24 : 20;
  const rayMax = compact ? 68 : 55;

  const getRayStyle = (ray: SunRay, index: number, total: number) => {
    const angle = (index / total) * 360 - 90;
    let length: number;
    let opacity: number;
    let color: string;
    let glowIntensity = 0;

    if (ray.isFuture) {
      length = rayMin;
      opacity = 0.15;
      color = 'rgb(185, 144, 107)';
    } else if (!ray.hasEntry) {
      length = rayBase;
      opacity = 0.3;
      color = 'rgb(185, 144, 107)';
    } else {
      const normalized = Math.min(ray.contentLength / maxContentLength, 1);
      length = rayBase + (rayMax - rayBase) * normalized;
      opacity = 0.8 + normalized * 0.2;
      color = 'rgb(212, 176, 140)';
      glowIntensity = 0.3 + normalized * 0.7;
    }

    if (ray.isToday) {
      length = Math.max(length, rayMax);
      glowIntensity = 1;
      color = 'rgb(212, 176, 140)';
      opacity = 1;
    }

    return { angle, length, opacity, color, glowIntensity };
  };

  const insightText =
    currentStreak >= 7
      ? `A ${currentStreak}-day streak. The archive is deepening — keep returning.`
      : currentStreak >= 3
        ? `${currentStreak} days in a row. Consistency is the quiet magic.`
        : currentStreak > 0
          ? `Day ${currentStreak} of your streak. Even a few words count.`
          : 'Begin today. A single line is enough to open the archive.';

  const sunTracker = (
    <div className={`relative ${compact ? 'mb-8' : 'mb-6'}`}>
      <div
        className={`absolute inset-0 flex items-center justify-between pointer-events-none z-10 ${
          compact ? '-mx-14' : 'px-2'
        }`}
      >
        <button
          type="button"
          onClick={goToPreviousMonth}
          aria-label="Previous month"
          className="pointer-events-auto w-10 h-10 rounded-full bg-tarot-dark/80 border border-tarot-gold/25 flex items-center justify-center hover:bg-tarot-gold/15 hover:border-tarot-gold/50 transition-colors"
        >
          <ChevronLeft className="text-tarot-gold" />
        </button>
        <button
          type="button"
          onClick={goToNextMonth}
          disabled={isCurrentMonth}
          aria-label="Next month"
          className={`pointer-events-auto w-10 h-10 rounded-full bg-tarot-dark/80 border border-tarot-gold/25 flex items-center justify-center transition-colors ${
            isCurrentMonth
              ? 'opacity-25 cursor-not-allowed'
              : 'hover:bg-tarot-gold/15 hover:border-tarot-gold/50'
          }`}
        >
          <ChevronRight className="text-tarot-gold" />
        </button>
      </div>

      <div className="relative mx-auto" style={{ width: sunSize, height: sunSize }}>
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background:
              'radial-gradient(circle, transparent 38%, rgba(185, 144, 107, 0.06) 58%, transparent 72%)',
          }}
        />

        <AnimatePresence mode="wait">
          <motion.svg
            key={`${viewingYear}-${viewingMonth}`}
            initial={compact ? false : { opacity: 0, rotate: -10 }}
            animate={{ opacity: 1, rotate: 0 }}
            exit={{ opacity: 0, rotate: 10 }}
            transition={{ duration: 0.3 }}
            viewBox={`0 0 ${sunSize} ${sunSize}`}
            className="absolute inset-0 w-full h-full"
            style={{ overflow: 'visible' }}
          >
            {sunRays.map((ray, index) => {
              const style = getRayStyle(ray, index, sunRays.length);
              const angleRad = (style.angle * Math.PI) / 180;
              const x1 = sunCenter + Math.cos(angleRad) * sunInnerRadius;
              const y1 = sunCenter + Math.sin(angleRad) * sunInnerRadius;
              const x2 = sunCenter + Math.cos(angleRad) * (sunInnerRadius + style.length);
              const y2 = sunCenter + Math.sin(angleRad) * (sunInnerRadius + style.length);

              return (
                <g key={ray.day}>
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
                  <motion.line
                    initial={compact ? false : { pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: style.opacity }}
                    transition={{
                      duration: compact ? 0.35 : 0.5,
                      delay: compact ? 0.02 + index * 0.008 : 0.1 + index * 0.015,
                      ease: 'easeOut',
                    }}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke={style.color}
                    strokeWidth={ray.isToday ? 3 : 1.5}
                    strokeLinecap="round"
                  />
                  {ray.isToday && (
                    <motion.circle
                      initial={compact ? false : { scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.3, delay: compact ? 0.2 : 0.6 }}
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

        <motion.div
          initial={compact ? false : { scale: 0 }}
          animate={{ scale: 1 }}
          transition={compact ? { duration: 0 } : { duration: 0.5, delay: 0.4, type: 'spring' }}
          className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-tarot-darker border-2 border-tarot-gold/50 flex flex-col items-center justify-center ${
            compact ? 'w-28 h-28' : 'w-24 h-24'
          }`}
          style={{
            boxShadow: '0 0 24px rgba(185, 144, 107, 0.22), inset 0 0 20px rgba(0, 0, 0, 0.5)',
          }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={`${viewingYear}-${viewingMonth}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col items-center"
            >
              <span
                className={`text-tarot-gold-light font-semibold tracking-[0.2em] ${
                  compact ? 'text-xl' : 'text-lg'
                }`}
              >
                {viewingMonthAbbr}
              </span>
              {isCurrentMonth && currentStreak > 0 && (
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-xs opacity-80">✧</span>
                  <span className="text-tarot-gold text-sm font-semibold tabular-nums">
                    {currentStreak}
                  </span>
                </div>
              )}
              {!isCurrentMonth && (
                <span className="text-tarot-gold/45 text-xs mt-1 tracking-wider">{viewingYear}</span>
              )}
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>

      {compact && (
        <p className="mt-5 text-center text-tarot-gold/45 text-xs tracking-[0.18em] uppercase">
          {daysLoggedThisMonth} {daysLoggedThisMonth === 1 ? 'entry' : 'entries'} this month
        </p>
      )}
    </div>
  );

  if (compact) {
    return (
      <div
        className="relative min-h-full flex flex-col items-center px-10 pt-10 pb-24"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 70% 55% at 50% 28%, rgba(185,144,107,0.07) 0%, transparent 70%)',
          }}
        />

        <div className="relative w-full max-w-lg flex flex-col items-center">
          <div className="text-center mb-8">
            <div className="text-tarot-gold-light/90 text-2xl mb-3 tracking-widest">
              {getTimeSymbol()}
            </div>
            <div className="text-tarot-gold-light font-mono text-4xl tracking-[0.12em] tabular-nums">
              {formattedHour}:{pad(minutes)}
              <span className="text-tarot-gold/50 text-sm ml-2 tracking-[0.2em]">{ampm}</span>
            </div>
            <h1 className="mt-5 text-tarot-gold-light text-2xl font-tarot tracking-wide">
              {getGreeting()}, <span className="font-semibold">{displayName}</span>
            </h1>
            <p className="mt-2 text-tarot-gold/55 text-sm tracking-[0.14em]">
              {dayName}, {monthName} {dayNumber}, {year}
            </p>
          </div>

          {sunTracker}

          <div className="w-full text-center mb-8">
            <div className="mx-auto mb-5 h-px w-16 bg-tarot-gold/25" />
            <blockquote className="text-white/65 text-[15px] italic leading-relaxed font-tarot">
              “{quote.text}”
            </blockquote>
            <cite className="mt-3 block text-tarot-gold/45 text-xs not-italic tracking-[0.16em] uppercase">
              {quote.author}
            </cite>
            <div className="mx-auto mt-5 h-px w-16 bg-tarot-gold/25" />
          </div>

          <div className="w-full border-l border-tarot-gold/30 pl-5 py-1">
            <h3 className="text-tarot-gold/70 text-[11px] font-semibold tracking-[0.2em] uppercase mb-2">
              Insight
            </h3>
            <p className="text-white/55 text-sm leading-relaxed">{insightText}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full p-4 pb-20">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-6"
      >
        <div className="text-tarot-gold-light text-3xl mb-1 animate-pulse">{getTimeSymbol()}</div>
        <div className="text-tarot-gold-light font-mono text-2xl tracking-wider">
          {formattedHour}:{pad(minutes)}{' '}
          <span className="text-tarot-gold/60 text-sm">{ampm}</span>
        </div>
      </motion.div>

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

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        {sunTracker}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="bg-tarot-dark/30 border border-tarot-gold/10 rounded-xl p-4 text-center"
      >
        <div className="text-tarot-gold/20 text-2xl mb-2">✦</div>
        <blockquote className="text-white/70 text-sm italic leading-relaxed mb-2">
          &quot;{quote.text}&quot;
        </blockquote>
        <cite className="text-tarot-gold/50 text-xs not-italic">— {quote.author}</cite>
      </motion.div>

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
                : `Start your journaling journey today. Even a few words can make a difference. 🌱`}
        </p>
      </motion.div>
    </div>
  );
}
