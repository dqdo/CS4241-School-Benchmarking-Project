import "./App.css";

import {useEffect, useState} from "react";

import reactLogo from "./assets/react.svg";

function App() {
  const [test1, setTest1] = useState("");
  const [test2, setTest2] = useState("");
  useEffect(() => {
      fetch("/test").then(res => res.json()).then(data => {setTest1(data.Test1); setTest2(data.Test2);});
  }, [])

  return (
    <div className="App">
      <div>
        <a href="https://vitejs.dev" target="_blank">
          <img src="/vite.svg" className="logo" alt="Vite logo" />
        </a>
        <a href="https://reactjs.org" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <p>Test1 From Database: {test1}</p>
        <p>Test2 From Database: {test2}</p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </div>
  );
}

export default App;
