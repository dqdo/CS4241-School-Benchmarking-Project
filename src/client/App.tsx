import "./App.css";

import {useEffect, useState} from "react";

import reactLogo from "./assets/react.svg";

function App() {
  const [test1, setTest1] = useState("");
  const [test2, setTest2] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);
  useEffect(() => {
      fetch("/loggedIn").then(res => res.json()).then(data => setLoggedIn(data.status));
      fetch("/admin/test").then(res => res.status === 200 ? res.json() : "").then(data => setTest1(data || ""));
      fetch("/test1").then(res => res.status === 200 ? res.json() : "").then(data => setTest2(data || ""));
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
        <p>Text will appear if logged in as Admin: {test1}</p>
        <p>Text will appear if you are logged in: {test2}</p>
      </div>
        <div hidden={loggedIn}>
            <a href={"http://localhost:3000/login"}>Log In</a>
        </div>
        <div hidden={!loggedIn}>
            <a href={"http://localhost:3000/logout"}>Logout</a>
        </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </div>
  );
}

export default App;
