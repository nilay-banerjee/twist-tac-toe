import { describe, expect, it } from "vitest";
import {
  applyMove,
  createState,
  legalMoves,
  nextToVanish,
  winningLine,
} from "../src/engine";

function play(moves: number[]) {
  return moves.reduce(applyMove, createState("X"));
}

describe("engine", () => {
  it("starts empty with X to move", () => {
    const state = createState("X");
    expect(state.board).toEqual(Array(9).fill(""));
    expect(state.turn).toBe("X");
    expect(legalMoves(state)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8]);
  });

  it("places a mark and passes the turn without mutating the old state", () => {
    const before = createState("X");
    const after = applyMove(before, 4);
    expect(after.board[4]).toBe("X");
    expect(after.turn).toBe("O");
    expect(before.board[4]).toBe("");
  });

  it("removes a player's oldest mark when they place a fourth", () => {
    const state = play([0, 8, 1, 7, 5, 3, 6]);
    expect(state.board[0]).toBe("");
    expect(state.marks.X).toEqual([1, 5, 6]);
    expect(state.marks.O).toEqual([8, 7, 3]);
  });

  it("reports the mark that vanishes next only once a player has three", () => {
    expect(nextToVanish(play([0, 8, 1]))).toEqual({ X: null, O: null });
    expect(nextToVanish(play([0, 8, 1, 7, 5]))).toEqual({ X: 0, O: null });
  });

  it("treats a player's own oldest mark as occupied", () => {
    const state = play([0, 8, 1, 7, 5, 3]);
    expect(legalMoves(state)).not.toContain(0);
  });

  it("finds a completed line", () => {
    expect(winningLine(play([0, 3, 1, 4, 2]).board, "X")).toEqual([0, 1, 2]);
    expect(winningLine(play([0, 3, 1]).board, "X")).toBeNull();
  });

  it("removes the oldest mark before checking for a win", () => {
    // X holds 0, 1 and 5; placing 2 drops 0 first, so 0-1-2 is not a line.
    const state = play([0, 3, 1, 7, 5, 8, 2]);
    expect(state.board[0]).toBe("");
    expect(winningLine(state.board, "X")).toBeNull();
  });
});
