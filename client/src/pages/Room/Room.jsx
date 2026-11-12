import React, { useState, useEffect, useRef } from 'react';
import { socket } from '../../services/socket';
import api from '../../services/api';
import './Room.css';

const API_URL = 'http://127.0.0.1:5000';

/* ---------- Helpers de archivos ---------- */
const getExt = (f) => {
  if (f.name && f.name.includes('.')) return f.name.split('.').pop().toLowerCase();
  return f.type ? String(f.type).toLowerCase() : '';
};

const getGroup = (ext) => {
  if (['doc', 'docx'].includes(ext)) return 'word';
  if (['xls', 'xlsx', 'csv'].includes(ext)) return 'excel';
  if (ext === 'pdf') return 'pdf';
  if (['ppt', 'pptx'].includes(ext)) return 'ppt';
  if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext)) return 'img';
  return 'other';
};

const GROUP_LABEL = {
  word: 'WORD', excel: 'EXCEL', pdf: 'PDF', ppt: 'PPT', img: 'IMAGEN', other: 'ARCHIVO'
};

const FILTERS = [
  { id: 'todos', label: 'Todos' },
  { id: 'pdf', label: 'PDF' },
  { id: 'word', label: 'Word' },
  { id: 'excel', label: 'Excel' },
  { id: 'ppt', label: 'PPT' },
  { id: 'img', label: 'Imágenes' }
];

const formatSize = (size) => {
  if (size === undefined || size === null || size === '') return '';
  if (typeof size !== 'number') return String(size);
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

const nowTime = () =>
  new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });

