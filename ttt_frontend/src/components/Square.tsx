import { Piece, SquareProps } from "../types/GameTypes";

const Square = ({
  active,
  playerPiece,
  index,
  value,
  onClick,
}: SquareProps) => {
  const renderValue =
    value === Piece.EMPTY ? "" : value === Piece.X ? "X" : "O";
  const colour =
    value.valueOf() === playerPiece.valueOf() ? "#99edc3" : "#fba2dd";
  return (
    <>
      <div
        className="square"
        style={{
          pointerEvents: active && renderValue === "" ? "all" : "none",
          color: colour,
        }}
        onClick={() => onClick(index)}
      >
        {renderValue}
      </div>
    </>
  );
};

export default Square;
