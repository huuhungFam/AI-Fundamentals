/**
 * Beam Search Implementation for Grid Pathfinding
 * @param {Array} grid - 2D grid of cells (0: empty, 1: wall)
 * @param {Object} start - {x, y}
 * @param {Object} goal - {x, y}
 * @param {number} k - Beam width
 * @returns {Object} { history, path, parentMap }
 */
export const gridBeamSearch = (grid, start, goal, k) => {
  const rows = grid.length;
  const cols = grid[0].length;
  const history = [];
  const visited = new Set();
  const parentMap = {}; // "x,y" -> "px,py"

  const getHeuristic = (point) =>
    Math.abs(point.x - goal.x) + Math.abs(point.y - goal.y);

  const getNeighbors = (point) => {
    const directions = [
      { x: 0, y: 1 }, { x: 0, y: -1 },
      { x: 1, y: 0 }, { x: -1, y: 0 }
    ];
    return directions
      .map(d => ({ x: point.x + d.x, y: point.y + d.y }))
      .filter(p =>
        p.x >= 0 && p.x < cols &&
        p.y >= 0 && p.y < rows &&
        grid[p.y][p.x] !== 1 &&
        !visited.has(`${p.x},${p.y}`)
      );
  };

  let currentBeam = [{ ...start, h: getHeuristic(start) }];
  visited.add(`${start.x},${start.y}`);

  while (currentBeam.length > 0) {
    history.push({
      beam: [...currentBeam],
      visited: Array.from(visited).map(s => {
        const [x, y] = s.split(',').map(Number);
        return { x, y };
      })
    });

    const goalNode = currentBeam.find(p => p.x === goal.x && p.y === goal.y);
    if (goalNode) {
      return {
        history,
        path: reconstructPath(parentMap, start, goal),
        parentMap,
      };
    }

    const nextCandidates = [];
    currentBeam.forEach(point => {
      const neighbors = getNeighbors(point);
      neighbors.forEach(n => {
        const key = `${n.x},${n.y}`;
        if (!visited.has(key)) {
          visited.add(key);
          parentMap[key] = `${point.x},${point.y}`;
          nextCandidates.push({ ...n, h: getHeuristic(n) });
        }
      });
    });

    nextCandidates.sort((a, b) => a.h - b.h);
    currentBeam = nextCandidates.slice(0, k);
  }

  return { history, path: [], parentMap };
};

const reconstructPath = (parentMap, start, goal) => {
  const path = [];
  let currentKey = `${goal.x},${goal.y}`;
  const startKey = `${start.x},${start.y}`;
  while (currentKey && currentKey !== startKey) {
    const [x, y] = currentKey.split(',').map(Number);
    path.unshift({ x, y });
    currentKey = parentMap[currentKey];
  }
  path.unshift(start);
  return path;
};

/**
 * Build ReactFlow nodes/edges from a grid BeamSearch result.
 * Each node label shows coordinate "(x, y)".
 */
export const buildTreeFromGridResult = (history, parentMap, path, start, goal) => {
  if (!history || history.length === 0) return { nodes: [], edges: [] };

  const startKey = `${start.x},${start.y}`;
  const goalKey = `${goal.x},${goal.y}`;
  const pathSet = new Set(path.map(p => `${p.x},${p.y}`));

  // Build parent -> [children] map
  const childrenMap = {}; // key -> [childKey]
  Object.entries(parentMap).forEach(([childKey, parentKey]) => {
    if (!childrenMap[parentKey]) childrenMap[parentKey] = [];
    childrenMap[parentKey].push(childKey);
  });

  // BFS to assign level & positional index
  const levelOf = {}; // key -> level
  const levelNodes = {}; // level -> [key]
  const queue = [startKey];
  levelOf[startKey] = 0;
  levelNodes[0] = [startKey];

  let head = 0;
  while (head < queue.length) {
    const key = queue[head++];
    const level = levelOf[key];
    (childrenMap[key] || []).forEach(childKey => {
      if (levelOf[childKey] === undefined) {
        levelOf[childKey] = level + 1;
        if (!levelNodes[level + 1]) levelNodes[level + 1] = [];
        levelNodes[level + 1].push(childKey);
        queue.push(childKey);
      }
    });
  }

  const spacingX = 90;
  const spacingY = 110;
  const nodes = [];
  const edges = [];

  Object.entries(levelNodes).forEach(([lvl, keys]) => {
    const y = parseInt(lvl) * spacingY;
    keys.forEach((key, idx) => {
      const x = (idx - (keys.length - 1) / 2) * spacingX;
      const [cx, cy] = key.split(',').map(Number);
      const isGoal = key === goalKey;
      const isStart = key === startKey;
      const isPath = pathSet.has(key);

      const h = Math.abs(cx - goal.x) + Math.abs(cy - goal.y);
      nodes.push({
        id: key,
        data: { label: isStart ? `S (${cx},${cy})` : isGoal ? `G (${cx},${cy})` : `(${cx},${cy})\nh=${h}` },
        position: { x, y },
        style: {
          background: isGoal ? '#ef4444' : isStart ? '#22c55e' : '#1e293b',
          color: 'white',
          borderRadius: '8px',
          border: isPath ? '2px solid #3b82f6' : '2px solid #334155',
          fontSize: '10px',
          padding: '4px 6px',
          minWidth: '54px',
          textAlign: 'center',
          boxShadow: isPath && !isStart ? '0 0 12px #3b82f640' : 'none',
          opacity: 0.25,
        }
      });

      if (parentMap[key]) {
        edges.push({
          id: `e-${parentMap[key]}-${key}`,
          source: parentMap[key],
          target: key,
          style: {
            stroke: isPath ? '#3b82f6' : '#475569',
            strokeWidth: isPath ? 2 : 1,
            opacity: 0.3,
          },
          markerEnd: { type: 'arrowclosed', color: isPath ? '#3b82f6' : '#475569' },
        });
      }
    });
  });

  return { nodes, edges };
};

/**
 * Tree Pruning preset data (abstract, not grid-based)
 */
export const generateTreeData = (type = 'best') => {
  const root = { id: 'root', label: 'S', h: 10, children: [] };
  if (type === 'best') {
    root.children = [
      { id: '1-1', label: 'A (h=5)', h: 5, children: [
          { id: '2-1', label: 'B (h=2)', h: 2, children: [
              { id: 'goal', label: 'G (h=0)', h: 0, isGoal: true, children: [] }
          ]}
      ]},
      { id: '1-2', label: 'C (h=8)', h: 8, children: [
          { id: '1-2-1', label: 'D (h=9)', h: 9, children: [] }
      ]}
    ];
  } else {
    root.children = [
      { id: 'w-1', label: 'X (h=2)', h: 2, children: [
          { id: 'w-1-1', label: 'Dead-end\n(h=1)', h: 1, children: [] }
      ]},
      { id: 'w-2', label: 'Y (h=9)', h: 9, children: [
          { id: 'goal', label: 'G (h=0)', h: 0, isGoal: true, children: [] }
      ]}
    ];
  }
  return root;
};
