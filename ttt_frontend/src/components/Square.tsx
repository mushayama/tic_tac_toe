export type PlayerPiece = 1 | 2;

export type Piece = 1 | 2 | 0;

interface SquareProps {
  active: boolean;
  index: number;
  value: Piece;
  onClick: (index: number) => void;
}

const Square = ({ active, index, value, onClick }: SquareProps) => {
  return (
    <>
      <button
        style={{ pointerEvents: active ? "all" : "all" }}
        className="square"
        onClick={() => onClick(index)}
      >
        {value == 0 ? "" : value == 1 ? "X" : "O"}
      </button>
    </>
  );
};

export default Square;
