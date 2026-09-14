import UserProfilePopover from './UserProfilePopover';

interface MobileHeaderProps {
  title: string;
}

export default function MobileHeader({ title }: MobileHeaderProps) {
  return (
    <header className="sticky top-0 z-20 h-14 bg-tarot-dark/95 backdrop-blur-sm border-b border-tarot-gold/30 flex items-center justify-between px-4">
      <h1 className="text-tarot-gold-light font-semibold text-lg font-tarot tracking-wide">
        {title}
      </h1>
      
      <UserProfilePopover size={40} />
    </header>
  );
}
