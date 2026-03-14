# Nội Dung Thuyết Trình (Script) — Beam Search Visualizer
Dự án: **Beam Search Visualizer** (React 19 + Vite + Tailwind v4 + `@xyflow/react`)

Mục tiêu của file này: giúp bạn có một **kịch bản thuyết trình “nói theo được”**, có cấu trúc slide rõ ràng, có pseudocode, và có “đường dẫn code” theo thứ tự dễ tiếp cận.

---

## Gợi ý cấu trúc thuyết trình (10–15 phút)
- 1 phút: Giới thiệu bài toán + mục tiêu demo
- 2 phút: Nghiên cứu liên quan (bối cảnh Beam Search)
- 1 phút: Heuristic H và vì sao chọn Manhattan
- 2 phút: Ưu/nhược + các trường hợp (k=1, k→∞, best/worst)
- 4 phút: Code flow + pseudocode + giải thích các phần code trong repo
- 2 phút: So sánh BFS/DFS/UCS/Greedy/A*
- 1 phút: Kết luận + hướng phát triển
- 2 phút: Kịch bản demo (Grid + Tree)

---

# 1) Giới thiệu bài toán
## Slide 1 — Bài toán
**Bạn nói:**
- Hôm nay mình trình bày về **Beam Search** và cách mình trực quan hóa nó trên **lưới 2D** và **cây tìm kiếm**.
- Bài toán cụ thể trong project: **tìm đường từ Start đến Goal** trên lưới `20×20`, có thể có tường (wall), di chuyển **4 hướng** (lên/xuống/trái/phải).
- Mục tiêu không chỉ “tìm ra đường đi”, mà là **thấy được quá trình**: mỗi bước beam giữ lại các node “tốt nhất theo heuristic”, và các nhánh khác bị **prune**.

**Bạn chỉ trên UI:**
- Tab `Grid Pathfinding`: xem quá trình trên lưới.
- Tab `Tree Pruning`: xem quá trình cắt tỉa trên cây.

**Thông điệp chốt:**
- Beam Search là thuật toán “đánh đổi”: **giảm bộ nhớ / tăng tốc** bằng cách chỉ giữ **top-k** ứng viên ở mỗi level.

---

# 2) Các nghiên cứu liên quan
## Slide 2 — Beam Search dùng ở đâu?
**Bạn nói:**
- Beam Search xuất hiện rất nhiều trong NLP và mô hình sinh: ví dụ **beam decoding** khi dịch máy / sinh chuỗi, vì không thể giữ toàn bộ không gian trạng thái.
- Ở bài toán tìm đường, Beam Search có thể xem như “BFS theo tầng nhưng có **cắt tỉa** theo heuristic”.

## Slide 3 — Họ hàng thuật toán
**Bạn nói:**
- **BFS/UCS**: đầy đủ và tối ưu (trên chi phí đều) nhưng tốn bộ nhớ.
- **DFS**: ít bộ nhớ nhưng dễ lạc sâu và không tối ưu.
- **Greedy Best-First**: nhanh, đi theo heuristic, nhưng dễ kẹt local optimum.
- **A\***: cân bằng `g+h`, thường tối ưu nếu heuristic admissible, nhưng tốn bộ nhớ.
- **Beam Search**: giống “giữ lại một lát cắt top-k” để giới hạn frontier.

---

# 3) Cách lựa chọn H
## Slide 4 — Heuristic H là gì?
**Bạn nói:**
- Heuristic `h(n)` là một ước lượng “node n còn cách Goal bao xa”.
- Beam Search trong project dùng `h(n)` để **sắp xếp** ứng viên và **giữ lại top-k**.

## Slide 5 — Vì sao chọn Manhattan?
**Trong code:** `src/utils/beamSearch.js` → `getHeuristic(point)`

```text
h(n) = |x - x_goal| + |y - y_goal|
```

**Bạn nói:**
- Vì agent chỉ đi 4 hướng, Manhattan khớp tự nhiên với số bước tối thiểu nếu không có tường.
- Manhattan rẻ tính toán, ổn định cho demo realtime.

