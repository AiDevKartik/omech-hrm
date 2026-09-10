/**
 * Live Clock Component
 * Displays real-time industrial shop-floor clock with Indian Standard Time (IST)
 * and active shift indicator.
 */

import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

export function LiveClock() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const hours = now.getHours();
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const timeStr = `${String(hours).padStart(2, '0')}:${minutes}:${seconds}`;

  // Current Shift Logic
  let shiftName = 'Shift A (Morning)';
  if (hours >= 14 && hours < 22) {
    shiftName = 'Shift B (Evening)';
  } else if (hours >= 22 || hours < 6) {
    shiftName = 'Shift C (Night)';
  }

  const dateStr = now.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className="flex items-center gap-3 bg-stone-950 border border-stone-800 px-3 py-1.5 rounded-none text-xs">
      <div className="flex items-center gap-1.5 text-stone-400">
        <Clock className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
        <span className="text-stone-400 hidden sm:inline">{dateStr}</span>
      </div>
      <div className="h-3 w-[1px] bg-stone-800 hidden sm:block" />
      <div className="font-mono font-semibold text-amber-400 tracking-wider text-sm">
        {timeStr} <span className="text-[10px] text-stone-500 font-sans">IST</span>
      </div>
      <div className="h-3 w-[1px] bg-stone-800" />
      <span className="hidden md:inline-block px-1.5 py-0.5 bg-stone-800 text-stone-300 font-medium text-[11px] border border-stone-700">
        {shiftName}
      </span>
    </div>
  );
}
