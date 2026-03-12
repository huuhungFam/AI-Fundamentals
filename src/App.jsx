import React, { useState } from 'react';
import TopMenu from './components/TopMenu';
import GridBoard from './components/GridBoard';
import TreeBoard from './components/TreeBoard';

function App() {
  const [activeTab, setActiveTab] = useState('grid');
  const [preset, setPreset] = useState('best');
  // gridResult is set when a Grid search completes; passed to TreeBoard for "Grid Demo"
  const [gridResult, setGridResult] = useState(null);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans selection:bg-blue-500/30">
      <TopMenu activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="flex-1 flex flex-col items-center">
        <div className="w-full max-w-7xl">
          {activeTab === 'grid' ? (
            <div className="p-4 space-y-2">
              <header className="px-6 py-4">
                <h2 className="text-3xl font-extrabold text-white tracking-tight">Grid Pathfinding Demo</h2>
                <p className="text-slate-400 mt-1 italic">
                  Visualizing level-by-level exploration on a 2D grid.
                </p>
              </header>
              <GridBoard preset={preset} setPreset={setPreset} onSearchComplete={setGridResult} />
            </div>
          ) : (
            <div className="p-4 space-y-2">
              <header className="px-6 py-4">
                <h2 className="text-3xl font-extrabold text-white tracking-tight">Tree Pruning Demo</h2>
                <p className="text-slate-400 mt-1 italic">
                  See how low-heuristic branches are discarded (pruned) to manage search space.
                </p>
              </header>
              <TreeBoard preset={preset} gridResult={gridResult} />
            </div>
          )}
        </div>
      </main>

      <footer className="py-6 border-t border-slate-800 text-center text-slate-500 text-sm">
        Beam Search Simulation • Built with React & Tailwind CSS
      </footer>
    </div>
  );
}

export default App;
