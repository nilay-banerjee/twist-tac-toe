import { describe, expect, it } from "vitest";
import { Difficulty, Sign } from "../../common/types";
import { chooseMove } from "../src/bot";
import {
  applyMove,
  createState,
  GameState,
  legalMoves,
  winningLine,
} from "../src/engine";

const DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard"];
const MAX_PLIES = 120;

function play(moves: number[]) {
  return moves.reduce(applyMove, createState("X"));
}

function randomState() {
  let state = createState("X");
  const plies = Math.floor(Math.random() * 12);
  for (let i = 0; i < plies; i++) {
    const moves = legalMoves(state);
    const next = applyMove(
      state,
      moves[Math.floor(Math.random() * moves.length)]
    );
    if (winningLine(next.board, state.turn)) break;
    state = next;
  }
  return state;
}

function match(x: Difficulty, o: Difficulty): Sign | null {
  const levels: Record<Sign, Difficulty> = { X: x, O: o };
  let state: GameState = createState("X");
  for (let ply = 0; ply < MAX_PLIES; ply++) {
    const mover = state.turn;
    state = applyMove(state, chooseMove(state, levels[mover]));
    if (winningLine(state.board, mover)) return mover;
  }
  return null;
}

describe("bot", () => {
  it.each(DIFFICULTIES)("%s only plays legal moves", (difficulty) => {
    for (let i = 0; i < 200; i++) {
      const state = randomState();
      expect(legalMoves(state)).toContain(chooseMove(state, difficulty));
    }
  });

  it.each(DIFFICULTIES)("%s takes an immediate win", (difficulty) => {
    // X holds 0 and 1 and is to move; 2 wins.
    const state = play([0, 4, 1, 8]);
    expect(chooseMove(state, difficulty)).toBe(2);
  });

  it.each(DIFFICULTIES)("%s blocks an immediate threat", (difficulty) => {
    // O is to move and X threatens 0-1-2.
    const state = play([0, 4, 1]);
    expect(chooseMove(state, difficulty)).toBe(2);
  });

  // The search loses ~1 in 150 to easy, from wins deeper than it looks.
  it("medium beats easy almost every game", () => {
    let wins = 0;
    let losses = 0;
    for (let i = 0; i < 20; i++) {
      const mediumIsX = i % 2 === 0;
      const winner = mediumIsX
        ? match("medium", "easy")
        : match("easy", "medium");
      const mediumSign = mediumIsX ? "X" : "O";
      if (winner === mediumSign) wins++;
      else if (winner !== null) losses++;
    }
    expect(losses).toBeLessThanOrEqual(3);
    expect(wins).toBeGreaterThanOrEqual(16);
  });

  it("hard picks a move on the empty board quickly", () => {
    const started = performance.now();
    chooseMove(createState("X"), "hard");
    expect(performance.now() - started).toBeLessThan(500);
  });
});