**Bạn bổ sung (nếu được hỏi):**
- Nếu cho phép đi chéo 8 hướng, có thể cân nhắc Chebyshev/Euclidean.
- Nếu có trọng số chi phí khác nhau, cần `g(n)` và dùng UCS/A* để có tối ưu theo chi phí.

---

# 4) Ưu/nhược và các trường hợp của bài toán
## Slide 6 — Ưu điểm
**Bạn nói:**
- **Bộ nhớ thấp**: chỉ giữ tối đa `k` node cho beam hiện tại.
- **Tốc độ tốt** khi `k` nhỏ: phù hợp không gian lớn, cần kết quả gần đúng nhanh.
- Trực quan hóa rất tốt: mỗi level giống một “frame”.

## Slide 7 — Nhược điểm
**Bạn nói:**
- Không đảm bảo **tối ưu** (optimal) khi `k` nhỏ.
- Không đảm bảo **đầy đủ** (complete): có thể prune mất nhánh chứa Goal.
- Nhạy với heuristic: heuristic càng “lệch” càng dễ rơi vào bẫy.

## Slide 8 — Các trường hợp quan trọng
### Trường hợp `k = 1`
**Bạn nói:**
- Beam chỉ giữ 1 node tốt nhất theo `h` ở mỗi level.
- Hành vi gần với “greedy theo tầng”: rất nhanh nhưng dễ kẹt.

### Trường hợp `k → ∞`
**Bạn nói (theo đúng code project):**
- Nếu `k` đủ lớn để giữ **toàn bộ ứng viên** mỗi level, ta gần như không prune nữa.
- Với lưới chi phí đều và mở rộng theo tầng, hành vi tiệm cận **BFS theo level**: đầy đủ hơn, thường tìm được đường ngắn theo số bước.

### Best Case
**Bạn nói:**
- Heuristic dẫn đúng hướng, nhánh tốt nhất thực sự đi tới Goal.
- Dù `k` nhỏ vẫn tới Goal nhanh.

### Worst Case
**Trong preset Tree:** `src/utils/beamSearch.js` → `generateTreeData('worst')`
**Bạn nói:**
- Các nhánh có `h` nhỏ (trông rất hứa hẹn) lại là dead-end.
- Nhánh chứa Goal có `h` xấu hơn nên bị prune khi `k` nhỏ.

---

# 5) Code: Flow, pseudocode, giải thích code
## Slide 9 — Flow tổng quát (dễ nhớ)
**Bạn nói:**
1. Người dùng cấu hình (k, walls, start/goal, speed).
2. Grid chạy `gridBeamSearch` để tạo `history + path + parentMap`.
3. Grid replay `history` để animate cell states.
4. Khi Grid xong, gửi `gridResult` lên `App`.
5. Tree nhận `gridResult`, build nodes/edges cho ReactFlow, rồi replay theo `history`.

**Các file chính (theo thứ tự dễ hiểu):**
1. `src/utils/beamSearch.js` (thuật toán + build dữ liệu cây)
2. `src/components/GridBoard.jsx` (UI + tạo `gridResult`)
3. `src/App.jsx` (chia sẻ state + điều hướng 2 tab)
4. `src/components/TreeBoard.jsx` (ReactFlow + mô phỏng pruning / replay)
5. `src/components/SpeedSlider.jsx` (điều khiển tốc độ)
6. `src/index.css` (màu sắc trạng thái cell)

## Slide 10 — Pseudocode Beam Search (phiên bản project)
```text
function GRID_BEAM_SEARCH(grid, start, goal, k):
  visited = set()
  parentMap = map()       // childKey -> parentKey
  history = []

  beam = [ start with h(start) ]
  visited.add(startKey)

  while beam not empty:
    history.push(snapshot(beam, visited))

    if goal in beam:
      return { history, path = reconstructPath(parentMap), parentMap }

    candidates = []
    for each node in beam:
      for each neighbor in neighbors(node):
        if neighbor not visited:
          visited.add(neighborKey)
          parentMap[neighborKey] = nodeKey
          candidates.push(neighbor with h)

    sort candidates by h asc
    beam = first k of candidates

  return { history, path = [], parentMap }
```

