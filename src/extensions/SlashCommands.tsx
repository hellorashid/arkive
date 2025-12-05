import { Extension } from '@tiptap/core';
import Suggestion, { SuggestionProps, SuggestionKeyDownProps } from '@tiptap/suggestion';
import { ReactRenderer } from '@tiptap/react';
import { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { Sparkles, MessageCircleQuestion, Lightbulb, Heart, Star, Ban } from 'lucide-react';
import { getAISettings } from '../lib/storage';
import { Command } from '../lib/ai-config';

const ICON_MAP = {
  'sparkles': Sparkles,
  'message-circle-question': MessageCircleQuestion,
  'lightbulb': Lightbulb,
  'heart': Heart,
  'star': Star,
} as const;

interface SlashCommandItem {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  requiresInput: boolean;
  disabled?: boolean;
  command: (props: { editor: SuggestionProps['editor']; range: SuggestionProps['range'] }) => void;
}

function getCommandsFromSettings(): SlashCommandItem[] {
  const settings = getAISettings();
  
  // If AI is disabled, return a single disabled item
  if (settings.provider === 'none') {
    return [{
      id: 'disabled',
      title: 'AI features disabled',
      description: 'Enable an AI provider in Settings',
      icon: <Ban size={16} />,
      requiresInput: false,
      disabled: true,
      command: ({ editor, range }) => {
        // Just delete the slash, don't insert anything
        editor.chain().focus().deleteRange(range).run();
      },
    }];
  }
  
  return settings.commands.map((cmd: Command) => {
    const IconComponent = ICON_MAP[cmd.icon] || Sparkles;
    return {
      id: cmd.id,
      title: cmd.title,
      description: cmd.description,
      icon: <IconComponent size={16} />,
      requiresInput: cmd.requiresInput,
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).insertAiCommand(cmd.id, !cmd.requiresInput).run();
      },
    };
  });
}

interface CommandListProps {
  items: SlashCommandItem[];
  command: (item: SlashCommandItem) => void;
}

interface CommandListRef {
  onKeyDown: (props: SuggestionKeyDownProps) => boolean;
}

const CommandList = forwardRef<CommandListRef, CommandListProps>(({ items, command }, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    setSelectedIndex(0);
  }, [items]);

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: SuggestionKeyDownProps) => {
      if (event.key === 'ArrowUp') {
        setSelectedIndex((prev) => (prev - 1 + items.length) % items.length);
        return true;
      }
      if (event.key === 'ArrowDown') {
        setSelectedIndex((prev) => (prev + 1) % items.length);
        return true;
      }
      if (event.key === 'Enter') {
        const item = items[selectedIndex];
        if (item) command(item);
        return true;
      }
      return false;
    },
  }));

  if (items.length === 0) return null;

  return (
    <div className="slash-command-menu">
      {items.map((item, index) => (
        <button
          key={item.id}
          className={`slash-command-item ${index === selectedIndex ? 'is-selected' : ''} ${item.disabled ? 'is-disabled' : ''}`}
          onClick={() => command(item)}
        >
          <div className="slash-command-icon">{item.icon}</div>
          <div className="slash-command-text">
            <div className="slash-command-title">{item.title}</div>
            <div className="slash-command-description">{item.description}</div>
          </div>
        </button>
      ))}
    </div>
  );
});

CommandList.displayName = 'CommandList';

export const SlashCommands = Extension.create({
  name: 'slashCommands',

  addOptions() {
    return {
      suggestion: {
        char: '/',
        startOfLine: true,
        command: ({ editor, range, props }: { editor: SuggestionProps['editor']; range: SuggestionProps['range']; props: SlashCommandItem }) => {
          props.command({ editor, range });
        },
      },
    };
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
        items: ({ query }: { query: string }) => {
          const commands = getCommandsFromSettings();
          return commands.filter((item) =>
            item.title.toLowerCase().includes(query.toLowerCase()) ||
            item.id.toLowerCase().includes(query.toLowerCase())
          );
        },
        render: () => {
          let component: ReactRenderer<CommandListRef> | null = null;
          let popup: HTMLDivElement | null = null;

          return {
            onStart: (props: SuggestionProps) => {
              component = new ReactRenderer(CommandList, {
                props: {
                  items: props.items as SlashCommandItem[],
                  command: (item: SlashCommandItem) => {
                    props.command(item);
                  },
                },
                editor: props.editor,
              });

              popup = document.createElement('div');
              popup.className = 'slash-command-popup';
              document.body.appendChild(popup);

              const { view } = props.editor;
              const { from } = props.range;
              const coords = view.coordsAtPos(from);

              popup.style.position = 'fixed';
              popup.style.left = `${coords.left}px`;
              popup.style.top = `${coords.bottom + 8}px`;
              popup.appendChild(component.element);
            },

            onUpdate: (props: SuggestionProps) => {
              if (component) {
                component.updateProps({
                  items: props.items as SlashCommandItem[],
                  command: (item: SlashCommandItem) => {
                    props.command(item);
                  },
                });
              }

              if (popup) {
                const { view } = props.editor;
                const { from } = props.range;
                const coords = view.coordsAtPos(from);
                popup.style.left = `${coords.left}px`;
                popup.style.top = `${coords.bottom + 8}px`;
              }
            },

            onKeyDown: (props: SuggestionKeyDownProps) => {
              if (props.event.key === 'Escape') {
                if (popup) {
                  popup.remove();
                  popup = null;
                }
                if (component) {
                  component.destroy();
                  component = null;
                }
                return true;
              }
              return component?.ref?.onKeyDown(props) ?? false;
            },

            onExit: () => {
              if (popup) {
                popup.remove();
                popup = null;
              }
              if (component) {
                component.destroy();
                component = null;
              }
            },
          };
        },
      }),
    ];
  },
});
