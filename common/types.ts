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

export interface MoveAckType {
  message: string;
  status: number;
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

export interface MoveEventType {
  move: string;
  id: string;
  username: string;
}

export interface RemoveEventType {
  move: string;
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
  errorCode: string | number;
}

export interface ClientToServerEvents {
  createGame: (data: UsernamePayload) => void;
  joinGame: (data: JoinGamePayload) => void;
  joinRandomGame: (data: UsernamePayload) => void;
  move: (data: MovePayload, callback: (response: MoveAckType) => void) => void;
}

export interface ServerToClientEvents {
  gameJoined: (data: GameJoinedEventType) => void;
  init: (data: InitEventType) => void;
  move: (data: MoveEventType) => void;
  remove: (data: RemoveEventType) => void;
  time: (data: TimeEventType) => void;
  win: (data: WinEventType) => void;
  error: (data: ErrorEventType) => void;
}
