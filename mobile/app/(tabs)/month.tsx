import { useEffect, useRef, useState } from 'react';
import JournalTimeline, { TimelineItem } from '@/components/JournalTimeline';
import { formatMonthDateKey, getAllEntries, getMonthName, saveEntry } from '@/lib/storage';

export default function MonthScreen() {
  const [items, setItems] = useState<TimelineItem[]>([]);
  const saveTimeouts = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const currentYear = new Date().getFullYear();
  const currentMonthIndex = new Date().getMonth();

  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    const monthEntries = await getAllEntries('month');
    setItems(
      Array.from({ length: currentMonthIndex + 1 }, (_, i) => {
        const monthIndex = currentMonthIndex - i;
        const key = formatMonthDateKey(currentYear, monthIndex);
        const entry = monthEntries.find((e) => e.date === key);
        const content = entry?.content || '';
        return {
          key,
          title: getMonthName(monthIndex),
          content,
          expanded: false,
          hasContent: content.trim().length > 0,
          placeholder: 'how was your month?',
        };
      })
    );
  };

  const handleToggle = (key: string) => {
    setItems((prev) =>
      prev.map((item) => (item.key === key ? { ...item, expanded: !item.expanded } : item))
    );
  };

  const handleChange = (key: string, content: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.key === key ? { ...item, content, hasContent: content.trim().length > 0 } : item
      )
    );

    if (saveTimeouts.current[key]) clearTimeout(saveTimeouts.current[key]);
    saveTimeouts.current[key] = setTimeout(() => {
      saveEntry(key, content);
    }, 1000);
  };

  return <JournalTimeline items={items} onToggle={handleToggle} onChange={handleChange} />;
}
