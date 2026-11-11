import React, { useState } from 'react';
import Home from './pages/Home/Home';
import Room from './pages/Room/Room';
import './App.css';

export default function App() {
  const [currentRoomData, setCurrentRoomData] = useState(null);

  const handleJoinSuccess = (data) => {
    setCurrentRoomData({
      ...data,
      isHost: data.is_host ?? false
    });
  };

  const handleLeaveRoom = () => {
    setCurrentRoomData(null);
  };

  return (
    <main className="app-main">
      {!currentRoomData ? (
        <Home onJoinSuccess={handleJoinSuccess} />
      ) : (
        <Room roomData={currentRoomData} onLeave={handleLeaveRoom} />
      )}
    </main>
  );
}