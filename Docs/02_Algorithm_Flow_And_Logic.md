# Tài liệu Luồng hoạt động & Logic Thuật toán Beam Search
## Dự án: Beam Search Visualizer

> **Mục tiêu tài liệu:** Phân tích chuyên sâu toàn bộ logic thuật toán trong file `src/utils/beamSearch.js`, bao gồm hàm heuristic, cấu trúc dữ liệu, luồng thực thi, cơ chế sắp xếp-cắt tỉa, và cách xây dựng cây kết quả.

---

## 1. Tổng quan File `beamSearch.js`

File này đóng vai trò là **lõi thuần logic** của ứng dụng, hoàn toàn tách biệt khỏi React. Nó chứa ba hàm xuất (export) chính:

| Hàm/Hằng | Mô tả |
|---|---|
| `gridBeamSearch(grid, start, goal, k)` | Thuật toán Beam Search trên lưới 2D |
| `buildTreeFromGridResult(history, parentMap, path, start, goal)` | Chuyển đổi kết quả lưới thành dữ liệu cây ReactFlow |
| `generateTreeData(type = 'best')` | Tạo dữ liệu cây mẫu tĩnh (Best/Worst Case) |

---

## 2. Hàm Heuristic — `getHeuristic`

### 2.1 Định nghĩa và Code

```javascript
// Được định nghĩa nội bộ bên trong gridBeamSearch
const getHeuristic = (point) =>
  Math.abs(point.x - goal.x) + Math.abs(point.y - goal.y);
```

### 2.2 Giải thích: Khoảng cách Manhattan

**Khoảng cách Manhattan** (Manhattan Distance), hay còn gọi là *taxicab geometry*, được tính theo công thức:

$$h(n) = |x_n - x_{goal}| + |y_n - y_{goal}|$$

**Tại sao dùng Manhattan thay vì Euclidean?**

| Tiêu chí | Manhattan Distance | Euclidean Distance |
|---|---|---|
| Công thức | `|Δx| + |Δy|` | `sqrt(Δx² + Δy²)` |
| Chi phí tính toán | Rất thấp (phép trừ, tuyệt đối) | Cao hơn (bình phương, căn bậc hai) |
| Phù hợp với | Di chuyển 4 chiều (lên/xuống/trái/phải) | Di chuyển 8 chiều hoặc liên tục |
| Admissibility | **Admissible** — luôn ≤ chi phí thực | Admissible nhưng dưới ước hơn |

Trong dự án này, agent chỉ di chuyển theo 4 hướng cơ bản (không di chuyển chéo), vì vậy Manhattan Distance là **heuristic chính xác và tự nhiên nhất**. Mỗi ô di chuyển = 1 bước, và khoảng cách Manhattan đếm đúng số bước tối thiểu trong trường hợp không có tường.

### 2.3 Ví dụ minh họa

```
Lưới 5×5, Start tại (1,1), Goal tại (4,4):

    0   1   2   3   4  (x)
0 [ .   .   .   .   . ]
1 [ .  [S]  .   .   . ]   h(S) = |1-4| + |1-4| = 3 + 3 = 6
2 [ .   .   .   .   . ]
3 [ .   .   .  (n)  . ]   h(n) = |3-4| + |3-4| = 1 + 1 = 2
4 [ .   .   .   .  [G] ]  h(G) = |4-4| + |4-4| = 0 + 0 = 0
(y)

→ Beam Search ưu tiên node (3,3) vì h=2 thấp hơn Start h=6
```

---

## 3. Hàm Tìm Node Kề — `getNeighbors`

```javascript
const getNeighbors = (point) => {
  const directions = [
    { x: 0, y: 1 },    // Xuống
    { x: 0, y: -1 },   // Lên
    { x: 1, y: 0 },    // Phải
    { x: -1, y: 0 }    // Trái
  ];
  return directions
    .map(d => ({ x: point.x + d.x, y: point.y + d.y }))
    .filter(p =>
      p.x >= 0 && p.x < cols &&        // Trong giới hạn cột
      p.y >= 0 && p.y < rows &&        // Trong giới hạn hàng
      grid[p.y][p.x] !== 1 &&          // Không phải tường
      !visited.has(`${p.x},${p.y}`)   // Chưa được thăm
    );
};
```

