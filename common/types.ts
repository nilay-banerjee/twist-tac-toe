export type Sign = "X" | "O";
export type Cell = Sign | "";
export type Difficulty = "easy" | "medium" | "hard";

export interface UsernamePayload {
  username: string;
}

export interface JoinGamePayload {
  gameId: string;
  username: string;
}

export interface PlayBotPayload {
  username: string;
  difficulty: Difficulty;
}

export interface MovePayload {
  cell: number;
}

export interface GameJoinedEventType {
  username: string;
  gameId: string;
  id: string;
  message: string;
  playersJoined: number;
}

export interface PlayerInfo {
  id: string;
  username: string;
  sign: Sign;
  isBot: boolean;
}

export interface InitEventType {
  gameId: string;
  you: PlayerInfo;
  opponent: PlayerInfo;
  fadingHidden: boolean;
}

export interface BoardEventType {
  board: Cell[];
  turnId: string;
  nextToVanish: Record<Sign, number | null>;
  turnEndsInMs: number;
}

export type WinReason = "line" | "timeout" | "left";

export interface WinEventType {
  winnerId: string;
  reason: WinReason;
  line: number[] | null;
}

export interface PlayerRenamedEventType {
  id: string;
  username: string;
}

export interface RematchOfferedEventType {
  username: string;
}

export interface NoticeEventType {
  message: string;
}

export interface OnlineEventType {
  count: number;
}

export interface ErrorEventType {
  message: string;
  errorCode: number;
}

export interface ClientToServerEvents {
  createGame: (data: UsernamePayload) => void;
  joinGame: (data: JoinGamePayload) => void;
  joinRandomGame: (data: UsernamePayload) => void;
  playBot: (data: PlayBotPayload) => void;
  move: (data: MovePayload) => void;
  cancel: () => void;
  leave: () => void;
  rematch: () => void;
  rename: (data: UsernamePayload) => void;
}

export interface ServerToClientEvents {
  gameJoined: (data: GameJoinedEventType) => void;
  init: (data: InitEventType) => void;
  board: (data: BoardEventType) => void;
  win: (data: WinEventType) => void;
  playerRenamed: (data: PlayerRenamedEventType) => void;
  rematchOffered: (data: RematchOfferedEventType) => void;
  rematchUnavailable: (data: NoticeEventType) => void;
  online: (data: OnlineEventType) => void;
  error: (data: ErrorEventType) => void;
}
