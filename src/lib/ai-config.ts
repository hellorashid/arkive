export type Provider = 'none' | 'ollama' | 'byok' | 'cloud';
export type BYOKProvider = 'openai' | 'anthropic' | 'google';
export type Tone = 'mystical' | 'direct' | 'gentle' | 'analytical';

export interface Command {
  id: string;
  slash: string;
  title: string;
  description: string;
  systemPrompt: string;
  icon: 'sparkles' | 'message-circle-question' | 'lightbulb' | 'heart' | 'star';
  requiresInput: boolean;
}

export interface AISettings {
  provider: Provider;
  // Ollama
  ollamaModel: string;
  ollamaEndpoint: string;
  // BYOK
  byokProvider: BYOKProvider;
  byokApiKey: string;
  byokModel: string;
  // Commands
  commands: Command[];
  tone: Tone;
}

export const DEFAULT_COMMANDS: Command[] = [
  {
    id: 'ask',
    slash: '/ask',
    title: 'Ask',
    description: 'Get thoughtful reflection',
    systemPrompt: `You are a thoughtful reflection assistant for a personal journal. The user will ask you a question, and you may also receive context from their journal entries.

Your role is to:
- Offer meaningful insights based on their question
- Draw connections to patterns or themes if journal context is provided
- Help them think deeper about their experiences and feelings
- Keep responses concise (2-3 sentences) unless more depth is needed`,
    icon: 'sparkles',
    requiresInput: true,
  },
  {
    id: 'prompt',
    slash: '/prompt',
    title: 'Prompt',
    description: 'Get a reflection question',
    systemPrompt: 'Generate a single thought-provoking journaling prompt. It should encourage deep self-reflection. No preamble - just the question itself.',
    icon: 'message-circle-question',
    requiresInput: false,
  },
];

export const TONE_MODIFIERS: Record<Tone, string> = {
  mystical: 'Speak in a mystical, poetic manner with references to cosmic wisdom and inner journeys.',
  direct: 'Be clear and straightforward. Get to the point without flourishes.',
  gentle: 'Use a warm, compassionate tone. Be encouraging and supportive.',
  analytical: 'Take a thoughtful, analytical approach. Help break down complex feelings into understandable parts.',
};

export const DEFAULT_SETTINGS: AISettings = {
  provider: 'cloud',
  ollamaModel: 'llama3.2',
  ollamaEndpoint: 'http://localhost:11434',
  byokProvider: 'openai',
  byokApiKey: '',
  byokModel: 'gpt-4o-mini',
  commands: DEFAULT_COMMANDS,
  tone: 'mystical',
};

export const OLLAMA_MODELS = [
  'llama3.2',
  'llama3.1',
  'mistral',
  'mixtral',
  'phi3',
  'gemma2',
  'qwen2.5',
];

export const BYOK_PROVIDERS: { id: BYOKProvider; name: string; models: string[] }[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'],
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    models: ['claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022', 'claude-3-opus-20240229'],
  },
  {
    id: 'google',
    name: 'Google',
    models: ['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-pro'],
  },
];

export const COMMAND_ICONS = [
  { id: 'sparkles', label: 'Sparkles' },
  { id: 'message-circle-question', label: 'Question' },
  { id: 'lightbulb', label: 'Lightbulb' },
  { id: 'heart', label: 'Heart' },
  { id: 'star', label: 'Star' },
] as const;
