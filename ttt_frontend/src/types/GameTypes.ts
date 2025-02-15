export enum PlayerPiece {
  X = 1,
  O = 2,
}

export enum Piece {
  EMPTY = 0,
  X = 1,
  O = 2,
}

export interface SquareProps {
  active: boolean;
  playerPiece: PlayerPiece;
  index: number;
  value: Piece;
  onClick: (index: number) => void;
}

export type BoardType = Piece[];

export interface BoardProps {
  active: boolean;
  board: BoardType;
  playerPiece: PlayerPiece;
  onClick: (index: number) => void;
}

export interface UserPieceDict {
  [userId: string]: PlayerPiece;
}

export enum GameState {
  NO_GAME = "no_game",
  SEARCHING = "searching",
  ONGOING = "ongoing",
  ENDED = "ended",
}

export enum GameResult {
  FORFEIT = "forfeit",
  WON = "won",
  LOST = "lost",
  DRAW = "draw",
}