**Lưu ý về hệ tọa độ:** Mảng `grid` được lưu theo row-major: `grid[y][x]`. Cột `x` là chiều ngang, hàng `y` là chiều dọc. Điều này nhất quán với cách render CSS Grid.

**`visited.has(...)` trong filter:** Việc kiểm tra `visited` ngay tại đây ngăn chặn việc hai node trong cùng một beam sinh ra cùng một node kề (duplicate candidates) — một vấn đề tinh tế quan trọng của thuật toán.

---

## 4. Hàm Chính — `gridBeamSearch`: Phân tích Toàn diện

### 4.1 Signature và Khởi tạo

```javascript
export const gridBeamSearch = (grid, start, goal, k) => {
  const rows = grid.length;        // 20
  const cols = grid[0].length;     // 20
  const history = [];              // Lịch sử tất cả các bước (dùng cho animation)
  const visited = new Set();       // Tập các node đã duyệt (string key "x,y")
  const parentMap = {};            // "x,y" → "px,py": lưu cha để reconstruct path

  // Khởi tạo: đặt Start là beam đầu tiên với h(start) được tính sẵn
  let currentBeam = [{ ...start, h: getHeuristic(start) }];
  visited.add(`${start.x},${start.y}`);
```

**Cấu trúc dữ liệu mảng `beam`:**

Mỗi phần tử trong `currentBeam` là một object có dạng:

```javascript
{
  x: number,    // Tọa độ cột
  y: number,    // Tọa độ hàng
  h: number     // Giá trị heuristic h(n) = khoảng cách Manhattan đến goal
}
```

**`parentMap` — cơ chế lưu đường đi:**

```javascript
parentMap["5,10"] = "4,10"    // Node (5,10) có cha là (4,10)
parentMap["6,10"] = "5,10"    // Node (6,10) có cha là (5,10)
parentMap["7,10"] = "6,10"    // ...
```

Đây là cấu trúc **implicit linked list** (danh sách liên kết ẩn), cho phép tái tạo đường đi ngược từ goal về start chỉ bằng cách theo dõi con trỏ cha.

**`visited` dùng `Set<string>` thay vì `Set<object>`:**

JavaScript `Set` so sánh object bằng reference, không phải value. Nếu dùng `Set<{x,y}>`, `{x:3,y:5}` và `{x:3,y:5}` sẽ là hai phần tử khác nhau. Dùng string key `"3,5"` đảm bảo so sánh đúng giá trị.

### 4.2 Vòng lặp While — Trái tim của Thuật toán

```javascript
while (currentBeam.length > 0) {
```

Điều kiện dừng: `currentBeam` rỗng nghĩa là không còn node nào để khám phá — thuật toán thất bại (không tìm được đường).

#### Bước A: Ghi lại lịch sử (Snapshot frame)

```javascript
history.push({
  beam: [...currentBeam],
  visited: Array.from(visited).map(s => {
    const [x, y] = s.split(',').map(Number);
    return { x, y };
  })
});
```

Mỗi iteration ghi lại một "frame" gồm:
- `beam`: Các node đang trong beam (sao chép để tránh mutation).
- `visited`: **Toàn bộ** tập đã thăm, được chuyển từ Set<string> sang `{x,y}[]` để UI có thể đọc.

Đây là cơ sở dữ liệu để `GridBoard` phát lại animation từng bước.

#### Bước B: Kiểm tra Goal

```javascript
const goalNode = currentBeam.find(p => p.x === goal.x && p.y === goal.y);
if (goalNode) {
  return {
    history,
    path: reconstructPath(parentMap, start, goal),
    parentMap,
  };
}
```

Nếu bất kỳ node nào trong beam hiện tại **là** Goal, thuật toán kết thúc thành công và trả về:
- `history`: Toàn bộ lịch sử để animate.
- `path`: Đường đi tối ưu (được tái tạo từ `parentMap`).
- `parentMap`: Bản đồ cha-con để `TreeBoard` dựng cây.

