import React from 'react';
import { Layout, TreePine, Grid3X3 } from 'lucide-react';

const TopMenu = ({ activeTab, setActiveTab }) => {
  return (
    <nav className="bg-slate-800 border-b border-slate-700 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
      <div className="flex items-center gap-2">
        <div className="bg-blue-600 p-2 rounded-lg">
          <Layout className="text-white w-6 h-6" />
        </div>
        <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
          Beam Search Visualizer
        </h1>
      </div>

      <div className="flex gap-4">
        <button
          onClick={() => setActiveTab('grid')}
          className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
            activeTab === 'grid'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40'
              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
          }`}
        >
          <Grid3X3 size={18} />
          <span>Grid Pathfinding</span>
        </button>

        <button
          onClick={() => setActiveTab('tree')}
          className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
            activeTab === 'tree'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/40'
              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
          }`}
        >
          <TreePine size={18} />
          <span>Tree Pruning</span>
        </button>
      </div>
    </nav>
  );
};

export default TopMenu;
