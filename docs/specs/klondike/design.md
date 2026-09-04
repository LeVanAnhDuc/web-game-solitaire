# Thiết kế · Klondike Solitaire (bản đầu)

> **Liên quan:** FR-01 · FR-02 · FR-03 · FR-04 · FR-05 · FR-06 · FR-07 · FR-08 · FR-09 · FR-10 · FR-11 · FR-12
> · NFR-PERF-02 · NFR-PERF-05 · NFR-PERF-06 · NFR-A11Y-01 → 05 · NFR-I18N-01 · NFR-REL-03 · NFR-REL-04 · NFR-DATA-01
> · ADR-0001 · ADR-0002 · ADR-0003 · ADR-0004 · ADR-0005
> **Ngày:** 2026-09-04

Kiến trúc tổng thể và ranh giới module nằm ở [`03-design/architecture.md`](../../03-design/architecture.md); tài liệu này chỉ nói phần mà kiến trúc không nói: hợp đồng cụ thể của từng hàm, cách hai hệ input gộp làm một, bố cục màn hình, và bộ test.

## 1. Hợp đồng của engine

`src/game/` — TypeScript thuần. Mọi chữ ký dưới đây là hợp đồng; hiện thực có thể đổi, chữ ký thì không, vì cả tầng UI lẫn bộ test đều viết theo chúng.

### `cards.ts`

```ts
export const SUITS = ['spades', 'hearts', 'diamonds', 'clubs'] as const;
export type Suit = (typeof SUITS)[number];
export type Rank = 1|2|3|4|5|6|7|8|9|10|11|12|13;   // 1 = A, 11 = J, 12 = Q, 13 = K
export type Color = 'red' | 'black';

export type CardId = string;                         // 'hearts-12' — duy nhất trong 52 lá
export type Card = { id: CardId; suit: Suit; rank: Rank };

export function colorOf(suit: Suit): Color;          // hearts, diamonds → 'red'
export function createDeck(): Card[];                // đúng 52 lá, thứ tự cố định, chưa xáo
export function cardId(suit: Suit, rank: Rank): CardId;
```

### `rng.ts`

```ts
export function mulberry32(seed: number): () => number;   // trả số thực trong [0, 1)
export function shuffle<T>(items: readonly T[], rng: () => number): T[];  // Fisher-Yates, không đột biến đầu vào
export function randomSeed(): number;                     // NGOẠI LỆ DUY NHẤT được dùng Math.random
```

`randomSeed` là chỗ duy nhất trong `src/game/` được phép gọi `Math.random`, và nó không được gọi từ bất kỳ hàm nào khác trong `game/` — chỉ `useGame` gọi nó khi người chơi bấm **Ván mới**. Nhờ vậy bất biến 3 vẫn đứng: mọi hàm luật đều xác định.

### `state.ts`

```ts
export type DrawMode = 1 | 3;
export type TableauColumn = { down: Card[]; up: Card[] };

export type PileId =
  | { kind: 'stock' }
  | { kind: 'waste' }
  | { kind: 'foundation'; index: 0|1|2|3 }
  | { kind: 'tableau'; index: 0|1|2|3|4|5|6 };

export type GameState = {
  readonly seed: number;
  readonly drawMode: DrawMode;
  readonly stock: readonly Card[];        // phần tử cuối mảng là lá sẽ được rút tiếp theo
  readonly waste: readonly Card[];        // phần tử cuối mảng là lá trên cùng, chơi được
  readonly foundations: readonly Card[][];   // đúng 4, theo thứ tự SUITS
  readonly tableau: readonly TableauColumn[];  // đúng 7 phần tử
};

export function pileIdEquals(a: PileId, b: PileId): boolean;
export function isWon(s: GameState): boolean;           // đủ 52 lá trên foundations
export function canAutoComplete(s: GameState): boolean; // mọi down rỗng
export function topCard(s: GameState, p: PileId): Card | undefined;
```

