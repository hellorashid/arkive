import { useMemo } from 'react';
import { StyleSheet, ScrollView, TextInput, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';

export type TimelineItem = {
  key: string;
  title: string;
  prefix?: string;
  content: string;
  expanded: boolean;
  hasContent: boolean;
  placeholder: string;
};

type JournalTimelineProps = {
  items: TimelineItem[];
  onToggle: (key: string) => void;
  onChange: (key: string, content: string) => void;
};

export default function JournalTimeline({ items, onToggle, onChange }: JournalTimelineProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];

  const stickyHeaderIndices = useMemo(
    () => items.map((_, index) => index * 2),
    [items.length]
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        stickyHeaderIndices={stickyHeaderIndices}
        keyboardShouldPersistTaps="handled"
      >
        {items.flatMap((item) => [
          <Pressable
            key={`${item.key}-header`}
            onPress={() => onToggle(item.key)}
            style={[
              styles.entryHeader,
              {
                backgroundColor: colors.backgroundDark,
                borderBottomColor: colors.gold + '30',
              },
            ]}
          >
            <Text style={[styles.entryTitle, { color: colors.goldLight }]}>
              {item.prefix ? (
                <Text style={[styles.prefix, { color: colors.gold + '99' }]}>{item.prefix} </Text>
              ) : null}
              {item.title}
            </Text>
          </Pressable>,
          <View
            key={`${item.key}-body`}
            style={[
              styles.entryBody,
              {
                backgroundColor: item.hasContent ? colors.backgroundLight : colors.background,
                borderBottomColor: colors.gold + '20',
                minHeight: item.expanded || item.hasContent ? 280 : 0,
              },
            ]}
          >
            {item.expanded || item.hasContent ? (
              <TextInput
                style={[styles.entryInput, { color: colors.text + 'E6' }]}
                multiline
                placeholder={item.placeholder}
                placeholderTextColor={colors.gold + '59'}
                value={item.content}
                onChangeText={(text) => onChange(item.key, text)}
                scrollEnabled={false}
                onFocus={() => {
                  if (!item.expanded) onToggle(item.key);
                }}
              />
            ) : (
              <Pressable onPress={() => onToggle(item.key)} style={styles.emptyTap}>
                <Text style={[styles.placeholder, { color: colors.gold + '59' }]}>
                  {item.placeholder}
                </Text>
              </Pressable>
            )}
          </View>,
        ])}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingBottom: 24,
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
  prefix: {
    fontSize: 16,
  },
  entryBody: {
    borderBottomWidth: 1,
  },
  entryInput: {
    padding: 16,
    fontSize: 15,
    lineHeight: 24,
    textAlignVertical: 'top',
    backgroundColor: 'transparent',
  },
  emptyTap: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  placeholder: {
    fontSize: 14,
    fontStyle: 'italic',
  },
});
