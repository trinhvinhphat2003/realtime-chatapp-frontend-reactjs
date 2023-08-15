import { BrowserRouter, Route, Routes } from "react-router-dom"
import { v4 } from "uuid"
import ChatRoom from "./components/chat-room/ChatRoom";
import { useEffect, useState } from "react";

//var stompClient = null;

function App() {

  return (
    <BrowserRouter>
      <div className="App">
        <Routes>
          <Route path="/" element={<ChatRoom />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
