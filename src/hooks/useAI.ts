import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { createOllama } from 'ollama-ai-provider-v2';
import { getAISettings } from '../lib/storage';
import { TONE_MODIFIERS, Command } from '../lib/ai-config';
import { useJournalContext, buildJournalContextString } from '../lib/journal-context';

interface GenerateOptions {
  commandId: string;
  userInput?: string;
}

interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

interface GenerateResult {
  text: string;
  usage?: TokenUsage;
}

// Estimate tokens from text (rough approximation: ~4 chars per token for English)
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

// Debug logging helper
function logAIRequest(data: {
  provider: string;
  model: string;
  endpoint?: string;
  commandId: string;
  systemPrompt: string;
  userPrompt: string;
  journalContext: string;
  tone: string;
  estimatedInputTokens: number;
}) {
  console.group('🔮 AI Request');
  console.log('Provider:', data.provider);
  console.log('Model:', data.model);
  if (data.endpoint) console.log('Endpoint:', data.endpoint);
  console.log('Command ID:', data.commandId);
  console.log('Tone:', data.tone);
  console.log('System Prompt:', data.systemPrompt);
  console.log('Journal Context:', data.journalContext || '(none)');
  console.log('User Prompt:', data.userPrompt);
  console.log('📊 Estimated Input Tokens:', data.estimatedInputTokens);
  console.groupEnd();
}

function logAIResponse(data: {
  text: string;
  duration: number;
  usage?: TokenUsage;
  estimatedOutputTokens: number;
}) {
  console.group('✨ AI Response');
  console.log('Duration:', `${data.duration}ms`);
  console.log('Response:', data.text);
  console.group('📊 Token Usage');
  if (data.usage) {
    console.log('Prompt Tokens:', data.usage.promptTokens);
    console.log('Completion Tokens:', data.usage.completionTokens);
    console.log('Total Tokens:', data.usage.totalTokens);
  } else {
    console.log('Estimated Output Tokens:', data.estimatedOutputTokens);
    console.log('(Actual usage not available from provider)');
  }
  console.groupEnd();
  console.groupEnd();
}

function logAIError(error: unknown) {
  console.group('❌ AI Error');
  console.error('Error:', error);
  console.groupEnd();
}

export function useAI() {
  const journalEntries = useJournalContext();

  const isEnabled = (): boolean => {
    const settings = getAISettings();
    return settings.provider !== 'none';
  };

  const getCommand = (commandId: string): Command | undefined => {
    const settings = getAISettings();
    return settings.commands.find(c => c.id === commandId);
  };

  const generateResponse = async ({ commandId, userInput }: GenerateOptions): Promise<string> => {
    const settings = getAISettings();
    const command = settings.commands.find(c => c.id === commandId);
    
    if (!command) {
      throw new Error(`Command not found: ${commandId}`);
    }

    // Build system prompt with tone modifier
    const toneModifier = TONE_MODIFIERS[settings.tone];
    const systemPrompt = `${command.systemPrompt}\n\n${toneModifier}`;
    
    // Build journal context
    const journalContext = journalEntries ? buildJournalContextString(journalEntries) : '';
    
    // Build the full user prompt with journal context
    const basePrompt = userInput || 'Generate a response.';
    const prompt = journalContext 
      ? `${journalContext}\n\nUser question: ${basePrompt}`
      : basePrompt;

    // Estimate input tokens
    const estimatedInputTokens = estimateTokens(systemPrompt) + estimateTokens(prompt);

    const startTime = Date.now();

    try {
      let result: GenerateResult;

      // Route to the appropriate provider
      switch (settings.provider) {
        case 'none':
          throw new Error('AI is disabled. Enable an AI provider in Settings to use this feature.');
        case 'ollama':
          logAIRequest({
            provider: 'ollama',
            model: settings.ollamaModel,
            endpoint: settings.ollamaEndpoint,
            commandId,
            systemPrompt,
            journalContext,
            userPrompt: basePrompt,
            tone: settings.tone,
            estimatedInputTokens,
          });
          result = await generateWithOllama(systemPrompt, prompt, settings.ollamaModel, settings.ollamaEndpoint);
          break;
        case 'byok':
          logAIRequest({
            provider: `byok (${settings.byokProvider})`,
            model: settings.byokModel,
            commandId,
            systemPrompt,
            journalContext,
            userPrompt: basePrompt,
            tone: settings.tone,
            estimatedInputTokens,
          });
          result = await generateWithBYOK(systemPrompt, prompt, settings);
          break;
        case 'cloud':
          logAIRequest({
            provider: 'cloud (OpenRouter)',
            model: 'server-configured',
            endpoint: '/api/chat',
            commandId,
            systemPrompt,
            journalContext,
            userPrompt: basePrompt,
            tone: settings.tone,
            estimatedInputTokens,
          });
          result = await generateWithCloud(systemPrompt, prompt);
          break;
        default:
          throw new Error(`Unknown provider: ${settings.provider}`);
      }

      const duration = Date.now() - startTime;
      logAIResponse({
        text: result.text,
        duration,
        usage: result.usage,
        estimatedOutputTokens: estimateTokens(result.text),
      });
      return result.text;
    } catch (error) {
      logAIError(error);
      throw error;
    }
  };

  return { generateResponse, getCommand, isEnabled };
}

async function generateWithOllama(
  systemPrompt: string,
  userPrompt: string,
  model: string,
  endpoint: string
): Promise<GenerateResult> {
  // Use the community ollama-ai-provider-v2 for AI SDK v5 compatibility
  const ollama = createOllama({
    baseURL: `${endpoint}/api`,
  });

  const { text, usage } = await generateText({
    model: ollama(model),
    system: systemPrompt,
    prompt: userPrompt,
  });

  return {
    text,
    usage: usage ? {
      promptTokens: usage.promptTokens,
      completionTokens: usage.completionTokens,
      totalTokens: usage.totalTokens,
    } : undefined,
  };
}

async function generateWithBYOK(
  systemPrompt: string,
  userPrompt: string,
  settings: ReturnType<typeof getAISettings>
): Promise<GenerateResult> {
  let provider;

  switch (settings.byokProvider) {
    case 'openai':
      provider = createOpenAI({
        apiKey: settings.byokApiKey,
      });
      break;
    case 'anthropic':
      // Use OpenAI-compatible endpoint for Anthropic
      provider = createOpenAI({
        apiKey: settings.byokApiKey,
        baseURL: 'https://api.anthropic.com/v1',
      });
      break;
    case 'google':
      // Use OpenAI-compatible endpoint for Google
      provider = createOpenAI({
        apiKey: settings.byokApiKey,
        baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai',
      });
      break;
    default:
      throw new Error(`Unknown BYOK provider: ${settings.byokProvider}`);
  }

  const { text, usage } = await generateText({
    model: provider(settings.byokModel),
    system: systemPrompt,
    prompt: userPrompt,
  });

  return {
    text,
    usage: usage ? {
      promptTokens: usage.promptTokens,
      completionTokens: usage.completionTokens,
      totalTokens: usage.totalTokens,
    } : undefined,
  };
}

async function generateWithCloud(
  systemPrompt: string,
  userPrompt: string
): Promise<GenerateResult> {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      system: systemPrompt,
      prompt: userPrompt,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Cloud API error: ${error}`);
  }

  const data = await response.json();
  return {
    text: data.text,
    usage: data.usage,
  };
}
