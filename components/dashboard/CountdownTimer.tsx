'use client';

import React, { useState, useEffect } from 'react';

interface CountdownTimerProps {
  targetTimestampSec: number;
  onMatured?: () => void;
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({
  targetTimestampSec,
  onMatured,
}) => {
  const [timeLeft, setTimeLeft] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
    isMatured: boolean;
  }>({ hours: 0, minutes: 0, seconds: 0, isMatured: false });

  useEffect(() => {
    const calculateTime = () => {
      const now = Math.floor(Date.now() / 1000);
      const diff = targetTimestampSec - now;

      if (diff <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0, isMatured: true });
        if (onMatured) onMatured();
        return;
      }

      const hours = Math.floor(diff / 3600);
      const minutes = Math.floor((diff % 3600) / 60);
      const seconds = diff % 60;

      setTimeLeft({ hours, minutes, seconds, isMatured: false });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [targetTimestampSec, onMatured]);

  if (timeLeft.isMatured) {
    return <span className="font-mono text-xs font-semibold text-emerald-400">Matured / Ready</span>;
  }

  return (
    <span className="font-mono text-xs text-amber-400">
      {String(timeLeft.hours).padStart(2, '0')}h : {String(timeLeft.minutes).padStart(2, '0')}m :{' '}
      {String(timeLeft.seconds).padStart(2, '0')}s
    </span>
  );
};