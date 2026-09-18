import { useEffect, useRef, useState } from 'react';
import JournalTimeline, { TimelineItem } from '@/components/JournalTimeline';
import { formatDayDateKey, getAllEntries, getMonthName, saveEntry } from '@/lib/storage';

export default function DayScreen() {
  const [items, setItems] = useState<TimelineItem[]>([]);
  const saveTimeouts = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const currentYear = new Date().getFullYear();
  const currentMonthIndex = new Date().getMonth();
  const currentDay = new Date().getDate();

  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    const dayEntries = await getAllEntries('day');
    const days: TimelineItem[] = [];

    for (let day = currentDay; day >= 1; day--) {
      const key = formatDayDateKey(currentYear, currentMonthIndex, day);
      const entry = dayEntries.find((e) => e.date === key);
      const content = entry?.content || '';
      days.push({
        key,
        title: String(day),
        prefix: day === currentDay ? getMonthName(currentMonthIndex) : undefined,
        content,
        expanded: false,
        hasContent: content.trim().length > 0,
        placeholder: 'how was your day?',
      });
    }

    setItems(days);
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
