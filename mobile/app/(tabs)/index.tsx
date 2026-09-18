import { StyleSheet, ScrollView, Pressable, Modal } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import SunTracker from '@/components/SunTracker';
import { formatDayDateKey, getAllEntries } from '@/lib/storage';

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

const quotes = [
  { text: 'The unexamined life is not worth living.', author: 'Socrates' },
  { text: 'Write what should not be forgotten.', author: 'Isabel Allende' },
  { text: 'Journal writing is a voyage to the interior.', author: 'Christina Baldwin' },
  { text: 'Fill your paper with the breathings of your heart.', author: 'William Wordsworth' },
  { text: 'The act of writing is the act of discovering what you believe.', author: 'David Hare' },
];

const getQuote = () => {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
  );
  return quotes[dayOfYear % quotes.length];
};

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];
  const [time, setTime] = useState(new Date());
  const [streak, setStreak] = useState(0);
  const [dayNotes, setDayNotes] = useState<Record<string, string>>({});
  const [aboutVisible, setAboutVisible] = useState(false);
  const [viewingMonth, setViewingMonth] = useState(new Date().getMonth());
  const [viewingYear, setViewingYear] = useState(new Date().getFullYear());

  const currentYear = time.getFullYear();
  const currentMonthIndex = time.getMonth();
  const currentDay = time.getDate();

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const loadStats = useCallback(async () => {
    const dayEntries = await getAllEntries('day');
    const notes: Record<string, string> = {};
    for (const entry of dayEntries) {
      notes[entry.date] = entry.content || '';
    }
    setDayNotes(notes);

    const today = new Date();
    let currentStreak = 0;
    for (let i = 0; i <= 365; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateKey = formatDayDateKey(date.getFullYear(), date.getMonth(), date.getDate());
      if (notes[dateKey]?.trim()) currentStreak++;
      else if (i > 0) break;
    }
    setStreak(currentStreak);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, [loadStats])
  );

  const hours = time.getHours();
  const minutes = time.getMinutes();
  const formattedHour = hours % 12 || 12;
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const pad = (n: number) => n.toString().padStart(2, '0');

  const dayName = time.toLocaleDateString('en-US', { weekday: 'long' });
  const monthName = time.toLocaleDateString('en-US', { month: 'long' });
  const dayNumber = time.getDate();
  const year = time.getFullYear();
  
  const quote = getQuote();

  const insightText = 
    streak >= 7
      ? `A ${streak}-day streak. The archive is deepening — keep returning.`
      : streak >= 3
        ? `${streak} days in a row. Consistency is the quiet magic.`
        : streak > 0
          ? `Day ${streak} of your streak. Even a few words count.`
          : 'Begin today. A single line is enough to open the archive.';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: 'transparent' }]}>
        <Pressable 
          onPress={() => setAboutVisible(true)}
          style={styles.aboutButton}
        >
          <Ionicons name="information-circle-outline" size={28} color={colors.goldLight} />
        </Pressable>
      </View>

      <View style={[styles.content, { backgroundColor: 'transparent' }]}>
        <View style={[styles.timeSection, { backgroundColor: 'transparent' }]}>
          <Text style={[styles.symbol, { color: colors.goldLight }]}>{getTimeSymbol()}</Text>
          <Text style={[styles.time, { color: colors.goldLight }]}>
            {formattedHour}:{pad(minutes)}
            <Text style={[styles.ampm, { color: colors.gold + '80' }]}> {ampm}</Text>
          </Text>
        </View>

        <View style={[styles.greetingSection, { backgroundColor: 'transparent' }]}>
          <Text style={[styles.greeting, { color: colors.goldLight }]}>
            {getGreeting()}, <Text style={styles.greetingName}>Friend</Text>
          </Text>
          <Text style={[styles.date, { color: colors.gold + '99' }]}>
            {dayName}, {monthName} {dayNumber}, {year}
          </Text>
        </View>

        <SunTracker
          dayNotes={dayNotes}
          viewingYear={viewingYear}
          viewingMonth={viewingMonth}
          currentYear={currentYear}
          currentMonthIndex={currentMonthIndex}
          currentDay={currentDay}
          currentStreak={streak}
          onPreviousMonth={() => {
            if (viewingMonth === 0) {
              setViewingMonth(11);
              setViewingYear((y) => y - 1);
            } else {
              setViewingMonth((m) => m - 1);
            }
          }}
          onNextMonth={() => {
            if (viewingMonth === currentMonthIndex && viewingYear === currentYear) return;
            if (viewingMonth === 11) {
              setViewingMonth(0);
              setViewingYear((y) => y + 1);
            } else {
              setViewingMonth((m) => m + 1);
            }
          }}
        />

        <View style={[styles.quoteSection, { backgroundColor: colors.backgroundDark, borderColor: colors.gold + '20' }]}>
          <Text style={[styles.quoteMark, { color: colors.gold + '33' }]}>✦</Text>
          <Text style={[styles.quoteText, { color: colors.text + 'B3' }]}>
            "{quote.text}"
          </Text>
          <Text style={[styles.quoteAuthor, { color: colors.gold + '80' }]}>— {quote.author}</Text>
        </View>

        <View style={[styles.insightSection, { backgroundColor: 'transparent', borderLeftColor: colors.gold + '4D' }]}>
          <Text style={[styles.insightLabel, { color: colors.gold + 'B3' }]}>INSIGHT</Text>
          <Text style={[styles.insightText, { color: colors.text + '99' }]}>{insightText}</Text>
        </View>
      </View>

      <Modal
        animationType="fade"
        transparent={true}
        visible={aboutVisible}
        onRequestClose={() => setAboutVisible(false)}
      >
        <Pressable 
          style={styles.modalOverlay}
          onPress={() => setAboutVisible(false)}
        >
          <Pressable 
            style={[styles.modalContent, { backgroundColor: colors.backgroundDark, borderColor: colors.goldLight }]}
            onPress={(e) => e.stopPropagation()}
          >
            <Pressable 
              style={styles.closeButton}
              onPress={() => setAboutVisible(false)}
            >
              <Ionicons name="close" size={24} color={colors.goldLight} />
            </Pressable>
            
            <Text style={[styles.modalTitle, { color: colors.goldLight }]}>About Arkive</Text>
            
            <ScrollView style={styles.modalScroll}>
              <Text style={[styles.modalText, { color: colors.text + 'CC' }]}>
                Arkive is a reflective journal designed to help you capture your thoughts across time — from fleeting daily moments to the broader arcs of months and years.
              </Text>
              
              <Text style={[styles.modalText, { color: colors.text + 'CC' }]}>
                The three-column layout mirrors the way memory works: the immediacy of today, the rhythm of the month, and the perspective of the year. Each view offers a different lens through which to understand your journey.
              </Text>
              
              <Text style={[styles.modalText, { color: colors.text + 'CC' }]}>
                With AI-powered prompts and reflections, you can explore your entries more deeply, ask questions and generate insights. Or not, up to you.
              </Text>
              
              <Text style={[styles.modalQuote, { color: colors.text + '99' }]}>
                "The unexamined life is not worth living." — Socrates
              </Text>
              
              <Text style={[styles.modalText, { color: colors.text + 'CC' }]}>
                Arkive is completely free to use, open source, and fully private.
              </Text>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    alignItems: 'flex-end',
  },
  aboutButton: {
    padding: 8,
  },
  content: {
    padding: 24,
    paddingTop: 0,
  },
  timeSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  symbol: {
    fontSize: 48,
    marginBottom: 8,
  },
  time: {
    fontSize: 42,
    fontWeight: '600',
    letterSpacing: 2,
  },
  ampm: {
    fontSize: 18,
    fontWeight: '400',
  },
  greetingSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  greeting: {
    fontSize: 24,
    marginBottom: 8,
  },
  greetingName: {
    fontWeight: '600',
  },
  date: {
    fontSize: 14,
    letterSpacing: 1,
  },
  quoteSection: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 24,
  },
  quoteMark: {
    fontSize: 32,
    marginBottom: 12,
  },
  quoteText: {
    fontSize: 15,
    fontStyle: 'italic',
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 12,
  },
  quoteAuthor: {
    fontSize: 12,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  insightSection: {
    borderLeftWidth: 2,
    paddingLeft: 20,
    paddingVertical: 4,
  },
  insightLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 8,
  },
  insightText: {
    fontSize: 14,
    lineHeight: 22,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 500,
    maxHeight: '80%',
    borderRadius: 8,
    borderWidth: 2,
    padding: 24,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 1,
    padding: 4,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 20,
    paddingRight: 40,
  },
  modalScroll: {
    maxHeight: 400,
  },
  modalText: {
    fontSize: 15,
    lineHeight: 24,
    marginBottom: 16,
  },
  modalQuote: {
    fontSize: 15,
    fontStyle: 'italic',
    lineHeight: 24,
    marginBottom: 16,
    paddingLeft: 16,
  },
});
