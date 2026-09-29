export interface UsernamePayload {
  username: string;
}

export interface JoinGamePayload {
  gameId: string;
  username: string;
}

export interface MovePayload {
  move: string;
}

export interface GameJoinedEventType {
  username: string;
  gameId: string;
  id: string;
  message: string;
  playersJoined: number;
}

export interface InitEventType {
  username: string;
  sign: string;
  id: string;
}

export interface BoardEventType {
  board: string[];
  turnId: string;
}

export interface TimeEventType {
  lastMoveTimeInSeconds: number;
}

export interface WinEventType {
  winner: string;
  id: string;
  message: string;
  timeout: boolean;
}

export interface ErrorEventType {
  message: string;
  errorCode: number;
}

export interface ClientToServerEvents {
  createGame: (data: UsernamePayload) => void;
  joinGame: (data: JoinGamePayload) => void;
  joinRandomGame: (data: UsernamePayload) => void;
  move: (data: MovePayload) => void;
}

export interface ServerToClientEvents {
  gameJoined: (data: GameJoinedEventType) => void;
  init: (data: InitEventType) => void;
  board: (data: BoardEventType) => void;
  time: (data: TimeEventType) => void;
  win: (data: WinEventType) => void;
  error: (data: ErrorEventType) => void;
}
