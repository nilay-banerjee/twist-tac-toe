import { z } from "zod";

const username = z.string().max(20);

export const usernameSchema = z.object({ username });
export const joinGameSchema = z.object({
  username,
  gameId: z.string().regex(/^[A-Z0-9]{6}$/),
});
export const moveSchema = z.object({ move: z.string().regex(/^[0-8]$/) });

export type UsernamePayload = z.infer<typeof usernameSchema>;
export type JoinGamePayload = z.infer<typeof joinGameSchema>;
export type MovePayload = z.infer<typeof moveSchema>;
