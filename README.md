# 🔍 Beam Search Visualizer

Ứng dụng mô phỏng trực quan thuật toán **Beam Search** trên lưới 2D và cây tìm kiếm. Được xây dựng bằng **React 19 + Vite + Tailwind CSS v4 + ReactFlow**.

---

## ✨ Tính năng

- 🗺️ **Grid Pathfinding Demo** — Trực quan hoá thuật toán Beam Search từng bước trên lưới 20×20, vẽ tường/đặt điểm Start-Goal tùy ý.
- 🌲 **Tree Pruning Demo** — Hiển thị cây tìm kiếm sinnh từ kết quả lưới, minh hoạ cơ chế cắt tỉa (pruning) theo beam width `k`.
- ⚙️ Điều chỉnh **Beam Width (k)** theo thời gian thực.
- 📦 Preset **Best Case / Worst Case** minh hoạ ưu nhược điểm của thuật toán.

---

## 🛠️ Yêu cầu hệ thống

Trước khi bắt đầu, hãy đảm bảo máy bạn đã cài đặt:

| Công cụ | Phiên bản tối thiểu | Kiểm tra |
|---|---|---|
| [Node.js](https://nodejs.org/) | **v18.0** trở lên | `node -v` |
| npm | **v9.0** trở lên (đi kèm Node.js) | `npm -v` |
| Git | Bất kỳ | `git --version` |

> **Gợi ý:** Nên dùng [Node.js LTS](https://nodejs.org/) (Long-Term Support) để đảm bảo ổn định nhất.

---

## 🚀 Hướng dẫn Cài đặt từng Bước

### Bước 1 — Clone repository về máy

Mở **Terminal** (Command Prompt / PowerShell / Git Bash) và chạy:

```bash
git clone https://github.com/<your-username>/NenTangAI.git
```

> Thay `<your-username>` bằng tên tài khoản GitHub của chủ repo.

---

### Bước 2 — Di chuyển vào thư mục dự án

```bash
cd NenTangAI
```

Kiểm tra bạn đang đứng đúng vị trí bằng cách xem danh sách file:

```bash
# Windows (PowerShell)
dir

# macOS / Linux
ls
```

Bạn sẽ thấy các file: `package.json`, `index.html`, `vite.config.js`, thư mục `src/`, v.v.

---

### Bước 3 — Cài đặt các thư viện phụ thuộc

```bash
npm install
```

Lệnh này sẽ tự động đọc file `package.json` và cài đặt toàn bộ thư viện cần thiết vào thư mục `node_modules/`. Quá trình này có thể mất **1–2 phút** tùy tốc độ mạng.

**Các thư viện chính sẽ được cài:**

| Thư viện | Vai trò |
|---|---|
| `react` / `react-dom` | Framework UI |
| `@xyflow/react` | Render cây tìm kiếm tương tác |
| `tailwindcss` | Hệ thống CSS tiện ích |
| `lucide-react` | Bộ icon UI |
| `vite` | Bundler & dev server |

---

### Bước 4 — Chạy ứng dụng ở chế độ Development

```bash
npm run dev
```

Sau khi khởi động thành công, terminal sẽ hiển thị:

```
  VITE vX.X.X  ready in XXX ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

Mở trình duyệt và truy cập: **[http://localhost:5173](http://localhost:5173)**

> Ứng dụng hỗ trợ **Hot Module Replacement (HMR)** — mọi thay đổi code sẽ tự động cập nhật trên trình duyệt mà không cần reload trang.

---

### Bước 5 (Tùy chọn) — Build phiên bản Production

Nếu bạn muốn build để deploy lên hosting:

```bash
npm run build
```

File output sẽ nằm trong thư mục `dist/`. Để xem trước bản build:

```bash
npm run preview
```

---

## 📁 Cấu trúc Thư mục

```
NenTangAI/
├── public/                  # Tài nguyên tĩnh
├── src/
│   ├── components/
│   │   ├── GridBoard.jsx    # Màn hình mô phỏng lưới 2D
│   │   ├── TreeBoard.jsx    # Màn hình cây tìm kiếm (ReactFlow)
│   │   └── TopMenu.jsx      # Thanh điều hướng
│   ├── utils/
│   │   └── beamSearch.js    # Logic thuật toán Beam Search
│   ├── App.jsx              # Component gốc
│   └── main.jsx             # Điểm khởi động React
├── Docs/                    # Tài liệu kỹ thuật chi tiết
│   ├── 01_Code_Architecture_And_UI.md
│   └── 02_Algorithm_Flow_And_Logic.md
├── index.html
├── package.json
└── vite.config.js
```

---

## 📚 Tài liệu Kỹ thuật

Xem thư mục [`Docs/`](./Docs) để hiểu sâu về dự án:

- [**01 — Kiến trúc Source Code & UI**](./Docs/01_Code_Architecture_And_UI.md): Giải thích từng component, hook, cơ chế animation.
- [**02 — Luồng hoạt động & Logic Thuật toán**](./Docs/02_Algorithm_Flow_And_Logic.md): Phân tích heuristic, vòng lặp, cơ chế sort & pruning.

---

## ❓ Xử lý Lỗi Thường Gặp

**Lỗi: `node: command not found`**
→ Node.js chưa được cài. Tải về tại [nodejs.org](https://nodejs.org/).

**Lỗi: `npm install` thất bại với EACCES (permission denied)**
→ Trên macOS/Linux, thử: `sudo npm install` hoặc [sửa quyền npm global](https://docs.npmjs.com/resolving-eacces-permissions-errors-when-installing-packages-globally).

**Lỗi: Port 5173 đã được sử dụng**
→ Vite sẽ tự động chọn port khác (5174, 5175...) và hiển thị trong terminal.

**Lỗi: `Cannot find module '@xyflow/react'`**
→ Thư mục `node_modules/` bị thiếu hoặc hỏng. Chạy lại: `npm install`.

---

## 🧰 Scripts có sẵn

| Lệnh | Mô tả |
|---|---|
| `npm run dev` | Khởi động dev server với HMR |
| `npm run build` | Build production vào thư mục `dist/` |
| `npm run preview` | Xem trước bản build production |
| `npm run lint` | Kiểm tra lỗi cú pháp với ESLint |