/* ---------- Iconos ---------- */
const Svg = ({ children, size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
);

const IconClip = () => (
  <Svg size={22}>
    <path d="M21.4 11.1l-9.2 9.2a6 6 0 01-8.5-8.5l9.2-9.2a4 4 0 115.7 5.7l-9.2 9.2a2 2 0 01-2.8-2.8l8.5-8.5" />
  </Svg>
);
const IconSend = () => (
  <Svg><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" /></Svg>
);
const IconEye = () => (
  <Svg><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" /><circle cx="12" cy="12" r="3" /></Svg>
);
const IconEyeOff = () => (
  <Svg>
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" />
    <circle cx="12" cy="12" r="3" />
    <path d="M3 3l18 18" />
  </Svg>
);
const IconDownload = () => (
  <Svg><path d="M12 3v12m0 0l-4-4m4 4l4-4M4 21h16" /></Svg>
);
const IconCopy = () => (
  <Svg>
    <rect x="9" y="9" width="13" height="13" rx="2" />
    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
  </Svg>
);
const IconCheck = () => (
  <Svg><path d="M20 6L9 17l-5-5" /></Svg>
);

function FileBadge({ file, big }) {
  const ext = getExt(file);
  return (
    <div className={`file-badge t-${getGroup(ext)} ${big ? 'big' : ''}`}>
      {(ext || 'file').slice(0, 4).toUpperCase()}
    </div>
  );
}

/* ---------- Componente ---------- */
export default function Room({ roomData, onLeave, onLoginClick, onRegisterClick }) {
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

  const [showSidebar, setShowSidebar] = useState(true);
  const [showCode, setShowCode] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);

  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Temporizador regresivo
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
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
      const time = data.time || nowTime();
      setMessages((prev) => [...prev, { ...data, time }]);

      if (data.files && data.files.length > 0) {
        setUploadedFiles((prev) => {
          const newFiles = data.files
            .filter((nf) => !prev.some((pf) => pf.url === nf.url))
            .map((nf) => ({
              ...nf,
              username: nf.username || data.username,
              time: nf.time || time
            }));
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

  // Cerrar el aviso con Escape
  useEffect(() => {
    if (!showCloseModal) return;
    const onKey = (e) => {
      if (e.key === 'Escape') setShowCloseModal(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showCloseModal]);

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

  const openPeople = () => {
    setActiveTab('people');
    setShowSidebar(true);
  };

  const filteredFiles = uploadedFiles.filter((file) => {
    const matchesSearch = (file.name || '').toLowerCase().includes(searchQuery.toLowerCase());
    if (selectedFilter === 'todos') return matchesSearch;
    return matchesSearch && getGroup(getExt(file)) === selectedFilter;
  });

  const maskedCode = '•'.repeat(String(room).length);

  return (
    <div className="room-page">
      {/* Header global */}
      <header className="room-topbar">
        <strong className="brand-name">FlashShare 200</strong>
        <div className="topbar-actions">
          <button type="button" className="btn-outline" onClick={onLoginClick}>Iniciar sesión</button>
          <button type="button" className="btn-outline" onClick={onRegisterClick}>Crear cuenta</button>
        </div>
      </header>

      <main className="room-shell">
        <section className="room-card">
          {/* Barra de la sala */}
          <div className="room-bar">
            <div className="room-id">
              <h2 className="room-title">{roomName}</h2>
              <span className="room-subtitle">
                Como <strong>{username}</strong> ({(username === host || isHost) ? 'Anfitrión' : 'Miembro'})
              </span>
            </div>

            <div className="code-group">
              <span className="code-label">CÓDIGO</span>
              <div className="code-field">
                <span className="code-value">{showCode ? room : maskedCode}</span>
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() => setShowCode((v) => !v)}
                  title={showCode ? 'Ocultar código' : 'Mostrar código'}
                  aria-label={showCode ? 'Ocultar código' : 'Mostrar código'}
                >
                  {showCode ? <IconEyeOff /> : <IconEye />}
                </button>
              </div>
              <button type="button" className="icon-btn boxed" onClick={copyRoomCode} title="Copiar código" aria-label="Copiar código">
                {copied ? <IconCheck /> : <IconCopy />}
              </button>
            </div>

            <div className="bar-info">
              <span className="timer-text">Tiempo restante {formatTime(timeLeft)}</span>
              <button type="button" className="members-badge" onClick={openPeople} title="Ver personas">
                <span className="avatar-mini">{username.substring(0, 2).toUpperCase()}</span>
                <span>{roomMembers.length}</span>
              </button>
            </div>

            <div className="bar-actions">
              <button
                type="button"
                className={`btn-bar ${showSidebar ? 'active' : ''}`}
                onClick={() => setShowSidebar((v) => !v)}
                aria-expanded={showSidebar}
              >
                Archivos
              </button>
              <button type="button" className="btn-bar danger" onClick={() => setShowCloseModal(true)}>
                Cerrar chat
              </button>
            </div>
          </div>

          {/* Chat + panel lateral */}
          <div className={`workspace-grid ${showSidebar ? 'open' : 'closed'}`}>
            <div className="chat-panel">
              <div className="messages-container">
                <div className="system-notice">
                  🔒 Los mensajes y archivos se eliminarán al cerrar la sala o cuando termine el tiempo.
                </div>

                {messages.map((msg, index) => {
                  const text = msg.message || '';
                  const isMe = msg.username === username;
                  const isSystem = !msg.username || text.includes('entró') || text.includes('retiró');

                  if (isSystem) {
                    return (
                      <div key={index} className="system-notice">
                        {msg.username} {text}
                      </div>
                    );
                  }

                  return (
                    <div key={index} className={`message-row ${isMe ? 'me' : 'other'}`}>
                      <div className="message-bubble">
                        <span className="message-meta">{isMe ? 'Tú' : msg.username}</span>

                        {text && <p className="message-text">{text}</p>}

                        {msg.files && msg.files.map((f, i) => (
                          <div key={i} className="file-card">
                            <a
                              href={`${API_URL}${f.url}`}
                              download
                              className="file-card-download"
                              title="Descargar"
                              aria-label={`Descargar ${f.name}`}
                            >
                              <IconDownload />
                            </a>
                            <FileBadge file={f} big />
                            <span className="file-card-name">
                              {f.name}{f.size ? ` · ${formatSize(f.size)}` : ''}
                            </span>
                          </div>
                        ))}

                        <span className="message-time">{msg.time}</span>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              <form className="chat-input-area" onSubmit={handleSendMessage}>
                <button type="button" className="icon-btn" onClick={() => fileInputRef.current.click()} title="Adjuntar archivo">
                  <IconClip />
                </button>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} />

                <div className="input-wrapper">
                  {selectedFile && (
                    <span className="selected-file-tag">
                      <span className="tag-name">{selectedFile.name}</span>
                      <button type="button" onClick={() => setSelectedFile(null)} aria-label="Quitar archivo">×</button>
                    </span>
                  )}
                  <input
                    type="text"
                    placeholder="Escribe un mensaje"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                  />
                </div>

                <button type="submit" className="btn-send" aria-label="Enviar">
                  <IconSend />
                </button>
              </form>
            </div>

            {/* Panel lateral */}
            <aside className="sidebar-panel" aria-hidden={!showSidebar}>
              <div className="sidebar-inner">
                <div className="sidebar-tabs">
                  <button
                    type="button"
                    className={`tab-btn ${activeTab === 'files' ? 'active' : ''}`}
                    onClick={() => setActiveTab('files')}
                  >
                    Archivos ({uploadedFiles.length})
                  </button>
                  <button
                    type="button"
                    className={`tab-btn ${activeTab === 'people' ? 'active' : ''}`}
                    onClick={() => setActiveTab('people')}
                  >
                    Personas ({roomMembers.length})
                  </button>
                </div>

                {activeTab === 'files' && (
                  <div className="tab-content">
                    <div className="search-bar">
                      🔍
                      <input
                        type="text"
                        placeholder="Buscar archivos..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>

                    <span className="filter-title">FILTRAR POR:</span>
                    <div className="file-filters">
                      {FILTERS.map((flt) => (
                        <button
                          key={flt.id}
                          type="button"
                          className={`filter-tag ${selectedFilter === flt.id ? 'active' : ''}`}
                          onClick={() => setSelectedFilter(flt.id)}
                        >
                          {flt.label}
                        </button>
                      ))}
                    </div>

                    {filteredFiles.length === 0 ? (
                      <div className="empty-state">
                        <div className="empty-icon">📁</div>
                        <p>No se encontraron archivos.</p>
                      </div>
                    ) : (
                      <div className="file-list">
                        {filteredFiles.map((f, i) => {
                          const meta = [formatSize(f.size), f.username, f.time].filter(Boolean).join(' - ');
                          return (
                            <div key={i} className="file-item">
                              <FileBadge file={f} />
                              <div className="file-info">
                                <span className="file-type">{GROUP_LABEL[getGroup(getExt(f))]}</span>
                                <span className="file-name" title={f.name}>{f.name}</span>
                                {meta && <span className="file-meta">{meta}</span>}
                              </div>
                              <a
                                href={`${API_URL}${f.url}`}
                                download
                                className="btn-download"
                                title="Descargar"
                                aria-label={`Descargar ${f.name}`}
                              >
                                <IconDownload />
                              </a>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'people' && (
                  <div className="tab-content">
                    <div className="people-list">
                      {roomMembers.map((member, idx) => {
                        const isThisUserHost = member === host;
                        return (
                          <div key={idx} className="person-item">
                            <div className="person-avatar">{member.substring(0, 2).toUpperCase()}</div>
                            <div className="person-details">
                              <span className="person-name">{member}</span>
                              <span className="person-role">{isThisUserHost ? 'Anfitrión' : 'Miembro'}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </aside>
          </div>
        </section>
      </main>

      {/* Aviso de cierre */}
      {showCloseModal && (
        <div className="modal-overlay" onClick={() => setShowCloseModal(false)}>
          <div
            className="modal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="modal-title" className="modal-title">Aviso</h3>
            <p className="modal-text">
              ¿Estás seguro que deseas cerrar el chat?<br />
              Se borrará toda la información almacenada.
            </p>
            <div className="modal-actions">
              <button type="button" className="modal-btn confirm" onClick={onLeave}>Sí</button>
              <button type="button" className="modal-btn cancel" onClick={() => setShowCloseModal(false)} autoFocus>No</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}