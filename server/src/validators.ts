import { z } from "zod";
import {
  JoinGamePayload,
  MovePayload,
  UsernamePayload,
} from "../../common/types";

const username = z.string().max(20);

export const usernameSchema: z.ZodType<UsernamePayload> = z.object({
  username,
});
export const joinGameSchema: z.ZodType<JoinGamePayload> = z.object({
  username,
  gameId: z.string().regex(/^[A-Z0-9]{6}$/),
});
export const moveSchema: z.ZodType<MovePayload> = z.object({
  move: z.string().regex(/^[0-8]$/),
});
