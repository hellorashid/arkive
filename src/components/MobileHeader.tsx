import UserProfilePopover from './UserProfilePopover';
import placeholderAvatar from '../placeholder_avatar.png';

interface MobileHeaderProps {
  title: string;
  isSignedIn: boolean;
  onSignInChange: (isSignedIn: boolean) => void;
}

export default function MobileHeader({ title, isSignedIn, onSignInChange }: MobileHeaderProps) {
  return (
    <header className="sticky top-0 z-20 h-14 bg-tarot-dark/95 backdrop-blur-sm border-b border-tarot-gold/30 flex items-center justify-between px-4">
      <h1 className="text-tarot-gold-light font-semibold text-lg font-tarot tracking-wide">
        {title}
      </h1>
      
      <UserProfilePopover isSignedIn={isSignedIn} onSignInChange={onSignInChange}>
        <button className="w-10 h-10 rounded-full bg-tarot-gold/20 border-2 border-tarot-gold/30 flex items-center justify-center cursor-pointer hover:bg-tarot-gold/30 transition-colors duration-200 focus:outline-none overflow-hidden">
          {isSignedIn ? (
            <div className="text-tarot-gold-light text-sm font-semibold">U</div>
          ) : (
            <img 
              src={placeholderAvatar} 
              alt="Anonymous avatar" 
              className="w-full h-full object-cover"
            />
          )}
        </button>
      </UserProfilePopover>
    </header>
  );
}
