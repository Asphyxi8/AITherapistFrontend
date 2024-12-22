import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Login from './components/Login';
import Chat from './components/Chat';
import Conversations from './components/Conversations';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/conversations" element={<Conversations />} />
          <Route path="/chat/:conversationId" element={<Chat />} />
          {/* <Route path="/combined" element={<ChatInterface />} /> */}
        </Routes>
      </div>
    </Router>
  );
}

export default App;
