# Kế hoạch hiện thực · Klondike Solitaire (bản đầu)

> **Liên quan:** [`design.md`](design.md) · FR-01 → FR-12
> **Ngày:** 2026-09-04 · nhánh `feat/klondike`

Thứ tự các giai đoạn là thứ tự phụ thuộc, không phải thứ tự ưu tiên. Trong một giai
đoạn, các việc độc lập với nhau và chạy song song được.

TDD cho mọi việc có logic: test đỏ trước, code sau, test xanh, rồi mới sang việc kế.

---

## Giai đoạn 0 · Khung dự án

- [ ] `package.json` theo khuôn minesweeper/gomoku: Next 15, React 19, TS 5, Tailwind 3, lucide-react, Vitest, Playwright, happy-dom
- [ ] `tsconfig.json` (strict), `next.config.ts` với `output: 'export'`, `postcss.config.mjs`, `.prettierrc`, `.eslintrc.json`
- [ ] `tailwind.config.ts` nạp token từ `MASTER.md`
- [ ] `vitest.config.mts` + `vitest.setup.ts`, `playwright.config.ts`
- [ ] `.gitignore` bổ sung `node_modules/`, `.next/`, `out/`, `test-results/`, `playwright-report/`
- [ ] `src/app/layout.tsx` (`lang="vi"`) + `src/app/globals.css`
- [ ] `yarn install` chạy được, `yarn typecheck` xanh trên kho rỗng

## Giai đoạn 1 · Engine — `src/game/`

Không import React, DOM, Next. Bất biến 1–5 áp cho toàn bộ giai đoạn này.

- [ ] `cards.ts` + test: `createDeck` đúng 52 lá không trùng, `colorOf`, `cardId`
- [ ] `rng.ts` + test: cùng seed cho cùng dãy số; `shuffle` không đột biến đầu vào; hai seed khác cho hoán vị khác
- [ ] `state.ts` + test: `pileIdEquals`, `topCard`, `isWon`, `canAutoComplete`
- [ ] `deal.ts` + test: phân bố cột 1..7, tổng 52 lá, `stock` 24 lá, tái tạo được theo seed (FR-01)
- [ ] `moves.ts` — `isLegal` + test cho từng ô của hai bảng luật trong design §1 (FR-02, FR-03)
- [ ] `moves.ts` — `applyMove` + test: không đột biến đầu vào (freeze sâu), lật lá, `recycle` đảo thứ tự
- [ ] `moves.ts` — `legalMoves` + test: khớp với `isLegal` trên mọi nước sinh ra
- [ ] Property test phát lại: 200 seed × 30 nước, `history.reduce(applyMove, deal(seed))` bằng state đi trực tiếp (ADR-0001, bất biến 3–4)
- [ ] Benchmark NFR-PERF-06: phát lại 300 nước < 16ms
- [ ] `auto.ts` — `findAutoTarget` + test thứ tự ưu tiên xác định (FR-05)
- [ ] `auto.ts` — `autoCompleteMoves` + test: từ thế gần thắng dẫn tới `isWon` (FR-06)
- [ ] Test canh ranh giới: không file nào trong `src/game/` (trừ `rng.ts`) chứa `Math.random`, `Date.now`, `window`, `document`

## Giai đoạn 2 · Hệ thống thiết kế và chuỗi hiển thị

Độc lập với giai đoạn 1, chạy song song được.

- [ ] `docs/design-system/solitaire/MASTER.md`: bảng màu (nền bàn, mặt bài, lưng bài, đỏ/đen, tiêu điểm, cảnh báo), thang chữ, thang khoảng cách, kích thước lá ở ba bề rộng
- [ ] `src/lib/strings.ts`: toàn bộ chuỗi tiếng Việt, kể cả mẫu `aria-label` cho lá bài và chồng bài (NFR-I18N-01)
- [ ] Kiểm tương phản đạt NFR-A11Y-01 cho mọi cặp màu chữ/nền trong bảng

## Giai đoạn 3 · Tầng React

Phụ thuộc giai đoạn 1 và 2.

- [ ] `hooks/useGame.ts` + test: dispatch `MoveIntent`, `undo`, `restart`, `newGame`, `setDrawMode`, cờ thắng, cờ hiện nút Hoàn tất (FR-07, FR-09, FR-10)
- [ ] `hooks/useSelection.ts` + test máy trạng thái ba nhánh của design §2 (FR-04)
- [ ] `components/CardView.tsx` + test `aria-label` và vùng chạm (NFR-A11Y-03, NFR-A11Y-04)
- [ ] `components/PileView.tsx` + test: vùng thả, nháy khi bị từ chối (NFR-REL-03)
- [ ] `components/Toolbar.tsx` (FR-06, FR-07, FR-09, FR-10)
- [ ] `components/GameBoard.tsx` — bố cục ba khu vực, phím tắt toàn cục (FR-11, FR-12)
- [ ] `components/WinOverlay.tsx` — canvas bài đổ, tôn trọng `prefers-reduced-motion` (FR-08, ADR-0003, NFR-A11Y-05)
- [ ] `app/page.tsx` ghép tất cả lại

## Giai đoạn 4 · Đầu cuối và xác minh

- [ ] E2E: chơi hết ván bằng chạm; bằng kéo; bằng bàn phím
- [ ] E2E: undo về đầu ván; đổi chế độ rút giữa ván
- [ ] E2E: không cuộn ngang ở 320 / 375 / 768 / 1440; vùng chạm ≥ 44px
- [ ] E2E: console sạch; không request mạng; `localStorage` trống (NFR-REL-04, NFR-DATA-01)
- [ ] `yarn typecheck`, `yarn lint`, `yarn test`, `yarn build` đều xanh
- [ ] `README.md` với `## Features`
- [ ] Cập nhật `scope.md` FR-01 → FR-12 sang `xong`, cập nhật `backlog.md` §Đang làm
