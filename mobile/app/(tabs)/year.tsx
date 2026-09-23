import { useEffect, useRef, useState } from 'react';
import JournalTimeline, { TimelineItem } from '@/components/JournalTimeline';
import { getAllEntries, saveEntry } from '@/lib/storage';

export default function YearScreen() {
  const [items, setItems] = useState<TimelineItem[]>([]);
  const saveTimeouts = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - i);

  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    const yearEntries = await getAllEntries('year');
    setItems(
      years.map((year) => {
        const key = String(year);
        const entry = yearEntries.find((e) => e.date === key);
        const content = entry?.content || '';
        return {
          key,
          title: key,
          content,
          expanded: false,
          hasContent: content.trim().length > 0,
          placeholder: 'how was your year?',
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
