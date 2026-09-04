/**
 * Finds a deal that can actually be won, and the moves that win it.
 *
 * The e2e suite needs to play a game through to the win screen. Roughly a fifth of
 * Klondike deals have no solution at all, and the ones that do are not solvable by
 * playing greedily, so the fixture cannot be written by hand or guessed. This searches
 * for one and writes it to e2e/fixtures/winnable.json, which is committed - the search
 * is slow and nothing about it needs to run in CI.
 *
 *   npx vite-node -c vitest.config.mts scripts/find-winnable.ts -- [firstSeed] [seedCount]
 *
 * The result it writes is the FULL winning line. e2e/fixtures/winnable.json holds only
 * the prefix up to the first fully-face-up position, because the rest is what the
 * game's own "Hoàn tất" button does, and replaying eighteen thousand moves through a
 * browser would take longer than the rest of the suite put together.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { deal } from "@/game/deal";
import { applyMove, legalMoves, type Move } from "@/game/moves";
import { isWon, type DrawMode, type GameState } from "@/game/state";

/**
 * Nodes searched before a deal is abandoned. Klondike search is genuinely hard: at
 * 25k most deals are abandoned, and raising it costs minutes per deal. The fixture in
 * the repo came from a run at 300k over the first few seeds, then trimmed to the point
 * where every card is face up - which is all the e2e replay needs.
 */
const NODE_BUDGET = 300_000;
/**
 * Without a cap the search happily walks a winning line thousands of moves long,
 * cycling the stock between every real move; the fixture has to be replayed through
 * the UI, so length is the difference between a test that runs and one that times out.
 *
 * Only REAL moves count against the cap. Drawing is not progress, but it is also not
 * optional - reaching a buried card legitimately costs twenty draws, and counting
 * those would rule out every genuine solution.
 */
const MAX_REAL_DEPTH = 110;
const DRAW_MODE: DrawMode = 1;

/**
 * Two positions with the same cards in the same places are the same position, however
 * you got there. Without this the search re-explores the same shuffling of the waste
 * pile forever.
 */
function fingerprint(s: GameState): string {
  return [
    s.stock.map((c) => c.id).join(","),
    s.waste.map((c) => c.id).join(","),
    s.foundations.map((f) => f.map((c) => c.id).join(",")).join("|"),
    s.tableau.map((c) => `${c.down.length}:${c.up.map((x) => x.id).join(",")}`).join("|"),
  ].join("/");
}

/**
 * Search order, best first. Turning over a face-down card is what actually makes
 * progress in Klondike; drawing makes none, and recycling makes less than none, so
 * they go last and the depth cap keeps the search from living there.
 */
function score(s: GameState, m: Move): number {
  if (m.type === "recycle") return 9;
  if (m.type === "draw") return 8;
  if (m.type !== "move") return 7;
  if (m.from.kind === "tableau") {
    const col = s.tableau[m.from.index];
    // Emptying the face-up run exposes a hidden card, or opens a column for a king.
    if (col && col.up.length === m.count) return col.down.length > 0 ? 0 : 3;
  }
  if (m.to.kind === "foundation") return 1;
  if (m.from.kind === "waste") return 2;
  if (m.from.kind === "foundation") return 6; // pulling back off a foundation rarely helps
  return 4;
}

/**
 * Iterative depth-first search. A recursive one overflows the stack long before it
 * runs out of budget: a Klondike line is thousands of moves deep once the search
 * starts cycling the stock.
 */
function solve(seed: number): Move[] | null {
  const seen = new Set<string>();
  let nodes = 0;

  type Frame = { state: GameState; moves: Move[]; next: number; realDepth: number };
  const path: Move[] = [];
  const stack: Frame[] = [
    { state: deal(seed, DRAW_MODE), moves: [], next: 0, realDepth: 0 },
  ];
  stack[0]!.moves = orderedMoves(stack[0]!.state);

  while (stack.length > 0) {
    const frame = stack[stack.length - 1]!;

    if (isWon(frame.state)) return [...path];
    if (++nodes > NODE_BUDGET) return null;

    if (frame.next >= frame.moves.length || frame.realDepth > MAX_REAL_DEPTH) {
      stack.pop();
      path.pop();
      continue;
    }

    const move = frame.moves[frame.next++]!;
    const child = applyMove(frame.state, move);
    const key = fingerprint(child);
    if (seen.has(key)) continue;
    seen.add(key);

    path.push(move);
    stack.push({
      state: child,
      moves: orderedMoves(child),
      next: 0,
      realDepth: frame.realDepth + (move.type === "move" ? 1 : 0),
    });
  }

  return null;
}

function orderedMoves(s: GameState): Move[] {
  return legalMoves(s).sort((a, b) => score(s, a) - score(s, b));
}

const firstSeed = Number(process.argv[2] ?? 1);
const seedCount = Number(process.argv[3] ?? 200);

for (let seed = firstSeed; seed < firstSeed + seedCount; seed++) {
  const moves = solve(seed);
  if (!moves) {
    process.stdout.write(`seed ${seed}: no solution within budget\n`);
    continue;
  }
  mkdirSync("e2e/fixtures", { recursive: true });
  writeFileSync(
    "e2e/fixtures/winnable.json",
    `${JSON.stringify({ seed, drawMode: DRAW_MODE, moves }, null, 2)}\n`,
    "utf8",
  );
  process.stdout.write(`seed ${seed}: solved in ${moves.length} moves -> e2e/fixtures/winnable.json\n`);
  process.exit(0);
}

process.stdout.write("no winnable deal found in that range\n");
process.exit(1);
