import type { Rank, Suit } from "@/game/cards";

/**
 * Every user-visible string in the app - NFR-I18N-01. Components import from here
 * instead of writing Vietnamese inline, so a missing translation is a compile error
 * rather than something you find by reading the UI.
 *
 * The e2e suite selects elements by these labels (design.md section 5), so changing
 * one is a user-facing change: it breaks tests on purpose.
 */

const RANK_NAMES: Record<Rank, string> = {
  1: "Át",
  2: "Hai",
  3: "Ba",
  4: "Bốn",
  5: "Năm",
  6: "Sáu",
  7: "Bảy",
  8: "Tám",
  9: "Chín",
  10: "Mười",
  11: "Bồi",
  12: "Đầm",
  13: "Già",
};

const SUIT_NAMES: Record<Suit, string> = {
  spades: "Bích",
  hearts: "Cơ",
  diamonds: "Rô",
  clubs: "Tép",
};

/** The glyph printed on the card face. */
export const SUIT_GLYPHS: Record<Suit, string> = {
  spades: "♠",
  hearts: "♥",
  diamonds: "♦",
  clubs: "♣",
};

/** The short rank shown on the card face - "A", "2".."10", "J", "Q", "K". */
export const RANK_LABELS: Record<Rank, string> = {
  1: "A",
  2: "2",
  3: "3",
  4: "4",
  5: "5",
  6: "6",
  7: "7",
  8: "8",
  9: "9",
  10: "10",
  11: "J",
  12: "Q",
  13: "K",
};

export const strings = {
  appTitle: "Klondike Solitaire",

  toolbar: {
    undo: "Hoàn lại",
    restart: "Chơi lại",
    newGame: "Ván mới",
    autoComplete: "Hoàn tất",
    drawMode: "Chế độ rút",
    draw1: "Rút 1 lá",
    draw3: "Rút 3 lá",
  },

  pile: {
    stock: "Chồng rút",
    stockEmpty: "Chồng rút đã cạn, chạm để lật lại",
    waste: "Bài đã rút",
    foundation: (suit: Suit) => `Chồng đích ${SUIT_NAMES[suit]}`,
    tableau: (index: number) => `Cột bài ${index + 1}`,
    empty: "trống",
  },

  card: {
    /** "Bích 7" - the readable name of a card. */
    name: (suit: Suit, rank: Rank) => `${SUIT_NAMES[suit]} ${RANK_NAMES[rank]}`,
    faceDown: "Lá úp",
    /** Full label for a face-up card, including how many cards move with it. */
    label: (suit: Suit, rank: Rank, stackCount: number) =>
      stackCount > 1
        ? `${SUIT_NAMES[suit]} ${RANK_NAMES[rank]}, kèm ${stackCount - 1} lá bên dưới`
        : `${SUIT_NAMES[suit]} ${RANK_NAMES[rank]}`,
    selected: "đang chọn",
  },

  seed: {
    label: (seed: number) => `Ván số ${seed}`,
    hint: "Cùng số hiệu ván luôn cho cùng thế bài",
  },

  win: {
    title: "Thắng rồi!",
    body: (moves: number) => `Xong ván trong ${moves} nước đi.`,
    playAgain: "Chơi ván mới",
  },

  confirm: {
    drawModeTitle: "Đổi chế độ rút sẽ bắt đầu lại ván",
    drawModeBody: "Ván đang chơi sẽ bị bỏ. Vẫn đổi chứ?",
    accept: "Đổi và chia lại",
    cancel: "Giữ ván hiện tại",
  },

  a11y: {
    board: "Bàn bài Klondike",
    toolbar: "Thanh điều khiển",
    /** Announced after every state change, for screen readers. */
    moveRejected: "Nước đi không hợp lệ",
    keyboardHint:
      "Dùng phím mũi tên để di chuyển giữa các chồng bài, phím cách để chọn và thả, Enter để tự tìm chỗ, Escape để bỏ chọn.",
  },
} as const;