#### Bước C: Mở rộng Node (Generate Candidates)

```javascript
const nextCandidates = [];
currentBeam.forEach(point => {
  const neighbors = getNeighbors(point);
  neighbors.forEach(n => {
    const key = `${n.x},${n.y}`;
    if (!visited.has(key)) {
      visited.add(key);                           // Đánh dấu đã thăm
      parentMap[key] = `${point.x},${point.y}`;  // Ghi lại cha
      nextCandidates.push({ ...n, h: getHeuristic(n) }); // Tính h & thêm vào pool
    }
  });
});
```

**Tại sao kiểm tra `!visited.has(key)` lần thứ hai?**  
`getNeighbors` đã lọc `!visited` rồi, nhưng hai node khác nhau trong cùng một `currentBeam` có thể cùng sinh ra một node kề giống nhau. Vòng lặp `forEach` xử lý tuần tự, nên khi node đầu tiên thêm neighbor vào `visited`, node thứ hai sẽ thấy nó đã tồn tại và bỏ qua. Điều này ngăn chặn **duplicate entries** trong `nextCandidates`.

#### Bước D: Sắp xếp (Sort) và Cắt tỉa (Pruning) — Cơ chế Cốt lõi

```javascript
nextCandidates.sort((a, b) => a.h - b.h);    // Sắp xếp tăng dần theo h(n)
currentBeam = nextCandidates.slice(0, k);    // Giữ lại k node tốt nhất
```

Đây là hai dòng code thể hiện **bản chất của Beam Search**:

**Sort — Sắp xếp theo h(n) tăng dần:**

Thuật toán dùng `Array.prototype.sort` với comparator `(a, b) => a.h - b.h`. Kết quả: node có h nhỏ nhất (gần Goal nhất theo heuristic) đứng đầu mảng. Độ phức tạp của sort là O(m log m) với m là số candidates.

**Slice — Cắt tỉa (Pruning):**

`slice(0, k)` lấy đúng k phần tử đầu tiên. Mọi candidate còn lại (**số lượng có thể lên tới m-k**) bị **loại bỏ hoàn toàn** — không được đặt vào queue, không bao giờ được xem xét lại. Đây là điểm phân biệt Beam Search với BFS:

| Thuật toán | Số node giữ lại mỗi level | Đặc điểm |
|---|---|---|
| BFS | Tất cả (không giới hạn) | Đầy đủ (complete), tốn nhiều bộ nhớ |
| Beam Search (k=1) | 1 node tốt nhất | Greedy Best-First, nhanh nhưng dễ bị bẫy |
| Beam Search (k=3) | 3 node tốt nhất | Cân bằng tốc độ và chất lượng |
| Beam Search (k=∞) | Tất cả → tương đương BFS | Hoàn chỉnh nhưng tốn bộ nhớ |

### 4.3 Sơ đồ Luồng Toàn diện

```
flowchart TD
    A[Bắt đầu: gridBeamSearch] --> B[Khởi tạo: currentBeam = [start], visited = {start}]
    B --> C{currentBeam rỗng?}
    C -- Có --> D[Trả về: history, path=[], parentMap\nThất bại: không tìm được đường]
    C -- Không --> E[Ghi snapshot vào history\nbeam + visited]
    E --> F{Goal trong currentBeam?}
    F -- Có --> G[reconstructPath từ parentMap\nTrả về: history, path, parentMap\nThành công!]
    F -- Không --> H[Duyệt mỗi node trong currentBeam]
    H --> I[Lấy neighbors chưa visited]
    I --> J[Cập nhật visited & parentMap\nTính h cho mỗi neighbor\nThêm vào nextCandidates]
    J --> K[Sắp xếp nextCandidates theo h tăng dần]
    K --> L[Pruning: slice 0 đến k\ncurrentBeam = k node tốt nhất]
    L --> C
```

---

## 5. Hàm Tái tạo Đường đi — `reconstructPath`