**Quy ước xuyên suốt: phần tử cuối mảng là lá trên cùng.** Áp cho cả bốn loại chồng, không có ngoại lệ. Quy ước ngược lại cũng chạy được, nhưng trộn hai quy ước trong một dự án là nguồn lỗi lệch-một-đơn-vị chắc chắn xảy ra.

### `deal.ts`

```ts
export function deal(seed: number, drawMode: DrawMode): GameState;
```

Chia đúng luật Klondike: cột *i* nhận *i+1* lá, lá cuối mỗi cột nằm trong `up`, phần còn lại trong `down`; 24 lá còn lại vào `stock`; `waste` và `foundations` rỗng.

### `moves.ts` — nguồn duy nhất của luật

```ts
export type Move =
  | { type: 'draw' }                                              // stock → waste, drawMode lá
  | { type: 'recycle' }                                           // waste → stock, chỉ khi stock rỗng
  | { type: 'move'; from: PileId; to: PileId; count: number };    // count ≥ 1

export function isLegal(s: GameState, m: Move): boolean;
export function applyMove(s: GameState, m: Move): GameState;      // thuần; ném lỗi nếu m không hợp lệ
export function legalMoves(s: GameState): Move[];                 // mọi nước hợp lệ, dùng cho auto và cho test
```

Luật, đầy đủ:

| Đích | Nhận gì |
| --- | --- |
| `foundation[i]` | Đúng chất `SUITS[i]`; rỗng thì chỉ nhận A; khác thì nhận lá hơn lá trên cùng đúng 1 hạng. Luôn `count === 1` |
| `tableau[i]` rỗng | Chỉ nhận dãy bắt đầu bằng K |
| `tableau[i]` có bài | Lá đầu dãy phải kém lá trên cùng đúng 1 hạng **và** khác màu |
| `waste` | Không nhận gì (chỉ nhận qua nước `draw`) |
| `stock` | Không nhận gì (chỉ nhận qua nước `recycle`) |

| Nguồn | Cho đi gì |
| --- | --- |
| `waste` | Chỉ lá trên cùng, `count === 1` |
| `foundation[i]` | Chỉ lá trên cùng, `count === 1` — cho phép rút về tableau |
| `tableau[i]` | `count` lá cuối của `up`, và dãy đó phải đã đúng thứ tự giảm dần xen kẽ màu |
| `stock` | Không cho đi (chỉ qua nước `draw`) |

Ngoài ra:

- `draw` hợp lệ khi `stock` không rỗng; lấy `min(drawMode, stock.length)` lá.
- `recycle` hợp lệ khi `stock` rỗng và `waste` không rỗng; toàn bộ `waste` quay lại `stock` **đảo thứ tự**, không xáo lại. Không giới hạn số lần.
- Sau khi lấy lá khỏi `tableau[i].up`, nếu `up` rỗng và `down` không rỗng thì lá cuối của `down` chuyển sang `up`. Nằm trong `applyMove`.
- Nước có `from` trùng `to` là không hợp lệ.

### `auto.ts`

```ts
export function findAutoTarget(s: GameState, from: PileId, count?: number): Move | null;
export function autoCompleteMoves(s: GameState): Move[];
```

`findAutoTarget` — dùng cho chạm đúp. Thứ tự ưu tiên: foundation đúng chất trước; nếu không có thì cột tableau đang có bài; cuối cùng mới là cột trống. Trong mỗi nhóm, chọn chỉ số nhỏ nhất — xác định, không phụ thuộc thứ tự duyệt.

`autoCompleteMoves` — chỉ gọi khi `canAutoComplete`. Lặp: mỗi vòng tìm một lá đưa được lên foundation (hoặc `draw`/`recycle` nếu cần lấy lá từ stock), cho đến khi `isWon` hoặc không còn tiến triển. Trả về mảng nước đi, **không tự thi hành**.

## 2. Một lớp ý định cho cả chạm lẫn kéo

Đây là chỗ trả giá cho quyết định "tap và drag đều là công dân hạng nhất". Nếu để hai hệ input tự phát nước đi thì sẽ có hai bản luật; nên cả hai chỉ được phép sinh ra cùng một thứ:

