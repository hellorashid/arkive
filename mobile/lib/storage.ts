import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys for different entry types
const YEAR_KEY_PREFIX = 'year_';
const MONTH_KEY_PREFIX = 'month_';
const DAY_KEY_PREFIX = 'day_';

// Journal entry type
export interface JournalEntry {
  date: string; // YYYY for year, YYYY-MM for month, YYYY-MM-DD for day
  content: string;
  updatedAt: string;
}

// Save a journal entry
export const saveEntry = async (date: string, content: string): Promise<void> => {
  try {
    const entry: JournalEntry = {
      date,
      content,
      updatedAt: new Date().toISOString(),
    };
    
    let key: string;
    const parts = date.split('-');
    if (parts.length === 1) {
      key = `${YEAR_KEY_PREFIX}${date}`;
    } else if (parts.length === 2) {
      key = `${MONTH_KEY_PREFIX}${date}`;
    } else {
      key = `${DAY_KEY_PREFIX}${date}`;
    }
    
    await AsyncStorage.setItem(key, JSON.stringify(entry));
  } catch (error) {
    console.error('Error saving entry:', error);
    throw error;
  }
};

// Get a journal entry
export const getEntry = async (date: string): Promise<JournalEntry | null> => {
  try {
    let key: string;
    const parts = date.split('-');
    if (parts.length === 1) {
      key = `${YEAR_KEY_PREFIX}${date}`;
    } else if (parts.length === 2) {
      key = `${MONTH_KEY_PREFIX}${date}`;
    } else {
      key = `${DAY_KEY_PREFIX}${date}`;
    }
    
    const value = await AsyncStorage.getItem(key);
    if (value) {
      return JSON.parse(value) as JournalEntry;
    }
    return null;
  } catch (error) {
    console.error('Error getting entry:', error);
    return null;
  }
};

// Get all entries of a specific type
export const getAllEntries = async (type: 'year' | 'month' | 'day'): Promise<JournalEntry[]> => {
  try {
    const prefix = type === 'year' ? YEAR_KEY_PREFIX : type === 'month' ? MONTH_KEY_PREFIX : DAY_KEY_PREFIX;
    const allKeys = await AsyncStorage.getAllKeys();
    const relevantKeys = allKeys.filter(key => key.startsWith(prefix));
    
    if (relevantKeys.length === 0) return [];
    
    const entries = await AsyncStorage.multiGet(relevantKeys);
    return entries
      .map(([_, value]) => (value ? JSON.parse(value) as JournalEntry : null))
      .filter((entry): entry is JournalEntry => entry !== null)
      .sort((a, b) => b.date.localeCompare(a.date)); // Sort newest first
  } catch (error) {
    console.error('Error getting all entries:', error);
    return [];
  }
};

// Date formatting helpers
export const formatDayDateKey = (year: number, month: number, day: number): string => {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
};

export const formatMonthDateKey = (year: number, month: number): string => {
  return `${year}-${String(month + 1).padStart(2, '0')}`;
};

export const getMonthName = (month: number): string => {
  return new Date(2000, month, 1).toLocaleString('default', { month: 'long' });
};

export const getDaysInMonth = (year: number, month: number): number => {
  return new Date(year, month + 1, 0).getDate();
};
