import React, { useState, useRef } from 'react';
import api from '../../services/api';
import './Home.css';

export default function Home({ onJoinSuccess }) {
  // Estado para unirse a sala
  const [joinCode, setJoinCode] = useState(['', '', '', '', '', '']);
  const [joinUsername, setJoinUsername] = useState('');

  // Estado para crear sala
  const [createRoomName, setCreateRoomName] = useState('');
  const [createUsername, setCreateUsername] = useState('');
  const [duration, setDuration] = useState('1h');

  const [errorMsg, setErrorMsg] = useState('');
  const inputRefs = useRef([]);

  // Manejo de inputs de 6 dígitos
  const handleDigitChange = (index, value) => {
    if (value.length > 1) value = value[value.length - 1];
    const newCode = [...joinCode];
    newCode[index] = value;
    setJoinCode(newCode);

    if (value && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !joinCode[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  // Petición HTTP: Unirse a sala
  const handleJoinRoom = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    const fullCode = joinCode.join('');

    try {
      const response = await api.post('/', {
        username: joinUsername,
        code: fullCode
      });
      
      onJoinSuccess({
        room: response.data.room,
        roomName: response.data.roomName,
        username: joinUsername
      });
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Error al intentar unirse');
    }
  };

  // Petición HTTP: Crear sala
  const handleCreateRoom = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    try {
      const response = await api.post('/create', {
        username: createUsername,
        roomName: createRoomName
      });

      onJoinSuccess({
        room: response.data.room,
        roomName: response.data.roomName,
        username: createUsername
      });
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Error al crear sala');
    }
  };

  return (
    <div className="home-container">
      {/* Header Top */}
      <header className="home-header">
        <div className="brand-badge">
          <span className="brand-icon">📥</span>
          <strong>FlashShare 200</strong>
        </div>
        <button className="btn-link">Cómo funciona →</button>
      </header>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="pill-badge">
          <span className="dot"></span> Una sala. Un código. Listo.
        </div>
        <h1 className="hero-title">Compartir debería<br />ser así de sencillo.</h1>
        <p className="hero-subtitle">
          Olvídate de los pasos innecesarios y comparte tus archivos con un simple código.
        </p>
      </section>

      {errorMsg && <div className="error-toast">{errorMsg}</div>}

      {/* Cards Container */}
      <div className="cards-wrapper">
        {/* Card: Unirse */}
        <div className="card-box">
          <div className="card-icon">👤</div>
          <h2>¡Únete a una sala!</h2>
          <p className="card-desc">Ingresa el código de acceso que te compartieron para comenzar a intercambiar archivos.</p>

          <form onSubmit={handleJoinRoom}>
            <label className="input-label">Código de acceso</label>
            <div className="code-inputs">
              {joinCode.map((digit, idx) => (
                <input
                  key={idx}
                  type="text"
                  maxLength={1}
                  value={digit}
                  ref={(el) => (inputRefs.current[idx] = el)}
                  onChange={(e) => handleDigitChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  className="code-box"
                />
              ))}
            </div>

            <label className="input-label">Tu nombre o apodo</label>
            <input
              type="text"
              className="text-input"
              placeholder="¿Cómo te identificarán?"
              value={joinUsername}
              onChange={(e) => setJoinUsername(e.target.value)}
            />

            <button type="submit" className="btn-primary">Unirse a la sala →</button>
          </form>
        </div>

        {/* Card: Crear */}
        <div className="card-box">
          <div className="card-icon">📁</div>
          <h2>Crea tu propia sala</h2>
          <p className="card-desc">Crea un espacio privado para compartir archivos y conversar con otras personas.</p>

          <form onSubmit={handleCreateRoom}>
            <label className="input-label">Nombre de la sala</label>
            <input
              type="text"
              className="text-input"
              placeholder="Ej. Proyecto de clase"
              value={createRoomName}
              onChange={(e) => setCreateRoomName(e.target.value)}
            />

            <label className="input-label">Tu nombre o apodo</label>
            <input
              type="text"
              className="text-input"
              placeholder="¿Cómo te identificarán?"
              value={createUsername}
              onChange={(e) => setCreateUsername(e.target.value)}
            />

            <label className="input-label">Duración de la sala</label>
            <div className="duration-selector">
              <button
                type="button"
                className={`duration-btn ${duration === '30m' ? 'active' : ''}`}
                onClick={() => setDuration('30m')}
              >
                30 min
              </button>
              <button
                type="button"
                className={`duration-btn ${duration === '1h' ? 'active' : ''}`}
                onClick={() => setDuration('1h')}
              >
                1 hora
              </button>
              <button
                type="button"
                className={`duration-btn ${duration === '2h' ? 'active' : ''}`}
                onClick={() => setDuration('2h')}
              >
                2 horas
              </button>
            </div>

            <button type="submit" className="btn-primary">Crear sala →</button>
          </form>
        </div>
      </div>

      {/* Features Bar */}
      <div className="features-header">
        <span>🕒 Compartir sin vueltas</span>
      </div>

      <div className="features-grid">
        <div className="feature-card">
          <span className="f-icon">🔒</span>
          <h3>Sin registro</h3>
          <p>Entra con un código, sin cuentas ni datos personales.</p>
        </div>
        <div className="feature-card">
          <span className="f-icon">⏱️</span>
          <h3>Se borra solo</h3>
          <p>Los mensajes y archivos desaparecen al cerrar la sala.</p>
        </div>
        <div className="feature-card">
          <span className="f-icon">💬</span>
          <h3>Chat y archivos juntos</h3>
          <p>Conversa y comparte documentos, hojas de cálculo y carpetas en un mismo lugar.</p>
        </div>
      </div>

      <footer className="home-footer">
        FlashShare 200 - Proyecto académico - 2026
      </footer>
    </div>
  );
}