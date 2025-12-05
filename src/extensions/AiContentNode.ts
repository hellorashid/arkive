import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import AiContentCard from '../components/AiContentCard';

export interface AiContentAttributes {
  commandId: string;
  userInput: string;
  response: string;
  isLoading: boolean;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    aiContent: {
      insertAiCommand: (commandId: string, autoRun?: boolean) => ReturnType;
    };
  }
}

export const AiContentNode = Node.create({
  name: 'aiContent',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      commandId: { default: 'ask' },
      userInput: { default: '' },
      response: { default: '' },
      isLoading: { default: false },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-ai-content]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-ai-content': '' })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(AiContentCard);
  },

  addCommands() {
    return {
      insertAiCommand:
        (commandId: string, autoRun = false) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: {
              commandId,
              userInput: '',
              response: '',
              isLoading: autoRun,
            },
          });
        },
    };
  },
});