```ts
type MoveIntent = { from: PileId; count: number; to: PileId };
```

`useSelection` là máy trạng thái duy nhất, ba trạng thái:

| Trạng thái | Vào bằng | Ra bằng |
| --- | --- | --- |
| `idle` | mặc định | chạm/bấm một lá chơi được → `selected`; giữ và di chuyển > 6px → `dragging` |
| `selected` | chạm lá nguồn | chạm chồng đích → phát `MoveIntent`; chạm lá khác → đổi lựa chọn; chạm chỗ trống hoặc `Escape` → `idle` |
| `dragging` | pointerdown + di chuyển | thả trên chồng đích → phát `MoveIntent`; thả chỗ khác, `pointercancel`, hoặc con trỏ rời cửa sổ → `idle`, bài về chỗ cũ |

Ba đường vào, một đường ra:

- **Chạm** → `selected` → `MoveIntent`.
- **Kéo** → `dragging` → `MoveIntent`.
- **Bàn phím** → mũi tên di chuyển focus giữa các chồng, `Space` chọn/thả, `Escape` bỏ chọn → `MoveIntent`. Bàn phím dùng lại đúng trạng thái `selected`, không có nhánh riêng.

Chạm đúp và `Enter` trên một lá thì không đi qua `useSelection` mà gọi thẳng `findAutoTarget`.

`useGame` nhận `MoveIntent`, dựng `Move`, hỏi `isLegal`. Không hợp lệ thì trả về `'rejected'` kèm `PileId` bị từ chối; UI nháy đỏ chồng đó một nhịp 200ms và bỏ lựa chọn. `history` không đổi — bất biến 7.

Ngưỡng 6px để phân biệt chạm với kéo: dưới ngưỡng, một cú `pointerdown` + `pointerup` tại chỗ được coi là chạm, kể cả khi ngón tay hơi rung. Đây là lý do luồng kéo không ăn tranh luồng chạm trên cảm ứng.

## 3. Bố cục

Thiết kế mobile 375 trước, hai bề rộng còn lại nới ra từ đó.

**Mobile 375** — bảy cột phải vừa màn hình, nên bề rộng lá là `(100vw - 8 × 4px) / 7`, khoảng 45px, cao 63px (tỉ lệ 1:1.4). Vùng chạm của lá được nới ra 44px tối thiểu bằng padding trong suốt, không nới phần vẽ (NFR-A11Y-03).

```
┌─────────────────────────────────┐
│  Ván số 48213        [Rút 1 ▾]  │  ← thanh trên: seed + chế độ rút
├─────────────────────────────────┤
│ ┌──┐ ┌──┐   ┌──┐┌──┐┌──┐┌──┐    │
│ │▨ ││J♥│   │A♠││  ││  ││  │     │  ← stock · waste · 4 foundation
│ └──┘ └──┘   └──┘└──┘└──┘└──┘    │
├─────────────────────────────────┤
│ ┌──┐┌──┐┌──┐┌──┐┌──┐┌──┐┌──┐    │
│ │K♠││▨ ││▨ ││▨ ││▨ ││▨ ││▨ │    │
│ └──┘│Q♦││▨ ││▨ ││▨ ││▨ ││▨ │    │  ← 7 cột tableau, chồng lấn dọc
│     └──┘│7♣││▨ ││▨ ││▨ ││▨ │    │    lá úp lấn 8px, lá ngửa lấn 18px
│         └──┘└──┘└──┘└──┘└──┘    │
│                                 │
├─────────────────────────────────┤
│  [↶ Hoàn lại] [↻ Chơi lại] [+]  │  ← thanh dưới, trong tầm ngón cái
└─────────────────────────────────┘
```

**Tablet 768 / Desktop 1440** — cùng một cây DOM, chỉ đổi bề rộng lá (72px / 96px) và khoảng lấn dọc; bàn bài canh giữa với `max-width`, không kéo dãn hết màn hình. Ở desktop hai thanh công cụ gộp thành một hàng trên cùng. Không có breakpoint nào làm đổi cấu trúc — vì đổi cấu trúc theo bề rộng là chỗ luật và bố cục bắt đầu rẽ nhánh.

