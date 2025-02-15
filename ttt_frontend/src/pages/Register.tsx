import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useNakama } from "../context/NakamaContext";

function Register() {
  const [username, setUsername] = useState("");
  const [isLoading, setLoading] = useState(false);
  const [isPopupVisible, setPopupVisible] = useState(false);

  const navigate = useNavigate();

  const { authenticate, getDisplayName, setDisplayName } = useNakama();

  const delay = async (milliseconds: number = 1000) => {
    await new Promise((resolve) => setTimeout(resolve, milliseconds));
  };

  const startSession = async () => {
    setLoading(true);

    try {
      await delay();
      await authenticate();

      const displayName = await getDisplayName();
      if (displayName) {
        await navigateToGame();
      } else {
        setPopupVisible(true);
      }
    } catch (err) {
      console.error(err);
      alert("Ran into an unexpected Error.\nPlease try again in some time.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    setLoading(true);

    try {
      await setDisplayName(username);
      await navigateToGame();
    } catch (err) {
      console.error(err);
      alert("Ran into an unexpected Error.\nPlease try again in some time.");
      setLoading(false);
    }
  };

  const navigateToGame = async () => {
    await delay();
    navigate("/game");
  };

  return (
    <>
      {!isPopupVisible && !isLoading && (
        <>
          <h1>Tic Tac Toe!!</h1>
          <div className="card">
            <button onClick={startSession}>Start</button>
          </div>
        </>
      )}
      {isLoading && (
        <div className="loader-overlay">
          <div className="loader"></div>
        </div>
      )}
      {isPopupVisible && !isLoading && (
        <div className="card popup">
          <button
            className="close-button"
            onClick={() => {
              setPopupVisible(false);
            }}
          >
            X
          </button>
          <h3>Enter Username</h3>
          <input
            className="username-input"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
          />
          <button
            className="submit-button"
            id="submit-username"
            disabled={username === ""}
            onClick={handleSubmit}
          >
            Submit
          </button>
        </div>
      )}
    </>
  );
}

export default Register;
