# web-game-solitaire

Klondike Solitaire in the browser. No account, no ads, no server — the whole game is a
static page that runs on the player's machine.

## Features

- Klondike Solitaire with a draw-1 / draw-3 toggle.
- Play by tapping or by dragging — both are first-class, on touch and with a mouse.
- Play the whole game from the keyboard, with visible focus and labelled cards.
- Double-tap a card to send it to the first legal pile.
- Finish the boring part in one press once every card is face up.
- Unlimited undo, back to the first move of the deal.
- Deals are generated from a seed, so restarting replays the exact same game.

## Getting started

```bash
yarn install
yarn dev            # http://localhost:3000
```

There is nothing to configure — the game reads no required environment variables. See
[`.env.example`](.env.example) for the one optional variable the deploy workflow sets.

## Commands

| Command | Does |
| --- | --- |
| `yarn dev` | Dev server |
| `yarn build` | Static export into `out/` |
| `yarn typecheck` | `tsc --noEmit` |
| `yarn lint` | ESLint, including the guard that keeps `src/game/` framework-free |
| `yarn test` | Vitest — rules and components |
| `yarn test:e2e` | Playwright against the built static export, at four viewports |
| `yarn format` | Prettier |

`yarn test:e2e` needs `yarn build` to have run first: the suite tests the exported
site, because that is what GitHub Pages serves.

## How it is put together

Three layers, arrows only pointing down:

```
src/app + src/components   React, DOM, Tailwind, pointer and keyboard events
src/hooks/useGame          useReducer · Move[] history · undo
src/game                   plain TypeScript — the Klondike rules. No React.
```

`src/game/` never imports React or touches the browser, so the rules are tested
without rendering anything. A game is stored as a seed plus the list of moves played;
the current position is that list replayed from the deal, which is what makes undo,
restart and deterministic tests the same mechanism. `src/game/moves.ts` is the only
place a position changes.

## Documentation

Everything else lives in [`docs/`](docs/README.md) — what the game is and is not
([`overview.md`](docs/01-product/overview.md)), what breaks silently
([`invariants.md`](docs/03-design/invariants.md)), and why each technical choice was
made ([`decisions/`](docs/decisions/README.md)).
