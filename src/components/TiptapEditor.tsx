import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { useEffect } from 'react';
import { AiContentNode } from '../extensions/AiContentNode';
import { SlashCommands } from '../extensions/SlashCommands';

interface TiptapEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
}

export default function TiptapEditor({ content, onChange, placeholder }: TiptapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      AiContentNode,
      SlashCommands,
      Placeholder.configure({
        placeholder: placeholder || 'Write something...',
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'tiptap-editor',
      },
    },
  });

  // Sync external content changes
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
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
