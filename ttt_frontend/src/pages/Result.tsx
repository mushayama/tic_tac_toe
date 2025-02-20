import { useCallback, useEffect, useState } from "react";
import "../App.css";
import { useLocation, useNavigate } from "react-router-dom";
import { useNakama } from "../context/NakamaContext";
import { GameResult, PlayerPiece } from "../types/GameTypes";
import LeaderboardData from "../types/RecordInterface";
import {
  HOME_COLOR,
  LEADERBOARD_LOAD_DELAY,
  NEUTRAL_COLOR,
  OPPONENT_COLOR,
} from "../Constants";

export default function Result() {
  const [isLoading, setLoading] = useState<boolean>(true);
  const [yourName, setYourName] = useState<string>("");
  const [opponentName, setOpponentName] = useState<string>("");
  const [result, setResult] = useState<string>("");
  const [resultColor, setResultColor] = useState<string>(NEUTRAL_COLOR);
  const [yourPiece, setYourPiece] = useState<PlayerPiece | undefined>(
    undefined
  );
  const [winnerPiece, setWinnerPiece] = useState<PlayerPiece | undefined>(
    undefined
  );
  const [message, setMessage] = useState<string>("");
  const [leaderboardData, setLeaderboardData] =
    useState<LeaderboardData | null>(null);
  const { healthcheck, getDisplayName, getOpponentName, getRecords } =
    useNakama();
  const navigate = useNavigate();
  const location = useLocation();

  const findNewMatch = () => {
    navigate("/game");
  };

  const delay = async (milliseconds: number = LEADERBOARD_LOAD_DELAY) => {
    await new Promise((resolve) => setTimeout(resolve, milliseconds));
  };

  const fetchLeaderboardData = useCallback(async () => {
    try {
      await delay();
      const response: LeaderboardData = await getRecords();
      setLeaderboardData(response);
    } catch (err) {
      console.error(err);
      throw new Error("Error fetching leaderboard data");
    }
  }, [getRecords]);

  const setResultString = useCallback(() => {
    let resultString = "";
    let messageString = "";
    if (location.state.result === GameResult.DRAW) {
      resultString = "DRAW!";
      messageString = "So close! Keep trying!";
    } else if (location.state.result === GameResult.FORFEIT) {
      resultString = "FORFEIT!";
      messageString = "Opponent left the match";
    } else if (location.state.result === GameResult.WON) {
      resultString = "WINNER!";
      messageString = "Well done! Keep it up!";
      setResultColor(HOME_COLOR);
      setWinnerPiece(location.state.playerPiece);
    } else {
      resultString = "WINNER!";
      messageString = "Better luck next time!";
      setResultColor(OPPONENT_COLOR);
      if (location.state.playerPiece === PlayerPiece.X)
        setWinnerPiece(PlayerPiece.O);
      else setWinnerPiece(PlayerPiece.X);
    }
    setResult(resultString);
    setMessage(messageString);
  }, [location]);

  useEffect(() => {
    if (opponentName !== "" && yourName !== "") setResultString();
  }, [opponentName, yourName, setResultString]);

  useEffect(() => {
    if (isLoading) {
      const checkhealth = async () => {
        try {
          if (!location || !location.state || !location.state.result)
            throw new Error("result state missing");
          if (!location.state.playerPiece)
            throw new Error("playerPiece state missing");

          await healthcheck();

          const name = await getDisplayName();
          if (!name) throw new Error("Display name undefined");
          const oppName = getOpponentName();
          if (!oppName) throw new Error("Opponent name undefined");

          if (location.state.result !== GameResult.FORFEIT)
            await fetchLeaderboardData();

          setYourPiece(location.state.playerPiece);
          setYourName(name);
          setOpponentName(oppName);
          setLoading(false);
        } catch (err) {
          console.error(err);
          navigate("/");
        }
      };

      checkhealth();
    }
  }, [
    isLoading,
    location,
    healthcheck,
    navigate,
    getDisplayName,
    getOpponentName,
    fetchLeaderboardData,
  ]);

  return (
    <>
      {isLoading && (
        <div className="loader-overlay">
          <div className="loader"></div>
        </div>
      )}
      {!isLoading && (
        <>
          <div className="headline">
            <div className="winning-pieces">
              <h1
                id="X"
                hidden={
                  !(
                    result === "DRAW!" ||
                    (result === "WINNER!" && winnerPiece === PlayerPiece.X)
                  )
                }
                style={{
                  color:
                    yourPiece === PlayerPiece.X ? HOME_COLOR : OPPONENT_COLOR,
                }}
              >
                X
              </h1>
              <h1
                id="O"
                hidden={
                  !(
                    result === "DRAW!" ||
                    (result === "WINNER!" && winnerPiece === PlayerPiece.O)
                  )
                }
                style={{
                  color:
                    yourPiece === PlayerPiece.O ? HOME_COLOR : OPPONENT_COLOR,
                }}
              >
                O
              </h1>
            </div>
            <h3 style={{ color: resultColor }}>{result}</h3>
            <p>{message}</p>
          </div>
          {leaderboardData && (
            <div className="leaderboard">
              <h3>Leaderboard</h3>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th className="name-cell">Name</th>
                      <th>W/L/D</th>
                      <th>Fast/Slow</th>
                      <th>Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboardData.leaderboardData.map((record) => (
                      <tr key={record.rank}>
                        <td className="name-cell">
                          {record.rank.toString() + ". " + record.userId}
                        </td>
                        <td>
                          <span className="won">{record.metadata.won}</span>/
                          <span className="lost">{record.metadata.lost}</span>/
                          <span className="draw">{record.metadata.draw}</span>
                        </td>
                        <td>
                          {record.metadata.fast}/{record.metadata.slow}
                        </td>
                        <td>{record.score}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          <div>
            <button onClick={() => findNewMatch()}>Find New Match</button>
          </div>
        </>
      )}
    </>
  );
}