```javascript
const reconstructPath = (parentMap, start, goal) => {
  const path = [];
  let currentKey = `${goal.x},${goal.y}`;    // Bắt đầu từ Goal
  const startKey = `${start.x},${start.y}`;

  while (currentKey && currentKey !== startKey) {
    const [x, y] = currentKey.split(',').map(Number);
    path.unshift({ x, y });                   // Thêm vào ĐẦU mảng (đảo ngược)
    currentKey = parentMap[currentKey];        // Đi ngược về cha
  }
  path.unshift(start);                        // Thêm Start vào đầu
  return path;
};
```

**Kỹ thuật `unshift` để đảo ngược:**

Vòng lặp theo dấu vết từ **Goal ngược về Start**. Dùng `unshift` (thêm vào đầu mảng) thay vì `push` (thêm vào cuối) để tự động đảo ngược thứ tự, cho ra path từ Start đến Goal mà không cần gọi `reverse()`.

**Ví dụ trace:**

```
parentMap: { "5,10": "4,10", "6,10": "5,10", "7,10" (goal): "6,10" }
start: {x:4, y:10}
goal: {x:7, y:10}

Iteration 1: currentKey = "7,10" → unshift({x:7,y:10}), → currentKey = "6,10"
             path = [{x:7,y:10}]
Iteration 2: currentKey = "6,10" → unshift({x:6,y:10}), → currentKey = "5,10"
             path = [{x:6,y:10}, {x:7,y:10}]
Iteration 3: currentKey = "5,10" → unshift({x:5,y:10}), → currentKey = "4,10"
             path = [{x:5,y:10}, {x:6,y:10}, {x:7,y:10}]
Stop: currentKey = "4,10" === startKey

path.unshift(start) →
Final path = [{x:4,y:10}, {x:5,y:10}, {x:6,y:10}, {x:7,y:10}]
```

---

## 6. Hàm Xây dựng Cây — `buildTreeFromGridResult`

### 6.1 Mục đích

Hàm này nhận đầu vào là kết quả thô của `gridBeamSearch` và biến đổi chúng thành định dạng mà ReactFlow có thể render: mảng `nodes` và mảng `edges`.

```javascript
export const buildTreeFromGridResult = (history, parentMap, path, start, goal) => {
  const startKey = `${start.x},${start.y}`;
  const goalKey  = `${goal.x},${goal.y}`;
  const pathSet  = new Set(path.map(p => `${p.x},${p.y}`));
```

### 6.2 Giai đoạn 1: Xây dựng `childrenMap` từ `parentMap`

```javascript
// parentMap: child → parent (ngược)
// childrenMap: parent → [children] (xuôi, dùng để BFS)
const childrenMap = {};
Object.entries(parentMap).forEach(([childKey, parentKey]) => {
  if (!childrenMap[parentKey]) childrenMap[parentKey] = [];
  childrenMap[parentKey].push(childKey);
});
```

Bước đảo ngược chiều (`parent → child`) này cho phép duyệt cây từ gốc xuống lá — cần thiết để tính level (độ sâu) của từng node.

### 6.3 Giai đoạn 2: BFS để Tính Level

```javascript
const levelOf = {};      // "x,y" → level (số nguyên)
const levelNodes = {};   // level → ["x,y", ...]
const queue = [startKey];
levelOf[startKey] = 0;
levelNodes[0] = [startKey];

let head = 0;
while (head < queue.length) {
  const key = queue[head++];          // Dequeue (BFS dùng pointer thay vì shift())
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
```

**Tại sao dùng `head++` thay vì `queue.shift()`?**

`Array.shift()` có độ phức tạp O(n) vì phải dịch chuyển toàn bộ phần tử. Dùng biến `head` như một pointer và `queue[head++]` là O(1). Với đồ thị có thể có hàng trăm node, đây là tối ưu hóa đáng kể.

### 6.4 Giai đoạn 3: Tính vị trí và Tạo Nodes/Edges

```javascript
const spacingX = 90;    // Khoảng cách ngang giữa các node (pixel)
const spacingY = 110;   // Khoảng cách dọc giữa các level (pixel)

Object.entries(levelNodes).forEach(([lvl, keys]) => {
  const y = parseInt(lvl) * spacingY;    // Level N nằm ở y = N * 110

  keys.forEach((key, idx) => {
    // Căn giữa: node idx-th trong một level có keys.length nodes tổng
    const x = (idx - (keys.length - 1) / 2) * spacingX;
    // Ví dụ: 4 nodes → idx: 0,1,2,3 → x: -135, -45, 45, 135
```

