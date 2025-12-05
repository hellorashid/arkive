import { createContext, useContext, ReactNode } from 'react';

export interface JournalEntries {
  yearNotes: Record<number, string>;
  monthNotes: Record<string, string>;
  dayNotes: Record<string, string>;
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

// Helper to strip HTML tags and get plain text
function stripHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.body.textContent || '';
}

// Build a context string for the AI from journal entries
export function buildJournalContextString(entries: JournalEntries): string {
  const parts: string[] = [];
  
  // Current year entry
  const yearEntry = entries.yearNotes[entries.currentYear];
  if (yearEntry && yearEntry.trim() && yearEntry !== '<p></p>') {
    const text = stripHtml(yearEntry).trim();
    if (text) {
      parts.push(`## ${entries.currentYear} Year Reflection:\n${text}`);
    }
  }
  
  // Current month entry
  const monthEntry = entries.monthNotes[entries.currentMonth];
  if (monthEntry && monthEntry.trim() && monthEntry !== '<p></p>') {
    const text = stripHtml(monthEntry).trim();
    if (text) {
      parts.push(`## ${entries.currentMonth} ${entries.currentYear} Month Reflection:\n${text}`);
    }
  }
  
  // Current month's daily entries
  const dailyEntries: string[] = [];
  for (let day = 1; day <= entries.currentDay; day++) {
    const dayEntry = entries.dayNotes[String(day)];
    if (dayEntry && dayEntry.trim() && dayEntry !== '<p></p>') {
      const text = stripHtml(dayEntry).trim();
      if (text) {
        dailyEntries.push(`### Day ${day}:\n${text}`);
      }
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

