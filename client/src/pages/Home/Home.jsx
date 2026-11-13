import React, { useState, useRef } from 'react';
import api from '../../services/api';
import './Home.css';

export default function Home({ onJoinSuccess, onLoginClick, onRegisterClick }) {
  // Estado para unirse a sala
  const [joinCode, setJoinCode] = useState(['', '', '', '', '', '']);
  const [joinUsername, setJoinUsername] = useState('');

  // Estado para crear sala
  const [createRoomName, setCreateRoomName] = useState('');
  const [createUsername, setCreateUsername] = useState('');
  // const [duration, setDuration] = useState('1h');

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

  const handlePaste = (e) => {
    e.preventDefault();

    const pastedDigits = e.clipboardData
      .getData('text')
      .replace(/\D/g, '')
      .slice(0, 6);

    if (!pastedDigits) return;

    const newCode = [...joinCode];
    for (let i = 0; i < pastedDigits.length; i++) {
      newCode[i] = pastedDigits[i];
    }
    setJoinCode(newCode);

    const nextIndex = Math.min(pastedDigits.length, 5);
    inputRefs.current[nextIndex]?.focus();
  };

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
        username: joinUsername,
        isHost: response.data.isHost,
        host: response.data.host,
        members: response.data.members,
        expiresAt: response.data.expiresAt
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
        username: createUsername,
        isHost: response.data.isHost,
        host: response.data.host,
        members: response.data.members,
        expiresAt: response.data.expiresAt
      });
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Error al crear sala');
    }
  };

  return (
    <div className="home-page">
      <header className="home-header">
        <strong className="brand-name">FlashShare 200</strong>
        <div className="header-actions">
          <button type="button" className="btn-outline" onClick={onLoginClick}>
            Iniciar sesión
          </button>
          <button type="button" className="btn-outline" onClick={onRegisterClick}>
            Crear cuenta
          </button>
        </div>
      </header>

      <div className="home-container">
        <section className="hero-section">
          <h1 className="hero-title">
            Compartir debería ser<br />así de sencillo.
          </h1>
          <p className="hero-subtitle">
            Olvídate de los pasos innecesarios y comparte tus archivos con un simple código.
          </p>
        </section>

        {errorMsg && <div className="error-toast">{errorMsg}</div>}

        <div className="cards-wrapper">
          <div className="card-box">
            <h2>Crea tu propia sala</h2>
            <p className="card-desc">
              Crea un espacio privado para compartir archivos y conversar con otras personas.
            </p>

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

              {/* <label className="input-label">Duración de la sala</label>
              <div className="duration-selector">
                {[
                  { value: '30m', label: '30 min' },
                  { value: '1h', label: '1 hora' },
                  { value: '2h', label: '2 horas' }
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    className={`duration-btn ${duration === opt.value ? 'active' : ''}`}
                    onClick={() => setDuration(opt.value)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div> */}

              <button type="submit" className="btn-primary">Crear sala</button>
            </form>
          </div>

          {/* Card: Unirse */}
          <div className="card-box">
            <h2>¡Únete a una sala!</h2>
            <p className="card-desc">
              Ingresa el código de acceso que te compartieron para comenzar a intercambiar archivos.
            </p>

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
                    onPaste={handlePaste}
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

              <button type="submit" className="btn-primary">Unirse a sala</button>
            </form>
          </div>
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
          FlashShare 200 | 2026
        </footer>
      </div>
    </div>
  );
}