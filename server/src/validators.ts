import { z } from "zod";
import { GAME_ID_LENGTH, USERNAME_MAX_LENGTH } from "../../common/constants";
import {
  JoinGamePayload,
  MovePayload,
  PlayBotPayload,
  UsernamePayload,
} from "../../common/types";

const username = z.string().trim().max(USERNAME_MAX_LENGTH);

export const usernameSchema: z.ZodType<UsernamePayload> = z.object({
  username,
});
export const joinGameSchema: z.ZodType<JoinGamePayload> = z.object({
  username,
  gameId: z.string().regex(new RegExp(`^[A-Z0-9]{${GAME_ID_LENGTH}}$`)),
});
export const playBotSchema: z.ZodType<PlayBotPayload> = z.object({
  username,
  difficulty: z.enum(["easy", "medium", "hard"]),
});
export const moveSchema: z.ZodType<MovePayload> = z.object({
  cell: z.number().int().min(0).max(8),
});
