import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useNakama } from "../context/NakamaContext";
import { MAX_USERNAME_LENGTH } from "../Constants";

function Register() {
  const [username, setUsername] = useState("");
  const [isLoading, setLoading] = useState(false);
  const [isPopupVisible, setPopupVisible] = useState(false);
  const [displayUsernameError, setDisplayUsernameError] = useState(false);
  const maxUsernameLength = MAX_USERNAME_LENGTH;

  const navigate = useNavigate();

  const { authenticate, getDisplayName, setDisplayName } = useNakama();

  const startSession = async () => {
    setLoading(true);

    try {
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

    if (username.length > maxUsernameLength) {
      setDisplayUsernameError(true);
      return;
    }
    if (displayUsernameError) setDisplayUsernameError(false);

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
    navigate("/game");
  };

  return (
    <>
      {isLoading && (
        <div className="loader-overlay">
          <div className="loader"></div>
        </div>
      )}
      {!isPopupVisible && !isLoading && (
        <>
          <h1>Tic Tac Toe!!</h1>
          <div className="card">
            <button onClick={startSession}>Start</button>
          </div>
        </>
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
          {displayUsernameError && (
            <p className="username-error" id="username-error">
              Username cannot exceed {maxUsernameLength} characters
            </p>
          )}
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
