import { useState, useEffect } from 'react';
import TarotClock from './components/TarotClock';
import UserProfilePopover from './components/UserProfilePopover';
import TiptapEditor from './components/TiptapEditor';
import placeholderAvatar from './placeholder_avatar.png';

function App() {
  const [expandedColumn, setExpandedColumn] = useState<'left' | 'middle' | 'right'>('middle');
  const [currentYear] = useState(new Date().getFullYear());
  const [currentMonth] = useState(new Date().toLocaleString('default', { month: 'short' }));
  const [currentMonthIndex] = useState(new Date().getMonth());
  const [currentDay] = useState(new Date().getDate());
  const [yearProgress] = useState((currentMonthIndex / 11) * 100);
  const [monthProgress] = useState((currentDay / new Date(currentYear, currentMonthIndex + 1, 0).getDate()) * 100);
  const [dayProgress, setDayProgress] = useState(() => {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const totalMinutes = hours * 60 + minutes;
    return (totalMinutes / (24 * 60)) * 100;
  });
  const [isSignedIn, setIsSignedIn] = useState(false);

  useEffect(() => {
    const updateDayProgress = () => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      const totalMinutes = hours * 60 + minutes;
      setDayProgress((totalMinutes / (24 * 60)) * 100);
    };

    // Update every minute
    const interval = setInterval(updateDayProgress, 60000);
    return () => clearInterval(interval);
  }, []);
  const [yearNotes, setYearNotes] = useState<Record<number, string>>({});
  const [monthNotes, setMonthNotes] = useState<Record<string, string>>({});
  const [dayNotes, setDayNotes] = useState<Record<string, string>>({});

  const getColumnWidth = (column: 'left' | 'middle' | 'right') => {
    if (column === expandedColumn) {
      return 'flex-[10]'; // Expanded state - takes 10 parts
    }
    return 'flex-[1]'; // Collapsed state - takes 1 part each
  };

  const years = Array.from({ length: 10 }, (_, i) => currentYear - i);

  const handleYearNoteChange = (year: number, value: string) => {
    setYearNotes(prev => ({
      ...prev,
      [year]: value
    }));
  };

  const handleMonthNoteChange = (month: string, value: string) => {
    setMonthNotes(prev => ({
      ...prev,
      [month]: value
    }));
  };

  const handleDayNoteChange = (day: number, value: string) => {
    setDayNotes(prev => ({
      ...prev,
      [String(day)]: value
    }));
  };


  return (
    <div className="min-h-screen w-screen bg-linear-to-br from-tarot-darker to-tarot-dark font-tarot">
      <div className="flex h-screen">
        {/* Columns container - Year, Month, Day */}
        <div className="flex flex-1 h-full">
          {/* Left sidebar - Year View */}
          <div 
            onClick={() => setExpandedColumn('left')}
            className={`${getColumnWidth('left')} bg-tarot-dark border-r border-tarot-gold/30 transition-all duration-300 ease-in-out cursor-pointer overflow-hidden shadow-tarot`}
          >
          <div className="h-full bg-linear-to-b from-tarot-darker to-tarot-dark">
            {expandedColumn === 'left' ? (
              <div className="h-full overflow-y-auto scrollbar-hide">
                {years.map(year => (
                  <div 
                    key={year}
                    className="bg-tarot-dark/50 border-b border-tarot-gold/20 h-[80vh] flex flex-col relative transition-colors duration-200"
                  >
                    <div className="sticky top-0 z-10 px-4 py-3 border-b border-tarot-gold/30 bg-tarot-dark/80 backdrop-blur-sm shadow-tarot">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold text-tarot-gold-light tracking-wide">{year}</h3>
                      </div>
                    </div>
                    <div className="grow">
                      <TiptapEditor
                        content={yearNotes[year] || ''}
                        onChange={(value) => handleYearNoteChange(year, value)}
                        placeholder={`Write your notes for ${year}...`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center">
                <div className="pt-4 flex flex-col items-center gap-2">
                  <span className="text-tarot-gold-light font-semibold text-lg tracking-wider">
                    {String(currentYear).slice(-2)}
                  </span>
                  <div className="relative h-[80vh] w-1 bg-tarot-gold/20 rounded-full overflow-hidden">
                    <div 
                      className="bg-linear-to-b from-tarot-gold to-tarot-gold-dark w-full transition-all duration-300"
                      style={{ height: `${yearProgress}%` }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Main content */}
        <div 
          onClick={() => setExpandedColumn('middle')}
          className={`${getColumnWidth('middle')} bg-tarot-dark border-r border-tarot-gold/30 transition-all duration-300 ease-in-out cursor-pointer overflow-hidden shadow-tarot`}
        >
          <div className="h-full bg-linear-to-b from-tarot-darker to-tarot-dark">
            {expandedColumn === 'middle' ? (
              <div className="h-full overflow-y-auto scrollbar-hide">
                {[
                  'January', 'February', 'March', 'April', 'May', 'June',
                  'July', 'August', 'September', 'October', 'November', 'December'
                ].slice(0, currentMonthIndex + 1).reverse().map((month) => (
                  <div 
                    key={month}
                    className="bg-tarot-dark/50 border-b border-tarot-gold/20 h-[80vh] flex flex-col relative transition-colors duration-200"
                  >
                    <div className="sticky top-0 z-10 px-4 py-3 border-b border-tarot-gold/30 bg-tarot-dark/80 backdrop-blur-sm shadow-tarot">
                      <h3 className="text-lg font-semibold text-tarot-gold-light tracking-wide">{month}</h3>
                    </div>
                    <div className="grow">
                      <TiptapEditor
                        content={monthNotes[month] || ''}
                        onChange={(value) => handleMonthNoteChange(month, value)}
                        placeholder={`Write your notes for ${month}...`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center">
                <div className="pt-4 flex flex-col items-center gap-2">
                  <span className="text-tarot-gold-light font-semibold text-lg tracking-wider">
                    {currentMonth}
                  </span>
                  <div className="relative h-[80vh] w-1 bg-tarot-gold/20 rounded-full overflow-hidden">
                    <div 
                      className="bg-linear-to-b from-tarot-gold to-tarot-gold-dark w-full transition-all duration-300"
                      style={{ height: `${monthProgress}%` }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

          {/* Right column - Day View */}
          <div 
            onClick={() => setExpandedColumn('right')}
            className={`${getColumnWidth('right')} bg-tarot-dark border-r border-tarot-gold/30 transition-all duration-300 ease-in-out cursor-pointer overflow-hidden shadow-tarot`}
          >
            <div className="h-full bg-linear-to-b from-tarot-darker to-tarot-dark">
              {expandedColumn === 'right' ? (
                <div className="h-full overflow-y-auto scrollbar-hide">
                  {Array.from({ length: currentDay }, (_, i) => currentDay - i).map((day) => (
                    <div 
                      key={day}
                      className="bg-tarot-dark/50 border-b border-tarot-gold/20 h-[80vh] flex flex-col relative transition-colors duration-200"
                    >
                      <div className="sticky top-0 z-10 px-4 py-3 border-b border-tarot-gold/30 bg-tarot-dark/80 backdrop-blur-sm shadow-tarot">
                        <h3 className="text-lg font-semibold text-tarot-gold-light tracking-wide">{day}</h3>
                      </div>
                      <div className="grow">
                        <TiptapEditor
                          content={dayNotes[String(day)] || ''}
                          onChange={(value) => handleDayNoteChange(day, value)}
                          placeholder={`Write your notes for day ${day}...`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center">
                  <div className="pt-4 flex flex-col items-center gap-2">
                    <span className="text-tarot-gold-light font-semibold text-lg tracking-wider">
                      {currentDay}
                    </span>
                    <div className="relative h-[80vh] w-1 bg-tarot-gold/20 rounded-full overflow-hidden">
                      <div 
                        className="bg-linear-to-b from-tarot-gold to-tarot-gold-dark w-full transition-all duration-300"
                        style={{ height: `${dayProgress}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar with Clock */}
        <div className="w-20 bg-tarot-dark border-l border-tarot-gold/30 flex flex-col items-center justify-between pt-4 pb-4">
          <TarotClock />
          {/* User Avatar with Popover */}
          <UserProfilePopover isSignedIn={isSignedIn} onSignInChange={setIsSignedIn}>
            <button className="w-12 h-12 rounded-full bg-tarot-gold/20 border-2 border-tarot-gold/30 flex items-center justify-center cursor-pointer hover:bg-tarot-gold/30 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-tarot-gold/50 overflow-hidden">
              {isSignedIn ? (
                <div className="text-tarot-gold-light text-lg font-semibold">
                  U
                </div>
              ) : (
                <img 
                  src={placeholderAvatar} 
                  alt="Anonymous avatar" 
                  className="w-full h-full object-cover"
                />
              )}
            </button>
          </UserProfilePopover>
        </div>
      </div>
    </div>
  );
}

export default App;