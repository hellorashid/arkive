import { NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2 } from 'lucide-react';
import { useAI } from '../hooks/useAI';
import { Command } from '../lib/ai-config';

export default function AiContentCard({ node, updateAttributes, deleteNode }: NodeViewProps) {
  const { commandId, userInput, response, isLoading } = node.attrs;
  const [inputValue, setInputValue] = useState(userInput);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const hasInitialized = useRef(false);
  const { generateResponse, getCommand } = useAI();
  
  const command: Command | undefined = getCommand(commandId);
  const requiresInput = command?.requiresInput ?? true;

  // Focus input if this command requires input
  useEffect(() => {
    if (requiresInput && !userInput && inputRef.current) {
      inputRef.current.focus();
    }
  }, [userInput, requiresInput]);

  // Auto-run for commands that don't require input
  useEffect(() => {
    if (!requiresInput && isLoading && !hasInitialized.current) {
      hasInitialized.current = true;
      runCommand();
    }
  }, [requiresInput, isLoading]);

  const runCommand = async (input?: string) => {
    setError(null);
    try {
      const result = await generateResponse({
        commandId,
        userInput: input,
      });
      updateAttributes({ response: result, isLoading: false });
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to get response';
      setError(message);
      updateAttributes({ isLoading: false });
    }
  };

  const handleSubmit = async () => {
    if (!inputValue.trim()) return;
    updateAttributes({ userInput: inputValue, isLoading: true });
    await runCommand(inputValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === 'Escape') {
      deleteNode();
    }
  };

  const handleRetry = () => {
    setError(null);
    updateAttributes({ isLoading: true });
    if (!requiresInput) {
      hasInitialized.current = false;
    } else if (inputValue.trim()) {
      runCommand(inputValue);
    }
  };

  const title = command?.title || 'AI';

  return (
    <NodeViewWrapper className="ai-content-wrapper">
      <motion.div 
        className={`ai-content-card ${!requiresInput ? 'ai-content-card--prompt' : ''}`} 
        contentEditable={false}
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
        <div className="ai-card-header">
          <span>{title}</span>
          <button className="ai-card-close" onClick={deleteNode}>
            <X size={12} />
          </button>
        </div>

        <AnimatePresence mode="wait">
          {error ? (
            <motion.div 
              key="error"
              className="ai-card-content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="ai-card-error">
                <p>{error}</p>
                <button onClick={handleRetry} className="ai-card-retry">
                  Try again
                </button>
              </div>
            </motion.div>
          ) : !requiresInput ? (
            // Auto-run command: show loading or response
            <div className="ai-card-content">
              <AnimatePresence mode="wait">
                {isLoading ? (
                  <motion.div 
                    key="loading"
                    className="ai-card-loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    >
                      <Loader2 size={14} />
                    </motion.div>
                    <span>Generating...</span>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="reflection"
                    className="ai-card-reflection"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                  >
                    {response}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            // Input command: show input or response
            <AnimatePresence mode="wait">
              {!response && !isLoading ? (
                <motion.div 
                  key="input"
                  className="ai-card-input-wrapper"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={command?.description || 'Enter your question...'}
                    className="ai-card-input"
                  />
                </motion.div>
              ) : (
                <motion.div 
                  key="response"
                  className="ai-card-content"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <motion.div 
                    className="ai-card-prompt"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2 }}
                  >
                    {userInput}
                  </motion.div>
                  <AnimatePresence mode="wait">
                    {isLoading ? (
                      <motion.div 
                        key="thinking"
                        className="ai-card-loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        >
                          <Loader2 size={14} />
                        </motion.div>
                        <span>Thinking...</span>
                      </motion.div>
                    ) : (
                      <motion.div 
                        key="answer"
                        className="ai-card-response"
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, ease: 'easeOut' }}
                      >
                        {response}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </AnimatePresence>
      </motion.div>
    </NodeViewWrapper>
  );
}
