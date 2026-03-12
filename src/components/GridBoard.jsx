import React, { useState, useEffect, useRef } from 'react';
import { Play, RotateCcw, Sliders } from 'lucide-react';
import { gridBeamSearch } from '../utils/beamSearch';
import SpeedSlider from './SpeedSlider';

const ROWS = 20;
const COLS = 20;

const GridBoard = ({ preset, setPreset, onSearchComplete }) => {
  const [grid, setGrid] = useState(
    Array(ROWS).fill().map(() => Array(COLS).fill(0))
  );
  const [start, setStart] = useState({ x: 2, y: 10 });
  const [goal, setGoal] = useState({ x: 17, y: 10 });
  const [k, setK] = useState(3);
  const [isSearching, setIsSearching] = useState(false);
  const [beamHistory, setBeamHistory] = useState([]);
  const [currentStep, setCurrentStep] = useState(-1);
  const [finalPath, setFinalPath] = useState([]);
  const [editMode, setEditMode] = useState('wall');
  const [speed, setSpeed] = useState(1); // multiplier
  const isMouseDown = useRef(false);

  const reset = () => {
    setGrid(Array(ROWS).fill().map(() => Array(COLS).fill(0)));
    setBeamHistory([]);
    setFinalPath([]);
    setCurrentStep(-1);
    setIsSearching(false);
  };

  const handleMouseDown = (x, y) => {
    isMouseDown.current = true;
    handleCellInteraction(x, y);
  };

  const handleMouseEnter = (x, y) => {
    if (isMouseDown.current) {
      handleCellInteraction(x, y);
    }
  };

  const handleMouseUp = () => {
    isMouseDown.current = false;
  };

  const handleCellInteraction = (x, y) => {
    if (isSearching) return;
    if (editMode === 'start') {
      setStart({ x, y });
    } else if (editMode === 'goal') {
      setGoal({ x, y });
    } else {
      const newGrid = [...grid];
      newGrid[y][x] = grid[y][x] === 1 ? 0 : 1;
      setGrid(newGrid);
    }
  };

  const startSearch = () => {
    if (isSearching) return;
    setFinalPath([]);
    setBeamHistory([]);
    setCurrentStep(-1);

    const { history, path, parentMap } = gridBeamSearch(grid, start, goal, k);
    setBeamHistory(history);
    setFinalPath(path);
    setIsSearching(true);

    let step = 0;
    const interval = setInterval(() => {
      setCurrentStep(prev => prev + 1);
      step++;
      if (step >= history.length) {
        clearInterval(interval);
        setIsSearching(false);
        // Notify parent with full result for Tree Demo
        if (onSearchComplete) {
          onSearchComplete({ history, path, parentMap, start, goal });
        }
      }
    }, Math.round(100 / speed));
  };

  const applyPreset = (type) => {
    setPreset(type); // notify parent / siblings
    reset();
    const newGrid = Array(ROWS).fill().map(() => Array(COLS).fill(0));
    if (type === 'worst') {
      // U-shape wall around start (2, 10), opening away from goal (17, 10)
      for (let y = 8; y <= 12; y++) newGrid[y][5] = 1;
      for (let x = 1; x <= 5; x++) {
        newGrid[8][x] = 1;
        newGrid[12][x] = 1;
      }
      setStart({ x: 2, y: 10 });
      setGoal({ x: 17, y: 10 });
    } else {
      setStart({ x: 5, y: 10 });
      setGoal({ x: 15, y: 10 });
    }
    setGrid(newGrid);
  };

  const getCellClass = (x, y) => {
    if (x === start.x && y === start.y) return 'cell-start';
    if (x === goal.x && y === goal.y) return 'cell-goal';
    if (finalPath.some(p => p.x === x && p.y === y)) return 'cell-path';
    if (currentStep >= 0 && beamHistory[currentStep]?.beam.some(p => p.x === x && p.y === y)) return 'cell-beam';
    if (currentStep >= 0 && beamHistory[currentStep]?.visited.some(p => p.x === x && p.y === y)) return 'cell-visited';
    if (grid[y][x] === 1) return 'cell-wall';
    return 'bg-slate-700/30';
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 p-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Control Panel */}
      <div className="lg:w-80 flex flex-col gap-6 bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
        <div className="space-y-4">
          <h3 className="flex items-center gap-2 font-semibold text-slate-200">
            <Sliders size={18} className="text-blue-400" />
            Config k (Beam Width)
          </h3>
          <div className="flex items-center gap-4">
            <input 
              type="range" min="1" max="10" value={k}
              onChange={(e) => setK(Number(e.target.value))}
              className="w-full accent-blue-500"
            />
            <span className="text-xl font-bold text-blue-400 w-8">{k}</span>
          </div>
          <p className="text-xs text-slate-400">
            Lower k makes search faster but risks getting trapped in local optima.
          </p>
        </div>

        <div className="space-y-3">
          <h3 className="font-semibold text-slate-200">Tools</h3>
          <div className="grid grid-cols-3 gap-2">
            {[ 
              { id: 'start', label: 'Start', color: 'bg-green-500' },
              { id: 'goal', label: 'Goal', color: 'bg-red-500' },
              { id: 'wall', label: 'Wall', color: 'bg-slate-100 border border-slate-400' }
            ].map(tool => (
              <button
                key={tool.id}
                onClick={() => setEditMode(tool.id)}
                className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition-all ${
                  editMode === tool.id ? 'border-blue-500 bg-blue-500/10' : 'border-slate-700 hover:bg-slate-700'
                }`}
              >
                <div className={`w-4 h-4 rounded-sm ${tool.color}`} />
                <span className="text-[10px] text-slate-300">{tool.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="font-semibold text-slate-200">Presets</h3>
          <div className="flex gap-2">
            <button onClick={() => applyPreset('best')} className="flex-1 px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-xs transition-colors">Best Case</button>
            <button onClick={() => applyPreset('worst')} className="flex-1 px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-xs transition-colors">Worst Case</button>
          </div>
        </div>

        {/* Speed */}
        <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-700/50">
          <SpeedSlider speed={speed} onChange={setSpeed} />
        </div>

        <div className="mt-auto space-y-3">
          <button 
            onClick={startSearch}
            disabled={isSearching}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-900/40"
          >
            <Play size={20} fill="currentColor" />
            Start Search
          </button>
          <button 
            onClick={reset}
            className="w-full flex items-center justify-center gap-2 border border-slate-700 hover:bg-slate-700 py-2 rounded-xl text-slate-300 transition-all font-semibold"
          >
            <RotateCcw size={18} />
            Reset
          </button>
        </div>
      </div>

      {/* Grid Display */}
      <div className="flex-1 bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-2xl overflow-auto flex items-center justify-center">
        <div 
          className="grid gap-px bg-slate-800 border border-slate-800"
          style={{ 
            gridTemplateColumns: `repeat(${COLS}, minmax(15px, 30px))`,
            userSelect: 'none'
          }}
          onMouseLeave={handleMouseUp}
        >
          {grid.map((row, y) => 
            row.map((_, x) => (
              <div
                key={`${x}-${y}`}
                onMouseDown={() => handleMouseDown(x, y)}
                onMouseEnter={() => handleMouseEnter(x, y)}
                onMouseUp={handleMouseUp}
                className={`grid-cell w-full aspect-square cursor-crosshair ${getCellClass(x, y)}`}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default GridBoard;
