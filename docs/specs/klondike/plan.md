# Kế hoạch hiện thực · Klondike Solitaire (bản đầu)

> **Liên quan:** [`design.md`](design.md) · FR-01 → FR-12
> **Ngày:** 2026-09-04 · nhánh `feat/klondike`

Thứ tự các giai đoạn là thứ tự phụ thuộc, không phải thứ tự ưu tiên. Trong một giai
đoạn, các việc độc lập với nhau và chạy song song được.

TDD cho mọi việc có logic: test đỏ trước, code sau, test xanh, rồi mới sang việc kế.

---

## Giai đoạn 0 · Khung dự án

- [x] `package.json` theo khuôn minesweeper/gomoku: Next 15, React 19, TS 5, Tailwind 3, lucide-react, Vitest, Playwright, happy-dom
- [x] `tsconfig.json` (strict), `next.config.ts` với `output: 'export'`, `postcss.config.mjs`, `.prettierrc`, `.eslintrc.json`
- [x] `tailwind.config.ts` nạp token từ `MASTER.md`
- [x] `vitest.config.mts` + `vitest.setup.ts`, `playwright.config.ts`
- [x] `.gitignore` bổ sung `node_modules/`, `.next/`, `out/`, `test-results/`, `playwright-report/`
- [x] `src/app/layout.tsx` (`lang="vi"`) + `src/app/globals.css`
- [x] `yarn install` chạy được, `yarn typecheck` xanh trên kho rỗng

## Giai đoạn 1 · Engine — `src/game/`

Không import React, DOM, Next. Bất biến 1–5 áp cho toàn bộ giai đoạn này.

- [x] `cards.ts` + test: `createDeck` đúng 52 lá không trùng, `colorOf`, `cardId`
- [x] `rng.ts` + test: cùng seed cho cùng dãy số; `shuffle` không đột biến đầu vào; hai seed khác cho hoán vị khác
- [x] `state.ts` + test: `pileIdEquals`, `topCard`, `isWon`, `canAutoComplete`
- [x] `deal.ts` + test: phân bố cột 1..7, tổng 52 lá, `stock` 24 lá, tái tạo được theo seed (FR-01)
- [x] `moves.ts` — `isLegal` + test cho từng ô của hai bảng luật trong design §1 (FR-02, FR-03)
- [x] `moves.ts` — `applyMove` + test: không đột biến đầu vào (freeze sâu), lật lá, `recycle` đảo thứ tự
- [x] `moves.ts` — `legalMoves` + test: khớp với `isLegal` trên mọi nước sinh ra
- [x] Property test phát lại: 200 seed × 30 nước, `history.reduce(applyMove, deal(seed))` bằng state đi trực tiếp (ADR-0001, bất biến 3–4)
- [x] Benchmark NFR-PERF-06: phát lại 300 nước < 16ms
- [x] `auto.ts` — `findAutoTarget` + test thứ tự ưu tiên xác định (FR-05)
- [x] `auto.ts` — `autoCompleteMoves` + test: từ thế gần thắng dẫn tới `isWon` (FR-06)
- [x] Test canh ranh giới: không file nào trong `src/game/` (trừ `rng.ts`) chứa `Math.random`, `Date.now`, `window`, `document`

## Giai đoạn 2 · Hệ thống thiết kế và chuỗi hiển thị

Độc lập với giai đoạn 1, chạy song song được.

- [x] `docs/design-system/solitaire/MASTER.md`: bảng màu (nền bàn, mặt bài, lưng bài, đỏ/đen, tiêu điểm, cảnh báo), thang chữ, thang khoảng cách, kích thước lá ở ba bề rộng
- [x] `src/lib/strings.ts`: toàn bộ chuỗi tiếng Việt, kể cả mẫu `aria-label` cho lá bài và chồng bài (NFR-I18N-01)
- [x] Kiểm tương phản đạt NFR-A11Y-01 cho mọi cặp màu chữ/nền trong bảng

## Giai đoạn 3 · Tầng React

Phụ thuộc giai đoạn 1 và 2.

- [x] `hooks/useGame.ts` + test: dispatch `MoveIntent`, `undo`, `restart`, `newGame`, `setDrawMode`, cờ thắng, cờ hiện nút Hoàn tất (FR-07, FR-09, FR-10)
- [x] `hooks/useSelection.ts` + test máy trạng thái ba nhánh của design §2 (FR-04)
- [x] `components/CardView.tsx` + test `aria-label` và vùng chạm (NFR-A11Y-03, NFR-A11Y-04)
- [x] `components/PileView.tsx` + test: vùng thả, nháy khi bị từ chối (NFR-REL-03)
- [x] `components/Toolbar.tsx` (FR-06, FR-07, FR-09, FR-10)
- [x] `components/GameBoard.tsx` — bố cục ba khu vực, phím tắt toàn cục (FR-11, FR-12)
- [x] `components/WinOverlay.tsx` — canvas bài đổ, tôn trọng `prefers-reduced-motion` (FR-08, ADR-0003, NFR-A11Y-05)
- [x] `app/page.tsx` ghép tất cả lại

## Giai đoạn 4 · Đầu cuối và xác minh

- [x] E2E: chơi hết ván bằng chạm (win.spec, 573 nước + Hoàn tất); bằng bàn phím; kéo thả
      còn ở mức một nước, chưa chơi hết ván bằng kéo — xem `backlog.md` §Nợ kỹ thuật
- [x] E2E: undo về đầu ván; đổi chế độ rút giữa ván
- [x] E2E: không cuộn ngang ở 320 / 375 / 768 / 1440; vùng chạm ≥ 44px
- [x] E2E: console sạch; không request mạng; `localStorage` trống (NFR-REL-04, NFR-DATA-01)
- [x] `yarn typecheck`, `yarn lint`, `yarn test`, `yarn build` đều xanh
- [x] `README.md` với `## Features`
- [x] Cập nhật `scope.md` FR-01 → FR-12 sang `xong`, cập nhật `backlog.md` §Đang làm
