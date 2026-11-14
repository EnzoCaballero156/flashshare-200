import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import Home from './pages/Home/Home';
import Room from './pages/Room/Room';
import './App.css';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import api from './services/api';

export default function App() {
  const [currentRoomData, setCurrentRoomData] = useState(null);

  const handleJoinSuccess = (data) => {
    setCurrentRoomData(data);
  };

  const handleLeaveRoom = () => {
    setCurrentRoomData(null);
  };

  const handleLoginClick = () => {
    window.location.href = "/login"
  }

  const handleRegisterClick = () => {
    window.location.href = "/register"
  }

  const handleLogoutClick = async () => {
    await api.post("/api/auth/logout");
    window.location.href = "/";
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={!currentRoomData ? (
          <Home onJoinSuccess={handleJoinSuccess} onLoginClick={handleLoginClick} onRegisterClick={handleRegisterClick} onLogoutClick={handleLogoutClick} />
        ) : (
          <Room roomData={currentRoomData} onLeave={handleLeaveRoom} onLoginClick={handleLoginClick} onRegisterClick={handleRegisterClick} onLogoutClick={handleLogoutClick}/>
        )}/>
        <Route path="/login" element={<Login onRegisterClick={handleRegisterClick}/>} />
        <Route path="/register" element={<Register onLoginClick={handleLoginClick}/>} />
      </Routes>
    </BrowserRouter>
  );
}