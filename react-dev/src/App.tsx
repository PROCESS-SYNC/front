import { Route, Routes } from "react-router-dom";
import "./App.css";
import HOME from "./pages/home/HOME";

function App() {
  return (
    <>
      <Routes>
        <Route path="/" Component={HOME} />
      </Routes>
    </>
  );
}

export default App;
