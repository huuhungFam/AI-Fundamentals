# Tài liệu Kiến trúc Source Code & Giao diện Người dùng
## Dự án: Beam Search Visualizer

> **Mục tiêu tài liệu:** Giải thích toàn diện kiến trúc mã nguồn, vai trò từng component, cơ chế quản lý state, và logic xử lý sự kiện trong ứng dụng mô phỏng thuật toán Beam Search.

---

## 1. Tổng quan Cấu trúc Thư mục

```
NenTangAI/
├── index.html                  # Điểm vào HTML (Vite entry)
├── vite.config.js              # Cấu hình Vite bundler
├── tailwind.config.js          # Cấu hình Tailwind CSS
├── Docs/                       # Thư mục tài liệu
│   ├── 01_Code_Architecture_And_UI.md
│   └── 02_Algorithm_Flow_And_Logic.md
└── src/
    ├── assets/                 # Ảnh/icon nội bộ (Vite import)
    ├── main.jsx                # Bootstrap ứng dụng React
    ├── App.jsx                 # Component gốc, quản lý tab & state chia sẻ
    ├── App.css                 # (Hiện tại chưa được import) CSS legacy từ template Vite
    ├── index.css               # CSS cốt lõi: biến, grid-cell classes
    ├── components/
    │   ├── TopMenu.jsx         # Thanh điều hướng tab (Grid / Tree)
    │   ├── GridBoard.jsx       # Màn hình mô phỏng tìm đường trên lưới 2D
    │   ├── TreeBoard.jsx       # Màn hình mô phỏng cây pruning (ReactFlow/@xyflow)
    │   └── SpeedSlider.jsx     # Slider tốc độ mô phỏng (0.25x → 4x)
    └── utils/
        └── beamSearch.js       # Toàn bộ logic thuật toán & xây dựng dữ liệu cây
```

### Ý nghĩa từng thành phần

| File | Vai trò |
|---|---|
| `main.jsx` | Render `<App />` vào DOM, là cầu nối giữa React và file HTML |
| `App.jsx` | Component chứa state toàn cục, điều phối hai màn hình chính |
| `SpeedSlider.jsx` | UI điều chỉnh tốc độ mô phỏng (multiplier), được dùng ở cả Grid và Tree |
| `TopMenu.jsx` | Thanh navigation đơn thuần (stateless), nhận callback từ `App` |
| `GridBoard.jsx` | UI + logic animation cho lưới 2D 20×20 |
| `TreeBoard.jsx` | UI + logic animation cho cây tìm kiếm dùng ReactFlow |
| `beamSearch.js` | Thuần logic: thuật toán, heuristic, reconstruct path, build tree |

---

## 2. Phân tích `main.jsx` — Bootstrap ứng dụng

```jsx
// src/main.jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

- `createRoot` là API của React 18+ (bao gồm React 19) cho phép concurrent rendering.
- `StrictMode` kích hoạt các cảnh báo phát triển (double-render trong dev mode) để phát hiện side-effect không thuần túy.
- `index.css` được import tại đây để đảm bảo CSS được áp dụng toàn cục trước khi bất kỳ component nào render.

---

## 3. Phân tích `App.jsx` — Component Gốc & State Chia sẻ

### 3.1 State và Cấu trúc

```jsx
// src/App.jsx
function App() {
  const [activeTab, setActiveTab] = useState('grid');
  const [preset, setPreset] = useState('best');
  const [gridResult, setGridResult] = useState(null);
  // ...
}
```

#### Bảng phân tích State

| State | Kiểu dữ liệu | Giá trị mặc định | Ý nghĩa |
|---|---|---|---|
| `activeTab` | `string` | `'grid'` | Tab đang hiển thị: `'grid'` hoặc `'tree'` |
| `preset` | `string` | `'best'` | Preset cho **GridBoard**: `'best'` hoặc `'worst'` (TreeBoard hiện điều khiển bằng `treeMode` nội bộ, không đọc `preset`) |
| `gridResult` | `object | null` | `null` | Kết quả tìm kiếm trên lưới, chứa `{ history, path, parentMap, start, goal }` |

#### Luồng dữ liệu (Data Flow)

```
App (state: activeTab, preset, gridResult)
  │
  ├──► TopMenu  ─── props: activeTab, setActiveTab
  │
  ├──► GridBoard ── props: preset, setPreset, onSearchComplete(setGridResult)
  │         │
  │         └── Khi tìm xong: gọi onSearchComplete({history, path, parentMap, start, goal})
  │                              → App.gridResult được cập nhật
  │
  └──► TreeBoard ── props: gridResult  (App vẫn truyền `preset` nhưng TreeBoard hiện chưa sử dụng)
             └── Nhận gridResult để vẽ cây từ kết quả lưới thực tế (Grid Demo)