**Công thức căn giữa:**

```
x = (idx - (N-1)/2) * spacing
```

Với N nodes, index từ 0 đến N-1:
- Node đầu: `(0 - (N-1)/2) * spacing` = âm nhất (trái nhất)
- Node cuối: `(N-1 - (N-1)/2) * spacing` = dương nhất (phải nhất)
- Trung bình = 0 (căn giữa tại x=0)

```javascript
    // Xác định loại node và style tương ứng
    const isGoal  = key === goalKey;
    const isStart = key === startKey;
    const isPath  = pathSet.has(key);
    const h = Math.abs(cx - goal.x) + Math.abs(cy - goal.y);

    nodes.push({
      id: key,                           // key = "x,y" (unique)
      data: { label: isStart ? `S (${cx},${cy})` : isGoal ? `G (${cx},${cy})` : `(${cx},${cy})\nh=${h}` },
      position: { x, y },
      style: {
        background: isGoal ? '#ef4444' : isStart ? '#22c55e' : '#1e293b',
        border:     isPath  ? '2px solid #3b82f6' : '2px solid #334155',
        opacity:    0.25,               // Mờ ban đầu, animation sẽ sáng dần
        // ...
      }
    });
```

**Màu sắc node** theo loại:

| Loại Node | Màu nền | Viền |
|---|---|---|
| Start | `#22c55e` (xanh lá) | Mặc định |
| Goal | `#ef4444` (đỏ) | Mặc định |
| Trên đường đi (path) | `#1e293b` (tối) | `#3b82f6` (xanh lam) |
| Node thường | `#1e293b` (tối) | `#334155` (xám) |
| Opacity ban đầu | — | `0.25` (mờ, chờ animation) |

---

## 7. Hàm Dữ liệu Preset — `generateTreeData`

```javascript
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
    // Worst case: 3 children from root.
    // A(h=1), B(h=2) look promising but are dead-ends.
    // C(h=10) has worst heuristic → pruned when k≤2 → Goal unreachable.
    // Only k≥3 keeps C and finds Goal.
    root.children = [
      {
        id: 'w-1', label: 'A (h=1)', h: 1, children: [
          { id: 'w-1-1', label: 'Dead-end\n(h=∞)', h: 99, children: [] }
        ]
      },
      {
        id: 'w-2', label: 'B (h=2)', h: 2, children: [
          { id: 'w-2-1', label: 'Dead-end\n(h=∞)', h: 99, children: [] }
        ]
      },
      {
        id: 'w-3', label: 'C (h=10)', h: 10, children: [
          { id: 'goal', label: 'G (h=0)', h: 0, isGoal: true, children: [] }
        ]
      }
    ];
  }
  return root;
};
```

**Cấu trúc cây dạng đệ quy (Recursive Tree Structure):**

```javascript
node = {
  id: string,           // Định danh duy nhất
  label: string,        // Nhãn hiển thị
  h: number,            // Giá trị heuristic
  isGoal?: boolean,     // Đánh dấu goal node (tùy chọn)
  children: node[]      // Mảng con — cho phép cây sâu tùy ý
}
```

Đây là cấu trúc **N-ary Tree** với dạng đệ quy tự tham chiếu. Hàm `buildFlowData` trong `TreeBoard` duyệt cấu trúc này bằng DFS đệ quy để tạo nodes/edges cho ReactFlow.

### 7.1 Best Case — Minh họa Beam Search Thành công

```
                [S] h=10
               /         \
        [A] h=5           [C] h=8    ← Beam={A} (k=1), C bị prune
             |                 |
        [B] h=2           [D] h=9
             |
        [G] h=0   ←←← Thuật toán tìm thấy Goal!
```

Với k=1: Mỗi level chỉ giữ node có h nhỏ nhất. A(h=5) < C(h=8) → A được giữ, con đường qua A dẫn thẳng đến Goal.

