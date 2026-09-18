import { StyleSheet, FlatList, Pressable, Modal, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Text, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { getAllEntries, saveEntry, JournalEntry } from '@/lib/storage';

export default function YearScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [editorVisible, setEditorVisible] = useState(false);
  const [editorContent, setEditorContent] = useState('');

  const loadEntries = async () => {
    const yearEntries = await getAllEntries('year');
    setEntries(yearEntries);
  };

  useEffect(() => {
    loadEntries();
  }, []);

  const handleOpenEditor = (year: number) => {
    const entry = entries.find(e => e.date === String(year));
    if (entry) {
      setEditingEntry(entry);
      setEditorContent(entry.content);
    } else {
      setEditingEntry({ date: String(year), content: '', updatedAt: new Date().toISOString() });
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
  const years = Array.from({ length: 10 }, (_, i) => currentYear - i);

  const renderYear = ({ item: year }: { item: number }) => {
    const entry = entries.find(e => e.date === String(year));
    const hasContent = entry && entry.content.trim().length > 0;

    return (
      <Pressable
        style={[styles.entryCard, { 
          backgroundColor: hasContent ? colors.backgroundLight : 'transparent', 
          borderColor: colors.gold + '30' 
        }]}
        onPress={() => handleOpenEditor(year)}
      >
        <View style={[styles.entryHeader, { backgroundColor: 'transparent' }]}>
          <Text style={[styles.entryTitle, { color: colors.goldLight }]}>{year}</Text>
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

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={years}
        renderItem={renderYear}
        keyExtractor={item => String(item)}
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
              {editingEntry?.date}
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
            placeholder="how was your year?"
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
