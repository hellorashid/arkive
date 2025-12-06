import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';

const app = new Hono();

// Enable CORS for the frontend
app.use('/*', cors({
  origin: ['http://localhost:5173', 'http://localhost:4173'],
  allowMethods: ['POST', 'OPTIONS'],
  allowHeaders: ['Content-Type'],
}));

// OpenRouter API configuration
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'anthropic/claude-3.5-haiku';

app.post('/api/chat', async (c) => {
  if (!OPENROUTER_API_KEY) {
    return c.json({ error: 'OpenRouter API key not configured' }, 500);
  }

  try {
    const { system, prompt } = await c.req.json();

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://journal.app',
        'X-Title': 'Arkive',
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: prompt },
        ],
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenRouter error:', error);
      return c.json({ error: 'Failed to generate response' }, 500);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || '';
    
    // Extract usage info from OpenRouter response
    const usage = data.usage ? {
      promptTokens: data.usage.prompt_tokens,
      completionTokens: data.usage.completion_tokens,
      totalTokens: data.usage.total_tokens,
    } : undefined;

    return c.json({ text, usage });
  } catch (error) {
    console.error('Server error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Health check
app.get('/health', (c) => c.json({ status: 'ok' }));

const port = parseInt(process.env.PORT || '3001');

console.log(`🔮 Proxy server running on http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port,
});