**Bạn nói:**
- Điểm quan trọng: thuật toán chạy **đồng bộ** và trả về “kịch bản” `history`.
- UI chỉ “tua lại” history, nên animation không bị phụ thuộc thời gian tính toán.

## Slide 11 — Giải thích `beamSearch.js` (đi theo export)
### (A) `gridBeamSearch(grid, start, goal, k)`
**Nằm tại:** `src/utils/beamSearch.js`

**Bạn nói:**
- `visited` lưu dạng string `"x,y"` để check nhanh.
- `history[]` lưu snapshot mỗi vòng lặp: `{ beam: [...], visited: [{x,y}...] }`.
- `parentMap` lưu “dấu vết cha” để reconstruct path.

### (B) `reconstructPath(parentMap, start, goal)`
**Bạn nói:**
- Đi ngược từ `goalKey` về `startKey` theo `parentMap`.
- Dùng `unshift` để tạo path theo đúng thứ tự `start -> ... -> goal`.

### (C) `buildTreeFromGridResult(history, parentMap, path, start, goal)`
**Bạn nói:**
- Chuyển kết quả lưới sang `nodes[]/edges[]` cho ReactFlow.
- Dùng BFS theo `childrenMap` để tính `levelNodes`, rồi đặt vị trí theo `spacingX/spacingY`.
- Node id chính là `"x,y"` nên map với `history` rất tiện (beamSet/visitedSet/pathSet).

### (D) `generateTreeData(type='best'|'worst')`
**Bạn nói:**
- Đây là data “cây trừu tượng” để minh họa pruning best/worst mà không phụ thuộc grid.
- Worst case trong code: `w-1`, `w-2` (dead-end, h nhỏ), `w-3` (h lớn nhưng chứa Goal).

## Slide 12 — Code liên quan đến “vận hành thuật toán” trong UI
### Danh sách theo thứ tự dễ trình bày
1. `src/components/GridBoard.jsx`
   - State cốt lõi: `grid`, `start`, `goal`, `k`, `beamHistory`, `currentStep`, `finalPath`, `speed`
   - `startSearch()`:
     - gọi `gridBeamSearch(grid, start, goal, k)`
     - set `beamHistory`, `finalPath`
     - `setInterval(..., Math.round(100 / speed))` để replay
     - khi xong gọi `onSearchComplete({ history, path, parentMap, start, goal })`
   - `getCellClass()`:
     - ưu tiên: Start/Goal > Path > Beam > Visited > Wall > Empty
2. `src/App.jsx`
   - giữ `gridResult` để Tree dùng lại
   - render theo `activeTab`
3. `src/components/TreeBoard.jsx`
   - `treeMode`: `best/worst/grid`
   - `initPresetTree()` dùng `generateTreeData()` + `buildFlowData()`
   - `initGridTree()` dùng `buildTreeFromGridResult()` hoặc placeholder nếu chưa có `gridResult`
   - `startSearch()`:
     - preset: `setInterval(..., Math.round(1500 / speed))` → `animatePresetStep(level)`
     - grid demo: `setInterval(..., Math.round(400 / speed))` → `animateGridStep(stepIdx)`
   - `everInBeamRef`: tích lũy node từng vào beam để giữ highlight vàng
4. `src/components/SpeedSlider.jsx`
   - speed là multiplier theo các mốc (0.25x…4x)
   - UI +/- và range index
5. `src/index.css`
   - class màu cell: `.cell-start/.cell-goal/.cell-wall/.cell-beam/.cell-visited/.cell-path`

---

