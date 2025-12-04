import { useState } from 'react';
import * as Popover from '@radix-ui/react-popover';
import OrnateButton from './OrnateButton';
import placeholderAvatar from '../placeholder_avatar.png';

interface UserProfilePopoverProps {
  children: React.ReactNode;
  isSignedIn: boolean;
  onSignInChange: (isSignedIn: boolean) => void;
}

const UserProfilePopover: React.FC<UserProfilePopoverProps> = ({ children, isSignedIn, onSignInChange }) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Backdrop overlay */}
      {open && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-200"
          onClick={() => setOpen(false)}
        />
      )}
      <Popover.Root open={open} onOpenChange={setOpen}>
        <Popover.Trigger asChild>
          {children}
        </Popover.Trigger>
        <Popover.Portal>
        <Popover.Content
          className="w-80 bg-tarot-dark border border-tarot-gold-light shadow-tarot-glow p-6 z-50 focus:outline-none relative"
          side="left"
          sideOffset={8}
          align="end"
        >
          {/* Corner decorations */}
          <div className="card-corner top left"></div>
          <div className="card-corner top right"></div>
          <div className="card-corner bottom left"></div>
          <div className="card-corner bottom right"></div>

          {/* User Profile Section */}
          <div className="mb-6">
            {/* Avatar - Centered */}
            <div className="flex flex-col items-center mb-4">
              <div className="w-16 h-16 rounded-full bg-tarot-gold/20 border-2 border-tarot-gold/40 flex items-center justify-center shadow-tarot mb-3 overflow-hidden">
                {isSignedIn ? (
                  <div className="text-tarot-gold-light text-2xl font-semibold font-tarot">
                    U
                  </div>
                ) : (
                  <img 
                    src={placeholderAvatar} 
                    alt="Anonymous avatar" 
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              <div className="text-center">
                <div className="text-tarot-gold-light font-semibold text-base font-tarot tracking-wide">
                  {isSignedIn ? 'User Name' : 'hi, anon'}
                </div>
              </div>
            </div>

            {/* Login/Logout Button */}
            <OrnateButton onClick={() => onSignInChange(!isSignedIn)}>
              {isSignedIn ? 'Sign Out' : 'Sign In'}
            </OrnateButton>
          </div>

          {/* Menu Items */}
          <div className="space-y-2 mb-6">
            <button className="w-full text-left px-4 py-2.5 text-sm text-white/90 hover:bg-tarot-gold/10 hover:text-tarot-gold-light rounded border border-transparent hover:border-tarot-gold/20 transition-all duration-200 font-tarot">
              Preferences
            </button>
            <button className="w-full text-left px-4 py-2.5 text-sm text-white/90 hover:bg-tarot-gold/10 hover:text-tarot-gold-light rounded border border-transparent hover:border-tarot-gold/20 transition-all duration-200 font-tarot">
              Appearance
            </button>
            <button className="w-full text-left px-4 py-2.5 text-sm text-white/90 hover:bg-tarot-gold/10 hover:text-tarot-gold-light rounded border border-transparent hover:border-tarot-gold/20 transition-all duration-200 font-tarot">
              About
            </button>
          </div>

          {/* Footer Section */}
          <div className="pt-4 border-t border-tarot-gold/30 relative">
            {/* Decorative elements */}
            <div className="absolute top-0 left-0 w-4 h-px bg-tarot-gold/50"></div>
            <div className="absolute top-0 right-0 w-4 h-px bg-tarot-gold/50"></div>
            <div className="text-center">
              <div className="text-tarot-gold-light/80 text-xs font-tarot tracking-wider">
                journal v.0.1.1
              </div>
            </div>
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
    </>
  );
};

export default UserProfilePopover;

