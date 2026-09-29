import { Cell, Sign } from "../../common/types";

export const MAX_MARKS = 3;
export const WIN_LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

export interface GameState {
  board: Cell[];
  marks: Record<Sign, number[]>;
  turn: Sign;
}

export function createState(turn: Sign = "X"): GameState {
  return { board: Array(9).fill(""), marks: { X: [], O: [] }, turn };
}

export function other(sign: Sign): Sign {
  return sign === "X" ? "O" : "X";
}

export function legalMoves(state: GameState): number[] {
  return state.board.flatMap((cell, index) => (cell === "" ? [index] : []));
}

export function nextToVanish(state: GameState): Record<Sign, number | null> {
  const oldest = (sign: Sign) =>
    state.marks[sign].length === MAX_MARKS ? state.marks[sign][0] : null;
  return { X: oldest("X"), O: oldest("O") };
}

export function applyMove(state: GameState, cell: number): GameState {
  const sign = state.turn;
  const board = [...state.board];
  const marks = [...state.marks[sign]];
  const removed = marks.length === MAX_MARKS ? marks.shift() : undefined;
  if (removed !== undefined) board[removed] = "";
  board[cell] = sign;
  marks.push(cell);
  return {
    board,
    marks: { ...state.marks, [sign]: marks },
    turn: other(sign),
  };
}

export function winningLine(board: Cell[], sign: Sign): number[] | null {
  return WIN_LINES.find((line) => line.every((i) => board[i] === sign)) ?? null;
}
