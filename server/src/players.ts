import { randomUUID } from "crypto";
import { Difficulty } from "../../common/types";
import { GameSocket } from "./types";

const BOT_NAMES: Record<Difficulty, string> = {
  easy: "Computer (Easy)",
  medium: "Computer (Medium)",
  hard: "Computer (Hard)",
};

export class Human {
  readonly kind = "human";
  constructor(
    public client: GameSocket,
    public username: string
  ) {}
  get id() {
    return this.client.id;
  }
}

export class Bot {
  readonly kind = "bot";
  readonly id = `bot-${randomUUID()}`;
  readonly username: string;
  constructor(readonly difficulty: Difficulty) {
    this.username = BOT_NAMES[difficulty];
  }
}

export type Player = Human | Bot;
