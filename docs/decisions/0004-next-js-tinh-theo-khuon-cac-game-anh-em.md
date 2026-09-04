# ADR-0004 · Dùng Next.js xuất tĩnh, theo đúng khuôn của các game cùng thư mục

> **Ngày:** 2026-09-04
> **Trạng thái:** accepted
> **Liên quan:** NFR-PERF-05 · NFR-SEC-05

## 1. Bối cảnh

Dự án là một trang tĩnh không server, trần chi phí 0 đ. Thư mục `web-game/` đã có năm game khác; ba game gần nhất (minesweeper, gomoku, flappy-bird) dùng chung một khuôn — Next.js 15 + React 19 + TypeScript + Tailwind 3 + Vitest, quản lý gói bằng Yarn classic — còn tetris lệch ra Vite + npm.

## 2. Quyết định

Theo khuôn của ba game gần nhất: Next.js 15 App Router với `output: 'export'`, React 19, TypeScript 5, Tailwind 3, `lucide-react` cho icon, Vitest + happy-dom cho test luật và component, Playwright cho E2E, Yarn classic. Không thêm thư viện state, không thêm thư viện animation, không thêm thư viện game.

## 3. Phương án đã loại

| Phương án | Vì sao loại |
| --- | --- |
| Vite + React (như tetris) | Nhẹ hơn Next thật, và với trang một màn hình thì phần lớn tính năng của Next là thừa. Nhưng nó tách dự án này khỏi khuôn chung, và cái giá phải trả là mọi thói quen, script và cấu hình đều phải nghĩ lại một lượt |
| Thêm Zustand cho state | Cây component nông, một `useReducer` là đủ. Một dependency cho thứ React đã có sẵn |
| Thêm framer-motion cho hiệu ứng bài | CSS transition trên phần tử có `key` ổn định đã cho đúng hiệu ứng cần; thư viện này nặng hơn cả phần logic game |

## 4. Hệ quả

**Được:**
- Cấu hình, script và thói quen dùng lại nguyên từ minesweeper và gomoku; không phải phát minh lại gì.
- `next build` với `output: 'export'` ra thư mục tĩnh, đẩy thẳng lên GitHub Pages.
- Phụ thuộc runtime đúng bốn gói, nên NFR-PERF-05 và NFR-SEC-05 gần như tự đạt.

**Mất / phải chấp nhận:**
- Next mang theo một lượng framework mà một game bàn cờ không dùng đến; đây là cái giá của việc đồng bộ với các dự án anh em, và nó được trả bằng NFR-PERF-05 (≤ 150KB gzip) chứ không bỏ ngỏ.
- Yarn classic đã cũ. Giữ vì cả thư mục `web-game/` đang dùng nó và trộn hai trình quản lý gói trong một workspace là nguồn lỗi thật (workspace này đã có tiền lệ).

**Điều kiện xem lại quyết định này:** khi các game anh em chuyển khuôn, hoặc khi bundle vượt trần NFR-PERF-05 mà không cắt được.
