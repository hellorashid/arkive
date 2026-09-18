import { StyleSheet, FlatList, Pressable, Modal, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Text, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { getAllEntries, saveEntry, JournalEntry, formatMonthDateKey, getMonthName } from '@/lib/storage';

export default function MonthScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [editorVisible, setEditorVisible] = useState(false);
  const [editorContent, setEditorContent] = useState('');

  const loadEntries = async () => {
    const monthEntries = await getAllEntries('month');
    setEntries(monthEntries);
  };

  useEffect(() => {
    loadEntries();
  }, []);

  const handleOpenEditor = (dateKey: string) => {
    const entry = entries.find(e => e.date === dateKey);
    if (entry) {
      setEditingEntry(entry);
      setEditorContent(entry.content);
    } else {
      setEditingEntry({ date: dateKey, content: '', updatedAt: new Date().toISOString() });
      setEditorContent('');
    }
    setEditorVisible(true);
  };

  const handleSave = async () => {
    if (editingEntry) {
      await saveEntry(editingEntry.date, editorContent);
      await loadEntries();
      setEditorVisible(false);
      setEditingEntry(null);
    }
  };

  const currentYear = new Date().getFullYear();
  const currentMonthIndex = new Date().getMonth();
  
  const months = Array.from({ length: currentMonthIndex + 1 }, (_, i) => ({
    monthIndex: currentMonthIndex - i,
    dateKey: formatMonthDateKey(currentYear, currentMonthIndex - i),
    name: getMonthName(currentMonthIndex - i),
  }));

  const renderMonth = ({ item }: { item: { monthIndex: number; dateKey: string; name: string } }) => {
    const entry = entries.find(e => e.date === item.dateKey);
    const hasContent = entry && entry.content.trim().length > 0;

    return (
      <Pressable
        style={[styles.entryCard, { 
          backgroundColor: hasContent ? colors.backgroundLight : 'transparent', 
          borderColor: colors.gold + '30' 
        }]}
        onPress={() => handleOpenEditor(item.dateKey)}
      >
        <View style={[styles.entryHeader, { backgroundColor: 'transparent' }]}>
          <Text style={[styles.entryTitle, { color: colors.goldLight }]}>{item.name}</Text>
          {!hasContent && (
            <Ionicons name="create-outline" size={20} color={colors.gold + '66'} />
          )}
        </View>
        {hasContent && (
          <Text 
            style={[styles.entryPreview, { color: colors.text + '99' }]} 
            numberOfLines={3}
          >
            {entry.content}
          </Text>
        )}
      </Pressable>
    );
  };

  const getEditorTitleFromDateKey = (dateKey: string) => {
    const [, monthStr] = dateKey.split('-');
    const monthIndex = parseInt(monthStr, 10) - 1;
    return getMonthName(monthIndex);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={months}
        renderItem={renderMonth}
        keyExtractor={item => item.dateKey}
        contentContainerStyle={styles.list}
      />

      <Modal
        animationType="slide"
        transparent={false}
        visible={editorVisible}
        onRequestClose={() => setEditorVisible(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={[styles.editorContainer, { backgroundColor: colors.background }]}
        >
          <View style={[styles.editorHeader, { backgroundColor: colors.backgroundDark, borderBottomColor: colors.gold + '30' }]}>
            <Pressable onPress={() => setEditorVisible(false)} style={styles.headerButton}>
              <Ionicons name="close" size={28} color={colors.goldLight} />
            </Pressable>
            <Text style={[styles.editorTitle, { color: colors.goldLight }]}>
              {editingEntry ? getEditorTitleFromDateKey(editingEntry.date) : ''}
            </Text>
            <Pressable onPress={handleSave} style={styles.headerButton}>
              <Ionicons name="checkmark" size={28} color={colors.goldLight} />
            </Pressable>
          </View>
          
          <TextInput
            style={[styles.editor, { 
              color: colors.text, 
              backgroundColor: colors.background 
            }]}
            multiline
            placeholder="how was your month?"
            placeholderTextColor={colors.gold + '59'}
            value={editorContent}
            onChangeText={setEditorContent}
            autoFocus
          />
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    padding: 16,
  },
  entryCard: {
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    minHeight: 80,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  entryTitle: {
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: 1,
  },
  entryPreview: {
    fontSize: 14,
    lineHeight: 22,
  },
  editorContainer: {
    flex: 1,
  },
  editorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  headerButton: {
    padding: 8,
    minWidth: 44,
  },
  editorTitle: {
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: 1,
  },
  editor: {
    flex: 1,
    padding: 20,
    fontSize: 16,
    lineHeight: 26,
    textAlignVertical: 'top',
  },
});
