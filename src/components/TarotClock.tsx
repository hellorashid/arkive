import React, { useState, useEffect } from 'react';

const TarotClock: React.FC = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const hours = time.getHours();
  const minutes = time.getMinutes();
  const seconds = time.getSeconds();

  // Format time with leading zeros and 12-hour format
  const formatTime = (num: number) => num.toString().padStart(2, '0');
  const formatHours = (hours: number) => {
    const h = hours % 12 || 12;
    return h.toString().padStart(2, '0');
  };
  const isPM = hours >= 12;

  // Get time of day symbol
  const getTimeSymbol = () => {
    if (hours >= 5 && hours < 12) {
      return '☀'; // Sun for morning
    } else if (hours >= 12 && hours < 17) {
      return '☼'; // Sun with rays for afternoon
    } else if (hours >= 17 && hours < 21) {
      return '☽'; // Crescent moon for evening
    } else {
      return '☾'; // Full moon for night
    }
  };

  return (
    <div className="flex flex-col items-center gap-1 w-16">
      <div className="text-tarot-gold-light text-xl animate-pulse">
        {getTimeSymbol()}
      </div>
      <div className="text-tarot-gold-light font-mono text-[10px] tracking-wider flex items-center gap-1">
        {formatHours(hours)}:{formatTime(minutes)}:{formatTime(seconds)}
        <div className="flex flex-col gap-0.5 ml-1">
          <div className={`w-1 h-1 rounded-full ${isPM ? 'bg-tarot-gold-light/30' : 'bg-tarot-gold-light'}`} />
          <div className={`w-1 h-1 rounded-full ${isPM ? 'bg-tarot-gold-light' : 'bg-tarot-gold-light/30'}`} />
        </div>
      </div>
    </div>
  );
};

export default TarotClock; 