# 6) So sánh với các thuật toán khác (BFS, DFS, A*, Greedy, UCS)
## Slide 13 — Bảng so sánh nhanh (nói gọn)
**Bạn nói:**
- **BFS**: tối ưu theo số bước (grid unweighted), nhưng frontier nở rất nhanh.
- **UCS**: tối ưu theo chi phí; với chi phí đều thì gần như BFS.
- **DFS**: ít bộ nhớ, nhưng không tối ưu và dễ “lạc sâu”.
- **Greedy Best-First**: chọn theo `h` (giống “đi theo mùi”), nhanh nhưng dễ sai.
- **A\***: dùng `f = g + h`, cân bằng; thường tối ưu nếu heuristic tốt, nhưng tốn bộ nhớ.
- **Beam Search**: giữ top-k theo `h` mỗi level; nhanh/bộ nhớ thấp nhưng không đảm bảo tối ưu/đầy đủ khi k nhỏ.

## Slide 14 — Cách chốt ý
**Bạn nói:**
- Beam Search nằm giữa “tối ưu” và “nhanh”: khi không thể mở rộng toàn bộ không gian, ta chọn một `k` phù hợp.

---

# 7) Kết luận + hướng phát triển/áp dụng
## Slide 15 — Kết luận
**Bạn nói:**
- Beam Search là chiến lược tìm kiếm có pruning theo heuristic.
- `k` là núm điều khiển trade-off:
  - k nhỏ: nhanh/nhẹ nhưng rủi ro
  - k lớn: ổn định hơn nhưng tốn tài nguyên

## Hướng phát triển (gợi ý nói thêm 30–60s)
- Thêm `g(n)` để so sánh với A*/UCS một cách “công bằng” hơn trên cùng UI.
- Cho phép trọng số (weighted grid) và quan sát UCS/A* vs Beam.
- Thử heuristic khác (diagonal move, weighted Manhattan).
- Dynamic beam width: tăng k khi bị kẹt, giảm k khi đang đi tốt.
- Thêm “no-path handling” rõ hơn trên UI (thông báo, highlight vùng đã duyệt).

---

# 8) Kịch bản demo (rõ thao tác, dễ nói)
## Demo 1 — Grid Pathfinding (2–3 phút)
**Mục tiêu:** thấy beam/visited/path và ảnh hưởng của k + tường + speed.

1. Vào tab `Grid Pathfinding`.
2. Giới thiệu công cụ:
   - `k` slider
   - Tools: Start / Goal / Wall (vẽ bằng kéo chuột)
   - Speed: thay đổi nhanh/chậm
3. Chạy **Best Case**:
   - bấm preset `Best Case`
   - đặt `k=1` hoặc `k=2`, bấm `Start Search`
   - nói: “heuristic dẫn đúng, k nhỏ vẫn ra path nhanh”
4. Chạy **Worst Case**:
   - bấm preset `Worst Case`
   - đặt `k=1` rồi chạy, quan sát dễ kẹt / không ra đường (tùy layout)
   - tăng `k` lên 5–10 và chạy lại, quan sát khác biệt

## Demo 2 — Tree Pruning (2–3 phút)
**Mục tiêu:** thấy pruning trực quan theo `k` và so sánh preset vs grid demo.

1. Vào tab `Tree Pruning`.
2. Chọn mode `Best Case`:
   - chỉnh `k=1` rồi bấm `Simulate`
   - nói: “beam giữ nhánh h thấp, prune nhánh còn lại”
3. Chọn mode `Worst Case`:
   - thử `k=2` (Goal bị prune)
   - thử `k=3` (Goal xuất hiện)
4. Chọn mode `Grid Demo`:
   - nếu chưa có dữ liệu, nói: “Tree yêu cầu Grid đã chạy để có `gridResult`”
   - sau khi chạy Grid, quay lại Tree → `Grid Demo` → `Simulate`
   - nói: “Tree đang replay đúng history mà Grid đã tạo”

---

## Checklist “điểm nhấn” để nói cho trôi
- Beam Search = “giữ top-k theo H mỗi tầng”
- `H` trong project = Manhattan (4 hướng)
- `k` điều khiển trade-off: nhanh/nhẹ vs đầy đủ/ổn định
- Project tách bạch:
  - Logic thuật toán: `src/utils/beamSearch.js`
  - UI + animation replay: `GridBoard`/`TreeBoard`
  - SpeedSlider = multiplier thay vì hard-code ms/frame

