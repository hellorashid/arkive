import React, { useState } from 'react';
import { Calendar } from 'lucide-react';

function App() {
  const [expandedColumn, setExpandedColumn] = useState<'left' | 'middle' | 'right'>('middle');
  const [currentYear] = useState(new Date().getFullYear());
  const [currentMonth] = useState(new Date().toLocaleString('default', { month: 'short' }));
  const [currentMonthIndex] = useState(new Date().getMonth());
  const [currentDay] = useState(new Date().getDate());
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
    <div className="min-h-screen w-screen bg-gray-100">
      <div className="flex h-screen  ">
        {/* Left sidebar - Year View */}
        <div 
          onClick={() => setExpandedColumn('left')}
          className={`${getColumnWidth('left')} bg-white border-r border-gray-200 transition-all duration-300 ease-in-out cursor-pointer overflow-hidden`}
        >
          <div className="h-full bg-gray-50">
            {expandedColumn === 'left' ? (
              <div className="h-full overflow-y-auto">
                {years.map(year => (
                  <div 
                    key={year}
                    className="bg-white border-b border-gray-200 h-[80vh] flex flex-col relative"
                  >
                    <div className="sticky top-0 z-10 px-4 py-3 border-b border-gray-200 bg-white shadow-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-indigo-600" />
                        <h3 className="text-lg font-semibold text-gray-800">{year}</h3>
                      </div>
                    </div>
                    <div className="flex-grow">
                      <textarea
                        value={yearNotes[year] || ''}
                        onChange={(e) => handleYearNoteChange(year, e.target.value)}
                        className="w-full h-full px-3 py-2 border-0 focus:outline-none focus:ring-0 resize-none"
                        placeholder={`Write your notes for ${year}...`}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center">
                <div className="pt-4">
                  <span className="text-gray-600 font-semibold text-lg rotate-90">
                    '{String(currentYear).slice(-2)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Main content */}
        <div 
          onClick={() => setExpandedColumn('middle')}
          className={`${getColumnWidth('middle')} bg-white border-r border-gray-200 transition-all duration-300 ease-in-out cursor-pointer overflow-hidden`}
        >
          <div className="h-full bg-gray-50">
            {expandedColumn === 'middle' ? (
              <div className="h-full overflow-y-auto">
                {[
                  'January', 'February', 'March', 'April', 'May', 'June',
                  'July', 'August', 'September', 'October', 'November', 'December'
                ].slice(0, currentMonthIndex + 1).reverse().map((month) => (
                  <div 
                    key={month}
                    className="bg-white border-b border-gray-200 h-[80vh] flex flex-col relative"
                  >
                    <div className="sticky top-0 z-10 px-4 py-3 border-b border-gray-200 bg-white shadow-sm">
                      <h3 className="text-lg font-semibold text-gray-800">{month}</h3>
                    </div>
                    <div className="flex-grow">
                      <textarea
                        value={monthNotes[month] || ''}
                        onChange={(e) => handleMonthNoteChange(month, e.target.value)}
                        className="w-full h-full px-3 py-2 border-0 focus:outline-none focus:ring-0 resize-none"
                        placeholder={`Write your notes for ${month}...`}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center">
                <div className="pt-4">
                  <span className="text-gray-600 font-semibold text-lg rotate-90">
                    {currentMonth}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right sidebar */}
        <div 
          onClick={() => setExpandedColumn('right')}
          className={`${getColumnWidth('right')} bg-white border-l border-gray-200 transition-all duration-300 ease-in-out cursor-pointer overflow-hidden`}
        >
          <div className="h-full bg-gray-50">
            {expandedColumn === 'right' ? (
              <div className="h-full overflow-y-auto">
                {Array.from({ length: currentDay }, (_, i) => currentDay - i).map((day) => (
                  <div 
                    key={day}
                    className="bg-white border-b border-gray-200 h-[80vh] flex flex-col relative"
                  >
                    <div className="sticky top-0 z-10 px-4 py-3 border-b border-gray-200 bg-white shadow-sm">
                      <h3 className="text-lg font-semibold text-gray-800">{day}</h3>
                    </div>
                    <div className="flex-grow">
                      <textarea
                        value={dayNotes[String(day)] || ''}
                        onChange={(e) => handleDayNoteChange(day, e.target.value)}
                        className="w-full h-full px-3 py-2 border-0 focus:outline-none focus:ring-0 resize-none"
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
                  <span className="text-gray-600 font-semibold text-lg rotate-90">
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