import { useCallback, useEffect, useState } from "react";
import { useNakama } from "../context/NakamaContext";
import Board from "../components/Board";
import { MatchData } from "@heroiclabs/nakama-js";
import { useNavigate } from "react-router-dom";
import {
  BoardType,
  GameResult,
  GameState,
  PlayerPiece,
  UserPieceDict,
} from "../types/GameTypes";

export default function Game() {
  const [gameState, setGameState] = useState<GameState>(GameState.NO_GAME);
  const [yourName, setYourName] = useState<string>("");
  const [opponentName, setOpponentName] = useState<string>("");
  const [playerPiece, setPlayerPiece] = useState<PlayerPiece | undefined>(
    undefined
  );
  const [yourTurn, setYourTurn] = useState<boolean>(false);
  const [fast, setFast] = useState<boolean>(false);
  const [board, setBoard] = useState<BoardType>(Array(9).fill(0));
  const [isLoading, setLoading] = useState(true);
  const {
    healthcheck,
    getDisplayName,
    findMatchUsingMatchmaker,
    cancelMatchmakerTicket,
    getUserId,
    getOpponentName,
    setMatchDataCallback,
    writeRecord,
    makeMove,
  } = useNakama();
  const navigate = useNavigate();

  const joinMatch = useCallback(async () => {
    try {
      await findMatchUsingMatchmaker(fast);
      setGameState(GameState.SEARCHING);
    } catch (err) {
      console.error(err);
    }
  }, [findMatchUsingMatchmaker, fast]);

  const cancelMatchSearch = useCallback(async () => {
    if (GameState.SEARCHING !== gameState) return;
    try {
      await cancelMatchmakerTicket();
      setGameState(GameState.NO_GAME);
    } catch (err) {
      console.error(err);
      throw new Error("Error cancelling match search");
    }
  }, [cancelMatchmakerTicket, gameState]);

  useEffect(() => {
    if (gameState === GameState.SEARCHING) {
      const timer = setTimeout(async () => {
        try {
          cancelMatchSearch().then(() => {
            alert("Unable to find a match. Please try again in some time.");
          });
        } catch (err) {
          console.error(err);
        }
      }, 30000);

      return () => clearTimeout(timer);
    }
  }, [gameState, cancelMatchSearch]);

  const handleClick = async (index: number) => {
    try {
      await makeMove(index);
    } catch (err) {
      console.error("Error making move: ", err);
    }
  };

  const setPiece = useCallback(
    (data: UserPieceDict) => {
      try {
        const user_id = getUserId();
        const userPiece = data[user_id];
        setPlayerPiece(userPiece);
        if (userPiece === 1) setYourTurn(true);
      } catch (err) {
        console.error("error retrieving user_id", err);
      }
    },
    [getUserId]
  );

  const updatePlayerRecord = useCallback(
    async (result: string, fast: boolean) => {
      try {
        await writeRecord(result, fast);
      } catch (err) {
        console.error(err);
        throw new Error("Error updating player record");
      }
    },
    [writeRecord]
  );

  const displayResult = useCallback(
    async (result: GameResult) => {
      try {
        if (result !== GameResult.FORFEIT)
          await updatePlayerRecord(result, fast);
      } catch (err) {
        console.error(err);
      }

      navigate("/result", {
        state: {
          playerPiece: playerPiece,
          result: result,
        },
      });
    },
    [navigate, playerPiece, updatePlayerRecord, fast]
  );

  const fetchOpponentName = useCallback(() => {
    try {
      const name = getOpponentName();
      setOpponentName(name);
    } catch (err) {
      console.error(err);
    }
  }, [getOpponentName]);

  const handleMatchData = useCallback(
    (result: MatchData) => {
      console.debug("recieved match data: ", result);
      const json_string = new TextDecoder().decode(result.data);
      const json = json_string ? JSON.parse(json_string) : "";

      console.debug("json: ", json);

      switch (result.op_code) {
        case 1:
          setGameState(GameState.ONGOING);
          fetchOpponentName();
          setPiece(json.marks);
          break;
        case 2:
          setBoard(json.board);
          setYourTurn(!yourTurn);
          break;
        case 3:
          setBoard(json.board);
          setGameState(GameState.ENDED);
          if (json.winner) {
            if (json.winner === playerPiece) {
              displayResult(GameResult.WON);
            } else {
              displayResult(GameResult.LOST);
            }
          } else {
            displayResult(GameResult.DRAW);
          }
          break;
        case 6:
          displayResult(GameResult.FORFEIT);
          break;
        default:
          console.error("unknown op code ", result.op_code);
          break;
      }
    },
    [displayResult, fetchOpponentName, setPiece, yourTurn, playerPiece]
  );

  useEffect(() => {
    if (isLoading) {
      const checkhealth = async () => {
        try {
          await healthcheck();
          const name = await getDisplayName();
          if (!name) throw new Error("Display name undefined");
          setYourName(name);
          setLoading(false);
        } catch (err) {
          console.error(err);
          navigate("/");
        }
      };

      checkhealth();
    }
  }, [isLoading, healthcheck, navigate, getDisplayName]);

  useEffect(() => {
    if (!isLoading) {
      setMatchDataCallback(handleMatchData);

      return () => {
        setMatchDataCallback(() => {});
      };
    }
  }, [isLoading, setMatchDataCallback, handleMatchData]);

  const onFastChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.value === "true") setFast(true);
    else setFast(false);
  };

  return (
    <>
      {isLoading && (
        <div className="loader-overlay">
          <div className="loader"></div>
        </div>
      )}
      {gameState === GameState.NO_GAME && !isLoading && (
        <div className="card">
          <h3>Hey {yourName}</h3>
          <h4>Ready for a new game?</h4>
          <div className="game-options">
            <label>
              <input
                type="radio"
                value="true"
                checked={fast}
                onChange={onFastChange}
              />
              Fast
            </label>
            <label>
              <input
                type="radio"
                value="false"
                checked={!fast}
                onChange={onFastChange}
              />
              Slow
            </label>
          </div>
          <button onClick={() => joinMatch()}>Find Match</button>
        </div>
      )}
      {gameState === GameState.SEARCHING && !isLoading && (
        <div className="card">
          <h3>Finding a random player...</h3>
          <h4>Usually takes 20 seconds</h4>
          <button className="cancel-button" onClick={() => cancelMatchSearch()}>
            Cancel
          </button>
        </div>
      )}
      {(gameState === GameState.ONGOING || gameState === GameState.ENDED) &&
        !isLoading && (
          <>
            <div className="header">
              <div className="player-info">
                <h3 className="your-marker">{playerPiece === 1 ? "X" : "O"}</h3>
                <h3>{yourName}</h3>
                <h3>(you)</h3>
              </div>
              <div className="vs">
                <h3>VS</h3>
              </div>
              <div className="player-info">
                <h3 className="opponent-marker">
                  {playerPiece === 1 ? "O" : "X"}
                </h3>
                <h3>{opponentName}</h3>
                <h3>(opp)</h3>
              </div>
            </div>
            <div className="turn-info">
              <h3>{yourTurn === true ? "Your" : opponentName + "'s"} turn</h3>
            </div>
            <div className="board-container">
              <Board
                active={yourTurn}
                playerPiece={playerPiece!}
                board={board}
                onClick={handleClick}
              />
            </div>
          </>
        )}
    </>
  );
}
