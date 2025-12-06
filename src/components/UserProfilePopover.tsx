import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import * as Popover from '@radix-ui/react-popover';
import { X } from 'lucide-react';
import { useBasic } from '@basictech/react';
import OrnateButton from './OrnateButton';
import { useIsMobile } from '../hooks/useIsMobile';
import placeholderAvatar from '../placeholder_avatar.png';

const VISITED_KEY = 'journal_has_visited';

interface UserProfilePopoverProps {
  children: React.ReactNode;
}

const UserProfilePopover: React.FC<UserProfilePopoverProps> = ({ children }) => {
  const [open, setOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const isMobile = useIsMobile();
  
  // Show About modal on first visit
  useEffect(() => {
    const hasVisited = localStorage.getItem(VISITED_KEY);
    if (!hasVisited) {
      setAboutOpen(true);
    }
  }, []);
  
  // Close About modal and mark as visited
  const closeAbout = () => {
    setAboutOpen(false);
    localStorage.setItem(VISITED_KEY, 'true');
  };
  
  const { user, signin, signout, isSignedIn } = useBasic();

  const handleAuthClick = () => {
    if (isSignedIn) {
      signout();
    } else {
      signin();
    }
  };

  // Get user display info
  const userName = user?.name || 'User';
  const userInitial = userName.charAt(0).toUpperCase();

  // Shared popover inner content
  const PopoverInner = () => (
    <>
      {/* Corner decorations */}
      <div className="card-corner top left"></div>
      <div className="card-corner top right"></div>
      <div className="card-corner bottom left"></div>
      <div className="card-corner bottom right"></div>

      {/* User Profile Section */}
      <motion.div 
        className="mb-6"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05 }}
      >
        {/* Avatar - Centered */}
        <div className="flex flex-col items-center mb-4">
          <motion.div 
            className="w-16 h-16 rounded-full bg-tarot-gold/20 border-2 border-tarot-gold/40 flex items-center justify-center shadow-tarot mb-3 overflow-hidden"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.1, ease: 'easeOut' }}
          >
            {isSignedIn ? (
              <div className="text-tarot-gold-light text-2xl font-semibold font-tarot">
                {userInitial}
              </div>
            ) : (
              <img 
                src={placeholderAvatar} 
                alt="Anonymous avatar" 
                className="w-full h-full object-cover"
              />
            )}
          </motion.div>
          <div className="text-center">
            <div className="text-tarot-gold-light font-semibold text-base font-tarot tracking-wide">
              {isSignedIn ? userName : 'hi, anon'}
            </div>
          </div>
        </div>

        {/* Login/Logout Button */}
        <OrnateButton onClick={handleAuthClick}>
          {isSignedIn ? 'Sign Out' : 'Sign In'}
        </OrnateButton>
      </motion.div>

      {/* Menu Items */}
      <motion.div 
        className="space-y-2 mb-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2, delay: 0.15 }}
      >
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2, delay: 0.2 }}
        >
          <Link 
            to="/settings"
            className="block w-full text-left px-4 py-2.5 text-sm text-white/90 hover:bg-tarot-gold/10 hover:text-tarot-gold-light rounded border border-transparent hover:border-tarot-gold/20 transition-all duration-200 font-tarot"
            onClick={() => setOpen(false)}
          >
            Preferences
          </Link>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2, delay: 0.25 }}
        >
          <button 
            className="w-full text-left px-4 py-2.5 text-sm text-white/90 hover:bg-tarot-gold/10 hover:text-tarot-gold-light rounded border border-transparent hover:border-tarot-gold/20 transition-all duration-200 font-tarot"
            onClick={() => {
              setOpen(false);
              setAboutOpen(true);
            }}
          >
            About
          </button>
        </motion.div>
      </motion.div>

      {/* Footer Section */}
      <motion.div 
        className="pt-4 border-t border-tarot-gold/30 relative"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.35 }}
      >
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-4 h-px bg-tarot-gold/50"></div>
        <div className="absolute top-0 right-0 w-4 h-px bg-tarot-gold/50"></div>
        <div className="text-center">
          <div className="text-tarot-gold-light/80 text-xs font-tarot tracking-wider">
            journal v.0.1.1
          </div>
        </div>
      </motion.div>
    </>
  );

  return (
    <>
      {/* Backdrop overlay */}
      <AnimatePresence>
        {open && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setOpen(false)}
          />
        )}
      </AnimatePresence>

      {isMobile ? (
        /* Mobile: Simple trigger + centered modal */
        <>
          <div onClick={() => setOpen(true)}>
            {children}
          </div>
          <AnimatePresence>
            {open && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
              >
                <div className="w-80 bg-tarot-dark border border-tarot-gold-light shadow-tarot-glow p-6 relative pointer-events-auto">
                  <PopoverInner />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      ) : (
        /* Desktop: Radix Popover with positioned content */
        <Popover.Root open={open} onOpenChange={setOpen}>
          <Popover.Trigger asChild>
            {children}
          </Popover.Trigger>
          <AnimatePresence>
            {open && (
              <Popover.Portal forceMount>
                <Popover.Content
                  className="w-80 bg-tarot-dark border border-tarot-gold-light shadow-tarot-glow p-6 z-50 focus:outline-none relative"
                  side="left"
                  sideOffset={8}
                  align="end"
                  asChild
                >
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, x: 10 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95, x: 10 }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                  >
                    <PopoverInner />
                  </motion.div>
                </Popover.Content>
              </Popover.Portal>
            )}
          </AnimatePresence>
        </Popover.Root>
      )}

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
                      About Journal
                    </h2>
                    
                    <div className="space-y-3 sm:space-y-4 text-white/80 font-tarot leading-relaxed text-sm sm:text-base">
                      <p>
                        <span className="text-tarot-gold-light font-semibold">Journal</span> is a reflective writing companion 
                        designed to help you capture your thoughts across time — from fleeting daily moments to the 
                        broader arcs of months and years.
                      </p>
                      
                      <p>
                        The three-column layout mirrors the way memory works: the immediacy of today, the rhythm 
                        of the month, and the perspective of the year. Each view offers a different lens through 
                        which to understand your journey.
                      </p>

                      <p>
                        With AI-powered prompts and reflections, you can explore your entries more deeply — 
                        asking questions, generating insights, and uncovering patterns in your writing that 
                        might otherwise go unnoticed.
                      </p>

                      <div className="pt-3 sm:pt-4 border-t border-tarot-gold/20 mt-4 sm:mt-6">
                        <p className="text-xs sm:text-sm text-tarot-gold/60 italic text-center">
                          "The unexamined life is not worth living." — Socrates
                        </p>
                      </div>

                      <p className="text-center text-tarot-gold-light/80 mt-4 sm:mt-6 text-sm sm:text-base">
                        Journal is completely free to use, open source, and fully private.
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
                        v0.1.1 • made by{' '}
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
                        href="#" 
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
    </>
  );
};

export default UserProfilePopover;
