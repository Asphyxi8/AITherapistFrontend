import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Navbar from "./Navbar";
import Login from "./components/Login";
import Chat from "./components/Chat";
import Tests from "./components/Tests";
import TestDetail from "./components/TestDetail";
import Conversations from "./components/Conversations";
import MyTests from "./components/MyTests";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function App() {
  return (
    <>
      <ToastContainer
        position="top-center"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
        style={{ zIndex: 9999 }}
      />
      <Router>
        <Navbar />
        <div className="App">
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/conversations" element={<Conversations />} />
            <Route path="/chat/:conversationId" element={<Chat />} />
            <Route path="/tests" element={<Tests />} />
            <Route path="/tests/:testId" element={<TestDetail />} />
            <Route path="/mytests" element={<MyTests />} />
          </Routes>
        </div>
      </Router>
    </>
  );
}

export default App;
