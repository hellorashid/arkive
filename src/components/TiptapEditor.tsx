import { useEditor, EditorContent, JSONContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { useEffect, useRef, useCallback } from 'react';
import { AiContentNode } from '../extensions/AiContentNode';
import { SlashCommands } from '../extensions/SlashCommands';

interface TiptapEditorProps {
  content: JSONContent | null;
  onChange: (content: JSONContent) => void;
  placeholder?: string;
}

export default function TiptapEditor({ content, onChange, placeholder }: TiptapEditorProps) {
  // Track pending changes for batched saves
  const pendingContentRef = useRef<JSONContent | null>(null);
  const lastSavedContentRef = useRef<string>('');
  
  // Save pending content if it differs from last saved
  const flushChanges = useCallback(() => {
    if (pendingContentRef.current) {
      const pendingJson = JSON.stringify(pendingContentRef.current);
      if (pendingJson !== lastSavedContentRef.current) {
        onChange(pendingContentRef.current);
        lastSavedContentRef.current = pendingJson;
      }
    }
  }, [onChange]);

  const editor = useEditor({
    extensions: [
      StarterKit,
      AiContentNode,
      SlashCommands,
      Placeholder.configure({
        placeholder: placeholder || 'Write something...',
      }),
    ],
    content: content || undefined,
    onUpdate: ({ editor }) => {
      // Store pending content but don't save immediately
      pendingContentRef.current = editor.getJSON();
    },
    onBlur: () => {
      // Save on blur
      flushChanges();
    },
    editorProps: {
      attributes: {
        class: 'tiptap-editor',
      },
    },
  });

  // Set up 3-second save interval
  useEffect(() => {
    const intervalId = setInterval(() => {
      flushChanges();
    }, 3000);

    return () => {
      clearInterval(intervalId);
      // Flush any pending changes on unmount
      flushChanges();
    };
  }, [flushChanges]);

  // Initialize lastSavedContent when content prop changes (external sync)
  useEffect(() => {
    if (content) {
      lastSavedContentRef.current = JSON.stringify(content);
    }
  }, [content]);

  // Sync external content changes
  useEffect(() => {
    if (editor && content) {
      const currentJson = JSON.stringify(editor.getJSON());
      const newJson = JSON.stringify(content);
      if (currentJson !== newJson) {
        editor.commands.setContent(content);
        // Update pending ref to match synced content
        pendingContentRef.current = content;
      }
    }
  }, [content, editor]);

  return (
    <div 
      className="w-full h-full"
      onClick={(e) => e.stopPropagation()}
    >
      <EditorContent editor={editor} className="h-full" />
    </div>
  );
}
