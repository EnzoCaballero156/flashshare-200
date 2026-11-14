import { io } from 'socket.io-client';

// const SOCKET_URL = 'http://127.0.0.1:5000';

export const socket = io({
  autoConnect: false,
  withCredentials: true
});