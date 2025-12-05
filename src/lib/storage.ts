import { AISettings, DEFAULT_SETTINGS } from './ai-config';

const STORAGE_KEY = 'journal-ai-settings';

export function getAISettings(): AISettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Merge with defaults to ensure all fields exist
      return { ...DEFAULT_SETTINGS, ...parsed };
    }
  } catch (e) {
    console.error('Failed to load AI settings:', e);
  }
  return DEFAULT_SETTINGS;
}

export function saveAISettings(settings: AISettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save AI settings:', e);
  }
}

export function resetAISettings(): AISettings {
  localStorage.removeItem(STORAGE_KEY);
  return DEFAULT_SETTINGS;
}

