// server.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

let timerState = { duration: 0, endTime: null, isRunning: false };

// NEW: Helper function that sends the Server's true clock time
function broadcastState() {
  io.emit('timer_state', { ...timerState, serverTime: Date.now() });
}

io.on('connection', (socket) => {
  socket.emit('timer_state', { ...timerState, serverTime: Date.now() });
  io.emit('user_count', io.engine.clientsCount);

  socket.on('start_timer', (minutes) => {
    const durationMs = minutes * 60 * 1000;
    timerState = {
      duration: durationMs,
      endTime: Date.now() + durationMs,
      isRunning: true
    };
    broadcastState();
  });

  socket.on('stop_timer', () => {
    timerState = { duration: 0, endTime: null, isRunning: false };
    broadcastState();
  });

  socket.on('disconnect', () => {
    io.emit('user_count', io.engine.clientsCount);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`Server running on ${PORT}`));