Bảng màu, kiểu chữ và khoảng cách lấy từ `docs/design-system/solitaire/MASTER.md`.

## 4. Thành phần React

| Thành phần | Nhận gì | Việc |
| --- | --- | --- |
| `app/page.tsx` | — | Gắn `<GameBoard />`, đặt tiêu đề trang |
| `GameBoard` | — | Gọi `useGame` + `useSelection`, bày ba khu vực, gắn phím tắt toàn cục |
| `PileView` | `pileId`, `cards`, trạng thái | Một chồng bài: vùng thả, nhãn cho screen reader, hiệu ứng nháy khi từ chối |
| `CardView` | `card`, `faceUp`, `selected`, `draggable` | Một lá: mặt bài, vùng chạm 44px, `aria-label` |
| `Toolbar` | các callback | Hoàn lại · Chơi lại · Ván mới · Rút 1/3 · Hoàn tất |
| `WinOverlay` | `cards` | Canvas bài đổ + nút chơi tiếp. Tôn trọng `prefers-reduced-motion` |
| `SeedLabel` | `seed` | Hiện số hiệu ván |

Mặt bài vẽ bằng ký tự Unicode chất bài (`♠ ♥ ♦ ♣`) trên nền trắng bo góc, không dùng ảnh — giữ bundle nhỏ và tự động sắc nét ở mọi mật độ điểm ảnh.

## 5. Kiểm thử

**Vitest — luật chơi** (không render gì):

- `deal` với cùng seed cho ra thế bài y hệt; hai seed khác nhau cho ra hai thế bài khác nhau; luôn đủ 52 lá không trùng, phân bố cột đúng 1..7.
- `isLegal` cho từng ô trong hai bảng luật ở §1, cả nhánh đúng lẫn nhánh sai.
- `applyMove` không đột biến state đầu vào — đóng băng state bằng `Object.freeze` sâu rồi gọi.
- Lật lá: lấy lá ngửa cuối cùng của một cột thì lá úp trên cùng phải lật lên.
- `recycle` đảo đúng thứ tự và lặp lại được nhiều lần.
- **Property test phát lại:** với 200 seed, đi 30 nước hợp lệ; phát lại từ seed qua toàn bộ `history` phải cho state bằng hệt state đi trực tiếp. Đây là test canh ADR-0001 và bất biến 3, 4.
- `autoCompleteMoves` từ một thế bài gần thắng phải dẫn tới `isWon`.
- NFR-PERF-06: phát lại 300 nước dưới 16ms.

**Vitest — component** (happy-dom): `CardView` có `aria-label` đúng; `PileView` báo nháy khi bị từ chối; máy trạng thái `useSelection` đi đúng ba nhánh ở §2.

**Playwright — đầu cuối:**

- Chơi một ván cố định seed từ đầu đến thắng, chỉ bằng chạm (US-01, US-03).
- Cùng ván đó, chỉ bằng kéo thả (US-02) — cùng chuỗi nước, cùng kết quả.
- Cùng ván đó, chỉ bằng bàn phím (FR-12).
- Undo về tận đầu ván rồi so bàn bài với lúc mới chia (US-04).
- Đổi chế độ rút giữa ván thì hỏi trước khi bỏ ván (US-05).
- Vùng chạm ≥ 44px ở 320px; không cuộn ngang ở 320 / 375 / 768 / 1440 (FR-11, NFR-A11Y-03).
- Console sạch suốt một ván (NFR-REL-04).
- Không có request mạng nào sau khi tải xong, và `localStorage` trống (NFR-DATA-01).

Test E2E chọn phần tử bằng `aria-label` tiếng Việt, không bằng `data-testid` — cùng một câu lệnh vừa kiểm nước đi vừa kiểm nhãn tiếp cận có tồn tại.
