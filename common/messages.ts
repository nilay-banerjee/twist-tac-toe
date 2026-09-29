import { WinReason } from "./types";

export function describeWin(reason: WinReason, winner: string, loser: string) {
  if (reason === "timeout") return `${winner} wins, ${loser} ran out of time`;
  if (reason === "left") return `${winner} wins, ${loser} left the game`;
  return `${winner} wins!`;
}
