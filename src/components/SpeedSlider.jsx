import React from 'react';
import { Minus, Plus, Gauge } from 'lucide-react';

const STEPS = [0.25, 0.5, 0.75, 1, 1.5, 2, 3, 4];
const MIN = STEPS[0];
const MAX = STEPS[STEPS.length - 1];

/**
 * SpeedSlider
 * @param {number}   speed    – current multiplier value (from STEPS)
 * @param {Function} onChange – called with new multiplier number
 */
const SpeedSlider = ({ speed, onChange }) => {
  const idx    = STEPS.indexOf(speed);
  const canDec = idx > 0;
  const canInc = idx < STEPS.length - 1;

  const dec = () => canDec && onChange(STEPS[idx - 1]);
  const inc = () => canInc && onChange(STEPS[idx + 1]);

  return (
    <div className="space-y-2">
      {/* Title */}
      <div className="flex items-center gap-2 text-slate-300 text-sm font-semibold">
        <Gauge size={16} className="text-purple-400" />
        <span>Simulation Speed</span>
      </div>

      {/* Speed value */}
      <div className="text-center text-2xl font-bold text-purple-300 tracking-wide">
        {speed}x
      </div>

      {/* Controls row */}
      <div className="flex items-center gap-3">
        {/* Minus button */}
        <button
          onClick={dec}
          disabled={!canDec}
          aria-label="Decrease speed"
          className="flex-none w-9 h-9 rounded-full bg-slate-700 hover:bg-slate-600 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-colors shadow-md"
        >
          <Minus size={16} className="text-slate-200" />
        </button>

        {/* Track + thumb */}
        <div className="relative flex-1 h-2 bg-slate-700 rounded-full">
          {/* Filled portion */}
          <div
            className="absolute inset-y-0 left-0 bg-purple-500 rounded-full transition-all"
            style={{ width: `${((speed - MIN) / (MAX - MIN)) * 100}%` }}
          />
          {/* Invisible native range for accessibility / drag */}
          <input
            type="range"
            min={0}
            max={STEPS.length - 1}
            step={1}
            value={idx === -1 ? 3 : idx}
            onChange={e => onChange(STEPS[Number(e.target.value)])}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          {/* Custom thumb */}
          <div
            className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white shadow-lg border-2 border-purple-500 transition-all pointer-events-none"
            style={{ left: `calc(${((speed - MIN) / (MAX - MIN)) * 100}% - 8px)` }}
          />
        </div>

        {/* Plus button */}
        <button
          onClick={inc}
          disabled={!canInc}
          aria-label="Increase speed"
          className="flex-none w-9 h-9 rounded-full bg-slate-700 hover:bg-slate-600 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-colors shadow-md"
        >
          <Plus size={16} className="text-slate-200" />
        </button>
      </div>

      {/* Tick labels */}
      <div className="flex justify-between px-1 text-xs font-semibold text-slate-400 select-none">
        <span>0.25×</span>
        <span>1×</span>
        <span>4×</span>
      </div>
    </div>
  );
};

export default SpeedSlider;