```

Thiết kế này là **Prop Drilling** một cách có chủ ý: `gridResult` chỉ cần chia sẻ một chiều từ `GridBoard` → `App` → `TreeBoard`, không cần Context hay Redux.

### 3.2 Render theo điều kiện (Conditional Rendering)

```jsx
{activeTab === 'grid' ? (
  <GridBoard preset={preset} setPreset={setPreset} onSearchComplete={setGridResult} />
) : (
  <TreeBoard preset={preset} gridResult={gridResult} />
)}
```

Kỹ thuật này đảm bảo component không active sẽ bị **unmount** hoàn toàn khỏi DOM, tránh animation "zombie" chạy ngầm ở tab ẩn.

---

## 4. Phân tích `TopMenu.jsx` — Navigation Bar

```jsx
// src/components/TopMenu.jsx
const TopMenu = ({ activeTab, setActiveTab }) => {
  return (
    <nav className="... sticky top-0 z-50">
      {/* Logo */}
      <h1>Beam Search Visualizer</h1>

      {/* Tab Buttons */}
      <button onClick={() => setActiveTab('grid')} className={`... ${activeTab === 'grid' ? 'bg-blue-600' : 'bg-slate-700'}`}>
        <Grid3X3 /> Grid Pathfinding
      </button>
      <button onClick={() => setActiveTab('tree')} className={`... ${activeTab === 'tree' ? 'bg-emerald-600' : 'bg-slate-700'}`}>
        <TreePine /> Tree Pruning
      </button>
    </nav>
  );
};
```

- `TopMenu` là một **Presentational Component** (không có state nội bộ) — toàn bộ logic điều hướng được xử lý bởi `App`.
- `sticky top-0 z-50`: Thanh nav dính ở đầu trang và luôn đứng trên mọi phần tử khác.
- Màu nút được điều khiển bởi `activeTab`: tab Grid dùng `bg-blue-600`, tab Tree dùng `bg-emerald-600`.

---

## 5. Phân tích `GridBoard.jsx` — Màn hình Tìm đường Lưới 2D

### 5.1 Các Hằng số và Import

```jsx
import React, { useState, useEffect, useRef } from 'react';
import { Play, RotateCcw, Sliders } from 'lucide-react';
import { gridBeamSearch } from '../utils/beamSearch';
import SpeedSlider from './SpeedSlider';

