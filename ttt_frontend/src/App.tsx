import "./App.css";
import { HashRouter as Router, Routes, Route } from "react-router-dom";
import Register from "./pages/Register";
import Game from "./pages/Game";
import Result from "./pages/Result";
import NotFound from "./pages/NotFound";
import NakamaProvider from "./context/NakamaProvider";

function App() {
  return (
    <NakamaProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Register />} />
          <Route path="/game" element={<Game />} />
          <Route path="/result" element={<Result />} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </NakamaProvider>
  );
}

export default App;
