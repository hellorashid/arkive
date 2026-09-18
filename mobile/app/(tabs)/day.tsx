import { StyleSheet, ScrollView, TextInput, Pressable } from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { Text, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { getAllEntries, saveEntry, formatDayDateKey, getMonthName } from '@/lib/storage';

interface DayEntryState {
  year: number;
  month: number;
  day: number;
  dateKey: string;
  isFirstOfMonth: boolean;
  content: string;
  expanded: boolean;
  hasContent: boolean;
}

export default function DayScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];
  const [dayStates, setDayStates] = useState<DayEntryState[]>([]);
  const saveTimeouts = useRef<Record<string, NodeJS.Timeout>>({});

  const currentYear = new Date().getFullYear();
  const currentMonthIndex = new Date().getMonth();
  const currentDay = new Date().getDate();

  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    const dayEntries = await getAllEntries('day');
    
    // Generate days (current month for now)
    const days: DayEntryState[] = [];
    for (let d = currentDay; d >= 1; d--) {
      const dateKey = formatDayDateKey(currentYear, currentMonthIndex, d);
      const entry = dayEntries.find(e => e.date === dateKey);
      
      days.push({
        year: currentYear,
        month: currentMonthIndex,
        day: d,
        dateKey,
        isFirstOfMonth: d === currentDay,
        content: entry?.content || '',
        expanded: false,
        hasContent: !!(entry?.content && entry.content.trim().length > 0),
      });
    }
    
    setDayStates(days);
  };

  const handleToggle = (dateKey: string) => {
    setDayStates(prev => prev.map(state => 
      state.dateKey === dateKey 
        ? { ...state, expanded: !state.expanded }
        : state
    ));
  };

  const handleContentChange = (dateKey: string, newContent: string) => {
    setDayStates(prev => prev.map(state =>
      state.dateKey === dateKey
        ? { ...state, content: newContent, hasContent: newContent.trim().length > 0 }
        : state
    ));

    // Debounced save
    if (saveTimeouts.current[dateKey]) {
      clearTimeout(saveTimeouts.current[dateKey]);
    }
    saveTimeouts.current[dateKey] = setTimeout(() => {
      saveEntry(dateKey, newContent);
    }, 1000);
  };

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      {dayStates.map((state) => (
        <View 
          key={state.dateKey}
          style={[
            styles.entrySection,
            { 
              backgroundColor: state.hasContent ? colors.backgroundLight : 'transparent',
              borderBottomColor: colors.gold + '20',
              minHeight: state.expanded ? 300 : 'auto',
            }
          ]}
        >
          <Pressable
            onPress={() => handleToggle(state.dateKey)}
            style={[
              styles.entryHeader,
              { 
                backgroundColor: colors.backgroundDark + 'CC',
                borderBottomColor: colors.gold + '30',
              }
            ]}
          >
            <Text style={[styles.entryTitle, { color: colors.goldLight }]}>
              {state.isFirstOfMonth && (
                <Text style={[styles.monthPrefix, { color: colors.gold + '99' }]}>
                  {getMonthName(state.month)}{' '}
                </Text>
              )}
              {state.day}
            </Text>
            {!state.hasContent && !state.expanded && (
              <Text style={[styles.placeholder, { color: colors.gold + '59' }]}>
                how was your day?
              </Text>
            )}
          </Pressable>

          {(state.expanded || state.hasContent) && (
            <TextInput
              style={[
                styles.entryInput,
                {
                  color: colors.text + 'E6',
                  backgroundColor: 'transparent',
                  minHeight: state.expanded ? 240 : 'auto',
                }
              ]}
              multiline
              placeholder={state.expanded ? "how was your day?" : ""}
              placeholderTextColor={colors.gold + '59'}
              value={state.content}
              onChangeText={(text) => handleContentChange(state.dateKey, text)}
              scrollEnabled={false}
              onFocus={() => handleToggle(state.dateKey)}
            />
          )}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: 20,
  },
  entrySection: {
    borderBottomWidth: 1,
  },
  entryHeader: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  entryTitle: {
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 1.5,
  },
  monthPrefix: {
    fontSize: 16,
  },
  placeholder: {
    fontSize: 14,
    fontStyle: 'italic',
    marginTop: 4,
  },
  entryInput: {
    padding: 16,
    fontSize: 15,
    lineHeight: 24,
    textAlignVertical: 'top',
  },
});
