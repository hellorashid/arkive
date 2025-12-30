import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Save, RotateCcw, Server, Key, Cloud, Plus, Trash2, Sparkles, MessageCircleQuestion, Lightbulb, Heart, Star, Ban, Database, Cpu, Upload, Smartphone, Check, X, Download, Info } from 'lucide-react';
import { useBasic } from '@basictech/react';

// PWA install prompt event type
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}
import { 
  AISettings, 
  Command,
  Tone, 
  DEFAULT_SETTINGS,
  DEFAULT_COMMANDS,
  OLLAMA_MODELS,
  BYOK_PROVIDERS,
  COMMAND_ICONS,
} from '../lib/ai-config';
import { getAISettings, saveAISettings, resetAISettings } from '../lib/storage';
import dailyPlaceholders from '../data/placeholder/daily.json';
import monthlyPlaceholders from '../data/placeholder/monthly.json';
import yearlyPlaceholders from '../data/placeholder/yearly.json';

type DailyPlaceholder = { date: string; entry: string };
type MonthlyPlaceholder = { month: string; entry: string };
type YearlyPlaceholder = { year: string; entry: string };

const ICON_COMPONENTS = {
  'sparkles': Sparkles,
  'message-circle-question': MessageCircleQuestion,
  'lightbulb': Lightbulb,
  'heart': Heart,
  'star': Star,
} as const;

type SettingsTab = 'ai' | 'data';

// Convert plain text to TipTap JSON format
const textToTiptapJSON = (text: string) => {
  const paragraphs = text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  if (paragraphs.length === 0) {
    return {
      type: 'doc',
      content: [{ type: 'paragraph' }],
    };
  }

  return {
    type: 'doc',
    content: paragraphs.map((line) => ({
      type: 'paragraph',
      content: [{ type: 'text', text: line }],
    })),
  };
};

