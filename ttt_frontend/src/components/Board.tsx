import Square, { Piece } from "./Square";

export type BoardType = Piece[];

interface BoardProps {
  active: boolean;
  board: BoardType;
  onClick: (index: number) => void;
}

const Board = ({ active, board, onClick }: BoardProps) => {
  return (
    <div className="board">
      {[0, 1, 2].map((row) => (
        <div key={row} className="row">
          {[0, 1, 2].map((col) => {
            const index = row * 3 + col;
            return (
              <Square
                active={active}
                key={index}
                index={index}
                value={board[index]}
                onClick={onClick}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
};

export default Board;
