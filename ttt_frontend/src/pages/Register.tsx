// import "../App.css";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useNakama } from "../context/NakamaContext";

function Register() {
  const [username, setUsername] = useState("");
  const [isLoading, setLoading] = useState(false);
  const [isPopupVisible, setPopupVisible] = useState(false);

  const navigate = useNavigate();

  const { authenticate, getDisplayName, setDisplayName } = useNakama();

  const delay = async (milliseconds: number) => {
    await new Promise((resolve) => setTimeout(resolve, milliseconds));
  };

  const startSession = async () => {
    setLoading(true);

    try {
      await delay(1000);
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

    if (!username) {
      alert("Username is required");
      return;
    }

    setLoading(true);

    try {
      await setDisplayName(username);

      await navigateToGame();
    } catch (err) {
      console.error(err);
      alert("Ran into an unexpected Error.\nPlease try again in some time.");
    } finally {
      setLoading(false);
    }
  };

  const navigateToGame = async () => {
    await delay(1000);
    navigate("/game");
  };

  return (
    <>
      {!isPopupVisible && !isLoading && <h1>Tic Tac Toe!!</h1>}
      <div className="card">
        {!isPopupVisible && !isLoading && (
          <button onClick={startSession}>Start</button>
        )}
        {isLoading && (
          <div style={overlayStyles}>
            <div style={spinnerStyles}></div>
            <p>Loading...</p>
          </div>
        )}
        {isPopupVisible && !isLoading && (
          <div style={popupStyles}>
            <div style={popupContentStyles}>
              <button
                style={{
                  position: "absolute",
                  padding: 2,
                  width: 30,
                  right: 10,
                  top: 10,
                }}
                onClick={() => {
                  setPopupVisible(false);
                }}
              >
                X
              </button>
              <h3>Enter Username</h3>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
              />
              <br></br>
              <button style={{ marginTop: 20 }} onClick={handleSubmit}>
                Submit
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default Register;

const overlayStyles: React.CSSProperties = {
  // position: "absolute",
  // top: 0,
  // left: 0,
  // right: 0,
  // bottom: 0,
  // backgroundColor: "rgba(0, 0, 0, 0.5)",
  // display: "flex",
  // justifyContent: "center",
  // alignItems: "center",
  // color: "white",
  // fontSize: "24px",
};

const spinnerStyles: React.CSSProperties = {
  // border: "8px solid #f3f3f3" /* Light grey */,
  // borderTop: "8px solid #3498db" /* Blue */,
  // borderRadius: "50%",
  // width: "50px",
  // height: "50px",
  // animation: "spin 2s linear infinite",
};

const popupStyles: React.CSSProperties = {
  // position: "fixed",
  // top: "50%",
  // left: "50%",
  // transform: "translate(-50%, -50%)",
  // backgroundColor: "rgb(40, 40, 40)",
  // padding: "20px",
  // borderRadius: "8px",
  // boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
};

const popupContentStyles: React.CSSProperties = {
  // textAlign: "center",
};
