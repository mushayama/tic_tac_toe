import { HOME_COLOR, OPPONENT_COLOR, PIECE_O, PIECE_X } from "../Constants";
import { Piece, SquareProps } from "../types/GameTypes";

const Square = ({
  active,
  playerPiece,
  index,
  value,
  onClick,
}: SquareProps) => {
  const renderValue =
    value === Piece.EMPTY ? "" : value === Piece.X ? PIECE_X : PIECE_O;
  const colour =
    value.valueOf() === playerPiece.valueOf() ? HOME_COLOR : OPPONENT_COLOR;
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
