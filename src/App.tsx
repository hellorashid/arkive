import React, { useState } from 'react';
import { Calendar } from 'lucide-react';

function App() {
  const [expandedColumn, setExpandedColumn] = useState<'left' | 'middle' | 'right'>('middle');
  const [currentYear] = useState(new Date().getFullYear());
  const [currentMonth] = useState(new Date().toLocaleString('default', { month: 'short' }));
  const [currentMonthIndex] = useState(new Date().getMonth());
  const [currentDay] = useState(new Date().getDate());
  const [yearProgress] = useState((currentMonthIndex / 11) * 100);
  const [monthProgress] = useState((currentDay / new Date(currentYear, currentMonthIndex + 1, 0).getDate()) * 100);
  const [hoveredMonth, setHoveredMonth] = useState<number | null>(null);
  const [hoveredDay, setHoveredDay] = useState<number | null>(null);
  const [yearNotes, setYearNotes] = useState<Record<number, string>>({});
  const [monthNotes, setMonthNotes] = useState<Record<string, string>>({});
  const [dayNotes, setDayNotes] = useState<Record<string, string>>({});

  const getColumnWidth = (column: 'left' | 'middle' | 'right') => {
    if (column === expandedColumn) {
      return 'w-9/12'; // Expanded state (3/4 of screen)
    }
    return 'w-1/12'; // Collapsed state
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
    <div className="min-h-screen w-screen bg-gradient-to-br from-tarot-darker to-tarot-dark font-tarot">
      <div className="flex h-screen">
        {/* Left sidebar - Year View */}
        <div 
          onClick={() => setExpandedColumn('left')}
          className={`${getColumnWidth('left')} bg-tarot-dark border-r border-tarot-gold/30 transition-all duration-300 ease-in-out cursor-pointer overflow-hidden shadow-tarot hover:shadow-tarot-glow`}
        >
          <div className="h-full bg-gradient-to-b from-tarot-darker to-tarot-dark">
            {expandedColumn === 'left' ? (
              <div className="h-full overflow-y-auto">
                {years.map(year => (
                  <div 
                    key={year}
                    className="bg-tarot-dark/50 border-b border-tarot-gold/20 h-[80vh] flex flex-col relative hover:bg-tarot-light/50 transition-colors duration-200"
                  >
                    <div className="sticky top-0 z-10 px-4 py-3 border-b border-tarot-gold/30 bg-tarot-dark/80 backdrop-blur-sm shadow-tarot">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-tarot-gold-light" />
                        <h3 className="text-lg font-semibold text-tarot-gold-light tracking-wide">{year}</h3>
                      </div>
                    </div>
                    <div className="flex-grow">
                      <textarea
                        value={yearNotes[year] || ''}
                        onChange={(e) => handleYearNoteChange(year, e.target.value)}
                        className="w-full h-full px-3 py-2 border-0 focus:outline-none focus:ring-0 resize-none bg-transparent text-white/90 placeholder-gray-500/50 tracking-wide"
                        placeholder={`Write your notes for ${year}...`}
                        onClick={(e) => e.stopPropagation()}
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
                      className="bg-gradient-to-b from-tarot-gold to-tarot-gold-dark w-full transition-all duration-300"
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
          className={`${getColumnWidth('middle')} bg-tarot-dark border-r border-tarot-gold/30 transition-all duration-300 ease-in-out cursor-pointer overflow-hidden shadow-tarot hover:shadow-tarot-glow`}
        >
          <div className="h-full bg-gradient-to-b from-tarot-darker to-tarot-dark">
            {expandedColumn === 'middle' ? (
              <div className="h-full overflow-y-auto">
                {[
                  'January', 'February', 'March', 'April', 'May', 'June',
                  'July', 'August', 'September', 'October', 'November', 'December'
                ].slice(0, currentMonthIndex + 1).reverse().map((month) => (
                  <div 
                    key={month}
                    className="bg-tarot-dark/50 border-b border-tarot-gold/20 h-[80vh] flex flex-col relative hover:bg-tarot-light/50 transition-colors duration-200"
                  >
                    <div className="sticky top-0 z-10 px-4 py-3 border-b border-tarot-gold/30 bg-tarot-dark/80 backdrop-blur-sm shadow-tarot">
                      <h3 className="text-lg font-semibold text-tarot-gold-light tracking-wide">{month}</h3>
                    </div>
                    <div className="flex-grow">
                      <textarea
                        value={monthNotes[month] || ''}
                        onChange={(e) => handleMonthNoteChange(month, e.target.value)}
                        className="w-full h-full px-3 py-2 border-0 focus:outline-none focus:ring-0 resize-none bg-transparent text-white/90 placeholder-gray-500/50 tracking-wide"
                        placeholder={`Write your notes for ${month}...`}
                        onClick={(e) => e.stopPropagation()}
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
                      className="bg-gradient-to-b from-tarot-gold to-tarot-gold-dark w-full transition-all duration-300"
                      style={{ height: `${monthProgress}%` }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right sidebar */}
        <div 
          onClick={() => setExpandedColumn('right')}
          className={`${getColumnWidth('right')} bg-tarot-dark border-l border-tarot-gold/30 transition-all duration-300 ease-in-out cursor-pointer overflow-hidden shadow-tarot hover:shadow-tarot-glow`}
        >
          <div className="h-full bg-gradient-to-b from-tarot-darker to-tarot-dark">
            {expandedColumn === 'right' ? (
              <div className="h-full overflow-y-auto">
                {Array.from({ length: currentDay }, (_, i) => currentDay - i).map((day) => (
                  <div 
                    key={day}
                    className="bg-tarot-dark/50 border-b border-tarot-gold/20 h-[80vh] flex flex-col relative hover:bg-tarot-light/50 transition-colors duration-200"
                  >
                    <div className="sticky top-0 z-10 px-4 py-3 border-b border-tarot-gold/30 bg-tarot-dark/80 backdrop-blur-sm shadow-tarot">
                      <h3 className="text-lg font-semibold text-tarot-gold-light tracking-wide">{day}</h3>
                    </div>
                    <div className="flex-grow">
                      <textarea
                        value={dayNotes[String(day)] || ''}
                        onChange={(e) => handleDayNoteChange(day, e.target.value)}
                        className="w-full h-full px-3 py-2 border-0 focus:outline-none focus:ring-0 resize-none bg-transparent text-white/90 placeholder-gray-500/50 tracking-wide"
                        placeholder={`Write your notes for day ${day}...`}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center">
                <div className="pt-4">
                  <span className="text-tarot-gold-light font-semibold text-lg tracking-wider rotate-90">
                    {currentDay}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;