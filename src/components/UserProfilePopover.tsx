import { useState, useEffect, type MouseEvent } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Settings } from 'lucide-react';
import { UserMenu } from '@basictech/react';
import packageJson from '../../package.json';

const VISITED_KEY = 'journal_has_visited';

interface UserProfilePopoverProps {
  className?: string;
  size?: number;
}

const UserProfilePopover: React.FC<UserProfilePopoverProps> = ({ className = '', size = 48 }) => {
  const [aboutOpen, setAboutOpen] = useState(false);
  
  // Show About modal on first visit
  useEffect(() => {
    const hasVisited = localStorage.getItem(VISITED_KEY);
    if (!hasVisited) {
      setAboutOpen(true);
    }
  }, []);
  
  // Close About modal and mark as visited.
  // stopPropagation so backdrop clicks don't bubble to the home column onClick.
  const closeAbout = (e?: MouseEvent) => {
    e?.stopPropagation();
    setAboutOpen(false);
    localStorage.setItem(VISITED_KEY, 'true');
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* SDK UserMenu with avatar trigger */}
      <UserMenu 
        trigger="avatar"
        avatarProps={{ 
          size,
          className: 'cursor-pointer'
        }}
        className="basic-ui"
      />
      
      {/* Arkive-specific buttons */}
      <div className="flex gap-1">
        <Link
          to="/settings"
          className="w-8 h-8 rounded-full bg-tarot-gold/10 border border-tarot-gold/30 flex items-center justify-center hover:bg-tarot-gold/20 hover:border-tarot-gold/40 transition-colors duration-200"
          title="Preferences"
        >
          <Settings size={14} className="text-tarot-gold-light" />
        </Link>
        <button
          onClick={() => setAboutOpen(true)}
          className="w-8 h-8 rounded-full bg-tarot-gold/10 border border-tarot-gold/30 flex items-center justify-center hover:bg-tarot-gold/20 hover:border-tarot-gold/40 transition-colors duration-200 text-tarot-gold-light text-xs font-tarot font-semibold"
          title="About Arkive"
        >
          ?
        </button>
      </div>

      {/* About Modal */}
      <AnimatePresence>
        {aboutOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/70 z-50"
              onClick={closeAbout}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="fixed inset-0 z-50 flex items-center justify-center p-6 sm:p-8 pointer-events-none"
            >
              {/* Outer wrapper allows corner overflow */}
              <div className="w-full max-w-2xl relative pointer-events-auto">
                {/* Corner decorations - positioned relative to outer wrapper */}
                <div className="card-corner top left"></div>
                <div className="card-corner top right"></div>
                <div className="card-corner bottom left"></div>
                <div className="card-corner bottom right"></div>
                
                {/* Inner scrollable container */}
                <div className="bg-tarot-dark border border-tarot-gold-light shadow-tarot-glow p-5 sm:p-8 max-h-[85vh] overflow-y-auto">
                  {/* Close button */}
                  <button 
                    onClick={closeAbout}
                    className="absolute top-3 right-3 sm:top-4 sm:right-4 text-tarot-gold/60 hover:text-tarot-gold-light transition-colors z-10"
                  >
                    <X size={20} />
                  </button>

                  {/* Content */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                  >
                    <h2 className="text-xl sm:text-2xl font-semibold text-tarot-gold-light font-tarot tracking-wide mb-4 sm:mb-6 text-center">
                      About Arkive
                    </h2>
                    
                    <div className="space-y-3 sm:space-y-4 text-white/80 font-tarot leading-relaxed text-sm sm:text-base">
                      <p>
                        <span className="text-tarot-gold-light font-semibold">Arkive</span> is a reflective journal 
                        designed to help you capture your thoughts across time — from fleeting daily moments to the 
                        broader arcs of months and years.
                      </p>
                      
                      <p>
                        The three-column layout mirrors the way memory works: the immediacy of today, the rhythm 
                        of the month, and the perspective of the year. Each view offers a different lens through 
                        which to understand your journey.
                      </p>

                      <p>
                        With AI-powered prompts and reflections, you can explore your entries more deeply,
                        ask questions and generate insights. Or not, up to you.
                      </p>

                      <div className="pt-3 sm:pt-4 border-t border-tarot-gold/20 mt-4 sm:mt-6">
                        <p className="text-xs sm:text-sm text-tarot-gold/60 italic text-center">
                          "The unexamined life is not worth living." — Socrates
                        </p>
                      </div>

                      <p className="text-center text-tarot-gold-light/80 mt-4 sm:mt-6 text-sm sm:text-base">
                        Arkive is completely free to use, open source, and fully private.
                      </p>
                    </div>
                  </motion.div>

                  {/* Footer */}
                  <motion.div 
                    className="mt-6 sm:mt-8 pt-3 sm:pt-4 border-t border-tarot-gold/30"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3, delay: 0.2 }}
                  >
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs font-tarot">
                      <div className="text-tarot-gold-light/60 tracking-wider">
                        Arkive (beta) v{packageJson.version} • made by{' '}
                        <a 
                          href="https://x.com/razberrychai" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-tarot-gold-light hover:text-tarot-gold transition-colors"
                        >
                          @razberrychai
                        </a>
                      </div>
                      <a 
                        href="https://github.com/hellorashid/arkive" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-tarot-gold-light/60 hover:text-tarot-gold-light transition-colors tracking-wider"
                      >
                        View on GitHub
                      </a>
                    </div>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UserProfilePopover;
