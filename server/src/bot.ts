import { Difficulty } from "../../common/types";
import {
  applyMove,
  GameState,
  legalMoves,
  MAX_MARKS,
  other,
  WIN_LINES,
  winningLine,
} from "./engine";

type Random = () => number;

const SEARCH_DEPTH = 8;
const WIN_SCORE = 1000;

function pick<T>(items: T[], random: Random): T {
  return items[Math.floor(random() * items.length)];
}

function isWinningMove(state: GameState, cell: number) {
  return winningLine(applyMove(state, cell).board, state.turn) !== null;
}

function winningMoves(state: GameState) {
  return legalMoves(state).filter((cell) => isWinningMove(state, cell));
}

function safeMoves(state: GameState) {
  return legalMoves(state).filter(
    (cell) => winningMoves(applyMove(state, cell)).length === 0
  );
}

// Scored for the side to move. Its oldest mark vanishes on its next placement,
// so that mark can't count towards its threats.
function evaluate(state: GameState) {
  const me = state.turn;
  const them = other(me);
  const vanishing =
    state.marks[me].length === MAX_MARKS ? state.marks[me][0] : null;
  let score = 0;
  for (const line of WIN_LINES) {
    let mine = 0;
    let theirs = 0;
    for (const i of line) {
      if (state.board[i] === me && i !== vanishing) mine++;
      else if (state.board[i] === them) theirs++;
    }
    if (theirs === 0) score += mine === 2 ? 10 : mine;
    if (mine === 0) score -= theirs === 2 ? 10 : theirs;
  }
  return score;
}

function negamax(
  state: GameState,
  depth: number,
  alpha: number,
  beta: number
): number {
  if (depth === 0) return evaluate(state);
  let best = -Infinity;
  for (const cell of legalMoves(state)) {
    const next = applyMove(state, cell);
    const score = winningLine(next.board, state.turn)
      ? WIN_SCORE + depth
      : -negamax(next, depth - 1, -beta, -alpha);
    best = Math.max(best, score);
    alpha = Math.max(alpha, best);
    if (alpha >= beta) break;
  }
  return best;
}

function searchMove(state: GameState, depth: number, random: Random) {
  let bestScore = -Infinity;
  let bestMoves: number[] = [];
  for (const cell of legalMoves(state)) {
    const next = applyMove(state, cell);
    // The narrowed window still gives exact scores for moves that tie the best.
    const score = winningLine(next.board, state.turn)
      ? WIN_SCORE + depth
      : -negamax(next, depth - 1, -Infinity, 1 - bestScore);
    if (score > bestScore) {
      bestScore = score;
      bestMoves = [cell];
    } else if (score === bestScore) {
      bestMoves.push(cell);
    }
  }
  return pick(bestMoves, random);
}

export function chooseMove(
  state: GameState,
  difficulty: Difficulty,
  random: Random = Math.random
): number {
  const winning = winningMoves(state);
  if (winning.length > 0) return pick(winning, random);
  if (difficulty === "easy") {
    const safe = safeMoves(state);
    return pick(safe.length > 0 ? safe : legalMoves(state), random);
  }
  return searchMove(state, SEARCH_DEPTH, random);
}
