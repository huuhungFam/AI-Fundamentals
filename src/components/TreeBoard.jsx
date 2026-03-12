import React, { useState, useEffect, useRef } from 'react';
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  Background,
  Controls,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Play, RotateCcw, Zap, Grid3X3, TreePine, AlertTriangle } from 'lucide-react';
import { generateTreeData, buildTreeFromGridResult } from '../utils/beamSearch';

const TreeBoard = ({ preset, gridResult }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [k, setK] = useState(2);
  const [isSearching, setIsSearching] = useState(false);
  // treeMode: 'best' | 'worst' | 'grid'
  const [treeMode, setTreeMode] = useState('grid');
  const intervalRef = useRef(null);
  // Tracks all node IDs that have ever entered the beam (to keep them yellow)
  const everInBeamRef = useRef(new Set());

  // ─── Helpers ────────────────────────────────────────────────────────────────

  const buildFlowData = (tree) => {
    const builtNodes = [];
    const builtEdges = [];
    const spacingX = 220;
    const spacingY = 130;

    const traverse = (node, depth, posX, posY, pId) => {
      builtNodes.push({
        id: node.id,
        data: { label: node.label, h: node.h, isGoal: node.isGoal },
        position: { x: posX, y: posY },
        style: {
          background: node.isGoal ? '#ef4444' : '#1e293b',
          color: 'white',
          borderRadius: '12px',
          border: '2px solid #334155',
          minWidth: '120px',
          padding: '10px 12px',
          textAlign: 'center',
          opacity: 0.22,
        },
        className: 'transition-all duration-500',
      });

      if (pId) {
        builtEdges.push({
          id: `e-${pId}-${node.id}`,
          source: pId,
          target: node.id,
          style: { stroke: '#475569', strokeWidth: 2, opacity: 0.25 },
          markerEnd: { type: MarkerType.ArrowClosed, color: '#475569' },
        });
      }

      if (node.children?.length > 0) {
        const totalWidth = (node.children.length - 1) * spacingX;
        node.children.forEach((child, i) => {
          traverse(child, depth + 1, posX - totalWidth / 2 + i * spacingX, posY + spacingY, node.id);
        });
      }
    };

    traverse(tree, 0, 0, 0, null);
    return { builtNodes, builtEdges };
  };

  // ─── Init ────────────────────────────────────────────────────────────────────

  const initPresetTree = (type) => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsSearching(false);
    everInBeamRef.current = new Set(); // reset tracker
    const data = generateTreeData(type);
    const { builtNodes, builtEdges } = buildFlowData(data);
    setNodes(builtNodes);
    setEdges(builtEdges);
  };

  const initGridTree = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsSearching(false);
    everInBeamRef.current = new Set(); // reset tracker
    if (!gridResult) {
      setNodes([{
        id: 'placeholder',
        data: { label: '⚠️ Run a Grid Search\nfirst!' },
        position: { x: 0, y: 0 },
        style: { background: '#334155', color: '#94a3b8', borderRadius: '12px', padding: '20px', border: '2px dashed #475569' }
      }]);
      setEdges([]);
      return;
    }
    const { history, parentMap, path, start, goal } = gridResult;
    const { nodes: n, edges: e } = buildTreeFromGridResult(history, parentMap, path, start, goal);
    setNodes(n);
    setEdges(e);
  };

  useEffect(() => {
    if (treeMode === 'grid') {
      initGridTree();
    } else {
      initPresetTree(treeMode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [treeMode, gridResult]);

  // ─── Animation ───────────────────────────────────────────────────────────────

  // For preset modes: animate level-by-level, accumulating yellow for past beam nodes
  const animatePresetStep = (level) => {
    setNodes((nds) => {
      if (level === 0) {
        everInBeamRef.current.add('root');
        return nds.map(n =>
          n.id === 'root'
            ? { ...n, style: { ...n.style, opacity: 1, border: '3px solid #eab308', boxShadow: '0 0 8px #eab308' } }
            : n
        );
      }

      if (level === 1) {
        const rootChildren = nds.filter(n => n.id.startsWith('1-') || n.id.startsWith('w-'));
        rootChildren.sort((a, b) => a.data.h - b.data.h);
        const topK = new Set(rootChildren.slice(0, k).map(n => n.id));
        topK.forEach(id => everInBeamRef.current.add(id));
        return nds.map(n => {
          if (n.id === 'root') return { ...n, style: { ...n.style, opacity: 1 } };
          if (topK.has(n.id)) return { ...n, style: { ...n.style, opacity: 1, border: '3px solid #eab308', boxShadow: '0 0 8px #eab308' } };
          // Pruned (not in top-k and was a root child)
          if (rootChildren.some(rc => rc.id === n.id)) return { ...n, style: { ...n.style, opacity: 0.18 } };
          // Was in beam before → stay yellow
          if (everInBeamRef.current.has(n.id)) return { ...n, style: { ...n.style, opacity: 0.85, border: '2px solid #eab308', boxShadow: '0 0 5px #eab308' } };
          return n;
        });
      }

      if (level >= 2) {
        const isWorst = nds.some(n => n.id === 'w-1');
        const newBeam = [];
        if (!isWorst) {
          if (level === 2) newBeam.push('2-1');
          if (level >= 3) newBeam.push('goal');
        } else {
          if (k >= 2 && level === 2) newBeam.push('w-2');
          if (k >= 2 && level >= 3) newBeam.push('goal');
        }
        newBeam.forEach(id => everInBeamRef.current.add(id));

        return nds.map(n => {
          const isGoalReached = n.id === 'goal' && level >= 3;
          if (newBeam.includes(n.id)) {
            return { ...n, style: { ...n.style, opacity: 1, border: isGoalReached ? '4px solid #3b82f6' : '3px solid #eab308', boxShadow: isGoalReached ? '0 0 20px #3b82f6' : '0 0 8px #eab308' } };
          }
          // Keep yellow for nodes that were ever in beam
          if (everInBeamRef.current.has(n.id)) {
            return { ...n, style: { ...n.style, opacity: 0.85, border: '2px solid #eab308', boxShadow: '0 0 5px #eab308' } };
          }
          return n;
        });
      }
      return nds;
    });

    setEdges(eds => eds.map(e => ({ ...e, style: { ...e.style, opacity: level > 0 ? 0.45 : 0.25 } })));
  };

  // Grid mode: replay beam history, accumulating yellow for past beam nodes
  const animateGridStep = (stepIdx) => {
    if (!gridResult) return;
    const { history, path } = gridResult;
    const step = history[stepIdx];
    if (!step) return;

    const pathSet = new Set(path.map(p => `${p.x},${p.y}`));
    const beamSet = new Set(step.beam.map(p => `${p.x},${p.y}`));
    const visitedSet = new Set(step.visited.map(p => `${p.x},${p.y}`));
    const isLast = stepIdx === history.length - 1;

    // Accumulate current beam ids
    beamSet.forEach(id => everInBeamRef.current.add(id));

    setNodes(nds => nds.map(n => {
      // Final step: highlight path in blue (overrides yellow)
      if (isLast && pathSet.has(n.id)) {
        return { ...n, style: { ...n.style, opacity: 1, border: '4px solid #3b82f6', boxShadow: '0 0 18px #3b82f6' } };
      }
      // Currently in beam → bright yellow
      if (beamSet.has(n.id)) {
        return { ...n, style: { ...n.style, opacity: 1, border: '3px solid #eab308', boxShadow: '0 0 10px #eab308' } };
      }
      // Ever been in beam → keep dim yellow
      if (everInBeamRef.current.has(n.id)) {
        return { ...n, style: { ...n.style, opacity: 0.8, border: '2px solid #eab308', boxShadow: '0 0 5px #eab308' } };
      }
      // Visited but not beam → visible without highlight
      if (visitedSet.has(n.id)) {
        return { ...n, style: { ...n.style, opacity: 0.55, border: '2px solid #334155', boxShadow: 'none' } };
      }
      return n;
    }));

    setEdges(eds => eds.map(e => {
      const targetInPath = isLast && pathSet.has(e.target);
      return {
        ...e,
        style: {
          ...e.style,
          opacity: targetInPath ? 1 : everInBeamRef.current.has(e.target) ? 0.6 : visitedSet.has(e.target) ? 0.35 : 0.15,
          stroke: targetInPath ? '#3b82f6' : everInBeamRef.current.has(e.target) ? '#eab308' : '#475569',
        }
      };
    }));
  };

  const startSearch = () => {
    if (isSearching) return;

    // re-init to dim state
    if (treeMode === 'grid') {
      initGridTree();
    } else {
      initPresetTree(treeMode);
    }

    setIsSearching(true);

    if (treeMode === 'grid' && gridResult) {
      let step = 0;
      const total = gridResult.history.length;
      intervalRef.current = setInterval(() => {
        animateGridStep(step);
        step++;
        if (step >= total) {
          clearInterval(intervalRef.current);
          setIsSearching(false);
        }
      }, 400);
    } else {
      let level = 0;
      const maxLevel = 4;
      intervalRef.current = setInterval(() => {
        animatePresetStep(level);
        level++;
        if (level > maxLevel) {
          clearInterval(intervalRef.current);
          setIsSearching(false);
        }
      }, 1500);
    }
  };

  const handleReset = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsSearching(false);
    if (treeMode === 'grid') initGridTree();
    else initPresetTree(treeMode);
  };

  // ─── Tab button helper ────────────────────────────────────────────────────────
  const tabBtn = (mode, icon, label, colorClass) => (
    <button
      onClick={() => setTreeMode(mode)}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all border ${
        treeMode === mode
          ? `${colorClass} text-white border-transparent shadow-lg`
          : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
      }`}
    >
      {icon}
      {label}
    </button>
  );

  const noGridData = treeMode === 'grid' && !gridResult;

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] p-6 gap-4">
      {/* Controls Row */}
      <div className="flex flex-wrap items-center gap-4 bg-slate-800/50 p-4 rounded-2xl border border-slate-700">

        {/* Mode tabs */}
        <div className="flex gap-2 flex-wrap">
          {tabBtn('best', <TreePine size={15} />, 'Best Case', 'bg-emerald-600')}
          {tabBtn('worst', <AlertTriangle size={15} />, 'Worst Case', 'bg-orange-600')}
          {tabBtn('grid', <Grid3X3 size={15} />, 'Grid Demo', 'bg-blue-600')}
        </div>

        {/* Beam Width (only for preset modes) */}
        {treeMode !== 'grid' && (
          <div className="flex items-center gap-3 border-l border-slate-700 pl-4">
            <Zap className="text-yellow-400" size={18} />
            <span className="text-slate-300 text-sm font-semibold">k =</span>
            <input
              type="number" min="1" max="5" value={k}
              onChange={e => setK(Number(e.target.value))}
              className="w-14 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-blue-400 font-bold"
            />
          </div>
        )}

        {/* Grid Demo info badge */}
        {treeMode === 'grid' && (
          <div className="flex items-center gap-2 border-l border-slate-700 pl-4 text-sm">
            {gridResult ? (
              <span className="text-emerald-400 font-semibold">
                ✅ Grid search loaded — {gridResult.history.length} steps, path length {gridResult.path.length}
              </span>
            ) : (
              <span className="text-orange-400 font-semibold">
                ⚠️ No grid search yet — run a search on the Grid tab first
              </span>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="ml-auto flex gap-3">
          <button
            onClick={startSearch}
            disabled={isSearching || noGridData}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 px-5 py-2 rounded-xl font-bold transition-all shadow-lg"
          >
            <Play size={17} fill="currentColor" />
            Simulate
          </button>
          <button
            onClick={handleReset}
            className="flex items-center gap-2 border border-slate-700 hover:bg-slate-700 px-4 py-2 rounded-xl text-slate-300 transition-all"
          >
            <RotateCcw size={17} />
            Reset
          </button>
        </div>
      </div>

      {/* React Flow Canvas */}
      <div className="flex-1 bg-slate-900 rounded-2xl border border-slate-800 relative overflow-hidden">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          fitView
          className="bg-slate-950"
        >
          <Background color="#334155" gap={20} />
          <Controls />
        </ReactFlow>

        {/* Legend */}
        <div className="absolute top-4 right-4 bg-slate-900/90 p-4 rounded-xl border border-slate-700 text-xs text-slate-400 max-w-[180px] pointer-events-none space-y-1">
          <p className="font-bold text-slate-200 mb-2">Legend</p>
          <div className="flex items-center gap-2"><div className="w-3 h-3 bg-slate-800 border border-slate-600 rounded-sm" /> Standard Node</div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 bg-red-500 rounded-sm" /> Goal</div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 bg-green-500 rounded-sm" /> Start</div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 border-2 border-yellow-400 rounded-sm shadow-[0_0_5px_#eab308]" /> Active Beam</div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 border-2 border-blue-400 rounded-sm shadow-[0_0_5px_#3b82f6]" /> Final Path</div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 bg-slate-800 opacity-20 rounded-sm" /> Pruned</div>
        </div>
      </div>
    </div>
  );
};

export default TreeBoard;
