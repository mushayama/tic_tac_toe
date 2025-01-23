import { useCallback, useEffect, useState } from "react";
// import "../App.css";
import { useNakama } from "../context/NakamaContext";
import Board, { BoardType } from "../components/Board";
import { MatchData } from "@heroiclabs/nakama-js";
import { useNavigate } from "react-router-dom";
import { PlayerPiece } from "../components/Square";

interface JSONObject {
  [x: string]: PlayerPiece;
}

type GameState = "no game" | "searching" | "ongoing" | "ended";

export function Game() {
  const [gameState, setGameState] = useState<GameState>("no game");
  const [yourName, setYourName] = useState<string | undefined>(undefined);
  const [opponentName, setOpponentName] = useState<string | undefined>(
    undefined
  );
  const [playerPiece, setPlayerPiece] = useState<PlayerPiece | undefined>(
    undefined
  );
  const [yourTurn, setYourTurn] = useState<boolean>(false);
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
    makeMove,
  } = useNakama();
  const navigate = useNavigate();

  const joinMatch = async () => {
    try {
      await findMatchUsingMatchmaker();
      setGameState("searching");
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (gameState === "searching") {
      const timer = setTimeout(async () => {
        try {
          await cancelMatchmakerTicket();
          setGameState("no game");
          alert("unable to find a match. try again in some time");
        } catch (err) {
          console.error(err);
        }
      }, 30000);

      return () => clearTimeout(timer);
    }
  }, [gameState, cancelMatchmakerTicket]);

  const handleClick = async (index: number) => {
    try {
      await makeMove(index);
    } catch (err) {
      console.error("Error making move: ", err);
    }
  };

  const setPiece = useCallback(
    (data: JSONObject) => {
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

  const displayResult = useCallback(
    (result: PlayerPiece | undefined) => {
      console.log(result);
      if (!result) {
        navigate("/result", { state: { result: "DRAW" } });
        return;
      }
      const winner = result === playerPiece ? yourName : opponentName;
      navigate("/result", { state: { result: winner } });
    },
    [navigate, playerPiece, yourName, opponentName]
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
      console.log("match data callback");
      console.log(result);
      const json_string = new TextDecoder().decode(result.data);
      const json = json_string ? JSON.parse(json_string) : "";

      console.log("json: ", json);

      switch (result.op_code) {
        case 1:
          setGameState("ongoing");
          fetchOpponentName();
          setPiece(json.marks);
          break;
        case 2:
          setBoard(json.board);
          setYourTurn(!yourTurn);
          break;
        case 3:
          setBoard(json.board);
          setGameState("ended");
          displayResult(json.winner);
          break;
        case 6:
          console.log("opponent left the game");
          displayResult(playerPiece);
          break;
        default:
          console.log("unknown op code ", result.op_code);
          break;
      }
    },
    [displayResult, fetchOpponentName, setPiece, yourTurn, playerPiece]
  );

  useEffect(() => {
    if (isLoading) {
      console.log("Healthcheck");
      const checkhealth = async () => {
        try {
          await healthcheck();
          const name = await getDisplayName();
          setLoading(false);
          setYourName(name);
        } catch (err) {
          console.error(err);
          navigate("/");
        }
      };

      checkhealth();
    } else {
      console.log("attaching match data callback");
      setMatchDataCallback(handleMatchData);

      return () => {
        setMatchDataCallback(() => {});
      };
    }
  }, [
    isLoading,
    healthcheck,
    navigate,
    getDisplayName,
    setMatchDataCallback,
    handleMatchData,
  ]);

  return (
    <>
      {isLoading && (
        <div>
          <div></div>
          <p>Loading...</p>
        </div>
      )}
      {gameState === "no game" && !isLoading && (
        <div id="find" className="card">
          <h3>Hey {yourName}</h3>
          <button onClick={() => joinMatch()}>"Find match"</button>
        </div>
      )}
      {gameState === "searching" && !isLoading && (
        <div id="find" className="card">
          <h3>searching for a match.....</h3>
        </div>
      )}
      {(gameState === "ongoing" || gameState === "ended") && !isLoading && (
        <div>
          <h3>
            Your Name; {yourName} {playerPiece == 1 ? "X" : "O"}
          </h3>
          <h3>
            Your Opponent; {opponentName} {playerPiece == 2 ? "X" : "O"}
          </h3>
          <h3>{yourTurn === true ? "Your" : "Opponent's"} turn</h3>
          <div id="board" className="card">
            <Board active={yourTurn} board={board} onClick={handleClick} />
          </div>
        </div>
      )}
    </>
  );
}
