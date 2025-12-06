import { createContext, useContext, ReactNode } from 'react';

export interface JournalEntries {
  yearNotes: Record<number, string>;
  monthNotes: Record<string, string>;
  dayNotes: Record<string, string>; // Keyed by full date like "2025-01-06"
  currentYear: number;
  currentMonth: string;
  currentMonthIndex: number;
  currentDay: number;
}

const JournalContext = createContext<JournalEntries | null>(null);

export function JournalProvider({ 
  children, 
  value 
}: { 
  children: ReactNode; 
  value: JournalEntries;
}) {
  return (
    <JournalContext.Provider value={value}>
      {children}
    </JournalContext.Provider>
  );
}

export function useJournalContext(): JournalEntries | null {
  return useContext(JournalContext);
}

// Helper to format date key (YYYY-MM-DD)
function formatDateKey(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

// Build a context string for the AI from journal entries
export function buildJournalContextString(entries: JournalEntries): string {
  const parts: string[] = [];
  
  // Current year entry
  const yearEntry = entries.yearNotes[entries.currentYear];
  if (yearEntry && yearEntry.trim()) {
    parts.push(`## ${entries.currentYear} Year Reflection:\n${yearEntry.trim()}`);
  }
  
  // Current month entry
  const monthEntry = entries.monthNotes[entries.currentMonth];
  if (monthEntry && monthEntry.trim()) {
    parts.push(`## ${entries.currentMonth} ${entries.currentYear} Month Reflection:\n${monthEntry.trim()}`);
  }
  
  // Current month's daily entries (using full date keys)
  const dailyEntries: string[] = [];
  for (let day = 1; day <= entries.currentDay; day++) {
    const dateKey = formatDateKey(entries.currentYear, entries.currentMonthIndex, day);
    const dayEntry = entries.dayNotes[dateKey];
    if (dayEntry && dayEntry.trim()) {
      dailyEntries.push(`### Day ${day}:\n${dayEntry.trim()}`);
    }
  }
  
  if (dailyEntries.length > 0) {
    parts.push(`## Daily Entries for ${entries.currentMonth} ${entries.currentYear}:\n${dailyEntries.join('\n\n')}`);
  }
  
  if (parts.length === 0) {
    return '';
  }
  
  return `---\nJOURNAL CONTEXT:\n${parts.join('\n\n')}\n---`;
}
