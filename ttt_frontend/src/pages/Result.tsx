import reactLogo from "../assets/react.svg";
import viteLogo from "/vite.svg";
import "../App.css";
import { useLocation } from "react-router-dom";

export function Result() {
  const location = useLocation();
  // const playerName = location.state.name;
  // const opponentName = location.state.oppName;
  const winner = location.state.result;
  console.log(winner);

  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      {/* <h1>
        {playerName} vs {opponentName}
      </h1> */}
      <div className="card">
        <button>winner is {winner}</button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  );
}
