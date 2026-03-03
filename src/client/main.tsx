import "./index.css";

import React from "react";
import ReactDOM from "react-dom/client";

import App from "./App";
import NavBar from "./components/NavBar";
import Footer from "./components/Footer";
import ChatWindow from "./components/ChatWindow";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    <React.StrictMode>
        <div className={"sticky top-0 z-10"}>
            <NavBar/>
        </div>
        <App/>
        <ChatWindow />
        <Footer/>
    </React.StrictMode>,
);
