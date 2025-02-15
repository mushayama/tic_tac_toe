import { BoardProps } from "../types/GameTypes";
import Square from "./Square";

const Board = ({ active, playerPiece, board, onClick }: BoardProps) => {
  return (
    <div className="board">
      {board.map((val, idx) => (
        <Square
          active={active}
          playerPiece={playerPiece}
          key={idx}
          index={idx}
          value={val}
          onClick={onClick}
        />
      ))}
    </div>
  );
};

export default Board;