const ROWS = 20;
const COLS = 20;
```

- `ROWS = 20, COLS = 20`: Lưới cố định 20×20 ô (400 ô tổng cộng).
- Các icon từ `lucide-react` được dùng thuần túy cho mục đích UI.

### 5.2 Phân tích State

```jsx
const GridBoard = ({ preset, setPreset, onSearchComplete }) => {
  const [grid, setGrid]                 = useState(Array(ROWS).fill().map(() => Array(COLS).fill(0)));
  const [start, setStart]               = useState({ x: 2, y: 10 });
  const [goal, setGoal]                 = useState({ x: 17, y: 10 });
  const [k, setK]                       = useState(3);
  const [isSearching, setIsSearching]   = useState(false);
  const [beamHistory, setBeamHistory]   = useState([]);
  const [currentStep, setCurrentStep]   = useState(-1);
  const [finalPath, setFinalPath]       = useState([]);
  const [editMode, setEditMode]         = useState('wall');
  const [speed, setSpeed]               = useState(1);       // multiplier (0.25x → 4x)
  const isMouseDown                     = useRef(false);
```

#### Bảng phân tích chi tiết từng State

| State | Kiểu | Mặc định | Ý nghĩa kỹ thuật |
|---|---|---|---|
| `grid` | `number[][]` | Ma trận 20×20 toàn `0` | Biểu diễn lưới ô vuông: `0` = ô trống, `1` = tường (wall). Row-major: `grid[y][x]` |
| `start` | `{x, y}` | `{x:2, y:10}` | Vị trí điểm bắt đầu trong hệ tọa độ lưới |
| `goal` | `{x, y}` | `{x:17, y:10}` | Vị trí điểm đích |
| `k` | `number` | `3` | Beam width — số node tối đa giữ lại mỗi bước |
| `isSearching` | `boolean` | `false` | Cờ ngăn chặn tương tác hoặc chạy lại trong khi đang animation |
| `beamHistory` | `object[]` | `[]` | Mảng các "frame" lịch sử, mỗi phần tử là `{ beam: [...], visited: [...] }` |
| `currentStep` | `number` | `-1` | Index frame hiện tại của animation (`-1` = chưa bắt đầu) |
| `finalPath` | `{x,y}[]` | `[]` | Mảng tọa độ tạo thành đường đi tối ưu khi tìm thấy goal |
| `editMode` | `string` | `'wall'` | Chế độ chỉnh sửa lưới: `'wall'`, `'start'`, hoặc `'goal'` |
| `speed` | `number` | `1` | Tốc độ mô phỏng (multiplier). Frame interval được tính bằng `Math.round(100 / speed)` ms |
| `isMouseDown` | `Ref<boolean>` | `false` | **Không phải state** — lưu trạng thái chuột để xử lý drag mà không trigger re-render |

#### Tại sao `isMouseDown` dùng `useRef` thay vì `useState`?

`useState` sẽ trigger re-render mỗi khi giá trị thay đổi. Khi người dùng kéo chuột qua nhiều ô, sự kiện `mouseenter` được gọi liên tục. Nếu dùng `useState` cho flag chuột, mỗi lần chuột vào một ô sẽ render lại toàn bộ component — gây lag nghiêm trọng. `useRef` cho phép đọc/ghi giá trị ngay lập tức **mà không trigger re-render**.

### 5.3 Phân tích Xử lý Sự kiện Tương tác Lưới

#### Block code: `handleMouseDown`, `handleMouseEnter`, `handleMouseUp`

```jsx
const handleMouseDown = (x, y) => {
  isMouseDown.current = true;      // Đánh dấu chuột đang được nhấn
  handleCellInteraction(x, y);    // Xử lý ngay ô được click
};

const handleMouseEnter = (x, y) => {
  if (isMouseDown.current) {       // Chỉ xử lý khi đang giữ chuột (drag)
    handleCellInteraction(x, y);
  }
};

const handleMouseUp = () => {
  isMouseDown.current = false;    // Giải phóng trạng thái chuột
};
```

Ba hàm này tạo thành cơ chế **"paint on drag"**: người dùng có thể nhấn và kéo chuột để vẽ tường liên tục, tương tự MS Paint.

- `onMouseLeave` trên container (div lưới) cũng gọi `handleMouseUp` để tránh bug "chuột ra ngoài lưới nhưng vẫn vẽ tiếp".

#### Block code: `handleCellInteraction` — Hàm xử lý tương tác ô

```jsx
const handleCellInteraction = (x, y) => {
  if (isSearching) return;                    // Không cho tương tác khi đang chạy thuật toán

  if (editMode === 'start') {
    setStart({ x, y });                       // Di chuyển điểm Start
  } else if (editMode === 'goal') {
    setGoal({ x, y });                        // Di chuyển điểm Goal
  } else {
    // Chế độ Wall: Toggle — nếu đang là wall thì xóa, nếu trống thì thêm wall
    const newGrid = [...grid];                // Shallow copy để tránh mutate state trực tiếp
    newGrid[y][x] = grid[y][x] === 1 ? 0 : 1;
    setGrid(newGrid);
  }
};
```

**Lưu ý quan trọng về immutability:** `const newGrid = [...grid]` tạo một array mới nhưng các **hàng bên trong vẫn là tham chiếu cũ**. Điều này hoạt động vì ta chỉ thay đổi một phần tử trong hàng, React vẫn detect được sự thay đổi qua spread operator ở level mảng ngoài. Để đảm bảo tuyệt đối, có thể deep-clone (`grid.map(r => [...r])`), nhưng shallow copy đủ dùng ở đây.

#### Block code: `applyPreset` — Tải cảnh huống mẫu

```jsx
const applyPreset = (type) => {
  setPreset(type);    // Thông báo lên App về preset mới (hiện chủ yếu phục vụ GridBoard)
  reset();            // Xóa sạch mọi state animation

  const newGrid = Array(ROWS).fill().map(() => Array(COLS).fill(0));

  if (type === 'worst') {
    // Xây tường hình chữ U bẫy điểm Start (2, 10)
    // Tường dọc tại cột x=5, từ y=8 đến y=12
    for (let y = 8; y <= 12; y++) newGrid[y][5] = 1;
    // Tường ngang ở hàng y=8 và y=12, từ x=1 đến x=5
    for (let x = 1; x <= 5; x++) {
      newGrid[8][x] = 1;
      newGrid[12][x] = 1;
    }
    setStart({ x: 2, y: 10 });
    setGoal({ x: 17, y: 10 });
  } else {
    // Best case: không có tường, đường thẳng
    setStart({ x: 5, y: 10 });
    setGoal({ x: 15, y: 10 });
  }
  setGrid(newGrid);
};
```

Trường hợp Worst Case tạo ra một mê cung hình chữ **U** bao quanh điểm Start. Beam Search sẽ bị "mắc kẹt" vì hướng có h(n) tốt nhất bị chặn bởi tường, buộc thuật toán phải vòng vèo — minh họa điểm yếu của Beam Search khi Beam Width nhỏ.

### 5.4 Phân tích Hàm Phân loại Ô (getCellClass)

```jsx
const getCellClass = (x, y) => {
  if (x === start.x && y === start.y) return 'cell-start';    // Ưu tiên cao nhất
  if (x === goal.x  && y === goal.y)  return 'cell-goal';
  if (finalPath.some(p => p.x === x && p.y === y)) return 'cell-path';
  if (currentStep >= 0 && beamHistory[currentStep]?.beam.some(p => p.x === x && p.y === y))
    return 'cell-beam';
  if (currentStep >= 0 && beamHistory[currentStep]?.visited.some(p => p.x === x && p.y === y))
    return 'cell-visited';
  if (grid[y][x] === 1) return 'cell-wall';
  return 'bg-slate-700/30';    // Ô trống mặc định
};
```

Hàm này áp dụng **priority chain** — kiểm tra theo thứ tự ưu tiên giảm dần:

```
Start/Goal  >  Final Path  >  Current Beam  >  Visited  >  Wall  >  Empty
```

CSS classes tương ứng được định nghĩa trong `index.css`:

```css
/* src/index.css */
.cell-start   { background-color: #22c55e !important; }
.cell-goal    { background-color: #ef4444 !important; }
.cell-wall    { background-color: #f1f5f9 !important; }
.cell-beam    { background-color: #eab308 !important; box-shadow: 0 0 10px #eab308; }
.cell-path    { background-color: #3b82f6 !important; box-shadow: 0 0 15px #3b82f6; z-index: 10; }
.cell-visited { background-color: rgba(234, 179, 8, 0.2); }
```

### 5.5 Cơ chế Animation — Kết hợp `setInterval` và mảng `beamHistory`

Đây là trái tim của hệ thống animation:

```jsx
const startSearch = () => {
  if (isSearching) return;

  // 1. Reset animation state
  setFinalPath([]);
  setBeamHistory([]);
  setCurrentStep(-1);

  // 2. Chạy thuật toán ĐỒNG BỘ — lấy toàn bộ lịch sử ngay lập tức
  const { history, path, parentMap } = gridBeamSearch(grid, start, goal, k);

  // 3. Lưu "kịch bản" vào state
  setBeamHistory(history);
  setFinalPath(path);
  setIsSearching(true);

  // 4. Phát lại từng frame theo thời gian thực
  let step = 0;
  const interval = setInterval(() => {
    setCurrentStep(prev => prev + 1);   // Di chuyển "con trỏ" frame lên 1
    step++;
    if (step >= history.length) {
      clearInterval(interval);           // Dừng animation
      setIsSearching(false);
      if (onSearchComplete) {
        onSearchComplete({ history, path, parentMap, start, goal });
      }
    }
  }, Math.round(100 / speed));          // SpeedSlider điều chỉnh tốc độ (multiplier)
};
```

#### Sơ đồ cơ chế Animation

```
[Nhấn Start Search]
        │
        ▼
gridBeamSearch() chạy đồng bộ
        │ kết quả: history = [frame0, frame1, frame2, ...]
        │          path    = [{x,y}, {x,y}, ...]
        ▼
setBeamHistory(history) ─── lưu toàn bộ frames vào state
setFinalPath(path)
        │
        ▼
setInterval(callback, round(100/speed) ms)
        │
        ├── Tick 1: setCurrentStep(0) → React re-render → getCellClass đọc beamHistory[0]
        ├── Tick 2: setCurrentStep(1) → React re-render → getCellClass đọc beamHistory[1]
        ├── Tick 3: setCurrentStep(2) → React re-render → getCellClass đọc beamHistory[2]
        │   ...
        └── Tick N: step >= history.length → clearInterval() → setIsSearching(false)
                    → gọi onSearchComplete để thông báo kết quả cho App (→ TreeBoard)
```

**Thiết kế "Pre-compute, then Animate":** Thuật toán không chạy từng bước trong interval. Thay vào đó, toàn bộ lịch sử được tính trước ngay lập tức (trong vài milliseconds), sau đó interval chỉ đơn giản là "tua lại" các frame đã có sẵn. Điều này đảm bảo:
- Animation mượt mà, không bị block bởi tính toán.
- Có thể thay đổi tốc độ dễ dàng bằng `SpeedSlider` (thay vì hard-code ms/frame).

---

## 6. Phân tích `TreeBoard.jsx` — Màn hình Cây Pruning

### 6.1 Dependencies và State

```jsx
import { ReactFlow, useNodesState, useEdgesState, Background, Controls, MarkerType } from '@xyflow/react';
import { generateTreeData, buildTreeFromGridResult } from '../utils/beamSearch';
import SpeedSlider from './SpeedSlider';

const TreeBoard = ({ preset, gridResult }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [k, setK]                        = useState(2);
  const [isSearching, setIsSearching]    = useState(false);
  const [treeMode, setTreeMode]          = useState('grid');
  const intervalRef                      = useRef(null);
  const [speed, setSpeed]                = useState(1);        // multiplier
  const everInBeamRef                    = useRef(new Set());
```

`TreeBoard` sử dụng thư viện **ReactFlow** (`@xyflow/react`) — một thư viện chuyên để render đồ thị/cây tương tác. Nodes và edges được quản lý bởi hook riêng của ReactFlow.

#### Bảng phân tích State của TreeBoard

| State/Ref | Ý nghĩa |
|---|---|
| `nodes` | Mảng các object node ReactFlow (chứa `id`, `position`, `data`, `style`) |
| `edges` | Mảng các object cạnh ReactFlow (chứa `source`, `target`, `style`) |
| `k` | Beam width cho chế độ preset (độc lập với k của GridBoard) |
| `treeMode` | Chế độ hiển thị: `'best'`, `'worst'`, hoặc `'grid'` |
| `intervalRef` | Ref lưu interval ID để có thể `clearInterval` khi cần (tránh memory leak) |
| `speed` | Tốc độ mô phỏng (multiplier). Preset dùng `Math.round(1500 / speed)`, Grid Demo dùng `Math.round(400 / speed)` |
| `everInBeamRef` | **Accumulate Set** — tập hợp tất cả node IDs đã từng vào beam, dùng để giữ màu vàng sau khi beam đi qua |

### 6.2 Hook `useEffect` — Đồng bộ với preset và gridResult

```jsx
useEffect(() => {
  if (treeMode === 'grid') {
    initGridTree();
  } else {
    initPresetTree(treeMode);
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [treeMode, gridResult]);
```

Effect này chạy lại mỗi khi `treeMode` thay đổi (người dùng chuyển tab trong TreeBoard) **hoặc** `gridResult` thay đổi (GridBoard vừa hoàn thành tìm kiếm mới). Đây là điểm đồng bộ quan trọng giữa hai màn hình.

### 6.2.1 Hành vi khi chưa có `gridResult` (Grid Demo)

Trong `treeMode === 'grid'`, nếu người dùng **chưa chạy Grid Search** (tức `gridResult === null`), `TreeBoard` sẽ:

- Render 1 node placeholder (dashed border) nhắc “Run a Grid Search first!”
- Disable nút `Simulate` (vì không có `history` để replay)
- Hiển thị badge cảnh báo ở hàng điều khiển (“No grid search yet …”)

### 6.3 Hàm `buildFlowData` — Xây dựng Cây từ Data Preset

```jsx
const buildFlowData = (tree) => {
  const traverse = (node, depth, posX, posY, pId) => {
    builtNodes.push({
      id: node.id,
      data: { label: node.label, h: node.h },
      position: { x: posX, y: posY },
      style: { /* ... */ opacity: 0.22 }  // Mờ lúc đầu
    });

    if (pId) {
      builtEdges.push({ id: `e-${pId}-${node.id}`, source: pId, target: node.id, /* ... */ });
    }

    // Đệ quy: chia đều không gian ngang cho các con
    const totalWidth = (node.children.length - 1) * spacingX;
    node.children.forEach((child, i) => {
      traverse(child, depth + 1,
        posX - totalWidth / 2 + i * spacingX,  // Căn giữa các con quanh cha
        posY + spacingY,
        node.id
      );
    });
  };

  traverse(tree, 0, 0, 0, null);
};
```

Đây là thuật toán **DFS (Depth-First)** để duyệt cây và tính vị trí (x, y) cho từng node. Công thức `posX - totalWidth/2 + i * spacingX` đảm bảo các node con được căn giữa đều đặn xung quanh node cha.

### 6.4 Animation cho Chế độ Preset (`animatePresetStep`)

```jsx
const animatePresetStep = (level) => {
  setNodes((nds) => {
    if (level === 0) {
      // Level 0: Sáng root node lên, đánh dấu vào everInBeamRef
      everInBeamRef.current.add('root');
      return nds.map(n => n.id === 'root'
        ? { ...n, style: { ...n.style, opacity: 1, border: '3px solid #eab308' } }
        : n
      );
    }

    if (level === 1) {
      // Level 1: Lấy tất cả con của root, sắp xếp theo h, giữ top-k
      const rootChildren = nds.filter(n => n.id.startsWith('1-') || n.id.startsWith('w-'));
      rootChildren.sort((a, b) => a.data.h - b.data.h);
      const topK = new Set(rootChildren.slice(0, k).map(n => n.id));
      topK.forEach(id => everInBeamRef.current.add(id));

      return nds.map(n => {
        if (topK.has(n.id)) return { ...n, style: { opacity: 1, border: '3px solid #eab308' } };    // Trong beam
        if (rootChildren.some(rc => rc.id === n.id)) return { ...n, style: { opacity: 0.18 } };     // Bị pruning
        if (everInBeamRef.current.has(n.id)) return { ...n, style: { opacity: 0.85, border: '2px solid #eab308' } }; // Đã qua beam
        return n;
      });
    }
    // ...
  });
};
```

Chiến lược animation level-by-level:
1. **Mỗi level = một frame animation** (preset: `Math.round(1500 / speed)` ms/frame).
2. `setNodes` dùng **functional update** (`nds => ...`) để đảm bảo nhận state mới nhất.
3. Spread operator `{ ...n, style: { ...n.style, ... } }` tạo object mới, kích hoạt React re-render.
4. `everInBeamRef` đảm bảo node đã vào beam trước đó luôn giữ màu vàng mờ để người xem thấy lịch sử.

### 6.5 Animation cho Chế độ Grid (`animateGridStep`)

```jsx
const animateGridStep = (stepIdx) => {
  const { history, path } = gridResult;
  const step = history[stepIdx];
  const pathSet    = new Set(path.map(p    => `${p.x},${p.y}`));
  const beamSet    = new Set(step.beam.map(p    => `${p.x},${p.y}`));
  const visitedSet = new Set(step.visited.map(p => `${p.x},${p.y}`));
  const isLast = stepIdx === history.length - 1;

  beamSet.forEach(id => everInBeamRef.current.add(id));

  setNodes(nds => nds.map(n => {
    if (isLast && pathSet.has(n.id))
      return { ...n, style: { ...n.style, opacity: 1, border: '4px solid #3b82f6', boxShadow: '0 0 18px #3b82f6' } };
    if (beamSet.has(n.id))
      return { ...n, style: { ...n.style, opacity: 1, border: '3px solid #eab308', boxShadow: '0 0 10px #eab308' } };
    if (everInBeamRef.current.has(n.id))
      return { ...n, style: { ...n.style, opacity: 0.8, border: '2px solid #eab308' } };
    if (visitedSet.has(n.id))
      return { ...n, style: { ...n.style, opacity: 0.55, border: '2px solid #334155' } };
    return n;
  }));
};
```

Hàm này mirror chính xác logic trực quan của `GridBoard.getCellClass` nhưng cho ngữ cảnh cây ReactFlow:
- Frame cuối cùng (`isLast`): highlight màu **xanh lam** cho đường đi tối ưu.
- Node trong beam hiện tại: màu **vàng sáng** (active beam).
- Node từng trong beam: màu **vàng mờ** (lịch sử beam).
- Node đã visited: màu **xám nhạt** (đã khám phá).

Tốc độ replay trong **Grid Demo của TreeBoard** được điều khiển bởi `SpeedSlider` với interval `Math.round(400 / speed)` ms/frame (khác với GridBoard là `Math.round(100 / speed)`).

---

## 7. Tổng kết Kiến trúc

```
┌─────────────────────────────────────────────────────────────┐
│                         App.jsx                             │
│  State: activeTab, preset, gridResult                       │
│                                                             │
│  ┌─────────────┐    ┌──────────────┐    ┌───────────────┐  │
│  │  TopMenu    │    │  GridBoard   │    │  TreeBoard    │  │
│  │  (display)  │    │  (compute +  │───►│  (visualize   │  │
│  │             │    │   animate)   │    │   tree)       │  │
│  └─────────────┘    └──────────────┘    └───────────────┘  │
│                            │                               │
│                     gridResult flows up                     │
│                     from GridBoard → App → TreeBoard        │
└─────────────────────────────────────────────────────────────┘
                             │
                      beamSearch.js
                (logic, không React, thuần JS)
```

### Các pattern kiến trúc được áp dụng

| Pattern | Áp dụng ở đâu | Mục đích |
|---|---|---|
| **Lifting State Up** | `gridResult` trong `App` | Chia sẻ kết quả giữa GridBoard và TreeBoard |
| **Controlled Component** | `k` slider, `editMode` buttons | UI phản chiếu state, không tự quản lý |
| **Pre-compute & Replay** | `startSearch` + `setInterval` | Tách biệt tính toán và hiển thị animation |
| **Presentational Component** | `TopMenu` | Thuần UI, không có business logic |
| **Functional Update** | `setNodes(nds => ...)` | Đảm bảo nhận state mới nhất trong callback async |
