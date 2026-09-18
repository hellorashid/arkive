import { StyleSheet, ScrollView, TextInput, Pressable } from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { Text, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { getAllEntries, saveEntry, JournalEntry } from '@/lib/storage';

interface YearEntryState {
  year: number;
  content: string;
  expanded: boolean;
  hasContent: boolean;
}

export default function YearScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];
  const [yearStates, setYearStates] = useState<YearEntryState[]>([]);
  const saveTimeouts = useRef<Record<string, NodeJS.Timeout>>({});

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - i);

  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    const yearEntries = await getAllEntries('year');
    const states = years.map(year => {
      const entry = yearEntries.find(e => e.date === String(year));
      return {
        year,
        content: entry?.content || '',
        expanded: false,
        hasContent: !!(entry?.content && entry.content.trim().length > 0),
      };
    });
    setYearStates(states);
  };

  const handleToggle = (year: number) => {
    setYearStates(prev => prev.map(state => 
      state.year === year 
        ? { ...state, expanded: !state.expanded }
        : state
    ));
  };

  const handleContentChange = (year: number, newContent: string) => {
    setYearStates(prev => prev.map(state =>
      state.year === year
        ? { ...state, content: newContent, hasContent: newContent.trim().length > 0 }
        : state
    ));

    // Debounced save
    const key = String(year);
    if (saveTimeouts.current[key]) {
      clearTimeout(saveTimeouts.current[key]);
    }
    saveTimeouts.current[key] = setTimeout(() => {
      saveEntry(String(year), newContent);
    }, 1000);
  };

  return (
    <View style={[styles.wrapper, { backgroundColor: colors.background }]}>
      <View style={[styles.dateHeader, { backgroundColor: colors.backgroundDark, borderBottomColor: colors.gold + '30' }]}>
        <Text style={[styles.dateHeaderText, { color: colors.goldLight }]}>
          {currentYear}
        </Text>
      </View>
      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.content}
      >
      {yearStates.map((state, index) => (
        <View 
          key={state.year}
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
            onPress={() => handleToggle(state.year)}
            style={[
              styles.entryHeader,
              { 
                backgroundColor: colors.backgroundDark + 'CC',
                borderBottomColor: colors.gold + '30',
              }
            ]}
          >
            <Text style={[styles.entryTitle, { color: colors.goldLight }]}>
              {state.year}
            </Text>
            {!state.hasContent && !state.expanded && (
              <Text style={[styles.placeholder, { color: colors.gold + '59' }]}>
                how was your year?
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
              placeholder={state.expanded ? "how was your year?" : ""}
              placeholderTextColor={colors.gold + '59'}
              value={state.content}
              onChangeText={(text) => handleContentChange(state.year, text)}
              scrollEnabled={false}
              onFocus={() => handleToggle(state.year)}
            />
          )}
        </View>
      ))}
    </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  dateHeader: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    alignItems: 'center',
  },
  dateHeaderText: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 2,
  },
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