### 7.2 Worst Case — Minh họa Điểm yếu Beam Search

```
                  [S] h=10
            /        |          \
     [A] h=1      [B] h=2     [C] h=10
        |            |           |
   [Dead-end]     [Dead-end]    [G] h=0
```

Trường hợp này được thiết kế để nhánh có heuristic **tốt nhất** lại dẫn tới bế tắc:

- Với `k ≤ 2`: Beam chỉ giữ A(h=1) và B(h=2) ở level 1, và **prune** C(h=10). Vì Goal nằm dưới C nên thuật toán **thất bại** (không thể chạm Goal).
- Với `k ≥ 3`: Beam giữ cả A, B, C → nhánh C được mở rộng và Goal được tìm thấy.

Trong mã, các node “Dead-end (h=∞)” được biểu diễn bằng `h = 99` như một cách xấp xỉ “vô cực” để minh họa trực quan.

---

## 8. Phân tích Độ phức tạp Thuật toán

| Đại lượng | Giá trị | Giải thích |
|---|---|---|
| Beam Width | k | Số node được giữ lại mỗi level |
| Độ sâu tối đa | d | Số bước từ Start đến Goal |
| Branching factor | b | Số lượng node kề trung bình (≤4 trong lưới 4-chiều) |
| **Bộ nhớ** | **O(k·b)** | Chỉ lưu beam hiện tại và candidates |
| **Thời gian** | **O(d·k·b·log(k·b))** | d level × k×b candidates × sort |

So sánh với các thuật toán khác trên cùng bài toán:

| Thuật toán | Bộ nhớ | Thời gian | Tìm đường tối ưu? |
|---|---|---|---|
| BFS | O(b^d) | O(b^d) | Có (theo số bước) |
| Greedy Best-First | O(b^d) | O(b^d·log b^d) | Không |
| A* | O(b^d) | O(b^d·log b^d) | Có (với h admissible) |
| **Beam Search (k)** | **O(k·b)** | **O(d·k·b·log(k·b))** | **Không** |

**Beam Search đánh đổi tính đầy đủ (completeness) và tính tối ưu (optimality) để đổi lấy bộ nhớ thấp và tốc độ cao** — đây là lý do thuật toán này được dùng rộng rãi trong NLP (beam decoding trong dịch máy, sinh văn bản) và các bài toán có không gian trạng thái lớn.

---

## 9. Sơ đồ Quan hệ giữa các Hàm

```
gridBeamSearch(grid, start, goal, k)
    │
    ├── getHeuristic(point) ─────────────── h(n) = |Δx| + |Δy|
    │
    ├── getNeighbors(point) ─────────────── filter: bounds, wall, visited
    │
    └── reconstructPath(parentMap, start, goal)
              └── duyệt parentMap ngược từ goal về start

buildTreeFromGridResult(history, parentMap, path, start, goal)
    │
    ├── [Bước 1] Đảo ngược parentMap → childrenMap
    │
    ├── [Bước 2] BFS để tính levelOf & levelNodes
    │
    └── [Bước 3] Tính position (x,y) và tạo nodes[], edges[]
              └── Output: { nodes[], edges[] } cho ReactFlow

generateTreeData(type)
    └── Trả về object cây đệ quy tĩnh cho preset Best/Worst Case
```

---

## 10. Tổng kết

Thiết kế của `beamSearch.js` thể hiện nguyên tắc **Separation of Concerns** rõ ràng:

1. **`gridBeamSearch`** — Thuần logic thuật toán, không phụ thuộc vào UI, hoàn toàn testable độc lập.
2. **`buildTreeFromGridResult`** — Layer chuyển đổi dữ liệu (data transformation), kết nối thế giới thuật toán với thế giới UI.
3. **`generateTreeData`** — Dữ liệu mẫu tĩnh, phục vụ mục đích giáo dục/demo.

Sự phân tách này cho phép thuật toán Beam Search có thể được tái sử dụng hoàn toàn trong các ngữ cảnh khác (không phải React, không phải lưới 2D) chỉ bằng cách thay đổi hàm heuristic và hàm sinh neighbors.