export default function Settings() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('ai');
  const [settings, setSettings] = useState<AISettings>(DEFAULT_SETTINGS);
  const [saved, setSaved] = useState(false);
  const [expandedCommand, setExpandedCommand] = useState<string | null>(null);
  const [loadingTestData, setLoadingTestData] = useState(false);
  const [testDataLoaded, setTestDataLoaded] = useState(false);
  
  // PWA state
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isPWAInstalled, setIsPWAInstalled] = useState(false);
  const [isPWASupported, setIsPWASupported] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  
  const { db, isSignedIn, signout } = useBasic();

  useEffect(() => {
    setSettings(getAISettings());
  }, []);

  // PWA detection and install prompt capture
  useEffect(() => {
    // Check if already installed (standalone mode)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches 
      || (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    setIsPWAInstalled(isStandalone);

    // Check if PWA is supported
    const hasServiceWorker = 'serviceWorker' in navigator;
    setIsPWASupported(hasServiceWorker);

    // Capture the install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    // Listen for successful installation
    const handleAppInstalled = () => {
      setIsPWAInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallPWA = async () => {
    if (!deferredPrompt) return;
    
    setIsInstalling(true);
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsPWAInstalled(true);
      }
      setDeferredPrompt(null);
    } catch (error) {
      console.error('PWA installation failed:', error);
    } finally {
      setIsInstalling(false);
    }
  };

  const handleSave = () => {
    saveAISettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    const defaults = resetAISettings();
    setSettings(defaults);
  };

  const updateSetting = <K extends keyof AISettings>(key: K, value: AISettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const updateCommand = (commandId: string, updates: Partial<Command>) => {
    setSettings(prev => ({
      ...prev,
      commands: prev.commands.map(cmd => 
        cmd.id === commandId ? { ...cmd, ...updates } : cmd
      ),
    }));
  };

  const addCommand = () => {
    const newId = `custom-${Date.now()}`;
    const newCommand: Command = {
      id: newId,
      slash: '/new',
      title: 'New Command',
      description: 'A custom command',
      systemPrompt: 'You are a helpful assistant.',
      icon: 'star',
      requiresInput: true,
    };
    setSettings(prev => ({
      ...prev,
      commands: [...prev.commands, newCommand],
    }));
    setExpandedCommand(newId);
  };

  const deleteCommand = (commandId: string) => {
    setSettings(prev => ({
      ...prev,
      commands: prev.commands.filter(cmd => cmd.id !== commandId),
    }));
  };

  const resetCommand = (commandId: string) => {
    const defaultCommand = DEFAULT_COMMANDS.find(c => c.id === commandId);
    if (defaultCommand) {
      updateCommand(commandId, defaultCommand);
    }
  };

  const handleLoadTestData = async () => {
    if (!db) {
      alert('Database not available');
      return;
    }

    setLoadingTestData(true);
    try {
      // Load yearly placeholders
      for (const { year, entry } of yearlyPlaceholders as YearlyPlaceholder[]) {
        const dateKey = year; // Just the year, e.g., "2025"
        await db.collection('entries').add({
          date: dateKey,
          content: textToTiptapJSON(entry),
        });
      }

      // Load monthly placeholders
      for (const { month, entry } of monthlyPlaceholders as MonthlyPlaceholder[]) {
        // month is in format "YYYY-MM"
        await db.collection('entries').add({
          date: month,
          content: textToTiptapJSON(entry),
        });
      }

      // Load daily placeholders
      for (const { date, entry } of dailyPlaceholders as DailyPlaceholder[]) {
        // date is in format "YYYY-MM-DD"
        await db.collection('entries').add({
          date: date,
          content: textToTiptapJSON(entry),
        });
      }

      setTestDataLoaded(true);
      setTimeout(() => setTestDataLoaded(false), 3000);
    } catch (error) {
      console.error('Failed to load test data:', error);
      alert('Failed to load test data. Check the console for details.');
    } finally {
      setLoadingTestData(false);
    }
  };

  const handleClearAllData = async () => {
    if (!confirm('Are you sure you want to clear all local data? This will sign you out if logged in.')) {
      return;
    }

    setLoadingTestData(true);
    try {
      // Clear localStorage
      localStorage.clear();

      // Clear all IndexedDB databases
      const databases = await indexedDB.databases();
      for (const dbInfo of databases) {
        if (dbInfo.name) {
          indexedDB.deleteDatabase(dbInfo.name);
        }
      }

      // Clear caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        for (const cacheName of cacheNames) {
          await caches.delete(cacheName);
        }
      }

      // Sign out if signed in
      if (isSignedIn) {
        signout();
      }

      alert('All local data has been cleared.');
      
      // Reload to reset app state
      window.location.reload();
    } catch (error) {
      console.error('Failed to clear data:', error);
      alert('Failed to clear data. Check the console for details.');
    } finally {
      setLoadingTestData(false);
    }
  };

  const currentBYOKProvider = BYOK_PROVIDERS.find(p => p.id === settings.byokProvider);

  return (
    <div className="min-h-screen w-screen bg-linear-to-br from-tarot-darker to-tarot-dark font-tarot">
      <div className="max-w-3xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link 
            to="/"
            className="w-10 h-10 rounded-full bg-tarot-gold/10 border border-tarot-gold/30 flex items-center justify-center hover:bg-tarot-gold/20 transition-colors"
          >
            <ArrowLeft size={18} className="text-tarot-gold" />
          </Link>
          <h1 className="text-2xl font-semibold text-tarot-gold-light tracking-wide">Settings</h1>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-8 border-b border-tarot-gold/20 pb-4">
          <button
            onClick={() => setActiveTab('ai')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'ai'
                ? 'bg-tarot-gold/20 text-tarot-gold-light border border-tarot-gold'
                : 'text-white/60 hover:text-white/80 border border-transparent'
            }`}
          >
            <Cpu size={18} />
            AI Settings
          </button>
          <button
            onClick={() => setActiveTab('data')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'data'
                ? 'bg-tarot-gold/20 text-tarot-gold-light border border-tarot-gold'
                : 'text-white/60 hover:text-white/80 border border-transparent'
            }`}
          >
            <Database size={18} />
            Data
          </button>
        </div>

        {/* AI Settings Tab */}
        {activeTab === 'ai' && (
          <>
            {/* Provider Selection */}
            <section className="mb-8">
              <h2 className="text-lg text-tarot-gold-light mb-4 tracking-wide">AI Provider</h2>
              <div className="grid grid-cols-4 gap-3">
                <ProviderCard
                  icon={<Ban size={20} />}
                  title="None"
                  description="Disable AI"
                  selected={settings.provider === 'none'}
                  onClick={() => updateSetting('provider', 'none')}
                />
                <ProviderCard
                  icon={<Server size={20} />}
                  title="Ollama"
                  description="Local AI"
                  selected={settings.provider === 'ollama'}
                  onClick={() => updateSetting('provider', 'ollama')}
                />
                <ProviderCard
                  icon={<Key size={20} />}
                  title="BYOK"
                  description="Your API key"
                  selected={settings.provider === 'byok'}
                  onClick={() => updateSetting('provider', 'byok')}
                />
                <ProviderCard
                  icon={<Cloud size={20} />}
                  title="Cloud"
                  description="Free for a limited time"
                  selected={settings.provider === 'cloud'}
                  onClick={() => updateSetting('provider', 'cloud')}
                />
              </div>
            </section>

            {/* Provider-specific settings */}
            {settings.provider === 'ollama' && (
              <section className="mb-8 p-4 bg-tarot-dark/50 border border-tarot-gold/20 rounded-lg">
                <h3 className="text-sm text-tarot-gold mb-4 uppercase tracking-wider">Ollama Configuration</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-white/70 mb-2">Endpoint</label>
                    <input
                      type="text"
                      value={settings.ollamaEndpoint}
                      onChange={(e) => updateSetting('ollamaEndpoint', e.target.value)}
                      className="w-full bg-tarot-darker border border-tarot-gold/30 rounded px-3 py-2 text-white/90 focus:outline-none focus:border-tarot-gold"
                      placeholder="http://localhost:11434"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-white/70 mb-2">Model</label>
                    <select
                      value={settings.ollamaModel}
                      onChange={(e) => updateSetting('ollamaModel', e.target.value)}
                      className="w-full bg-tarot-darker border border-tarot-gold/30 rounded px-3 py-2 text-white/90 focus:outline-none focus:border-tarot-gold"
                    >
                      {OLLAMA_MODELS.map(model => (
                        <option key={model} value={model}>{model}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </section>
            )}

            {settings.provider === 'byok' && (
              <section className="mb-8 p-4 bg-tarot-dark/50 border border-tarot-gold/20 rounded-lg">
                <h3 className="text-sm text-tarot-gold mb-4 uppercase tracking-wider">API Key Configuration</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-white/70 mb-2">Provider</label>
                    <select
                      value={settings.byokProvider}
                      onChange={(e) => {
                        const provider = e.target.value as AISettings['byokProvider'];
                        const providerConfig = BYOK_PROVIDERS.find(p => p.id === provider);
                        updateSetting('byokProvider', provider);
                        if (providerConfig) {
                          updateSetting('byokModel', providerConfig.models[0]);
                        }
                      }}
                      className="w-full bg-tarot-darker border border-tarot-gold/30 rounded px-3 py-2 text-white/90 focus:outline-none focus:border-tarot-gold"
                    >
                      {BYOK_PROVIDERS.map(provider => (
                        <option key={provider.id} value={provider.id}>{provider.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-white/70 mb-2">API Key</label>
                    <input
                      type="password"
                      value={settings.byokApiKey}
                      onChange={(e) => updateSetting('byokApiKey', e.target.value)}
                      className="w-full bg-tarot-darker border border-tarot-gold/30 rounded px-3 py-2 text-white/90 focus:outline-none focus:border-tarot-gold"
                      placeholder="sk-..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-white/70 mb-2">Model</label>
                    <select
                      value={settings.byokModel}
                      onChange={(e) => updateSetting('byokModel', e.target.value)}
                      className="w-full bg-tarot-darker border border-tarot-gold/30 rounded px-3 py-2 text-white/90 focus:outline-none focus:border-tarot-gold"
                    >
                      {currentBYOKProvider?.models.map(model => (
                        <option key={model} value={model}>{model}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </section>
            )}

            {settings.provider === 'cloud' && (
              <section className="mb-8 p-4 bg-tarot-dark/50 border border-tarot-gold/20 rounded-lg">
                <h3 className="text-sm text-tarot-gold mb-4 uppercase tracking-wider">Cloud Provider</h3>
                <p className="text-white/60 text-sm">
                  Using our cloud servers powered by OpenRouter. No configuration needed.
                </p>
              </section>
            )}

            {/* Tone Selection - only show if AI is enabled */}
            {settings.provider !== 'none' && (
              <section className="mb-8">
                <h2 className="text-lg text-tarot-gold-light mb-4 tracking-wide">Response Tone</h2>
                <div className="grid grid-cols-2 gap-3">
                  {(['mystical', 'direct', 'gentle', 'analytical'] as Tone[]).map(tone => (
                    <button
                      key={tone}
                      onClick={() => updateSetting('tone', tone)}
                      className={`p-3 rounded-lg border text-left transition-colors ${
                        settings.tone === tone
                          ? 'bg-tarot-gold/20 border-tarot-gold text-tarot-gold-light'
                          : 'bg-tarot-dark/50 border-tarot-gold/20 text-white/70 hover:border-tarot-gold/40'
                      }`}
                    >
                      <span className="capitalize">{tone}</span>
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* Commands - only show if AI is enabled */}
            {settings.provider !== 'none' && (
              <section className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg text-tarot-gold-light tracking-wide">Commands</h2>
                  <button
                    onClick={addCommand}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm bg-tarot-gold/10 border border-tarot-gold/30 rounded-lg text-tarot-gold hover:bg-tarot-gold/20 transition-colors"
                  >
                    <Plus size={14} />
                    Add Command
                  </button>
                </div>
                
                <div className="space-y-3">
                  {settings.commands.map((cmd) => {
                    const IconComponent = ICON_COMPONENTS[cmd.icon] || Sparkles;
                    const isExpanded = expandedCommand === cmd.id;
                    const isDefault = DEFAULT_COMMANDS.some(d => d.id === cmd.id);
                    
                    return (
                      <div 
                        key={cmd.id}
                        className="bg-tarot-dark/50 border border-tarot-gold/20 rounded-lg overflow-hidden"
                      >
                        <button
                          onClick={() => setExpandedCommand(isExpanded ? null : cmd.id)}
                          className="w-full flex items-center gap-3 p-4 text-left hover:bg-tarot-gold/5 transition-colors"
                        >
                          <IconComponent size={18} className="text-tarot-gold" />
                          <div className="flex-1">
                            <div className="text-white/90 font-medium">{cmd.title}</div>
                            <div className="text-white/50 text-sm">{cmd.slash}</div>
                          </div>
                          <div className="text-white/30 text-sm">
                            {isExpanded ? '▲' : '▼'}
                          </div>
                        </button>
                        
                        {isExpanded && (
                          <div className="px-4 pb-4 space-y-4 border-t border-tarot-gold/10 pt-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm text-white/70 mb-2">Title</label>
                                <input
                                  type="text"
                                  value={cmd.title}
                                  onChange={(e) => updateCommand(cmd.id, { title: e.target.value })}
                                  className="w-full bg-tarot-darker border border-tarot-gold/30 rounded px-3 py-2 text-white/90 text-sm focus:outline-none focus:border-tarot-gold"
                                />
                              </div>
                              <div>
                                <label className="block text-sm text-white/70 mb-2">Slash Command</label>
                                <input
                                  type="text"
                                  value={cmd.slash}
                                  onChange={(e) => updateCommand(cmd.id, { slash: e.target.value })}
                                  className="w-full bg-tarot-darker border border-tarot-gold/30 rounded px-3 py-2 text-white/90 text-sm focus:outline-none focus:border-tarot-gold"
                                />
                              </div>
                            </div>
                            
                            <div>
                              <label className="block text-sm text-white/70 mb-2">Description</label>
                              <input
                                type="text"
                                value={cmd.description}
                                onChange={(e) => updateCommand(cmd.id, { description: e.target.value })}
                                className="w-full bg-tarot-darker border border-tarot-gold/30 rounded px-3 py-2 text-white/90 text-sm focus:outline-none focus:border-tarot-gold"
                              />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm text-white/70 mb-2">Icon</label>
                                <select
                                  value={cmd.icon}
                                  onChange={(e) => updateCommand(cmd.id, { icon: e.target.value as Command['icon'] })}
                                  className="w-full bg-tarot-darker border border-tarot-gold/30 rounded px-3 py-2 text-white/90 text-sm focus:outline-none focus:border-tarot-gold"
                                >
                                  {COMMAND_ICONS.map(icon => (
                                    <option key={icon.id} value={icon.id}>{icon.label}</option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label className="block text-sm text-white/70 mb-2">Input Required</label>
                                <select
                                  value={cmd.requiresInput ? 'yes' : 'no'}
                                  onChange={(e) => updateCommand(cmd.id, { requiresInput: e.target.value === 'yes' })}
                                  className="w-full bg-tarot-darker border border-tarot-gold/30 rounded px-3 py-2 text-white/90 text-sm focus:outline-none focus:border-tarot-gold"
                                >
                                  <option value="yes">Yes - user types a prompt</option>
                                  <option value="no">No - runs automatically</option>
                                </select>
                              </div>
                            </div>
                            
                            <div>
                              <label className="block text-sm text-white/70 mb-2">System Prompt</label>
                              <textarea
                                value={cmd.systemPrompt}
                                onChange={(e) => updateCommand(cmd.id, { systemPrompt: e.target.value })}
                                rows={4}
                                className="w-full bg-tarot-darker border border-tarot-gold/30 rounded px-3 py-2 text-white/90 text-sm focus:outline-none focus:border-tarot-gold resize-none"
                              />
                            </div>
                            
                            <div className="flex items-center gap-2 pt-2">
                              {isDefault && (
                                <button
                                  onClick={() => resetCommand(cmd.id)}
                                  className="text-xs text-white/50 hover:text-white/70"
                                >
                                  Reset to default
                                </button>
                              )}
                              {!isDefault && (
                                <button
                                  onClick={() => deleteCommand(cmd.id)}
                                  className="flex items-center gap-1 text-xs text-red-400/70 hover:text-red-400"
                                >
                                  <Trash2 size={12} />
                                  Delete command
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-4 py-2 bg-tarot-gold/20 border border-tarot-gold rounded-lg text-tarot-gold-light hover:bg-tarot-gold/30 transition-colors"
              >
                <Save size={16} />
                {saved ? 'Saved!' : 'Save Settings'}
              </button>
              <button
                onClick={handleReset}
                className="flex items-center gap-2 px-4 py-2 bg-tarot-dark/50 border border-tarot-gold/30 rounded-lg text-white/70 hover:text-white/90 hover:border-tarot-gold/50 transition-colors"
              >
                <RotateCcw size={16} />
                Reset to Defaults
              </button>
            </div>
          </>
        )}

        {/* Data Tab */}
        {activeTab === 'data' && (
          <>
            {/* PWA Section */}
            <section className="mb-8">
              <h2 className="text-lg text-tarot-gold-light mb-4 tracking-wide flex items-center gap-2">
                <Smartphone size={20} />
                Progressive Web App
              </h2>
              <div className="p-4 bg-tarot-dark/50 border border-tarot-gold/20 rounded-lg space-y-4">
                {/* Status indicators */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-white/70 text-sm">PWA Support</span>
                    <div className="flex items-center gap-2">
                      {isPWASupported ? (
                        <>
                          <Check size={16} className="text-green-400" />
                          <span className="text-green-400 text-sm">Supported</span>
                        </>
                      ) : (
                        <>
                          <X size={16} className="text-red-400" />
                          <span className="text-red-400 text-sm">Not Supported</span>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-white/70 text-sm">Installation Status</span>
                    <div className="flex items-center gap-2">
                      {isPWAInstalled ? (
                        <>
                          <Check size={16} className="text-green-400" />
                          <span className="text-green-400 text-sm">Installed</span>
                        </>
                      ) : deferredPrompt ? (
                        <>
                          <Download size={16} className="text-tarot-gold" />
                          <span className="text-tarot-gold text-sm">Ready to Install</span>
                        </>
                      ) : (
                        <>
                          <Info size={16} className="text-white/50" />
                          <span className="text-white/50 text-sm">Not Installed</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Install button */}
                {!isPWAInstalled && deferredPrompt && (
                  <button
                    onClick={handleInstallPWA}
                    disabled={isInstalling}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-tarot-gold/20 border border-tarot-gold rounded-lg text-tarot-gold-light hover:bg-tarot-gold/30 transition-colors"
                  >
                    <Download size={18} />
                    {isInstalling ? 'Installing...' : 'Install Arkive App'}
                  </button>
                )}

                {/* Installation instructions */}
                <div className="pt-2 border-t border-tarot-gold/10">
                  <h3 className="text-sm text-tarot-gold mb-2 flex items-center gap-2">
                    <Info size={14} />
                    Installation Instructions
                  </h3>
                  {isPWAInstalled ? (
                    <p className="text-white/60 text-sm">
                      Arkive is installed! You can find it on your home screen or in your app drawer.
                    </p>
                  ) : deferredPrompt ? (
                    <p className="text-white/60 text-sm">
                      Click the "Install Arkive App" button above to add Arkive to your home screen for quick access and offline use.
                    </p>
                  ) : (
                    <div className="text-white/60 text-sm space-y-2">
                      <p className="font-medium text-white/70">To install Arkive:</p>
                      <ul className="list-disc list-inside space-y-1 ml-2">
                        <li><span className="text-tarot-gold/80">Chrome/Edge (Desktop):</span> Click the install icon in the address bar, or use the menu → "Install Arkive"</li>
                        <li><span className="text-tarot-gold/80">Safari (iOS):</span> Tap the Share button → "Add to Home Screen"</li>
                        <li><span className="text-tarot-gold/80">Chrome (Android):</span> Tap the menu (⋮) → "Add to Home Screen" or "Install app"</li>
                        <li><span className="text-tarot-gold/80">Firefox:</span> PWA installation may require using Chrome or Edge</li>
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-lg text-tarot-gold-light mb-4 tracking-wide">Test Data</h2>
              <div className="p-4 bg-tarot-dark/50 border border-tarot-gold/20 rounded-lg">
                <p className="text-white/70 text-sm mb-4">
                  Load sample journal entries to see how the app works with content. This will add example entries for years, months, and days.
                </p>
                <button
                  onClick={handleLoadTestData}
                  disabled={loadingTestData}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    testDataLoaded
                      ? 'bg-green-500/20 border border-green-500 text-green-400'
                      : 'bg-tarot-gold/20 border border-tarot-gold text-tarot-gold-light hover:bg-tarot-gold/30'
                  }`}
                >
                  <Upload size={16} />
                  {loadingTestData ? 'Loading...' : testDataLoaded ? 'Test Data Loaded!' : 'Load Test Data'}
                </button>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-lg text-tarot-gold-light mb-4 tracking-wide">Danger Zone</h2>
              <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-lg">
                <p className="text-white/70 text-sm mb-4">
                  Clear all local data (cache, IndexedDB, localStorage). If signed in, this will also sign you out.
                </p>
                <button
                  onClick={handleClearAllData}
                  disabled={loadingTestData}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors bg-red-500/10 border border-red-500/50 text-red-400 hover:bg-red-500/20"
                >
                  <Trash2 size={16} />
                  {loadingTestData ? 'Clearing...' : 'Clear All Local Data'}
                </button>
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}

function ProviderCard({ 
  icon, 
  title, 
  description, 
  selected, 
  onClick 
}: { 
  icon: React.ReactNode; 
  title: string; 
  description: string; 
  selected: boolean; 
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`p-4 rounded-lg border text-left transition-colors ${
        selected
          ? 'bg-tarot-gold/20 border-tarot-gold'
          : 'bg-tarot-dark/50 border-tarot-gold/20 hover:border-tarot-gold/40'
      }`}
    >
      <div className={`mb-2 ${selected ? 'text-tarot-gold-light' : 'text-tarot-gold/60'}`}>
        {icon}
      </div>
      <div className={`font-medium ${selected ? 'text-tarot-gold-light' : 'text-white/80'}`}>
        {title}
      </div>
      <div className="text-xs text-white/50">{description}</div>
    </button>
  );
}
