import React, { useState, useEffect, useRef } from 'react';
import { socket } from '../../services/socket';
import api from '../../services/api';
import './Room.css';

export default function Room({ roomData, onLeave }) {
  const { room, roomName, username, isHost, host } = roomData;

  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [activeTab, setActiveTab] = useState('files');
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [roomMembers, setRoomMembers] = useState([username]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [copied, setCopied] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('todos');
  const [timeLeft, setTimeLeft] = useState(3600);

  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Temporizador regresivo
  useEffect(() => {
    const timer = setInterval(() => { setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));}, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    socket.connect();

    socket.on('connect', () => {
      socket.emit('join_room', { room, username });
      fetchRoomFiles();
    });

    socket.on('message', (data) => {
      setMessages((prev) => [...prev, data]);

      if (data.files && data.files.length > 0) {
        setUploadedFiles((prev) => {
          const newFiles = data.files.filter(
            (nf) => !prev.some((pf) => pf.url === nf.url)
          );
          return [...prev, ...newFiles];
        });
      }

      if (data.message && data.message.includes('entró a la sala.')) {
        setRoomMembers((prev) => Array.from(new Set([...prev, data.username])));
      } else if (data.message && data.message.includes('se retiró de la sala.')) {
        setRoomMembers((prev) => prev.filter((m) => m !== data.username));
      }
    });

    return () => {
      socket.off('message');
      socket.disconnect();
    };
  }, [room, username]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchRoomFiles = async () => {
    try {
      const res = await api.get(`/room/files/${room}`);
      if (res.data.files) {
        setUploadedFiles(res.data.files);
      }
    } catch (err) {
      console.error('Error cargando archivos', err);
    }
  };

  const copyRoomCode = () => {
    navigator.clipboard.writeText(room);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputMessage.trim() && !selectedFile) return;

    if (selectedFile) {
      const reader = new FileReader();
      reader.onload = () => {
        const fileBuffer = reader.result;
        socket.emit('message', {
          room: room,
          username: username,
          data: inputMessage,
          files: [
            {
              name: selectedFile.name,
              data: fileBuffer
            }
          ]
        });
        setSelectedFile(null);
        setInputMessage('');
      };
      reader.readAsArrayBuffer(selectedFile);
    } else {
      socket.emit('message', {
        room: room,
        username: username,
        data: inputMessage,
        files: []
      });
      setInputMessage('');
    }
  };

  const filteredFiles = uploadedFiles.filter((file) => {
    const matchesSearch = file.name.toLowerCase().includes(searchQuery.toLowerCase());
    if (selectedFilter === 'todos') return matchesSearch;
    if (selectedFilter === 'pdf') return matchesSearch && file.type === 'pdf';
    if (selectedFilter === 'word') return matchesSearch && (file.type === 'doc' || file.type === 'docx');
    if (selectedFilter === 'excel') return matchesSearch && (file.type === 'xls' || file.type === 'xlsx' || file.type === 'csv');
    if (selectedFilter === 'imágenes') return matchesSearch && ['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(file.type);
    return matchesSearch;
  });

  return (
    <div className="room-layout">
      <header className="room-header">
        <div className="header-left">
          <button className="btn-icon" onClick={onLeave}>←</button>
          <div>
            <h2 className="room-title">{roomName}</h2>
            <span className="room-subtitle">En la sala como <strong>{username}</strong> ({(username === host || isHost) ? 'Anfitrión' : 'Miembro'})</span>
          </div>
        </div>

        <div className="header-center">
          <div className="code-display">
            <span className="room-code-text">{room}</span>
            <button className="btn-copy" onClick={copyRoomCode} title="Copiar código">
              {copied ? '✅' : '📋'}
            </button>
          </div>
          <div className="timer-badge">
            ⏱️ {formatTime(timeLeft)}
          </div>
        </div>

        <div className="header-right">
          <div className="members-badge">
            <span className="avatar-mini">{username.substring(0, 2).toUpperCase()}</span>
            <span>{roomMembers.length}</span>
          </div>
          <button className="btn-danger" onClick={onLeave}>❌ Cerrar y borrar</button>
        </div>
      </header>

      <div className="info-banner">
        🔒 Los mensajes y archivos se eliminarán al cerrar la sala o cuando termine el tiempo.
      </div>

      <div className="workspace-grid">
        <div className="chat-panel">
          <div className="messages-container">
            <div className="system-notice">Sala iniciada correctamente</div>

            {messages.map((msg, index) => {
              const isMe = msg.username === username;
              const isSystem = !msg.username || msg.message.includes('entró') || msg.message.includes('retiró');

              if (isSystem) {
                return (
                  <div key={index} className="system-notice">
                    {msg.username} {msg.message}
                  </div>
                );
              }

              return (
                <div key={index} className={`message-row ${isMe ? 'me' : 'other'}`}>
                  <div className="message-wrapper">
                    <span className="message-meta">{isMe ? 'Tú' : msg.username}</span>
                    <div className="message-bubble">
                      {msg.message}
                      {msg.files && msg.files.map((f, i) => (
                        <div key={i} className="file-attachment">
                          📎 <a href={`http://127.0.0.1:5000${f.url}`} target="_blank" rel="noreferrer">{f.name}</a>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="avatar-circle">
                    {msg.username ? msg.username.substring(0, 2).toUpperCase() : 'U'}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          <form className="chat-input-area" onSubmit={handleSendMessage}>
            <button type="button" className="btn-icon" onClick={() => fileInputRef.current.click()}>
              📎
            </button>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }}/>
            <div className="input-wrapper">
              {selectedFile && (
                <span className="selected-file-tag">
                  {selectedFile.name}
                  <button type="button" onClick={() => setSelectedFile(null)}>×</button>
                </span>
              )}
              <input type="text" placeholder="Escribe un mensaje" value={inputMessage} onChange={(e) => setInputMessage(e.target.value)} />
            </div>

            <button type="submit" className="btn-send">🚀</button>
          </form>
        </div>

        <div className="sidebar-panel">
          <div className="sidebar-tabs">
            <button className={`tab-btn ${activeTab === 'files' ? 'active' : ''}`} onClick={() => setActiveTab('files')}>
              📁 Archivos {uploadedFiles.length}
            </button>
            <button className={`tab-btn ${activeTab === 'people' ? 'active' : ''}`}onClick={() => setActiveTab('people')}>
              👥 Personas {roomMembers.length}
            </button>
          </div>

          {activeTab === 'files' && (
            <div className="tab-content">
              <div className="search-bar">
                🔍 
                <input type="text" placeholder="Buscar archivos..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}/>
              </div>

              <div className="file-filters">
                <button type="button" className={`filter-tag ${selectedFilter === 'todos' ? 'active' : ''}`} onClick={() => setSelectedFilter('todos')}>Todos</button>
                <button type="button" className={`filter-tag ${selectedFilter === 'pdf' ? 'active' : ''}`} onClick={() => setSelectedFilter('pdf')}>PDF</button>
                <button type="button" className={`filter-tag ${selectedFilter === 'word' ? 'active' : ''}`} onClick={() => setSelectedFilter('word')}>Word</button>
                <button type="button" className={`filter-tag ${selectedFilter === 'excel' ? 'active' : ''}`} onClick={() => setSelectedFilter('excel')}>Excel</button>
                <button type="button" className={`filter-tag ${selectedFilter === 'imágenes' ? 'active' : ''}`} onClick={() => setSelectedFilter('imágenes')}>Imágenes</button>
              </div>

              {filteredFiles.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">📁</div>
                  <p>No se encontraron archivos.</p>
                </div>
              ) : (
                <div className="file-list" style={{ overflowY: 'auto', flex: 1 }}>
                  {filteredFiles.map((f, i) => (
                    <div key={i} className="file-item" style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', background: 'rgba(255,255,255,0.03)', marginBottom: '6px', borderRadius: '6px', alignItems: 'center' }}>
                      <div className="file-info" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        <span className="file-name" style={{ fontSize: '0.85rem' }}>{f.name}</span>
                      </div>
                      <a href={`http://127.0.0.1:5000${f.url}`} download className="btn-download"
                        style={{ textDecoration: 'none', padding: '4px 8px' }}
                      >
                        ⬇️
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'people' && (
            <div className="tab-content">
              <div className="people-list">
                {roomMembers.map((member, idx) => {
                  // Comparamos si el miembro de la lista es exactamente el creador (host)
                  const isThisUserHost = member === host;
                  return (
                    <div key={idx} className="person-item">
                      <div className="person-avatar">
                        {member.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="person-details">
                        <span className="person-name">{member}</span>
                        <span className="person-role">
                          {isThisUserHost ? 'Anfitrión' : 'Miembro'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}